import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "artist" | "user" | null;

export const useUserRole = () => {
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchRole = async (userId: string | null) => {
      if (!userId) {
        if (active) {
          setRole(null);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("user_type")
        .eq("user_id", userId)
        .maybeSingle();
      if (!active) return;
      setRole(((data?.user_type as AppRole) ?? null));
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchRole(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoading(true);
      fetchRole(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { role, loading, isAdmin: role === "admin" };
};
