import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformStats {
  artists: number;
  countries: number;
  users: number;
  eventsBooked: number;
  singers: number;
  instrumentalists: number;
  djs: number;
  bands: number;
}

/** Format used across the app for platform statistics (e.g. `468+`). */
export const formatPlatformStat = (value: number | undefined | null) =>
  value === undefined || value === null ? "—" : `${value}+`;

/**
 * Single source of truth for platform statistics.
 * Reads the authoritative `get_platform_stats` RPC and refreshes it
 * every 60s and on window focus, so every page shows identical numbers.
 */
export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  const loadStats = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_platform_stats");
    if (error) {
      console.error("Error loading platform stats:", error);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return;
    setStats({
      artists: Number(row.artists ?? 0),
      countries: Number(row.countries ?? 0),
      users: Number(row.users ?? 0),
      eventsBooked: Number(row.events_booked ?? 0),
      singers: Number(row.singers ?? 0),
      instrumentalists: Number(row.instrumentalists ?? 0),
      djs: Number(row.djs ?? 0),
      bands: Number(row.bands ?? 0),
    });
  }, []);

  useEffect(() => {
    loadStats();
    const interval = window.setInterval(loadStats, 60000);
    const onFocus = () => loadStats();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadStats]);

  return { stats, refresh: loadStats };
}
