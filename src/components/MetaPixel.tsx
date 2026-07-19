import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { subscriptionPlans } from "@/lib/subscriptionPlans";

const PIXEL_ID = "1819508862155121";
const PENDING_PURCHASE_KEY = "muzicalist_pixel_pending_purchase";
const FIRED_PURCHASE_PREFIX = "muzicalist_pixel_purchase_fired_";

type PlanId = "Free" | "Standard" | "Premium";

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

const generateNonce = () => {
  try {
    // Prefer cryptographically secure UUIDs when available
    const c = (globalThis as any).crypto;
    if (c?.randomUUID) return c.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * Called right before redirecting the user to Stripe checkout. Stores the
 * plan being purchased so the Purchase pixel event can be fired accurately
 * once Stripe redirects back with `?checkout=success`.
 */
export const stagePendingPurchase = (opts: {
  plan: PlanId | string;
  isAnnual: boolean;
}): string | null => {
  if (typeof window === "undefined") return null;
  const planDef = subscriptionPlans.find((p) => p.id === opts.plan);
  if (!planDef || planDef.monthlyPrice <= 0) return null;
  const value = opts.isAnnual ? planDef.monthlyPrice * 10 : planDef.monthlyPrice;
  const nonce = generateNonce();
  try {
    sessionStorage.setItem(
      PENDING_PURCHASE_KEY,
      JSON.stringify({
        nonce,
        plan: planDef.id,
        planName: planDef.name,
        value,
        currency: "RON",
        isAnnual: opts.isAnnual,
      }),
    );
  } catch {}
  return nonce;
};

const firePurchaseIfSuccess = (search: string) => {
  if (typeof window === "undefined" || !window.fbq) return;
  const params = new URLSearchParams(search);
  if (params.get("checkout") !== "success") return;

  let pending: any = null;
  try {
    const raw = sessionStorage.getItem(PENDING_PURCHASE_KEY);
    if (raw) pending = JSON.parse(raw);
  } catch {}
  if (!pending?.nonce) return;

  const firedKey = `${FIRED_PURCHASE_PREFIX}${pending.nonce}`;
  try {
    if (sessionStorage.getItem(firedKey)) return;
  } catch {}

  window.fbq("track", "Purchase", {
    value: pending.value,
    currency: pending.currency || "RON",
    content_name: pending.planName || pending.plan,
  });

  try {
    sessionStorage.setItem(firedKey, "1");
    sessionStorage.removeItem(PENDING_PURCHASE_KEY);
  } catch {}
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

    // After PageView, check for a completed Stripe checkout redirect and
    // fire the Purchase event exactly once per successful payment.
    firePurchaseIfSuccess(location.search);
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

/**
 * Fire a Meta Pixel event. Safe to call before the pixel script has loaded —
 * the bootstrap snippet queues calls until fbevents.js is ready.
 */
export const trackPixelEvent = (
  event: string,
  params?: Record<string, unknown>,
) => {
  if (typeof window === "undefined") return;
  // Ensure the pixel bootstrap has run so window.fbq exists and queues calls
  // until fbevents.js finishes loading. Without this, an event fired on a
  // page where <MetaPixel /> hasn't mounted yet (or before its effect ran)
  // would silently no-op.
  loadPixel();
  if (!window.fbq) {
    console.warn(`[MetaPixel] fbq unavailable, dropping event: ${event}`);
    return;
  }
  console.log(`[MetaPixel] ${event} fired`, params ?? "");
  if (params) {
    window.fbq("track", event, params);
  } else {
    window.fbq("track", event);
  }
};

