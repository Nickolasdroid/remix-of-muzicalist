import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const PENDING_ACCOUNT_TYPE_KEY = "muz_pending_account_type";

export type ActivationState = {
  loading: boolean;
  hasSession: boolean;
  isActive: boolean;
  isAdmin: boolean;
};

/**
 * Tracks whether the current user is allowed to use the app.
 * Admins always pass. Anonymous users are not gated.
 * Authenticated users with profiles.is_active = false are inactive
 * and must complete a paid plan checkout before being activated.
 */
export const useActivation = (): ActivationState => {
  const [state, setState] = useState<ActivationState>({
    loading: true,
    hasSession: false,
    isActive: true,
    isAdmin: false,
  });

  useEffect(() => {
    let active = true;

    const evaluate = async (userId: string | null) => {
      if (!userId) {
        if (active) setState({ loading: false, hasSession: false, isActive: true, isAdmin: false });
        return;
      }
      const [{ data: roleData }, { data: profileData }] = await Promise.all([
        supabase.from("user_roles").select("user_type").eq("user_id", userId).maybeSingle(),
        supabase.from("profiles").select("is_active").eq("id", userId).maybeSingle(),
      ]);
      if (!active) return;
      const isAdmin = (roleData?.user_type as string) === "admin";
      // Profile may not exist yet for a brand-new Google signup → treat as inactive.
      const isActive = isAdmin ? true : Boolean((profileData as { is_active?: boolean } | null)?.is_active);
      setState({ loading: false, hasSession: true, isActive, isAdmin });
    };

    supabase.auth.getSession().then(({ data: { session } }) => evaluate(session?.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setState((s) => ({ ...s, loading: true }));
      evaluate(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
};
