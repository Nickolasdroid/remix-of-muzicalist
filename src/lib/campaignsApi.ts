import { supabase } from "@/integrations/supabase/client";

export type DbCampaign = {
  id: string;
  name: string;
  template: string | null;
  audience_type: string | null;
  uploaded_file_name: string | null;
  total_recipients: number | null;
  valid_recipients: number | null;
  invalid_recipients: number | null;
  sent_count: number | null;
  failed_count: number | null;
  status: string;
  created_by: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  last_error: string | null;
};

export type DbCampaignRecipient = {
  id: string;
  campaign_id: string;
  recipient_name: string | null;
  recipient_email: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  attempts: number;
  created_at: string;
};

export async function fetchCampaigns(): Promise<DbCampaign[]> {
  const { data, error } = await supabase
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbCampaign[];
}

export async function fetchCampaignRecipients(
  campaignId: string,
  page: number,
  pageSize: number,
): Promise<{ rows: DbCampaignRecipient[]; total: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("email_campaign_recipients")
    .select("*", { count: "exact" })
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true })
    .range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as DbCampaignRecipient[], total: count ?? 0 };
}

export async function cancelCampaign(id: string) {
  const { error } = await supabase
    .from("email_campaigns")
    .update({ status: "Cancelled", finished_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "Sending");
  if (error) throw error;
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase.from("email_campaigns").delete().eq("id", id);
  if (error) throw error;
}

export async function retryFailedRecipients(campaignId: string) {
  // Reset Failed recipients (with retries left) back to Pending so the
  // processor picks them up again. `attempts` is intentionally preserved so
  // the processor keeps enforcing the < 3 cap. Sent recipients are untouched.
  const { error: recErr } = await supabase
    .from("email_campaign_recipients")
    .update({ status: "Pending", error_message: null })
    .eq("campaign_id", campaignId)
    .eq("status", "Failed")
    .lt("attempts", 3);
  if (recErr) throw recErr;

  // Move campaign back to Pending, clear failure state, keep sent_count.
  const { error: campErr } = await supabase
    .from("email_campaigns")
    .update({
      status: "Pending",
      finished_at: null,
      last_error: null,
      failed_count: 0,
    })
    .eq("id", campaignId);
  if (campErr) throw campErr;

  const { error: invokeErr } = await supabase.functions.invoke("send-email-campaign", {
    body: { campaign_id: campaignId },
  });
  if (invokeErr) throw invokeErr;
}

export async function duplicateCampaign(source: DbCampaign): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  const { data: created, error } = await supabase
    .from("email_campaigns")
    .insert({
      name: `${source.name} (Copy)`,
      template: source.template,
      audience_type: source.audience_type,
      uploaded_file_name: source.uploaded_file_name,
      total_recipients: source.total_recipients ?? 0,
      valid_recipients: source.valid_recipients ?? 0,
      invalid_recipients: source.invalid_recipients ?? 0,
      status: "Draft",
      created_by: user.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  // Copy recipient list, reset per-recipient state.
  const { data: recipients, error: recErr } = await supabase
    .from("email_campaign_recipients")
    .select("recipient_name, recipient_email")
    .eq("campaign_id", source.id);
  if (recErr) throw recErr;

  if (recipients && recipients.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < recipients.length; i += chunkSize) {
      const slice = recipients.slice(i, i + chunkSize).map((r) => ({
        campaign_id: created.id,
        recipient_name: r.recipient_name,
        recipient_email: r.recipient_email,
        status: "Pending",
        attempts: 0,
      }));
      const { error: insErr } = await supabase
        .from("email_campaign_recipients")
        .insert(slice);
      if (insErr) throw insErr;
    }
  }

  return created.id;
}

export function formatDuration(startISO: string | null, endISO: string | null): string {
  if (!startISO) return "—";
  const start = new Date(startISO).getTime();
  const end = endISO ? new Date(endISO).getTime() : Date.now();
  const ms = Math.max(0, end - start);
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem ? `${m}m ${rem}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h}h ${mm}m` : `${h}h`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
