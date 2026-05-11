import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ro from './locales/ro.json';
import { languageForCountry } from '@/lib/countryLanguages';
import { getOverride, TRANSLATION_OVERRIDES } from './overrides';

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

async function detectVisitorLanguage(): Promise<string> {
  const cached = localStorage.getItem(COUNTRY_LANG_KEY);
  if (cached) return cached;

  const providers = [
    async () => (await fetch('https://ipapi.co/country_code/')).text(),
    async () => {
      const trace = await (await fetch('https://www.cloudflare.com/cdn-cgi/trace')).text();
      return trace.match(/loc=([A-Z]{2})/)?.[1] || '';
    },
    async () => {
      const data = await (await fetch('https://ipwho.is/')).json();
      return data?.country_code || '';
    },
  ];

  for (const provider of providers) {
    try {
      const code = (await provider()).trim().toUpperCase();
      if (code) {
        const lang = languageForCountry(code);
        localStorage.setItem(COUNTRY_LANG_KEY, lang);
        return lang;
      }
    } catch {
      /* try next provider */
    }
  }

  return normalizeLanguage(navigator.languages?.[0] || navigator.language);
}

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
      // Allow any language at runtime; we add resources dynamically.
      supportedLngs: false as any,
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
    });

  // Auto-localize based on visitor country (IP geolocation).
  // Skipped if the user has manually picked a language.
  (async () => {
    try {
      if (typeof window === 'undefined') return;
      const manual = localStorage.getItem(MANUAL_LANG_KEY);
      if (manual) {
        await applyLanguage(manual);
        return;
      }

      await applyLanguage(await detectVisitorLanguage());
    } catch (e) {
      console.warn('Auto-localization failed', e);
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
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data.translations));
      } catch {
        /* quota exceeded — non-fatal */
      }
      return data.translations;
    }
    return null;
  } catch (e) {
    console.warn('translate-locale request failed', e);
    return null;
  }
}

async function applyLanguage(lang: string) {
  const base = normalizeLanguage(lang);
  if (STATIC_LANGS.includes(base)) {
    if (i18n.language?.split('-')[0] !== base) await i18n.changeLanguage(base);
    return;
  }

  // Dynamic language — load (or fetch + cache) translations, then switch.
  const translations = await loadDynamicTranslations(base);
  if (translations) {
    i18n.addResourceBundle(base, 'translation', translations, true, true);
    if (i18n.language?.split('-')[0] !== base) await i18n.changeLanguage(base);
  } else {
    // Fall back to English if AI translation failed.
    if (i18n.language?.split('-')[0] !== 'en') await i18n.changeLanguage('en');
  }
}

// Helper for language switchers to mark a manual override and apply it.
export const setManualLanguage = async (lng: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MANUAL_LANG_KEY, lng);
  }
  await applyLanguage(lng);
};

export const getCurrentLanguage = () => normalizeLanguage(i18n.language);

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
  if (!uniqueTexts.length || base === 'en') return Object.fromEntries(uniqueTexts.map((t) => [t, t]));
  const cache = loadCache(base);
  const overrides = TRANSLATION_OVERRIDES[base] || {};
  return Object.fromEntries(uniqueTexts.map((t) => [t, overrides[t] || cache[t] || '']));
};

export const translateTexts = async (targetLang: string, texts: string[]): Promise<Record<string, string>> => {
  const base = normalizeLanguage(targetLang);
  const uniqueTexts = [...new Set(texts.map((text) => text.trim()).filter(Boolean))];
  if (!uniqueTexts.length || base === 'en') return Object.fromEntries(uniqueTexts.map((text) => [text, text]));

  const cache = loadCache(base);
  const overrides = TRANSLATION_OVERRIDES[base] || {};

  const missing = uniqueTexts.filter((text) => !overrides[text] && !cache[text]);
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
          cache[text] = typeof translated[index] === 'string' && translated[index].trim() ? translated[index] : text;
        });
      }
      persistCache(base);
    }
  }

  return Object.fromEntries(uniqueTexts.map((text) => [text, overrides[text] || cache[text] || text]));
};


export default i18n;
