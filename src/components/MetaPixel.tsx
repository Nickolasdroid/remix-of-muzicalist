import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const PIXEL_ID = "1819508862155121";

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] };
    _fbq?: unknown;
  }
}

const loadPixel = () => {
  if (typeof window === "undefined" || window.fbq) return;

  /* eslint-disable */
  // Standard Meta Pixel bootstrap snippet
  (function (f: any, b: Document, e: string, v: string) {
    let n: any;
    let t: HTMLScriptElement;
    let s: HTMLScriptElement | null;
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0] as HTMLScriptElement;
    s?.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq!("init", PIXEL_ID);
};

const MetaPixel = () => {
  const location = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    loadPixel();
  }, []);

  useEffect(() => {
    if (!window.fbq) return;
    // Fire PageView on initial mount and every subsequent route change.
    // The snippet does not auto-track a PageView so this is the single source.
    window.fbq("track", "PageView");
    initialized.current = true;
  }, [location.pathname, location.search]);

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        alt=""
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
};

export default MetaPixel;
