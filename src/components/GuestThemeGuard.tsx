import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Forces the dark theme for any unauthenticated visitor,
 * regardless of the route they're on. Restores the user's
 * preferred theme (light class) once they sign in.
 */
const GuestThemeGuard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setIsAuthenticated(!!session?.user)
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      const root = document.documentElement;
      const hadLight = root.classList.contains("light");
      root.classList.remove("light");
      return () => {
        if (hadLight) root.classList.add("light");
      };
    }
  }, [isAuthenticated]);

  return null;
};

export default GuestThemeGuard;
