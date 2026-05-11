// Maps ISO 3166-1 alpha-2 country codes to a primary language code.
// Used for automatic UI localization based on visitor location.

export const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  // English-speaking
  US: "en", GB: "en", IE: "en", AU: "en", NZ: "en", CA: "en", ZA: "en",
  IN: "en", PK: "en", PH: "en", SG: "en", MY: "en", NG: "en", KE: "en",
  GH: "en", UG: "en", JM: "en", TT: "en",

  // Romanian
  RO: "ro", MD: "ro",

  // French
  FR: "fr", BE: "fr", LU: "fr", MC: "fr", CH: "fr", SN: "fr", CI: "fr",
  CM: "fr", DZ: "fr", TN: "fr", MA: "fr", HT: "fr",

  // German
  DE: "de", AT: "de", LI: "de",

  // Spanish
  ES: "es", MX: "es", AR: "es", CO: "es", PE: "es", CL: "es", VE: "es",
  EC: "es", GT: "es", CU: "es", BO: "es", DO: "es", HN: "es", PY: "es",
  SV: "es", NI: "es", CR: "es", PA: "es", UY: "es", PR: "es",

  // Portuguese
  PT: "pt", BR: "pt", AO: "pt", MZ: "pt", CV: "pt",

  // Italian
  IT: "it", SM: "it", VA: "it",

  // Dutch
  NL: "nl",

  // Nordic
  SE: "sv", NO: "no", DK: "da", FI: "fi", IS: "is",

  // Eastern Europe
  PL: "pl", CZ: "cs", SK: "sk", HU: "hu", BG: "bg", RS: "sr", HR: "hr",
  SI: "sl", BA: "bs", MK: "mk", AL: "sq", EE: "et", LV: "lv", LT: "lt",
  UA: "uk", BY: "be",

  // Greek / Turkish
  GR: "el", CY: "el", TR: "tr",

  // Russian-speaking
  RU: "ru", KZ: "ru", KG: "ru", UZ: "uz", TJ: "tg", AM: "hy", AZ: "az", GE: "ka",

  // Middle East / Arabic
  SA: "ar", AE: "ar", EG: "ar", QA: "ar", KW: "ar", BH: "ar", OM: "ar",
  JO: "ar", LB: "ar", SY: "ar", IQ: "ar", LY: "ar", YE: "ar", SD: "ar",
  IL: "he", IR: "fa", AF: "fa",

  // Asia
  CN: "zh", HK: "zh", TW: "zh", MO: "zh",
  JP: "ja", KR: "ko",
  TH: "th", VN: "vi", ID: "id", KH: "km", LA: "lo", MM: "my",
  BD: "bn", LK: "si", NP: "ne",
};

export function languageForCountry(code: string | null | undefined): string {
  if (!code) return "en";
  return COUNTRY_TO_LANGUAGE[code.toUpperCase()] || "en";
}
