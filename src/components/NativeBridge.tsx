import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/native";
import { isModalOpen } from "@/lib/modalHistory";
import { RECOVERY_KEY } from "@/lib/recoveryCapture";

/** Pages where Back leaves the app instead of going to a previous page. */
const ROOT_PATHS = new Set(["/", "/login", "/feed", "/dashboard", "/user-dashboard", "/admin/dashboard"]);
const OWN_HOSTS = new Set(["www.muzicalist.com", "muzicalist.com"]);
const LINK_TOKEN_TYPES = new Set(["recovery", "signup", "magiclink", "email_change", "invite"]);

/**
 * Android app only (renders nothing on the website):
 *  - hardware Back button: closes an open window first, then goes to the previous page, and
 *    leaves the app only from a main page
 *  - links that open the app (muzicalist.com/...): go to that page; email links that carry a
 *    session (password reset, confirmation) are signed in first
 */
const NativeBridge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    if (!isNativeApp()) return;
    let cancelled = false;
    const handles: Array<{ remove: () => Promise<void> }> = [];

    (async () => {
      const { App } = await import("@capacitor/app");

      const back = await App.addListener("backButton", () => {
        // A window or sheet is open: let the shared modal history manager close it
        if (isModalOpen()) {
          window.history.back();
          return;
        }
        if (ROOT_PATHS.has(pathRef.current)) {
          void App.exitApp();
          return;
        }
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) window.history.back();
        else navigateRef.current("/", { replace: true });
      });

      const opened = await App.addListener("appUrlOpen", async ({ url }) => {
        let target: URL;
        try {
          target = new URL(url);
        } catch {
          return;
        }
        if (target.protocol !== "https:" || !OWN_HOSTS.has(target.hostname)) return;

        const hash = new URLSearchParams(target.hash.replace(/^#/, ""));
        const type = hash.get("type") ?? "";
        const access = hash.get("access_token");
        const refresh = hash.get("refresh_token");
        if (access && refresh && LINK_TOKEN_TYPES.has(type)) {
          const { error } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
          if (!error && type === "recovery") {
            try {
              sessionStorage.setItem(RECOVERY_KEY, "1");
            } catch {
              /* storage unavailable */
            }
            navigateRef.current("/reset-password", { replace: true });
            return;
          }
        }
        navigateRef.current(`${target.pathname}${target.search}`, { replace: false });
      });

      if (cancelled) {
        void back.remove();
        void opened.remove();
        return;
      }
      handles.push(back, opened);
    })();

    return () => {
      cancelled = true;
      handles.forEach((h) => void h.remove());
    };
  }, []);

  return null;
};

export default NativeBridge;
