/**
 * Runs before the Supabase client is created (imported first in main.tsx, no imports here).
 * The client reads the password-reset link from the URL and clears it as soon as it starts,
 * long before the lazily loaded reset page mounts, so the page would miss it and show the
 * "send me a link" form again. We note it here, while the URL still has it.
 */
export const RECOVERY_KEY = "mz_password_recovery";
export const RECOVERY_ERROR_KEY = "mz_password_recovery_error";
/** This page load came from a password-reset link. */
export let landedWithRecoveryLink = false;

if (typeof window !== "undefined") {
  try {
    const raw = `${window.location.hash.replace(/^#/, "&")}&${window.location.search.replace(/^\?/, "")}`;
    const params = new URLSearchParams(raw);
    if (params.get("type") === "recovery") {
      landedWithRecoveryLink = true;
      sessionStorage.setItem(RECOVERY_KEY, "1");
    }
    // Expired or already used link: Supabase sends error_code=otp_expired
    const errorCode = params.get("error_code") || params.get("error");
    if (errorCode && window.location.pathname === "/reset-password") {
      sessionStorage.setItem(RECOVERY_ERROR_KEY, errorCode);
    }
  } catch {
    /* storage unavailable */
  }
}
