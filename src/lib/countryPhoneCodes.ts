// Country code to phone prefix and length mapping
// length is the number of digits AFTER the country code
export interface CountryPhoneConfig {
  prefix: string;
  minLength: number;
  maxLength: number;
}

export const countryPhoneCodes: Record<string, CountryPhoneConfig> = {
  AL: { prefix: "+355", minLength: 8, maxLength: 9 },
  AD: { prefix: "+376", minLength: 6, maxLength: 9 },
  AT: { prefix: "+43", minLength: 10, maxLength: 13 },
  BY: { prefix: "+375", minLength: 9, maxLength: 9 },
  BE: { prefix: "+32", minLength: 8, maxLength: 9 },
  BA: { prefix: "+387", minLength: 8, maxLength: 8 },
  BG: { prefix: "+359", minLength: 8, maxLength: 9 },
  HR: { prefix: "+385", minLength: 8, maxLength: 9 },
  CY: { prefix: "+357", minLength: 8, maxLength: 8 },
  CZ: { prefix: "+420", minLength: 9, maxLength: 9 },
  DK: { prefix: "+45", minLength: 8, maxLength: 8 },
  EE: { prefix: "+372", minLength: 7, maxLength: 8 },
  FI: { prefix: "+358", minLength: 9, maxLength: 10 },
  FR: { prefix: "+33", minLength: 9, maxLength: 9 },
  DE: { prefix: "+49", minLength: 10, maxLength: 11 },
  GR: { prefix: "+30", minLength: 10, maxLength: 10 },
  HU: { prefix: "+36", minLength: 9, maxLength: 9 },
  IS: { prefix: "+354", minLength: 7, maxLength: 7 },
  IE: { prefix: "+353", minLength: 9, maxLength: 9 },
  IT: { prefix: "+39", minLength: 9, maxLength: 10 },
  XK: { prefix: "+383", minLength: 8, maxLength: 8 },
  LV: { prefix: "+371", minLength: 8, maxLength: 8 },
  LI: { prefix: "+423", minLength: 7, maxLength: 9 },
  LT: { prefix: "+370", minLength: 8, maxLength: 8 },
  LU: { prefix: "+352", minLength: 8, maxLength: 9 },
  MT: { prefix: "+356", minLength: 8, maxLength: 8 },
  MD: { prefix: "+373", minLength: 8, maxLength: 8 },
  MC: { prefix: "+377", minLength: 8, maxLength: 9 },
  ME: { prefix: "+382", minLength: 8, maxLength: 8 },
  NL: { prefix: "+31", minLength: 9, maxLength: 9 },
  MK: { prefix: "+389", minLength: 8, maxLength: 8 },
  NO: { prefix: "+47", minLength: 8, maxLength: 8 },
  PL: { prefix: "+48", minLength: 9, maxLength: 9 },
  PT: { prefix: "+351", minLength: 9, maxLength: 9 },
  RO: { prefix: "+40", minLength: 9, maxLength: 9 },
  RU: { prefix: "+7", minLength: 10, maxLength: 10 },
  SM: { prefix: "+378", minLength: 6, maxLength: 10 },
  RS: { prefix: "+381", minLength: 8, maxLength: 9 },
  SK: { prefix: "+421", minLength: 9, maxLength: 9 },
  SI: { prefix: "+386", minLength: 8, maxLength: 8 },
  ES: { prefix: "+34", minLength: 9, maxLength: 9 },
  SE: { prefix: "+46", minLength: 9, maxLength: 10 },
  CH: { prefix: "+41", minLength: 9, maxLength: 9 },
  UA: { prefix: "+380", minLength: 9, maxLength: 9 },
  GB: { prefix: "+44", minLength: 10, maxLength: 10 },
  VA: { prefix: "+39", minLength: 9, maxLength: 10 },
  US: { prefix: "+1", minLength: 10, maxLength: 10 },
  CA: { prefix: "+1", minLength: 10, maxLength: 10 },
  AU: { prefix: "+61", minLength: 9, maxLength: 9 },
  BR: { prefix: "+55", minLength: 10, maxLength: 11 },
  AR: { prefix: "+54", minLength: 10, maxLength: 10 },
  MX: { prefix: "+52", minLength: 10, maxLength: 10 },
  JP: { prefix: "+81", minLength: 10, maxLength: 10 },
  CN: { prefix: "+86", minLength: 11, maxLength: 11 },
  IN: { prefix: "+91", minLength: 10, maxLength: 10 },
  KR: { prefix: "+82", minLength: 9, maxLength: 10 },
  TR: { prefix: "+90", minLength: 10, maxLength: 10 },
  IL: { prefix: "+972", minLength: 9, maxLength: 9 },
  ZA: { prefix: "+27", minLength: 9, maxLength: 9 },
  NZ: { prefix: "+64", minLength: 8, maxLength: 9 },
};

export const getPhoneConfig = (countryCode: string): CountryPhoneConfig | null => {
  return countryPhoneCodes[countryCode] || null;
};

export const getPhonePrefix = (countryCode: string): string => {
  return countryPhoneCodes[countryCode]?.prefix || "";
};

export const getMaxPhoneLength = (countryCode: string): number => {
  const config = countryPhoneCodes[countryCode];
  if (!config) return 15; // Default max
  // Total length = prefix length + space + max digits
  return config.prefix.length + 1 + config.maxLength;
};

export const validatePhoneNumber = (phone: string, countryCode: string): { valid: boolean; message?: string } => {
  const config = countryPhoneCodes[countryCode];
  if (!config) return { valid: true };
  
  // Extract digits after the prefix
  const digitsOnly = phone.replace(config.prefix, "").replace(/\D/g, "");
  
  if (digitsOnly.length < config.minLength) {
    return { valid: false, message: `Phone number must have at least ${config.minLength} digits` };
  }
  
  if (digitsOnly.length > config.maxLength) {
    return { valid: false, message: `Phone number must have at most ${config.maxLength} digits` };
  }
  
  return { valid: true };
};
