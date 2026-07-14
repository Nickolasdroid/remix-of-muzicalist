import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cache: Set<string> | null = null;
let inflight: Promise<Set<string>> | null = null;

const loadAdminIds = async (): Promise<Set<string>> => {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await (supabase as any).rpc("get_admin_user_ids");
    const ids = new Set<string>(((data as any[]) ?? []).map((r: any) => (typeof r === "string" ? r : r.get_admin_user_ids ?? r.user_id)));
    cache = ids;
    return ids;
  })();
  const result = await inflight;
  inflight = null;
  return result;
};

export const useAdminIds = () => {
  const [adminIds, setAdminIds] = useState<Set<string>>(cache ?? new Set());

  useEffect(() => {
    let active = true;
    loadAdminIds().then((ids) => {
      if (active) setAdminIds(new Set(ids));
    });
    return () => {
      active = false;
    };
  }, []);

  return adminIds;
};
