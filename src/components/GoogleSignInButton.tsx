import { useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GOOGLE_WEB_CLIENT_ID, createNonce, loadGoogleIdentity } from "@/lib/googleIdentity";

type Props = {
  /** Wording on Google's button. */
  text: "signin_with" | "signup_with" | "continue_with";
  /** Runs right before the Supabase exchange (e.g. to remember which account type was chosen). */
  onBeforeSignIn?: () => void;
  onSignedIn: () => void;
  onError: (message: string) => void;
  /** Shown instead when Google's script can't load (blocked, offline, in-app browsers). */
  fallback: ReactNode;
};

/**
 * "Continue with Google" without leaving the site. Falls back to the redirect-based button when
 * Google Identity Services isn't available, so signing in never depends on a third-party script.
 */
const GoogleSignInButton = ({ text, onBeforeSignIn, onSignedIn, onError, fallback }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"loading" | "google" | "fallback">(GOOGLE_WEB_CLIENT_ID ? "loading" : "fallback");
  const handlers = useRef({ onBeforeSignIn, onSignedIn, onError });
  handlers.current = { onBeforeSignIn, onSignedIn, onError };

  useEffect(() => {
    if (!GOOGLE_WEB_CLIENT_ID) return;
    let cancelled = false;

    (async () => {
      try {
        await loadGoogleIdentity();
        const { raw, hashed } = await createNonce();
        const container = containerRef.current;
        if (cancelled || !container || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_WEB_CLIENT_ID,
          nonce: hashed,
          auto_select: false,
          use_fedcm_for_button: true,
          callback: async (response) => {
            if (!response.credential) {
              handlers.current.onError("Google sign-in failed.");
              return;
            }
            handlers.current.onBeforeSignIn?.();
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce: raw,
            });
            if (error) handlers.current.onError(error.message || "Google sign-in failed.");
            else handlers.current.onSignedIn();
          },
        });

        // Google needs a pixel width between 200 and 400
        const width = Math.min(400, Math.max(200, Math.round(container.clientWidth || 320)));
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          text,
          shape: "pill",
          logo_alignment: "left",
          width,
        });
        setMode("google");
      } catch {
        if (!cancelled) setMode("fallback");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <>
      <div
        ref={containerRef}
        className={
          mode === "google" ? "flex min-h-11 w-full justify-center" : mode === "loading" ? "h-0 w-full overflow-hidden" : "hidden"
        }
      />
      {mode === "loading" && <div className="h-11 w-full animate-pulse rounded-full border border-[#292929]" aria-hidden="true" />}
      {mode === "fallback" && fallback}
    </>
  );
};

export default GoogleSignInButton;
