import { supabase } from "@/integrations/supabase/client";

/**
 * Whether a singer / instrumentalist is open to collaborations (profiles.collab_status).
 * Not set = nothing is shown and nothing is assumed.
 */
export type CollabStatus = "free" | "band_open" | "band_closed";

export const COLLAB_STATUSES: CollabStatus[] = ["free", "band_open", "band_closed"];

/** English labels, translated on screen by the RO dictionary. */
export const COLLAB_STATUS_LABEL: Record<CollabStatus, string> = {
  free: "Free for collaborations",
  band_open: "In a band, open to collaborations",
  band_closed: "In a band, not looking for collaborations",
};

/** Short form for chips on the profile header. */
export const COLLAB_STATUS_SHORT: Record<CollabStatus, string> = {
  free: "Free for collaborations",
  band_open: "Open to collaborations",
  band_closed: "Not looking for collaborations",
};

export const isCollabStatus = (v: unknown): v is CollabStatus =>
  typeof v === "string" && (COLLAB_STATUSES as string[]).includes(v);

/** Open to collaborations: free, or in a band but accepting. */
export const isOpenToCollabs = (v: unknown) => v === "free" || v === "band_open";

/** Only singers and instrumentalists have this status (bands and DJs don't). */
export const hasCollabStatus = (specialization?: string | null) =>
  specialization === "Singer" || specialization === "Instrumentalist";

/**
 * collab_status for some profiles. Read separately and never throws, so a page
 * keeps working before the column exists on the server.
 */
export const fetchCollabStatuses = async (ids: string[]): Promise<Record<string, CollabStatus>> => {
  if (!ids.length) return {};
  try {
    const { data, error } = await (supabase as any).from("profiles").select("id, collab_status").in("id", ids);
    if (error || !data) return {};
    const out: Record<string, CollabStatus> = {};
    for (const r of data as { id: string; collab_status: unknown }[]) if (isCollabStatus(r.collab_status)) out[r.id] = r.collab_status;
    return out;
  } catch {
    return {};
  }
};
