import { supabase } from "@/integrations/supabase/client";

/**
 * First-party active-time tracking for signed-in accounts.
 *
 * How active time is counted:
 * - One second is counted only while the tab is visible AND the person has
 *   interacted (pointer, key, scroll, touch) within INACTIVITY_MS.
 * - Seconds are flushed every FLUSH_MS and when the tab is hidden/closed.
 * - The server caps each flush by real elapsed time, ignores replays (seq),
 *   and starts a new session after 30 minutes without activity.
 * Limitations: it measures "visible + recently interacted", not attention;
 * up to one flush interval can be lost if the browser is killed.
 */
export const INACTIVITY_MS = 5 * 60 * 1000;
const FLUSH_MS = 60 * 1000;

let started = false;
let pending = 0;
let seq = 0;
let lastInteraction = Date.now();
let userId: string | null = null;
const tabId = crypto.randomUUID();

const isActive = () =>
  !!userId && document.visibilityState === "visible" && Date.now() - lastInteraction < INACTIVITY_MS;

const flush = () => {
  if (!userId || pending <= 0) return;
  const secs = pending;
  pending = 0;
  seq += 1;
  (supabase as any)
    .rpc("activity_heartbeat", { _tab_id: tabId, _seq: seq, _active_seconds: secs })
    .then(({ error }: { error: unknown }) => {
      if (error) pending += secs; // retry with next flush
    })
    .catch(() => { pending += secs; });
};

export const startActivityTracking = () => {
  if (started || typeof window === "undefined") return;
  started = true;

  const touch = () => { lastInteraction = Date.now(); };
  let lastTouch = 0;
  const throttled = () => {
    const now = Date.now();
    if (now - lastTouch > 1000) { lastTouch = now; touch(); }
  };
  ["pointerdown", "keydown", "touchstart", "wheel"].forEach((e) =>
    window.addEventListener(e, touch, { passive: true }),
  );
  ["scroll", "pointermove"].forEach((e) => window.addEventListener(e, throttled, { passive: true }));

  window.setInterval(() => { if (isActive()) pending += 1; }, 1000);
  window.setInterval(flush, FLUSH_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
    else touch();
  });
  window.addEventListener("pagehide", flush);

  supabase.auth.getSession().then(({ data }) => {
    userId = data.session?.user?.id ?? null;
  });
  supabase.auth.onAuthStateChange((_e, session) => {
    const next = session?.user?.id ?? null;
    if (next !== userId) { flush(); pending = 0; }
    userId = next;
  });
};

export type ActivityEvent =
  | "artist_profile_view"
  | "search_performed"
  | "search_result_click"
  | "post_view"
  | "announcements_view"
  | "booking_started"
  | "gallery_media_open";

/** Count a feature-usage event for the signed-in account. Never throws. */
export const trackActivityEvent = (event: ActivityEvent) => {
  if (!userId) return;
  try {
    (supabase as any)
      .rpc("track_activity_event", { _event: event, _client_event_id: crypto.randomUUID() })
      .then(() => {}, () => {});
  } catch {
    /* tracking must never break the app */
  }
};
