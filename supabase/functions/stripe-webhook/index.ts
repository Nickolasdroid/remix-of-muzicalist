// Stripe webhook handler — price_id is the single source of truth
import Stripe from "npm:stripe@17.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getPlanFromPriceId } from "../_shared/stripePriceMap.ts";
import { issueSmartBillInvoice } from "../_shared/smartbill.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

async function findProfileIdByCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function syncSubscription(subscription: Stripe.Subscription, fallbackProfileId?: string) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  let profileId = fallbackProfileId ?? (await findProfileIdByCustomer(customerId));

  // If still unknown, try metadata.user_id from Stripe customer
  if (!profileId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted && customer.metadata?.user_id) {
        profileId = customer.metadata.user_id;
        await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", profileId);
      }
    } catch (_) { /* ignore */ }
  }

  if (!profileId) {
    console.warn("No profile found for customer", customerId);
    return;
  }

  const item = subscription.items.data[0];
  const priceId = item?.price?.id;
  const planInfo = getPlanFromPriceId(priceId);

  const status = subscription.status;
  const isActive = status === "active" || status === "trialing";
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const update: Record<string, unknown> = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: status,
    subscription_current_period_end: periodEnd,
    subscription_cancel_at_period_end: !!subscription.cancel_at_period_end,
  };

  if (planInfo && isActive) {
    update.plan = planInfo.plan;
    update.billing = planInfo.billing;
  } else if (!isActive) {
    // Canceled / unpaid / incomplete → downgrade
    update.plan = "Free";
    update.billing = null;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", profileId);
  if (error) console.error("Profile update error:", error);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider);
  } catch (err) {
    console.error("Signature verification failed:", err);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  console.log(`[stripe-webhook] received event ${event.id} type=${event.type}`);

  // Idempotency: log event; skip if already processed
  const { error: logErr } = await supabase
    .from("subscription_events")
    .insert({ stripe_event_id: event.id, event_type: event.type, payload: event as unknown as object });
  if (logErr && !logErr.message.includes("duplicate")) {
    console.warn("Event log insert warning:", logErr.message);
  }

  // Helper: issue a SmartBill invoice for a Stripe invoice (idempotent by stripe_event_id)
  async function issueAndRecord(profileId: string, invoice: Stripe.Invoice, eventId: string) {
    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("stripe_event_id", eventId)
      .maybeSingle();
    if (existing) {
      console.log(`[stripe-webhook] invoice already recorded for event ${eventId}, skipping`);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    if (!profile) {
      console.error(`[stripe-webhook] profile ${profileId} not found, cannot issue invoice`);
      return;
    }

    console.log(`[stripe-webhook] issuing SmartBill invoice for profile=${profileId} stripe_invoice=${invoice.id} amount=${invoice.amount_paid}`);
    const result = await issueSmartBillInvoice(profile as any, {
      id: invoice.id,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      number: invoice.number ?? undefined,
      hosted_invoice_url: invoice.hosted_invoice_url ?? undefined,
    });

    await supabase.from("invoices").insert({
      profile_id: profileId,
      stripe_event_id: eventId,
      stripe_invoice_id: invoice.id ?? null,
      stripe_subscription_id: typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id ?? null,
      smartbill_series: result.series ?? null,
      smartbill_number: result.number ?? null,
      smartbill_url: result.url ?? null,
      amount: (invoice.amount_paid ?? 0) / 100,
      currency: (invoice.currency ?? "ron").toUpperCase(),
      status: result.ok ? "issued" : "failed",
      error_message: result.error ?? null,
      issued_at: result.ok ? new Date().toISOString() : null,
    });

    if (!result.ok) console.error("[stripe-webhook] SmartBill issue failed:", result.error);
  }


  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        let profileId = session.metadata?.user_id ?? null;

        // Handle deferred artist signup: create user from pending_artist_registrations
        if (session.metadata?.type === "artist_signup" && session.metadata?.pending_id) {
          const pendingId = session.metadata.pending_id;
          const { data: pending, error: pErr } = await supabase
            .from("pending_artist_registrations")
            .select("*")
            .eq("id", pendingId)
            .maybeSingle();

          if (pErr) console.error("Fetch pending failed:", pErr);

          if (pending) {
            // Create the auth user (email already confirmed since they paid)
            const { data: created, error: cErr } = await supabase.auth.admin.createUser({
              email: pending.email,
              password: pending.password_plain,
              email_confirm: true,
              user_metadata: {
                account_type: "artist",
                first_name: pending.first_name,
                last_name: pending.last_name,
                full_name: pending.stage_name,
                stage_name: pending.stage_name,
                phone: pending.phone,
                country: pending.country,
                county: pending.county,
                specialization: pending.specialization,
                experience_level: pending.experience_level,
                career_start_year: pending.career_start_year ? String(pending.career_start_year) : "",
              },
            });

            if (cErr || !created?.user) {
              // Maybe already created by a webhook retry — try to find it
              const { data: prof } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", pending.email)
                .maybeSingle();
              profileId = prof?.id ?? null;
              if (!profileId) {
                console.error("Failed to create user for pending signup:", cErr);
              }
            } else {
              profileId = created.user.id;
            }

            // Upload avatar if provided
            if (profileId && pending.avatar_base64) {
              try {
                const bytes = Uint8Array.from(atob(pending.avatar_base64), (c) => c.charCodeAt(0));
                const path = `${profileId}/avatar.jpg`;
                const { error: upErr } = await supabase.storage
                  .from("avatars")
                  .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
                if (!upErr) {
                  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
                  if (pub?.publicUrl) {
                    await supabase
                      .from("profiles")
                      .update({ avatar_url: pub.publicUrl })
                      .eq("id", profileId);
                  }
                } else {
                  console.warn("Avatar upload failed:", upErr);
                }
              } catch (e) {
                console.warn("Avatar processing failed:", e);
              }
            }

            // Cleanup pending row
            await supabase.from("pending_artist_registrations").delete().eq("id", pendingId);
          }
        }

        if (profileId && customerId) {
          await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", profileId);
        }
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(sub, profileId ?? undefined);
        }

        // Fallback: also issue SmartBill from checkout (covers cases where
        // invoice.paid/invoice.payment_succeeded never reaches this endpoint).
        if (profileId && session.invoice) {
          try {
            const invId = typeof session.invoice === "string" ? session.invoice : session.invoice.id;
            const invoice = await stripe.invoices.retrieve(invId);
            await issueAndRecord(profileId, invoice, event.id);
          } catch (e) {
            console.error("[stripe-webhook] checkout-invoice issue failed:", (e as Error).message);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const profileId = await findProfileIdByCustomer(customerId);
        if (profileId) {
          await supabase.from("profiles").update({
            plan: "Free",
            billing: null,
            subscription_status: "canceled",
            subscription_cancel_at_period_end: false,
            stripe_subscription_id: sub.id,
          }).eq("id", profileId);
        }
        break;
      }
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        let profileId: string | null = null;
        if (invoice.subscription) {
          const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(sub);
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
          profileId = await findProfileIdByCustomer(customerId);
        } else if (invoice.customer) {
          const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
          profileId = await findProfileIdByCustomer(customerId);
        }

        if (profileId) {
          await issueAndRecord(profileId, invoice, event.id);
        } else {
          console.warn(`[stripe-webhook] no profile for invoice ${invoice.id}, cannot issue SmartBill`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          const profileId = await findProfileIdByCustomer(customerId);
          if (profileId) {
            await supabase.from("profiles").update({ subscription_status: "past_due" }).eq("id", profileId);
          }
        }
        break;
      }
      default:
        // ignore other events
        break;
    }

    // Link event row to profile if possible
    if ("customer" in (event.data.object as Record<string, unknown>)) {
      const obj = event.data.object as { customer?: string | { id: string } };
      const customerId = typeof obj.customer === "string" ? obj.customer : obj.customer?.id;
      if (customerId) {
        const profileId = await findProfileIdByCustomer(customerId);
        if (profileId) {
          await supabase.from("subscription_events").update({ profile_id: profileId }).eq("stripe_event_id", event.id);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
