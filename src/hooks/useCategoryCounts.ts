import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
import { ARTIST_CATEGORIES, type ArtistCategory } from "@/lib/artistCategories";

export type CategoryCounts = Record<ArtistCategory, number>;

const emptyCounts = (): CategoryCounts =>
  ARTIST_CATEGORIES.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as CategoryCounts);

/**
 * Live per-category artist counts, using the same authoritative sources as the
 * Categories page: artist ids (valid artist accounts) + profiles.specialization.
 */
export const useCategoryCounts = () => {
  const [counts, setCounts] = useState<CategoryCounts>(emptyCounts);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const artistIds = await fetchArtistIds();
      if (cancelled) return;
      if (artistIds.length === 0) {
        setCounts(emptyCounts());
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, specialization")
        .in("id", artistIds);

      if (cancelled || !data) return;

      const next = emptyCounts();
      data.forEach((profile) => {
        const spec = profile.specialization as ArtistCategory | null;
        if (spec && next[spec] !== undefined) next[spec]++;
      });
      setCounts(next);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return counts;
};
