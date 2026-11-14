import { Capacitor } from "@capacitor/core";

/** True inside the Android app (never on the website, including the mobile browser). */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/**
 * The address Muzicalist lives at. Inside the app the page itself runs on https://localhost,
 * which is useless in an email link or a payment return, so everything that leaves the app
 * (confirmation and reset emails, Stripe return pages, shared links) uses this instead.
 */
export const PUBLIC_ORIGIN = "https://www.muzicalist.com";

export const appOrigin = (): string => (isNativeApp() ? PUBLIC_ORIGIN : window.location.origin);

/** Absolute address of a page of the site, e.g. appUrl("/login"). */
export const appUrl = (path = ""): string => `${appOrigin()}${path}`;

/**
 * Buying or changing a paid plan inside the app. Google Play requires Play Billing for digital
 * subscriptions, so this stays off until Play Billing is built (or the app is published
 * without purchases). Flip to true only together with that work.
 */
export const NATIVE_PURCHASES_ENABLED = false;

/** Plans can be bought / managed on this device. */
export const canManagePlans = (): boolean => !isNativeApp() || NATIVE_PURCHASES_ENABLED;
