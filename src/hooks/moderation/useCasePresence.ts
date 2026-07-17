/**
 * useCasePresence — Supabase Realtime Presence for a moderation case.
 *
 * Every viewer joins a `mod-case:<id>` channel and tracks their identity plus
 * a `joined_at` timestamp. The earliest joiner is the "soft lock" holder;
 * others open the case in read-only mode until they explicitly take over.
 *
 * Presence is heartbeat-refreshed every 25s and pruned client-side after 60s
 * of inactivity so a network hiccup can't strand a stale viewer.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  activePresences,
  flattenPresence,
  PRESENCE_HEARTBEAT_MS,
  softLockHolder,
  type PresenceMeta,
} from "@/lib/moderation/collab";

export interface UseCasePresenceOptions {
  caseId: string;
  selfId: string | null;
  selfName: string;
  selfAvatar?: string | null;
  /** Disable presence tracking (e.g. panel not mounted). */
  enabled?: boolean;
}

export interface UseCasePresenceResult {
  /** All currently-active presences on the case, including self. */
  presences: PresenceMeta[];
  /** Other moderators (self excluded). */
  others: PresenceMeta[];
  /** Earliest-joined other moderator, or null if none. */
  lockHolder: PresenceMeta | null;
  /** True while another moderator holds the soft lock and self hasn't taken over. */
  isReadOnly: boolean;
  /** True after the current user explicitly took over the review. */
  hasTakenOver: boolean;
  /**
   * Take over the review: rewrites our own `joined_at` to epoch so we become
   * the earliest joiner. The previous holder will drop to read-only on their
   * next presence sync.
   */
  takeOver: () => Promise<void>;
}

export function useCasePresence({
  caseId,
  selfId,
  selfName,
  selfAvatar = null,
  enabled = true,
}: UseCasePresenceOptions): UseCasePresenceResult {
  const [rawState, setRawState] = useState<PresenceMeta[]>([]);
  const [hasTakenOver, setHasTakenOver] = useState(false);
  // Tick state so time-based staleness filtering re-renders.
  const [, setTick] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const joinedAtRef = useRef<string>(new Date().toISOString());

  // Reset take-over when navigating to a different case.
  useEffect(() => {
    joinedAtRef.current = new Date().toISOString();
    setHasTakenOver(false);
  }, [caseId, selfId]);

  useEffect(() => {
    if (!enabled || !caseId || !selfId) return;

    const channel = supabase.channel(`mod-case:${caseId}`, {
      config: { presence: { key: selfId } },
    });
    channelRef.current = channel;

    const sync = () => {
      const raw = channel.presenceState<PresenceMeta>() as Record<string, PresenceMeta[]>;
      setRawState(flattenPresence(raw));
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync);

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      await channel.track({
        user_id: selfId,
        name: selfName,
        avatar_url: selfAvatar,
        joined_at: joinedAtRef.current,
        last_active: new Date().toISOString(),
      } satisfies PresenceMeta);
    });

    // Heartbeat keeps our `last_active` fresh so peers don't prune us.
    const beat = window.setInterval(() => {
      void channel.track({
        user_id: selfId,
        name: selfName,
        avatar_url: selfAvatar,
        joined_at: joinedAtRef.current,
        last_active: new Date().toISOString(),
      } satisfies PresenceMeta);
    }, PRESENCE_HEARTBEAT_MS);

    // Force re-render on the stale window so peers vanish from the UI
    // even if no presence event fires (pure network drop).
    const staleTick = window.setInterval(() => setTick((n) => n + 1), 15_000);

    return () => {
      window.clearInterval(beat);
      window.clearInterval(staleTick);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [enabled, caseId, selfId, selfName, selfAvatar]);

  const takeOver = useCallback(async () => {
    if (!selfId || !channelRef.current) return;
    // Rewrite joined_at to epoch — we become the earliest joiner.
    joinedAtRef.current = new Date(0).toISOString();
    setHasTakenOver(true);
    await channelRef.current.track({
      user_id: selfId,
      name: selfName,
      avatar_url: selfAvatar,
      joined_at: joinedAtRef.current,
      last_active: new Date().toISOString(),
    } satisfies PresenceMeta);
  }, [selfId, selfName, selfAvatar]);

  const active = useMemo(() => activePresences(rawState), [rawState]);
  const others = useMemo(
    () => active.filter((p) => p.user_id !== selfId),
    [active, selfId],
  );
  const lockHolder = useMemo(
    () => (selfId ? softLockHolder(rawState, selfId) : null),
    [rawState, selfId],
  );

  return {
    presences: active,
    others,
    lockHolder,
    isReadOnly: !!lockHolder && !hasTakenOver,
    hasTakenOver,
    takeOver,
  };
}
