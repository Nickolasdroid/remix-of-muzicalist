// Country code to phone prefix and length mapping
// length is the number of digits AFTER the country code
export interface CountryPhoneConfig {
  prefix: string;
  minLength: number;
  maxLength: number;
}

export const countryPhoneCodes: Record<string, CountryPhoneConfig> = {
  // A
  AF: { prefix: "+93", minLength: 9, maxLength: 9 },
  AL: { prefix: "+355", minLength: 8, maxLength: 9 },
  DZ: { prefix: "+213", minLength: 9, maxLength: 9 },
  AD: { prefix: "+376", minLength: 6, maxLength: 9 },
  AO: { prefix: "+244", minLength: 9, maxLength: 9 },
  AG: { prefix: "+1268", minLength: 7, maxLength: 7 },
  AR: { prefix: "+54", minLength: 10, maxLength: 10 },
  AM: { prefix: "+374", minLength: 8, maxLength: 8 },
  AU: { prefix: "+61", minLength: 9, maxLength: 9 },
  AT: { prefix: "+43", minLength: 10, maxLength: 13 },
  AZ: { prefix: "+994", minLength: 9, maxLength: 9 },
  // B
  BS: { prefix: "+1242", minLength: 7, maxLength: 7 },
  BH: { prefix: "+973", minLength: 8, maxLength: 8 },
  BD: { prefix: "+880", minLength: 10, maxLength: 10 },
  BB: { prefix: "+1246", minLength: 7, maxLength: 7 },
  BY: { prefix: "+375", minLength: 9, maxLength: 9 },
  BE: { prefix: "+32", minLength: 8, maxLength: 9 },
  BZ: { prefix: "+501", minLength: 7, maxLength: 7 },
  BJ: { prefix: "+229", minLength: 8, maxLength: 8 },
  BT: { prefix: "+975", minLength: 8, maxLength: 8 },
  BO: { prefix: "+591", minLength: 8, maxLength: 8 },
  BA: { prefix: "+387", minLength: 8, maxLength: 8 },
  BW: { prefix: "+267", minLength: 7, maxLength: 8 },
  BR: { prefix: "+55", minLength: 10, maxLength: 11 },
  BN: { prefix: "+673", minLength: 7, maxLength: 7 },
  BG: { prefix: "+359", minLength: 8, maxLength: 9 },
  BF: { prefix: "+226", minLength: 8, maxLength: 8 },
  BI: { prefix: "+257", minLength: 8, maxLength: 8 },
  // C
  CV: { prefix: "+238", minLength: 7, maxLength: 7 },
  KH: { prefix: "+855", minLength: 8, maxLength: 9 },
  CM: { prefix: "+237", minLength: 9, maxLength: 9 },
  CA: { prefix: "+1", minLength: 10, maxLength: 10 },
  CF: { prefix: "+236", minLength: 8, maxLength: 8 },
  TD: { prefix: "+235", minLength: 8, maxLength: 8 },
  CL: { prefix: "+56", minLength: 9, maxLength: 9 },
  CN: { prefix: "+86", minLength: 11, maxLength: 11 },
  CO: { prefix: "+57", minLength: 10, maxLength: 10 },
  KM: { prefix: "+269", minLength: 7, maxLength: 7 },
  CG: { prefix: "+242", minLength: 9, maxLength: 9 },
  CD: { prefix: "+243", minLength: 9, maxLength: 9 },
  CR: { prefix: "+506", minLength: 8, maxLength: 8 },
  CI: { prefix: "+225", minLength: 10, maxLength: 10 },
  HR: { prefix: "+385", minLength: 8, maxLength: 9 },
  CU: { prefix: "+53", minLength: 8, maxLength: 8 },
  CY: { prefix: "+357", minLength: 8, maxLength: 8 },
  CZ: { prefix: "+420", minLength: 9, maxLength: 9 },
  // D
  DK: { prefix: "+45", minLength: 8, maxLength: 8 },
  DJ: { prefix: "+253", minLength: 8, maxLength: 8 },
  DM: { prefix: "+1767", minLength: 7, maxLength: 7 },
  DO: { prefix: "+1809", minLength: 7, maxLength: 7 },
  // E
  EC: { prefix: "+593", minLength: 9, maxLength: 9 },
  EG: { prefix: "+20", minLength: 10, maxLength: 10 },
  SV: { prefix: "+503", minLength: 8, maxLength: 8 },
  GQ: { prefix: "+240", minLength: 9, maxLength: 9 },
  ER: { prefix: "+291", minLength: 7, maxLength: 7 },
  EE: { prefix: "+372", minLength: 7, maxLength: 8 },
  SZ: { prefix: "+268", minLength: 8, maxLength: 8 },
  ET: { prefix: "+251", minLength: 9, maxLength: 9 },
  // F
  FJ: { prefix: "+679", minLength: 7, maxLength: 7 },
  FI: { prefix: "+358", minLength: 9, maxLength: 10 },
  FR: { prefix: "+33", minLength: 9, maxLength: 9 },
  // G
  GA: { prefix: "+241", minLength: 7, maxLength: 8 },
  GM: { prefix: "+220", minLength: 7, maxLength: 7 },
  GE: { prefix: "+995", minLength: 9, maxLength: 9 },
  DE: { prefix: "+49", minLength: 10, maxLength: 11 },
  GH: { prefix: "+233", minLength: 9, maxLength: 9 },
  GR: { prefix: "+30", minLength: 10, maxLength: 10 },
  GD: { prefix: "+1473", minLength: 7, maxLength: 7 },
  GT: { prefix: "+502", minLength: 8, maxLength: 8 },
  GN: { prefix: "+224", minLength: 9, maxLength: 9 },
  GW: { prefix: "+245", minLength: 7, maxLength: 7 },
  GY: { prefix: "+592", minLength: 7, maxLength: 7 },
  // H
  HT: { prefix: "+509", minLength: 8, maxLength: 8 },
  HN: { prefix: "+504", minLength: 8, maxLength: 8 },
  HU: { prefix: "+36", minLength: 9, maxLength: 9 },
  // I
  IS: { prefix: "+354", minLength: 7, maxLength: 7 },
  IN: { prefix: "+91", minLength: 10, maxLength: 10 },
  ID: { prefix: "+62", minLength: 9, maxLength: 12 },
  IR: { prefix: "+98", minLength: 10, maxLength: 10 },
  IQ: { prefix: "+964", minLength: 10, maxLength: 10 },
  IE: { prefix: "+353", minLength: 9, maxLength: 9 },
  IL: { prefix: "+972", minLength: 9, maxLength: 9 },
  IT: { prefix: "+39", minLength: 9, maxLength: 10 },
  // J
  JM: { prefix: "+1876", minLength: 7, maxLength: 7 },
  JP: { prefix: "+81", minLength: 10, maxLength: 10 },
  JO: { prefix: "+962", minLength: 9, maxLength: 9 },
  // K
  KZ: { prefix: "+7", minLength: 10, maxLength: 10 },
  KE: { prefix: "+254", minLength: 9, maxLength: 9 },
  KI: { prefix: "+686", minLength: 5, maxLength: 8 },
  XK: { prefix: "+383", minLength: 8, maxLength: 8 },
  KW: { prefix: "+965", minLength: 8, maxLength: 8 },
  KG: { prefix: "+996", minLength: 9, maxLength: 9 },
  // L
  LA: { prefix: "+856", minLength: 8, maxLength: 10 },
  LV: { prefix: "+371", minLength: 8, maxLength: 8 },
  LB: { prefix: "+961", minLength: 7, maxLength: 8 },
  LS: { prefix: "+266", minLength: 8, maxLength: 8 },
  LR: { prefix: "+231", minLength: 7, maxLength: 8 },
  LY: { prefix: "+218", minLength: 9, maxLength: 9 },
  LI: { prefix: "+423", minLength: 7, maxLength: 9 },
  LT: { prefix: "+370", minLength: 8, maxLength: 8 },
  LU: { prefix: "+352", minLength: 8, maxLength: 9 },
  // M
  MG: { prefix: "+261", minLength: 9, maxLength: 9 },
  MW: { prefix: "+265", minLength: 7, maxLength: 9 },
  MY: { prefix: "+60", minLength: 9, maxLength: 10 },
  MV: { prefix: "+960", minLength: 7, maxLength: 7 },
  ML: { prefix: "+223", minLength: 8, maxLength: 8 },
  MT: { prefix: "+356", minLength: 8, maxLength: 8 },
  MH: { prefix: "+692", minLength: 7, maxLength: 7 },
  MR: { prefix: "+222", minLength: 8, maxLength: 8 },
  MU: { prefix: "+230", minLength: 7, maxLength: 8 },
  MX: { prefix: "+52", minLength: 10, maxLength: 10 },
  FM: { prefix: "+691", minLength: 7, maxLength: 7 },
  MD: { prefix: "+373", minLength: 8, maxLength: 8 },
  MC: { prefix: "+377", minLength: 8, maxLength: 9 },
  MN: { prefix: "+976", minLength: 8, maxLength: 8 },
  ME: { prefix: "+382", minLength: 8, maxLength: 8 },
  MA: { prefix: "+212", minLength: 9, maxLength: 9 },
  MZ: { prefix: "+258", minLength: 9, maxLength: 9 },
  MM: { prefix: "+95", minLength: 8, maxLength: 10 },
  // N
  NA: { prefix: "+264", minLength: 9, maxLength: 9 },
  NR: { prefix: "+674", minLength: 7, maxLength: 7 },
  NP: { prefix: "+977", minLength: 10, maxLength: 10 },
  NL: { prefix: "+31", minLength: 9, maxLength: 9 },
  NZ: { prefix: "+64", minLength: 8, maxLength: 9 },
  NI: { prefix: "+505", minLength: 8, maxLength: 8 },
  NE: { prefix: "+227", minLength: 8, maxLength: 8 },
  NG: { prefix: "+234", minLength: 10, maxLength: 10 },
  KP: { prefix: "+850", minLength: 10, maxLength: 10 },
  MK: { prefix: "+389", minLength: 8, maxLength: 8 },
  NO: { prefix: "+47", minLength: 8, maxLength: 8 },
  // O
  OM: { prefix: "+968", minLength: 8, maxLength: 8 },
  // P
  PK: { prefix: "+92", minLength: 10, maxLength: 10 },
  PW: { prefix: "+680", minLength: 7, maxLength: 7 },
  PS: { prefix: "+970", minLength: 9, maxLength: 9 },
  PA: { prefix: "+507", minLength: 8, maxLength: 8 },
  PG: { prefix: "+675", minLength: 8, maxLength: 8 },
  PY: { prefix: "+595", minLength: 9, maxLength: 9 },
  PE: { prefix: "+51", minLength: 9, maxLength: 9 },
  PH: { prefix: "+63", minLength: 10, maxLength: 10 },
  PL: { prefix: "+48", minLength: 9, maxLength: 9 },
  PT: { prefix: "+351", minLength: 9, maxLength: 9 },
  // Q
  QA: { prefix: "+974", minLength: 8, maxLength: 8 },
  // R
  RO: { prefix: "+40", minLength: 9, maxLength: 9 },
  RU: { prefix: "+7", minLength: 10, maxLength: 10 },
  RW: { prefix: "+250", minLength: 9, maxLength: 9 },
  // S
  KN: { prefix: "+1869", minLength: 7, maxLength: 7 },
  LC: { prefix: "+1758", minLength: 7, maxLength: 7 },
  VC: { prefix: "+1784", minLength: 7, maxLength: 7 },
  WS: { prefix: "+685", minLength: 5, maxLength: 7 },
  SM: { prefix: "+378", minLength: 6, maxLength: 10 },
  ST: { prefix: "+239", minLength: 7, maxLength: 7 },
  SA: { prefix: "+966", minLength: 9, maxLength: 9 },
  SN: { prefix: "+221", minLength: 9, maxLength: 9 },
  RS: { prefix: "+381", minLength: 8, maxLength: 9 },
  SC: { prefix: "+248", minLength: 7, maxLength: 7 },
  SL: { prefix: "+232", minLength: 8, maxLength: 8 },
  SG: { prefix: "+65", minLength: 8, maxLength: 8 },
  SK: { prefix: "+421", minLength: 9, maxLength: 9 },
  SI: { prefix: "+386", minLength: 8, maxLength: 8 },
  SB: { prefix: "+677", minLength: 5, maxLength: 7 },
  SO: { prefix: "+252", minLength: 7, maxLength: 8 },
  ZA: { prefix: "+27", minLength: 9, maxLength: 9 },
  KR: { prefix: "+82", minLength: 9, maxLength: 10 },
  SS: { prefix: "+211", minLength: 9, maxLength: 9 },
  ES: { prefix: "+34", minLength: 9, maxLength: 9 },
  LK: { prefix: "+94", minLength: 9, maxLength: 9 },
  SD: { prefix: "+249", minLength: 9, maxLength: 9 },
  SR: { prefix: "+597", minLength: 6, maxLength: 7 },
  SE: { prefix: "+46", minLength: 9, maxLength: 10 },
  CH: { prefix: "+41", minLength: 9, maxLength: 9 },
  SY: { prefix: "+963", minLength: 9, maxLength: 9 },
  // T
  TW: { prefix: "+886", minLength: 9, maxLength: 9 },
  TJ: { prefix: "+992", minLength: 9, maxLength: 9 },
  TZ: { prefix: "+255", minLength: 9, maxLength: 9 },
  TH: { prefix: "+66", minLength: 9, maxLength: 9 },
  TL: { prefix: "+670", minLength: 7, maxLength: 8 },
  TG: { prefix: "+228", minLength: 8, maxLength: 8 },
  TO: { prefix: "+676", minLength: 5, maxLength: 7 },
  TT: { prefix: "+1868", minLength: 7, maxLength: 7 },
  TN: { prefix: "+216", minLength: 8, maxLength: 8 },
  TR: { prefix: "+90", minLength: 10, maxLength: 10 },
  TM: { prefix: "+993", minLength: 8, maxLength: 8 },
  TV: { prefix: "+688", minLength: 5, maxLength: 6 },
  // U
  UG: { prefix: "+256", minLength: 9, maxLength: 9 },
  UA: { prefix: "+380", minLength: 9, maxLength: 9 },
  AE: { prefix: "+971", minLength: 9, maxLength: 9 },
  GB: { prefix: "+44", minLength: 10, maxLength: 10 },
  US: { prefix: "+1", minLength: 10, maxLength: 10 },
  UY: { prefix: "+598", minLength: 8, maxLength: 8 },
  UZ: { prefix: "+998", minLength: 9, maxLength: 9 },
  // V
  VU: { prefix: "+678", minLength: 5, maxLength: 7 },
  VA: { prefix: "+39", minLength: 9, maxLength: 10 },
  VE: { prefix: "+58", minLength: 10, maxLength: 10 },
  VN: { prefix: "+84", minLength: 9, maxLength: 10 },
  // Y
  YE: { prefix: "+967", minLength: 9, maxLength: 9 },
  // Z
  ZM: { prefix: "+260", minLength: 9, maxLength: 9 },
  ZW: { prefix: "+263", minLength: 9, maxLength: 9 },
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
  // Total length = prefix length + max digits (no space)
  return config.prefix.length + config.maxLength;
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
