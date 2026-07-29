import { supabase } from "@/integrations/supabase/client";
import type { StatusTone } from "@/components/admin/platform/StatusBadge";

export const REPORT_TYPES = [
  { value: "bug", label: "Bug" },
  { value: "account", label: "Account Problem" },
  { value: "abuse", label: "Abuse Report" },
  { value: "feature", label: "Feature Request" },
  { value: "payment", label: "Payment Problem" },
  { value: "subscription", label: "Subscription" },
  { value: "other", label: "Other" },
] as const;

export const REPORT_STATUSES = [
  { value: "new", label: "New", tone: "info" as StatusTone },
  { value: "under_review", label: "Under Review", tone: "warning" as StatusTone },
  { value: "in_progress", label: "In Progress", tone: "warning" as StatusTone },
  { value: "resolved", label: "Resolved", tone: "success" as StatusTone },
  { value: "closed", label: "Closed", tone: "muted" as StatusTone },
] as const;

export const REPORT_PRIORITIES = [
  { value: "low", label: "Low", tone: "muted" as StatusTone },
  { value: "medium", label: "Medium", tone: "info" as StatusTone },
  { value: "high", label: "High", tone: "warning" as StatusTone },
  { value: "critical", label: "Critical", tone: "danger" as StatusTone },
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number]["value"];
export type ReportPriority = (typeof REPORT_PRIORITIES)[number]["value"];

export const reportTypeLabel = (v?: string | null) =>
  REPORT_TYPES.find((t) => t.value === v)?.label ?? v ?? "—";
export const reportStatusMeta = (v?: string | null) =>
  REPORT_STATUSES.find((s) => s.value === v) ?? REPORT_STATUSES[0];
export const reportPriorityMeta = (v?: string | null) =>
  REPORT_PRIORITIES.find((p) => p.value === v) ?? REPORT_PRIORITIES[1];

export interface ReportRow {
  id: string;
  user_id: string | null;
  artist_id: string | null;
  role: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  attachments: { path: string; name: string; size?: number }[] | null;
  reporter_name: string | null;
  reporter_email: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  language: string | null;
  page_url: string | null;
  country: string | null;
  app_version: string | null;
  admin_notes: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

/** Best-effort client environment detection (no manual input required). */
export function collectClientInfo() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  const browser = (() => {
    if (/Edg\//.test(ua)) return "Edge";
    if (/OPR\//.test(ua)) return "Opera";
    if (/Chrome\//.test(ua)) return `Chrome ${ua.match(/Chrome\/(\d+)/)?.[1] ?? ""}`.trim();
    if (/Firefox\//.test(ua)) return `Firefox ${ua.match(/Firefox\/(\d+)/)?.[1] ?? ""}`.trim();
    if (/Safari\//.test(ua)) return "Safari";
    return "Unknown";
  })();

  const os = (() => {
    if (/Windows NT/.test(ua)) return "Windows";
    if (/Android/.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
    if (/Mac OS X/.test(ua)) return "macOS";
    if (/Linux/.test(ua)) return "Linux";
    return "Unknown";
  })();

  const device = /iPad|Tablet/.test(ua)
    ? "Tablet"
    : /Mobi|Android|iPhone/.test(ua)
      ? "Mobile"
      : "Desktop";

  return {
    browser,
    os,
    device,
    language: typeof navigator !== "undefined" ? navigator.language : null,
    page_url: typeof window !== "undefined" ? window.location.href : null,
    app_version: (import.meta.env.VITE_APP_VERSION as string | undefined) ?? null,
  };
}

export interface SubmitReportInput {
  type: string;
  title: string;
  description: string;
  file?: File | null;
}

export async function submitReport({ type, title, description, file }: SubmitReportInput) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to submit a report.");

  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase
      .from("profiles")
      .select("stage_name, first_name, last_name, email, country, specialization")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("user_type").eq("user_id", user.id).maybeSingle(),
  ]);

  const role = (roleRow as any)?.user_type ?? "user";
  const isArtist = role === "artist" || !!(profile as any)?.specialization;

  const attachments: { path: string; name: string; size: number }[] = [];
  if (file) {
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("report-attachments")
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) throw uploadError;
    attachments.push({ path, name: file.name, size: file.size });
  }

  const info = collectClientInfo();
  const { error } = await supabase.from("reports").insert({
    user_id: user.id,
    artist_id: isArtist ? user.id : null,
    role: role === "admin" ? "admin" : isArtist ? "artist" : "user",
    type,
    title: title.trim(),
    description: description.trim(),
    attachments: attachments as any,
    reporter_name:
      (profile as any)?.stage_name ||
      `${(profile as any)?.first_name ?? ""} ${(profile as any)?.last_name ?? ""}`.trim() ||
      null,
    reporter_email: (profile as any)?.email ?? user.email ?? null,
    country: (profile as any)?.country ?? null,
    ...info,
  } as any);

  if (error) throw error;
}
