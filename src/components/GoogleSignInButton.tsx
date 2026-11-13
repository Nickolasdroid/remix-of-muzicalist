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
          theme: "outline",
          size: "large",
          text,
          shape: "pill",
          logo_alignment: "center",
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
      <div className={mode === "fallback" ? "hidden" : "group relative mx-auto h-11 w-full max-w-[400px]"}>
        {/* What people see: the site's own button. It is not clickable by itself. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#727272] text-base font-bold text-foreground transition-colors group-hover:border-foreground group-focus-within:ring-2 group-focus-within:ring-white/70 ${
            mode === "loading" ? "opacity-60" : ""
          }`}
        >
          <GoogleLogo />
          <span>Continue with Google</span>
        </div>
        {/* What people click: Google's real button, invisible, stretched over ours. */}
        <div className="absolute inset-0 overflow-hidden rounded-full opacity-[0.01]">
          <div ref={containerRef} className="flex h-full w-full origin-center scale-y-[1.15] items-center justify-center" />
        </div>
      </div>
      {mode === "fallback" && fallback}
    </>
  );
};

const GoogleLogo = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);

export default GoogleSignInButton;
