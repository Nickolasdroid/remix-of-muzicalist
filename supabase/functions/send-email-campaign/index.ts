import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface RequestBody {
  campaign_id?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // --- Auth ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return json({ error: "Unauthorized" }, 401);
  }
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

  // --- Load campaign ---
  const { data: campaign, error: campaignError } = await admin
    .from("email_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) {
    return json({ error: "Failed to load campaign", details: campaignError.message }, 500);
  }
  if (!campaign) {
    return json({ error: "Campaign not found" }, 404);
  }

  const currentStatus = String(campaign.status ?? "").toLowerCase();
  if (currentStatus !== "pending") {
    return json(
      { error: `Campaign cannot be processed. Expected status 'Pending', got '${campaign.status}'.` },
      409,
    );
  }

  // --- Load recipients ---
  const { data: recipients, error: recipientsError, count } = await admin
    .from("email_campaign_recipients")
    .select("id, recipient_email", { count: "exact" })
    .eq("campaign_id", campaignId);

  if (recipientsError) {
    return json({ error: "Failed to load recipients", details: recipientsError.message }, 500);
  }
  const totalRecipients = count ?? recipients?.length ?? 0;
  if (totalRecipients === 0) {
    return json({ error: "Campaign has no recipients" }, 400);
  }

  // --- Transition Pending -> Sending ---
  const { data: updated, error: updateError } = await admin
    .from("email_campaigns")
    .update({ status: "Sending", started_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("status", "Pending")
    .select()
    .maybeSingle();

  if (updateError || !updated) {
    return json(
      { error: "Failed to transition campaign to Sending", details: updateError?.message },
      500,
    );
  }

  try {
    // Placeholder: email delivery pipeline will be implemented in the next sprint.
    return json({
      campaign_id: updated.id,
      campaign_name: updated.name,
      total_recipients: updated.total_recipients ?? totalRecipients,
      valid_recipients: updated.valid_recipients ?? totalRecipients,
      status: updated.status,
      message: "Campaign processor initialized successfully.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin
      .from("email_campaigns")
      .update({ status: "Failed", finished_at: new Date().toISOString() })
      .eq("id", campaignId);
    return json({ error: "Campaign processing failed", details: message }, 500);
  }
});
