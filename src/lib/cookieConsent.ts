// Consent for marketing tracking (Meta Pixel). Nothing marketing-related loads before "granted".

const KEY = "muzicalist_marketing_consent";
export const CONSENT_EVENT = "muzicalist:consent";

export type Consent = "granted" | "denied" | null;

export const getConsent = (): Consent => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
};

export const setConsent = (value: "granted" | "denied") => {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // Storage blocked: the choice only lasts for this page view.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
};

export const hasMarketingConsent = () => getConsent() === "granted";
