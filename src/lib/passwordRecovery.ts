import { supabase } from "@/integrations/supabase/client";
import { RECOVERY_KEY, landedWithRecoveryLink } from "@/lib/recoveryCapture";

/** A reset link that landed on another page (e.g. the home page) still ends on /reset-password. */
export const watchPasswordRecovery = () => {
  supabase.auth.onAuthStateChange((event) => {
    if (event !== "PASSWORD_RECOVERY") return;
    try {
      sessionStorage.setItem(RECOVERY_KEY, "1");
    } catch {
      /* storage unavailable */
    }
    if (window.location.pathname !== "/reset-password") window.location.replace("/reset-password");
  });
  // Landed with the link on another page: go to the reset page (the session is already stored)
  if (landedWithRecoveryLink && window.location.pathname !== "/reset-password") {
    window.location.replace("/reset-password");
  }
};
