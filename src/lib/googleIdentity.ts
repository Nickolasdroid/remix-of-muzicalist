/**
 * Google Identity Services ("Sign in with Google" button).
 *
 * The button runs on our own origin and hands back a Google ID token, which is exchanged for a
 * Supabase session with supabase.auth.signInWithIdToken. People never leave muzicalist.com, so
 * Google's account chooser does not show the Supabase project address.
 */

type CredentialResponse = { credential?: string };

type GsiInitializeConfig = {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  nonce?: string;
  auto_select?: boolean;
  use_fedcm_for_button?: boolean;
};

type GsiButtonConfig = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GsiInitializeConfig) => void;
          renderButton: (parent: HTMLElement, options: GsiButtonConfig) => void;
        };
      };
    };
  }
}

export type { CredentialResponse, GsiButtonConfig };

/** The Web OAuth client ID (public by design — it is shipped to the browser). */
export const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined;

const GSI_SRC = "https://accounts.google.com/gsi/client";
let loading: Promise<void> | null = null;

/** Loads Google's script once. Rejects on network failure or timeout so callers can fall back. */
export function loadGoogleIdentity(timeoutMs = 8000): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const fail = (message: string) => {
      window.clearTimeout(timer);
      script.remove();
      loading = null;
      reject(new Error(message));
    };
    const timer = window.setTimeout(() => fail("Google Identity script timed out"), timeoutMs);
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.clearTimeout(timer);
      if (window.google?.accounts?.id) resolve();
      else fail("Google Identity script loaded without the API");
    };
    script.onerror = () => fail("Google Identity script failed to load");
    document.head.appendChild(script);
  });

  return loading;
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

/**
 * A fresh nonce per attempt. Google gets the SHA-256 hash (it ends up in the ID token), Supabase
 * gets the raw value and checks that the hash matches — this stops a stolen token being replayed.
 */
export async function createNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = toHex(bytes);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return { raw, hashed: toHex(new Uint8Array(digest)) };
}
