import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sortByPlanPriority } from "@/lib/planLimits";

export interface HomeArtist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  specialization: string | null;
  county: string | null;
  country: string | null;
  plan: string;
  created_at: string;
  rating: number | null;
  reviewCount: number;
}

/** Artists shown on the public home page (hero photos and the "Discover artists" row). */
export function useHomeArtists(limit = 12) {
  const [artists, setArtists] = useState<HomeArtist[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, stage_name, avatar_url, specialization, county, country, plan, created_at")
        .not("specialization", "is", null)
        .limit(limit);
      if (cancelled) return;
      if (error || !data) {
        setArtists([]);
        return;
      }
      const { data: reviews } = await supabase
        .from("reviews")
        .select("profile_id, rating")
        .in("profile_id", data.map((a) => a.id));
      if (cancelled) return;
      const ratings: Record<string, number[]> = {};
      (reviews || []).forEach((r: any) => {
        (ratings[r.profile_id] ||= []).push(r.rating);
      });
      const rows: HomeArtist[] = data.map((a: any) => {
        const list = ratings[a.id] || [];
        return {
          ...a,
          rating: list.length ? Math.round((list.reduce((s, v) => s + v, 0) / list.length) * 10) / 10 : null,
          reviewCount: list.length,
        };
      });
      rows.sort(sortByPlanPriority);
      setArtists(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return artists;
}
