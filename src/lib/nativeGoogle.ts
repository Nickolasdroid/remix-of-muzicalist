import { SocialLogin } from "@capgo/capacitor-social-login";
import { GOOGLE_WEB_CLIENT_ID, createNonce } from "@/lib/googleIdentity";

/**
 * Google sign-in inside the Android app: the system account sheet (Credential Manager) instead of
 * a web page. It hands back the same kind of Google ID token as the website button, which is
 * exchanged with supabase.auth.signInWithIdToken. Needs an Android OAuth client in Google Cloud
 * (package com.muzicalist.app + the SHA-1 of the key that signs the app).
 */

let initialized: Promise<void> | null = null;

const init = () => {
  if (!initialized) {
    initialized = SocialLogin.initialize({
      // The WEB client id: it is the audience Supabase accepts. The Android client is only
      // registered in Google Cloud and never appears in code.
      google: { webClientId: GOOGLE_WEB_CLIENT_ID, skipAuthOnlyAuthorizationAfterSignIn: true },
    }).catch((e) => {
      initialized = null;
      throw e;
    });
  }
  return initialized;
};

export class GoogleCancelled extends Error {}

/** Opens the Google account sheet and returns the ID token plus the raw nonce Supabase needs. */
export async function nativeGoogleLogin(): Promise<{ idToken: string; nonce: string }> {
  if (!GOOGLE_WEB_CLIENT_ID) throw new Error("Google sign-in is not configured.");
  await init();
  const { raw, hashed } = await createNonce();
  try {
    const res = await SocialLogin.login({ provider: "google", options: { nonce: hashed } });
    const result = res.result;
    const idToken = "idToken" in result ? result.idToken : null;
    if (!idToken) throw new Error("Google sign-in failed.");
    return { idToken, nonce: raw };
  } catch (e) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "USER_CANCELLED") throw new GoogleCancelled();
    throw e;
  }
}
