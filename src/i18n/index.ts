import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ro from './locales/ro.json';
import { languageForCountry } from '@/lib/countryLanguages';

const STATIC_RESOURCES: Record<string, any> = {
  en,
  ro,
};

const STATIC_LANGS = Object.keys(STATIC_RESOURCES);

const COUNTRY_LANG_KEY = 'i18nextCountryLang';
const MANUAL_LANG_KEY = 'i18nextManualLang';
const TRANSLATIONS_PREFIX = 'i18nextDynamic_';
// Bump this when en.json changes meaningfully to invalidate cached AI translations.
const TRANSLATIONS_VERSION = '1';

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

      let lang = localStorage.getItem(COUNTRY_LANG_KEY);
      if (!lang) {
        try {
          const res = await fetch('https://ipapi.co/country_code/');
          if (res.ok) {
            const code = (await res.text()).trim().toUpperCase();
            lang = languageForCountry(code);
          }
        } catch {
          /* network/CORS failure — keep default */
        }
        if (lang) localStorage.setItem(COUNTRY_LANG_KEY, lang);
      }

      if (lang) await applyLanguage(lang);
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
  const base = lang.split('-')[0];
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

export default i18n;
