import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ro from './locales/ro.json';

const resources = {
  en: { translation: en },
  ro: { translation: ro },
};

// Map ISO country codes to supported app languages.
// Extend this when adding more locales.
const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  RO: 'ro',
  MD: 'ro',
};

const SUPPORTED = ['en', 'ro'];
const COUNTRY_LANG_KEY = 'i18nextCountryLang';
const MANUAL_LANG_KEY = 'i18nextManualLang';

// Only initialize if not already initialized
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      supportedLngs: SUPPORTED,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },
    });

  // Auto-translate based on visitor country (IP geolocation).
  // Runs only if the user hasn't manually chosen a language.
  (async () => {
    try {
      if (typeof window === 'undefined') return;
      const manual = localStorage.getItem(MANUAL_LANG_KEY);
      if (manual) return; // respect explicit user choice

      let countryLang = localStorage.getItem(COUNTRY_LANG_KEY);
      if (!countryLang) {
        const res = await fetch('https://ipapi.co/country_code/');
        if (!res.ok) return;
        const code = (await res.text()).trim().toUpperCase();
        countryLang = COUNTRY_TO_LANGUAGE[code] || 'en';
        localStorage.setItem(COUNTRY_LANG_KEY, countryLang);
      }

      if (
        SUPPORTED.includes(countryLang) &&
        i18n.language?.split('-')[0] !== countryLang
      ) {
        await i18n.changeLanguage(countryLang);
      }
    } catch {
      // Silent fail — fallback to detector defaults
    }
  })();
}

// Helper for language switchers to mark a manual override.
export const setManualLanguage = async (lng: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MANUAL_LANG_KEY, lng);
  }
  await i18n.changeLanguage(lng);
};

export default i18n;
