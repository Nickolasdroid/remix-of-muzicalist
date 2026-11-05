import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** id -> avatar_url for a set of profiles (e.g. the people who sent booking requests). */
export const useProfileAvatars = (ids: (string | null | undefined)[]) => {
  const key = Array.from(new Set(ids.filter(Boolean) as string[])).sort().join(",");
  const [map, setMap] = useState<Record<string, string | null>>({});
  useEffect(() => {
    if (!key) return;
    let active = true;
    supabase
      .from("profiles")
      .select("id, avatar_url")
      .in("id", key.split(","))
      .then(({ data }) => {
        if (!active || !data) return;
        const next: Record<string, string | null> = {};
        (data as { id: string; avatar_url: string | null }[]).forEach((p) => (next[p.id] = p.avatar_url));
        setMap(next);
      });
    return () => {
      active = false;
    };
  }, [key]);
  return map;
};
