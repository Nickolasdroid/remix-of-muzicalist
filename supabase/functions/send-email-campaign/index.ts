import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  renderCampaignEmail,
  sendCampaignEmailViaResend,
} from "../_shared/campaignEmail.ts";

interface RequestBody {
  campaign_id?: string;
}

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 3;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Recipient {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  status: string;
  attempts: number;
}

async function fetchNextBatch(
  admin: SupabaseClient,
  campaignId: string,
): Promise<Recipient[]> {
  // Pending OR (Failed AND attempts < MAX_ATTEMPTS)
  const { data, error } = await admin
    .from("email_campaign_recipients")
    .select("id, recipient_email, recipient_name, status, attempts")
    .eq("campaign_id", campaignId)
    .or(`status.eq.Pending,and(status.eq.Failed,attempts.lt.${MAX_ATTEMPTS})`)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (error) throw new Error(`fetch batch: ${error.message}`);
  return (data ?? []) as Recipient[];
}

async function markRecipientSending(
  admin: SupabaseClient,
  r: Recipient,
): Promise<boolean> {
  const { data, error } = await admin
    .from("email_campaign_recipients")
    .update({ status: "Sending", attempts: r.attempts + 1 })
    .eq("id", r.id)
    .in("status", ["Pending", "Failed"])
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("markRecipientSending failed", r.id, error.message);
    return false;
  }
  return !!data;
}

async function markSent(admin: SupabaseClient, recipientId: string) {
  await admin
    .from("email_campaign_recipients")
    .update({
      status: "Sent",
      sent_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", recipientId);
}

async function markFailed(
  admin: SupabaseClient,
  recipientId: string,
  message: string,
) {
  await admin
    .from("email_campaign_recipients")
    .update({
      status: "Failed",
      error_message: message.slice(0, 1000),
    })
    .eq("id", recipientId);
}

async function persistCampaignProgress(
  admin: SupabaseClient,
  campaignId: string,
  sentDelta: number,
  failedDelta: number,
) {
  if (sentDelta === 0 && failedDelta === 0) return;
  const { data: current } = await admin
    .from("email_campaigns")
    .select("sent_count, failed_count")
    .eq("id", campaignId)
    .maybeSingle();
  await admin
    .from("email_campaigns")
    .update({
      sent_count: (current?.sent_count ?? 0) + sentDelta,
      failed_count: (current?.failed_count ?? 0) + failedDelta,
    })
    .eq("id", campaignId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  // --- Auth ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = claimsData.claims.sub as string;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: isAdminData, error: isAdminError } = await admin.rpc("is_admin", {
    _user_id: userId,
  });
  if (isAdminError || !isAdminData) {
    return json({ error: "Forbidden: admin access required" }, 403);
  }

  // --- Parse body ---
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const campaignId = body.campaign_id?.trim();
  if (!campaignId || !UUID_RE.test(campaignId)) {
    return json({ error: "campaign_id is required and must be a valid UUID" }, 400);
  }

  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return json({ error: "Email gateway not configured" }, 500);
  }

  // --- Atomic lock: only proceed if we can flip Pending -> Sending
  //     (or reclaim a Sending campaign that has been stuck for >15 min). ---
  const { data: lockedRows, error: lockError } = await admin.rpc(
    "try_lock_email_campaign",
    { _campaign_id: campaignId },
  );
  if (lockError) {
    return json({ error: "Failed to acquire campaign lock", details: lockError.message }, 500);
  }
  const campaign = Array.isArray(lockedRows) ? lockedRows[0] : lockedRows;
  if (!campaign) {
    // Either the campaign doesn't exist, or it's already being processed by another run.
    const { data: existing } = await admin
      .from("email_campaigns")
      .select("id")
      .eq("id", campaignId)
      .maybeSingle();
    if (!existing) return json({ error: "Campaign not found" }, 404);
    return json({ error: "Campaign is already being processed." }, 409);
  }

  const campaignName: string = campaign.name ?? "Muzicalist";
  const template: string = campaign.template ?? "";

  let totalProcessed = 0;
  let sentDeltaTotal = 0;
  let failedDeltaTotal = 0;

  try {
    while (true) {
      const batch = await fetchNextBatch(admin, campaignId);
      if (batch.length === 0) break;

      let batchSent = 0;
      let batchFailed = 0;

      for (const recipient of batch) {
        const claimed = await markRecipientSending(admin, recipient);
        if (!claimed) continue; // already picked up by another run

        totalProcessed++;

        const { subject, html } = renderCampaignEmail({
          campaignName,
          template,
          recipientName: recipient.recipient_name,
        });

        const result = await sendCampaignEmailViaResend({
          to: recipient.recipient_email,
          subject,
          html,
          lovableApiKey: LOVABLE_API_KEY,
          resendApiKey: RESEND_API_KEY,
        });

        if (result.ok) {
          await markSent(admin, recipient.id);
          batchSent++;
        } else {
          console.error(`Send failed for ${recipient.recipient_email}: ${result.error}`);
          await markFailed(admin, recipient.id, result.error);
          batchFailed++;
        }
      }

      await persistCampaignProgress(admin, campaignId, batchSent, batchFailed);
      sentDeltaTotal += batchSent;
      failedDeltaTotal += batchFailed;
    }

    // --- Finalize ---
    const { data: finalCampaign } = await admin
      .from("email_campaigns")
      .select("sent_count, failed_count")
      .eq("id", campaignId)
      .maybeSingle();

    // Any recipients still needing retry (Failed with attempts < MAX_ATTEMPTS)?
    const { count: retriableCount } = await admin
      .from("email_campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "Failed")
      .lt("attempts", MAX_ATTEMPTS);

    const failedCount = finalCampaign?.failed_count ?? failedDeltaTotal;
    const sentCount = finalCampaign?.sent_count ?? sentDeltaTotal;

    const finalStatus =
      (retriableCount ?? 0) > 0
        ? "Sending"
        : failedCount === 0
          ? "Completed"
          : "CompletedWithErrors";

    await admin
      .from("email_campaigns")
      .update({
        status: finalStatus,
        finished_at: finalStatus === "Sending" ? null : new Date().toISOString(),
        last_error: null,
      })
      .eq("id", campaignId);

    return json({
      campaign_id: campaignId,
      total_processed: totalProcessed,
      sent_count: sentCount,
      failed_count: failedCount,
      final_status: finalStatus,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Fatal campaign processing error", message);
    await admin
      .from("email_campaigns")
      .update({
        status: "Failed",
        last_error: message.slice(0, 1000),
        finished_at: new Date().toISOString(),
      })
      .eq("id", campaignId);
    return json({ error: "Campaign processing failed", details: message }, 500);
  }
});
