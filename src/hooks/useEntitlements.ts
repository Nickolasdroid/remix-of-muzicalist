import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Authoritative entitlement source.
 *
 * Reads `public.get_my_entitlements()` — the same effective plan, limits and
 * usage counters the server-side triggers enforce. The TypeScript helpers in
 * `@/lib/planLimits` remain only as a presentation fallback while this loads.
 */
export interface ServerEntitlementLimits {
  posts: number;
  announcements: number;
  post_promotions: number;
  announcement_promotions: number;
  gallery_images: number;
  gallery_videos: number;
  pricing_entries: number;
  social_links: number;
}

export interface ServerEntitlements {
  effective_plan: "Free" | "Standard" | "Premium";
  is_admin: boolean;
  period_start: string;
  limits: ServerEntitlementLimits;
  usage: Record<string, number>;
  totals: Record<string, number>;
}

export const useEntitlements = () => {
  const [entitlements, setEntitlements] = useState<ServerEntitlements | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_my_entitlements");
      if (error) throw error;
      setEntitlements((data as unknown as ServerEntitlements) ?? null);
    } catch {
      setEntitlements(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entitlements, loading, refresh };
};

/** Server limit when available, otherwise the static presentation fallback. */
export const serverLimit = (
  entitlements: ServerEntitlements | null,
  key: keyof ServerEntitlementLimits,
  fallback: number,
): number => {
  const value = entitlements?.limits?.[key];
  return typeof value === "number" ? value : fallback;
};
