import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ro from './locales/ro.json';
import { languageForCountry } from '@/lib/countryLanguages';
import { getOverride, TRANSLATION_OVERRIDES } from './overrides';
// The Romanian dictionary (~130KB raw) is code-split and loaded lazily so
// non-Romanian visitors never download it. The import is kicked off at module
// load for Romanian visitors, so it's ready before first paint in practice.
let RO_TEXT: Record<string, string> = {};
let roDictPromise: Promise<void> | null = null;
const ensureRoDict = (): Promise<void> =>
  (roDictPromise ??= import('./roText').then((m) => {
    RO_TEXT = m.RO_TEXT;
  }));
import { restoreBrandName, restoreBrandNameDeep } from '@/lib/brandName';

const STATIC_RESOURCES: Record<string, any> = {
  en,
  ro,
};

const STATIC_LANGS = Object.keys(STATIC_RESOURCES);

const COUNTRY_LANG_KEY = 'i18nextCountryLang_v2';
const MANUAL_LANG_KEY = 'i18nextManualLang_v2';
const TRANSLATIONS_PREFIX = 'i18nextDynamic_';
const TEXT_TRANSLATIONS_PREFIX = 'i18nextTextDynamic_';
// Bump this when en.json changes meaningfully to invalidate cached AI translations.
const TRANSLATIONS_VERSION = '1';

const normalizeLanguage = (lang: string | null | undefined) => (lang || 'en').split('-')[0].toLowerCase();

const getStoredLanguage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return (
      localStorage.getItem(MANUAL_LANG_KEY) ||
      localStorage.getItem(COUNTRY_LANG_KEY) ||
      localStorage.getItem('i18nextLng') ||
      null
    );
  } catch {
    return null;
  }
};

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  const stored = getStoredLanguage();
  if (stored) return normalizeLanguage(stored);
  // Scan ALL browser language preferences, not just the first one: many
  // users run an English-UI browser but still list their native language
  // (e.g. ['en-US', 'ro']). The first non-English entry is the best guess
  // and lets us localize instantly, with zero network round-trips.
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const p of prefs) {
    const base = normalizeLanguage(p);
    if (base !== 'en') return base;
  }
  return 'en';
};

async function detectVisitorLanguage(): Promise<string> {
  const cached = localStorage.getItem(COUNTRY_LANG_KEY);
  if (cached) return cached;

  const GEO_TIMEOUT_MS = 1500;
  const timeoutSignal = () => {
    try {
      return AbortSignal.timeout(GEO_TIMEOUT_MS);
    } catch {
      return undefined; // very old browsers — fetch just runs without a cap
    }
  };

  const providers = [
    async () =>
      (await fetch('https://ipapi.co/country_code/', { signal: timeoutSignal() })).text(),
    async () => {
      const trace = await (
        await fetch('https://www.cloudflare.com/cdn-cgi/trace', { signal: timeoutSignal() })
      ).text();
      return trace.match(/loc=([A-Z]{2})/)?.[1] || '';
    },
    async () => {
      const data = await (
        await fetch('https://ipwho.is/', { signal: timeoutSignal() })
      ).json();
      return data?.country_code || '';
    },
  ];

  try {
    // All providers race in PARALLEL — the first valid two-letter country
    // code wins. The old sequential chain could take many seconds when the
    // first provider was slow or rate-limited.
    const code = await Promise.any(
      providers.map(async (provider) => {
        const c = (await provider()).trim().toUpperCase();
        if (!/^[A-Z]{2}$/.test(c)) throw new Error('invalid country code');
        return c;
      })
    );
    const lang = languageForCountry(code);
    localStorage.setItem(COUNTRY_LANG_KEY, lang);
    return lang;
  } catch {
    return normalizeLanguage(navigator.languages?.[0] || navigator.language);
  }
}

// --- Boot-time language gate ---------------------------------------------
// Pentru limbile DINAMICE (nu engleză, nu cele statice ca româna), resursele
// de traducere se încarcă async din rețea (warmTextCache + loadDynamicTranslations)
// DUPĂ ce i18n.init a setat deja limba sincron din localStorage. Fereastra
// dintre "limba e setată" și "resursele au sosit" = flash de engleză la primul
// load. Ascundem body-ul O SINGURĂ DATĂ, la boot, până termină auto-localizarea
// — NU la fiecare navigare. Un load inițial cu o clipă de așteptare e acceptat
// de useri; un flash pe fiecare pagină nu.
const bootLangIsDynamic = () => {
  if (typeof window === 'undefined') return false;
  const manual = (() => {
    try { return localStorage.getItem(MANUAL_LANG_KEY); } catch { return null; }
  })();
  const base = normalizeLanguage(manual || getInitialLanguage());
  return base !== 'en' && !STATIC_LANGS.includes(base);
};

const showBootGate = () => {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('i18n-pending-style')) {
    const style = document.createElement('style');
    style.id = 'i18n-pending-style';
    style.textContent = 'html[data-i18n-pending="true"] body{visibility:hidden!important}';
    document.head.appendChild(style);
  }
  document.documentElement.setAttribute('data-i18n-pending', 'true');
};

const hideBootGate = () => {
  if (typeof document === 'undefined') return;
  document.documentElement.removeAttribute('data-i18n-pending');
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ro: { translation: ro },
      },
      fallbackLng: 'en',
      lng: getInitialLanguage(),
      // Allow any language at runtime; we add resources dynamically.
      supportedLngs: false as any,
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
    });


// Kick off the Romanian dictionary download immediately for Romanian
// visitors — in parallel with everything else, before React even mounts.
if (typeof window !== 'undefined' && getInitialLanguage() === 'ro') {
  void ensureRoDict();
}
  // Auto-localize based on visitor country (IP geolocation).
  // Skipped if the user has manually picked a language, and skipped entirely
  // when the browser already declares a non-English preferred language —
  // the browser's explicit preference outranks an IP-based guess, and this
  // makes localization instant (no network round-trip) for most visitors.
  (async () => {
    // Ascunde body-ul la boot DOAR pentru limbile dinamice (resursele lor vin
    // din rețea). Pentru en/ro nu ascundem nimic — sunt sincrone. Safety: nu
    // ținem pagina ascunsă mai mult de 2.5s, orice s-ar întâmpla.
    const gated = bootLangIsDynamic();
    let safety: ReturnType<typeof setTimeout> | null = null;
    if (gated) {
      showBootGate();
      safety = setTimeout(hideBootGate, 2500);
    }
    try {
      if (typeof window === 'undefined') return;
      const manual = localStorage.getItem(MANUAL_LANG_KEY);
      if (manual) {
        await applyLanguage(manual);
        return;
      }

      const initial = getInitialLanguage();
      if (initial !== 'en') {
        await applyLanguage(initial);
        return;
      }

      await applyLanguage(await detectVisitorLanguage());
    } catch (e) {
      console.warn('Auto-localization failed', e);
    } finally {
      if (gated) {
        if (safety) clearTimeout(safety);
        hideBootGate();
      }
    }
  })();
}

async function loadDynamicTranslations(lang: string): Promise<Record<string, any> | null> {
  const cacheKey = `${TRANSLATIONS_PREFIX}${lang}_v${TRANSLATIONS_VERSION}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    /* ignore parse errors */
  }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl) return null;

    const res = await fetch(`${supabaseUrl}/functions/v1/translate-locale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {}),
      },
      body: JSON.stringify({ targetLang: lang, sourceLang: 'en', source: en }),
    });
    if (!res.ok) {
      console.warn('translate-locale failed', res.status);
      return null;
    }
    const data = await res.json();
    if (data?.translations) {
      const safe = restoreBrandNameDeep(data.translations);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(safe));
      } catch {
        /* quota exceeded — non-fatal */
      }
      return safe;
    }
    return null;
  } catch (e) {
    console.warn('translate-locale request failed', e);
    return null;
  }
}

async function applyLanguage(lang: string) {
  const base = normalizeLanguage(lang);
  // Keep <html lang="..."> in sync with the active language — helps search
  // engines, screen readers and browser translation prompts.
  const syncHtmlLang = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = i18n.language?.split('-')[0] || base;
    }
  };
  if (STATIC_LANGS.includes(base)) {
    if (base === 'ro') await ensureRoDict();
    if (i18n.language?.split('-')[0] !== base) await i18n.changeLanguage(base);
    syncHtmlLang();
    return;
  }

  // Dynamic language: warm the local text cache with the ENTIRE global
  // dictionary for this language (one round-trip, plain DB read, no AI).
  // Every string any past visitor ever translated becomes instantly
  // available to this visitor too.
  await warmTextCache(base);

  // Dynamic language — load (or fetch + cache) translations, then switch.
  const translations = await loadDynamicTranslations(base);
  if (translations) {
    i18n.addResourceBundle(base, 'translation', translations, true, true);
    if (i18n.language?.split('-')[0] !== base) await i18n.changeLanguage(base);
  } else {
    // Fall back to English if AI translation failed.
    if (i18n.language?.split('-')[0] !== 'en') await i18n.changeLanguage('en');
  }
  syncHtmlLang();
}

// Fetches the full server-side translation dictionary for a language and
// merges it into the local cache. Fails silently — the per-page translation
// flow still works without it, just with more round-trips.
async function warmTextCache(base: string) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl) return;
    const res = await fetch(`${supabaseUrl}/functions/v1/translate-locale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
      },
      body: JSON.stringify({ dump: true, targetLang: base }),
    });
    if (!res.ok) return;
    const json = await res.json();
    const dict = json?.translations;
    if (dict && typeof dict === 'object') {
      const cache = loadCache(base);
      Object.assign(cache, dict);
      persistCache(base);
    }
  } catch {
    /* non-fatal */
  }
}

// Helper for language switchers to mark a manual override and apply it.
export const setManualLanguage = async (lng: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MANUAL_LANG_KEY, lng);
    const base = normalizeLanguage(lng);
    const currentBase = normalizeLanguage(i18n.language);
    if (base !== currentBase) {
      // Hide the body during the language swap so users never see a flash of
      // the previous language. AutoTranslatePageText removes this attribute
      // after the sync + async translation pass completes.
      document.documentElement.setAttribute('data-i18n-pending', 'true');
      if (!document.getElementById('i18n-pending-style')) {
        const style = document.createElement('style');
        style.id = 'i18n-pending-style';
        style.textContent = 'html[data-i18n-pending="true"] body{visibility:hidden!important}';
        document.head.appendChild(style);
      }
      // Safety timeout in case translation never resolves. Kept short:
      // a visible page with mixed languages beats a blank page any day.
      window.setTimeout(() => {
        document.documentElement.removeAttribute('data-i18n-pending');
      }, 2500);
    }
  }
  await applyLanguage(lng);
};

export const getCurrentLanguage = () => normalizeLanguage(getStoredLanguage() || i18n.language);

const memoryCache: Record<string, Record<string, string>> = {};

const loadCache = (base: string): Record<string, string> => {
  if (memoryCache[base]) return memoryCache[base];
  const cacheKey = `${TEXT_TRANSLATIONS_PREFIX}${base}_v${TRANSLATIONS_VERSION}`;
  try {
    memoryCache[base] = JSON.parse(localStorage.getItem(cacheKey) || '{}');
  } catch {
    memoryCache[base] = {};
  }
  return memoryCache[base];
};

const persistCache = (base: string) => {
  const cacheKey = `${TEXT_TRANSLATIONS_PREFIX}${base}_v${TRANSLATIONS_VERSION}`;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(memoryCache[base] || {}));
  } catch {
    /* quota exceeded */
  }
};

export const translateTextsSync = (targetLang: string, texts: string[]): Record<string, string> => {
  const base = normalizeLanguage(targetLang);
  const uniqueTexts = [...new Set(texts.map((t) => t.trim()).filter(Boolean))];
  if (!uniqueTexts.length || base === 'en')
    return Object.fromEntries(uniqueTexts.map((t) => [t, restoreBrandName(t)]));
  const cache = loadCache(base);
  const overrides = TRANSLATION_OVERRIDES[base] || {};
  // Romanian ships with a full static dictionary bundled at build time —
  // every known UI string translates synchronously, with zero network calls.
  const staticMap: Record<string, string> = base === 'ro' ? RO_TEXT : {};
  return Object.fromEntries(
    uniqueTexts.map((t) => [t, restoreBrandName(overrides[t] || staticMap[t] || cache[t] || '')])
  );
};

export const translateTexts = async (targetLang: string, texts: string[]): Promise<Record<string, string>> => {
  const base = normalizeLanguage(targetLang);
  const uniqueTexts = [...new Set(texts.map((text) => text.trim()).filter(Boolean))];
  if (!uniqueTexts.length || base === 'en') return Object.fromEntries(uniqueTexts.map((text) => [text, text]));

  if (base === 'ro') await ensureRoDict();
  const cache = loadCache(base);
  const overrides = TRANSLATION_OVERRIDES[base] || {};
  const staticMap: Record<string, string> = base === 'ro' ? RO_TEXT : {};

  const missing = uniqueTexts.filter((text) => !overrides[text] && !staticMap[text] && !cache[text]);
  if (missing.length) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (supabaseUrl) {
      for (let i = 0; i < missing.length; i += 80) {
        const batch = missing.slice(i, i + 80);
        const res = await fetch(`${supabaseUrl}/functions/v1/translate-locale`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {}),
          },
          body: JSON.stringify({ targetLang: base, sourceLang: 'auto', texts: batch }),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const translated: string[] = Array.isArray(data?.translations) ? data.translations : [];
        batch.forEach((text, index) => {
          const raw =
            typeof translated[index] === 'string' && translated[index].trim()
              ? translated[index]
              : text;
          cache[text] = restoreBrandName(raw);
        });
      }
      persistCache(base);
    }
  }

  return Object.fromEntries(
    uniqueTexts.map((text) => [text, restoreBrandName(overrides[text] || staticMap[text] || cache[text] || text)])
  );
};


export default i18n;
