import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { clearOnboardingCache, getOnboardingState, onboardingRedirect } from "@/lib/onboarding";

/**
 * Sends a signed-in person who hasn't finished signing up to the step they still owe:
 * the "artist or looking for artists" choice after Google, or the artist profile form.
 */
const OnboardingGate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      setUserId((prev) => {
        if (prev !== id) clearOnboardingCache();
        return id;
      });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getOnboardingState(userId).then((state) => {
      if (cancelled) return;
      const target = onboardingRedirect(state, location.pathname);
      if (target && target !== location.pathname) navigate(target, { replace: true });
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, location.pathname, navigate]);

  return null;
};

export default OnboardingGate;
