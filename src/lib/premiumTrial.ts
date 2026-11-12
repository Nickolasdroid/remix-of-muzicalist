import { supabase } from "@/integrations/supabase/client";

/*
 * Free Premium for 30 days, once per artist (see migration 20261112230000).
 * The server decides who qualifies; the app only starts it and shows its state.
 */

export const TRIAL_DAYS = 30;

export interface PremiumTrial {
  status: "none" | "active" | "ended" | "subscribed";
  startedAt: string | null;
  endsAt: string | null;
  endSeen: boolean;
  views: number;
  bookingRequests: number;
  newFollowers: number;
}

const rpc = (name: string) =>
  (supabase as any).rpc(name).then(
    (r: { data: any; error: any }) => r,
    () => ({ data: null, error: true }),
  );

/** Starts the trial if this artist never had one. Returns when it ends, or null. */
export async function startTrialIfEligible(): Promise<string | null> {
  const { data, error } = await rpc("start_my_trial");
  if (error || !data) return null;
  return typeof data === "string" ? data : null;
}

export async function getMyTrial(): Promise<PremiumTrial | null> {
  const { data, error } = await rpc("get_my_trial");
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return null;
  return {
    status: row.status,
    startedAt: row.started_at,
    endsAt: row.ends_at,
    endSeen: !!row.end_seen,
    views: row.views ?? 0,
    bookingRequests: row.booking_requests ?? 0,
    newFollowers: row.new_followers ?? 0,
  };
}

export async function markTrialEndSeen() {
  await rpc("mark_trial_end_seen");
}

/** Whole days left (at least 1 while the trial runs). */
export const trialDaysLeft = (endsAt: string | null) => {
  if (!endsAt) return 0;
  const ms = new Date(endsAt).getTime() - Date.now();
  return ms <= 0 ? 0 : Math.max(1, Math.ceil(ms / 86_400_000));
};
