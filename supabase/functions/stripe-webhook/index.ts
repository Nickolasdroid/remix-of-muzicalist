// Stripe webhook handler — price_id is the single source of truth
import Stripe from "npm:stripe@17.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getPlanFromPriceId } from "../_shared/stripePriceMap.ts";
import { notifyAdminPaidSubscription } from "../_shared/adminNotify.ts";
import { shouldDowngradeOnDeleted } from "../_shared/subscriptionRules.ts";


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

// Events can arrive out of order, so the subscription is always re-read from Stripe: what the
// profile stores is Stripe's current state, not the state at the time of the event.
async function latestSubscription(fromEvent: Stripe.Subscription): Promise<Stripe.Subscription> {
  try {
    return await stripe.subscriptions.retrieve(fromEvent.id);
  } catch (e) {
    console.warn("Could not re-read subscription, using the event payload", fromEvent.id, e);
    return fromEvent;
  }
}

async function syncSubscription(eventSubscription: Stripe.Subscription, fallbackProfileId?: string) {
  const subscription = await latestSubscription(eventSubscription);
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
  const isActive = status === "active" || status === "trialing" || status === "past_due"; // past_due grace handled by effective_plan()
  // Older Stripe API versions put the period end on the subscription; newer ones (2025-03-31+)
  // moved it onto the subscription items. Accept both so the endpoint's API version doesn't matter.
  const rawPeriodEnd =
    (subscription as unknown as { current_period_end?: number }).current_period_end ??
    (item as unknown as { current_period_end?: number } | undefined)?.current_period_end;
  const periodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : null;

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
  const isDuplicateEvent = !!logErr && logErr.message.includes("duplicate");
  if (logErr && !isDuplicateEvent) {
    console.warn("Event log insert warning:", logErr.message);
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
            // Decrypt the password that was stored at checkout creation time
            let pendingPassword: string;
            try {
              const { decryptPassword } = await import("../_shared/passwordCrypto.ts");
              pendingPassword = await decryptPassword(pending.password_encrypted);
            } catch (e) {
              console.error("Failed to decrypt pending password:", e);
              break;
            }

            // Create the auth user (email already confirmed since they paid)
            const { data: created, error: cErr } = await supabase.auth.admin.createUser({
              email: pending.email,
              password: pendingPassword,
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

          // Admin notification for a successful paid subscription.
          // Dedup: only fire the first time this Stripe event is processed.
          if (!isDuplicateEvent) {
            try {
              const item = sub.items.data[0];
              const priceId = item?.price?.id;
              const planInfo = getPlanFromPriceId(priceId);
              const status = sub.status;
              const isActive = status === "active" || status === "trialing" || status === "past_due"; // past_due grace handled by effective_plan()
              if (planInfo && isActive) {
                const effectiveProfileId =
                  profileId ?? (await findProfileIdByCustomer(customerId ?? ""));
                let name = "";
                let email = "";
                let accountType: "user" | "artist" = "user";
                if (effectiveProfileId) {
                  const { data: prof } = await supabase
                    .from("profiles")
                    .select("first_name, stage_name, email, specialization")
                    .eq("id", effectiveProfileId)
                    .maybeSingle();
                  if (prof) {
                    name = (prof.stage_name || prof.first_name || prof.email || "") as string;
                    email = (prof.email || "") as string;
                    accountType = prof.specialization ? "artist" : "user";
                  }
                  const { data: roleRow } = await supabase
                    .from("user_roles")
                    .select("user_type")
                    .eq("user_id", effectiveProfileId)
                    .maybeSingle();
                  if ((roleRow?.user_type as string) === "artist") accountType = "artist";
                }
                const unitAmount = item?.price?.unit_amount ?? session.amount_total ?? 0;
                const currency =
                  item?.price?.currency ?? session.currency ?? "usd";
                await notifyAdminPaidSubscription({
                  accountType,
                  name,
                  email,
                  plan: planInfo.plan,
                  billing: planInfo.billing,
                  amount: unitAmount / 100,
                  currency,
                  paidAt: new Date(),
                });
              }
            } catch (e) {
              console.error("admin notify (paid subscription) failed", e);
            }
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
          const { data: current } = await supabase
            .from("profiles")
            .select("stripe_subscription_id")
            .eq("id", profileId)
            .maybeSingle();
          if (shouldDowngradeOnDeleted(current?.stripe_subscription_id, sub.id)) {
            await supabase.from("profiles").update({
              plan: "Free",
              billing: null,
              subscription_status: "canceled",
              subscription_cancel_at_period_end: false,
              stripe_subscription_id: sub.id,
            }).eq("id", profileId);
          } else {
            console.log("Ignoring deletion of an older subscription", sub.id, "current:", current?.stripe_subscription_id);
          }
        }
        break;
      }
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // `invoice.subscription` (older API versions) or `invoice.parent.subscription_details.subscription` (newer)
        const invoiceSub =
          invoice.subscription ??
          (invoice as unknown as { parent?: { subscription_details?: { subscription?: string | { id: string } } } })
            .parent?.subscription_details?.subscription;
        if (invoiceSub) {
          const subId = typeof invoiceSub === "string" ? invoiceSub : invoiceSub.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(sub);
        }
        break;
      }

      case "invoice.payment_failed": {
        // Do not write "past_due" blindly: re-read the subscription so the stored status is Stripe's
        // current one (the payment may already have been retried successfully, or the subscription ended).
        const invoice = event.data.object as Stripe.Invoice;
        const failedSub =
          invoice.subscription ??
          (invoice as unknown as { parent?: { subscription_details?: { subscription?: string | { id: string } } } })
            .parent?.subscription_details?.subscription;
        if (failedSub) {
          const subId = typeof failedSub === "string" ? failedSub : failedSub.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(sub);
        }
        break;
      }
      default:
        // ignore other events
        break;
    }

    // Link event row to profile if possible
    const obj = event.data.object as { customer?: string | { id: string } };
    if ("customer" in obj) {
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
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
