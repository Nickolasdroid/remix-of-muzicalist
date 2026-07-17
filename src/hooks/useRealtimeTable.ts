import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type RealtimeStatus = "connecting" | "connected" | "disconnected";

export type RealtimeChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export interface UseRealtimeTableOptions<Row extends Record<string, unknown>> {
  /** Table name in the `public` schema. */
  table: string;
  /** PostgREST-style filter, e.g. `campaign_id=eq.<uuid>`. */
  filter?: string;
  /** Postgres change event to listen for. Defaults to `*`. */
  event?: RealtimeChangeEvent;
  /** Called for every matching change payload. */
  onChange: (payload: RealtimePostgresChangesPayload<Row>) => void;
  /** Toggle subscription on/off without unmounting the host component. */
  enabled?: boolean;
  /** Optional stable channel name suffix (defaults to auto-generated). */
  channelKey?: string;
}

/**
 * Reusable Supabase Realtime subscription hook for a single Postgres table.
 * Handles channel lifecycle, filter changes, and exposes a connection status
 * that UIs can surface as a "Live" / "Reconnecting" indicator.
 *
 * The Supabase JS client auto-reconnects underneath; this hook simply reflects
 * the current state so consumers don't have to wire it themselves.
 */
export function useRealtimeTable<Row extends Record<string, unknown> = Record<string, unknown>>({
  table,
  filter,
  event = "*",
  onChange,
  enabled = true,
  channelKey,
}: UseRealtimeTableOptions<Row>): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;

  useEffect(() => {
    if (!enabled) {
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");
    const name =
      channelKey ??
      `rt:${table}:${filter ?? "all"}:${Math.random().toString(36).slice(2, 8)}`;

    const channel: RealtimeChannel = supabase.channel(name).on(
      "postgres_changes" as never,
      { event, schema: "public", table, ...(filter ? { filter } : {}) } as never,
      (payload: RealtimePostgresChangesPayload<Row>) => {
        handlerRef.current(payload);
      },
    );

    channel.subscribe((subStatus) => {
      if (subStatus === "SUBSCRIBED") setStatus("connected");
      else if (subStatus === "CHANNEL_ERROR" || subStatus === "TIMED_OUT") setStatus("connecting");
      else if (subStatus === "CLOSED") setStatus("disconnected");
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, event, enabled, channelKey]);

  return status;
}

/** Combine multiple realtime statuses into a single UI status. */
export function combineRealtimeStatus(...statuses: RealtimeStatus[]): RealtimeStatus {
  if (statuses.length === 0) return "disconnected";
  if (statuses.every((s) => s === "connected")) return "connected";
  if (statuses.some((s) => s === "connecting")) return "connecting";
  return "disconnected";
}
