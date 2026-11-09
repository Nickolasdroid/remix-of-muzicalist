import { supabase } from "@/integrations/supabase/client";

export type OnboardingState = {
  role: string | null;
  /** false only for Google sign-ups that haven't said "artist" or "looking for artists" yet */
  typeChosen: boolean;
  /** Artists appear in lists once their profile has a type (and the rest saved with it) */
  artistComplete: boolean;
};

let cache: { userId: string; state: OnboardingState } | null = null;

export const clearOnboardingCache = () => {
  cache = null;
};

export const getOnboardingState = async (userId: string, force = false): Promise<OnboardingState> => {
  if (!force && cache?.userId === userId) return cache.state;

  const [{ data: roleRow }, profileRes] = await Promise.all([
    supabase.from("user_roles").select("user_type").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("specialization, account_type_chosen" as any).eq("id", userId).maybeSingle(),
  ]);

  let profile: any = profileRes.data;
  if (profileRes.error) {
    // Column not there yet (migration pending): everyone counts as having chosen
    const { data } = await supabase.from("profiles").select("specialization").eq("id", userId).maybeSingle();
    profile = data;
  }

  const state: OnboardingState = {
    role: (roleRow?.user_type as string) ?? null,
    typeChosen: profile?.account_type_chosen !== false,
    artistComplete: !!profile?.specialization,
  };
  cache = { userId, state };
  return state;
};

/** Pages a signed-in person can always open, even before finishing sign-up. */
const ALWAYS_OPEN = ["/welcome", "/complete-profile", "/login", "/reset-password", "/terms-of-service", "/privacy-policy", "/help", "/rules"];

/** Where to send someone who hasn't finished signing up, or null to leave them be. */
export const onboardingRedirect = (state: OnboardingState, path: string): string | null => {
  if (ALWAYS_OPEN.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  if (state.role === "admin") return null;
  if (!state.typeChosen) return "/welcome";
  // An artist without a profile has nothing to manage yet: their home is the profile form
  if (state.role === "artist" && !state.artistComplete && ["/", "/dashboard", "/calendar", "/user-dashboard"].includes(path)) {
    return "/complete-profile";
  }
  return null;
};
