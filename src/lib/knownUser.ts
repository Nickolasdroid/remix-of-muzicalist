import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/*
 * Who is signed in, known straight away. Supabase only tells us after an async check, so
 * every page used to draw itself for a guest for a moment first (guest menu, "Log in"
 * buttons), then switch. We start from the session saved in the browser and keep it
 * in step with Supabase, so pages open in the right state from the first frame.
 */

const readStored = (): User | null => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !/^sb-.+-auth-token$/.test(key)) continue;
      const raw = JSON.parse(localStorage.getItem(key) || "null");
      const session = raw?.currentSession ?? raw;
      if (session?.user?.id && session?.refresh_token) return session.user as User;
    }
  } catch {
    /* blocked storage: we'll learn it from Supabase */
  }
  return null;
};

let current: User | null = readStored();

supabase.auth.onAuthStateChange((_event, session) => {
  current = session?.user ?? null;
});

export const knownUser = (): User | null => current;
export const knownUserId = (): string | null => current?.id ?? null;
