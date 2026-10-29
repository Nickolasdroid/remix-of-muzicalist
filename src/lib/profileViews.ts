import { supabase } from "@/integrations/supabase/client";

/**
 * Artist profile view counter (all plans).
 *
 * The server counts one view per visitor per artist per day and ignores the
 * artist's own visits (public.record_profile_view). Guests are identified by a
 * random id kept in localStorage; signed-in visitors by their account.
 */

const VISITOR_KEY = "mz_visitor_id";
const BOT_UA = /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit/i;

let sessionVisitorId: string | null = null;

const getVisitorId = (): string => {
  try {
    const stored = localStorage.getItem(VISITOR_KEY);
    if (stored) return stored;
    const fresh = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    // Storage blocked (private mode etc.): fall back to one id per page session.
    sessionVisitorId ??= crypto.randomUUID();
    return sessionVisitorId;
  }
};

/** Records a visit to an artist's public profile. Never throws. */
export const recordProfileView = (artistId: string) => {
  try {
    if (typeof navigator !== "undefined" && (navigator.webdriver || BOT_UA.test(navigator.userAgent))) return;
    (supabase as any)
      .rpc("record_profile_view", { _artist_id: artistId, _visitor_id: getVisitorId() })
      .then(() => {}, () => {});
  } catch {
    /* counting must never break the profile page */
  }
};

export interface ProfileViewStats {
  last30: number;
  prev30: number;
  total: number;
}

/** The signed-in artist's own view counts, or null if unavailable. */
export const fetchMyProfileViews = async (): Promise<ProfileViewStats | null> => {
  try {
    const { data, error } = await (supabase as any).rpc("get_my_profile_views");
    if (error || !data) return null;
    return {
      last30: Number(data.last_30) || 0,
      prev30: Number(data.prev_30) || 0,
      total: Number(data.total) || 0,
    };
  } catch {
    return null;
  }
};

/** Percentage change vs. the previous 30 days; null when there is no baseline. */
export const viewsChangePct = (stats: ProfileViewStats): number | null =>
  stats.prev30 > 0 ? Math.round(((stats.last30 - stats.prev30) / stats.prev30) * 100) : null;
