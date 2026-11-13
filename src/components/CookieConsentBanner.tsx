import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { CONSENT_EVENT, getConsent, setConsent } from "@/lib/cookieConsent";

/** Asks once whether marketing cookies (Meta Pixel) may be used. Not shown in the native app. */
const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const sync = () => setVisible(getConsent() === null);
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-[#111114] px-4 py-4 text-white shadow-[0_-8px_24px_rgba(0,0,0,0.45)] md:px-8"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-relaxed text-white/80">
          We use Meta cookies to measure our ads and improve our marketing. They are only used if you accept.{" "}
          <Link to="/privacy-policy" className="font-semibold underline underline-offset-2">
            Privacy policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => setConsent("denied")}
            className="h-11 rounded-full border border-white/40 px-6 text-sm font-bold text-white transition-colors hover:border-white"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className="h-11 rounded-full bg-accent px-6 text-sm font-bold text-accent-foreground transition-transform hover:scale-[1.03]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
