// Country code to phone prefix and length mapping
// length is the number of digits AFTER the country code
export interface CountryPhoneConfig {
  prefix: string;
  minLength: number;
  maxLength: number;
}

export const countryPhoneCodes: Record<string, CountryPhoneConfig> = {
  // A
  AF: { prefix: "+93", minLength: 9, maxLength: 9 },      // Afghanistan: 9 digits
  AL: { prefix: "+355", minLength: 9, maxLength: 9 },    // Albania: 9 digits
  DZ: { prefix: "+213", minLength: 9, maxLength: 9 },    // Algeria: 9 digits
  AD: { prefix: "+376", minLength: 6, maxLength: 6 },    // Andorra: 6 digits
  AO: { prefix: "+244", minLength: 9, maxLength: 9 },    // Angola: 9 digits
  AG: { prefix: "+1268", minLength: 7, maxLength: 7 },   // Antigua: 7 digits
  AR: { prefix: "+54", minLength: 10, maxLength: 10 },   // Argentina: 10 digits
  AM: { prefix: "+374", minLength: 8, maxLength: 8 },    // Armenia: 8 digits
  AU: { prefix: "+61", minLength: 9, maxLength: 9 },     // Australia: 9 digits
  AT: { prefix: "+43", minLength: 10, maxLength: 11 },   // Austria: 10-11 digits
  AZ: { prefix: "+994", minLength: 9, maxLength: 9 },    // Azerbaijan: 9 digits
  // B
  BS: { prefix: "+1242", minLength: 7, maxLength: 7 },   // Bahamas: 7 digits
  BH: { prefix: "+973", minLength: 8, maxLength: 8 },    // Bahrain: 8 digits
  BD: { prefix: "+880", minLength: 10, maxLength: 10 },  // Bangladesh: 10 digits
  BB: { prefix: "+1246", minLength: 7, maxLength: 7 },   // Barbados: 7 digits
  BY: { prefix: "+375", minLength: 9, maxLength: 9 },    // Belarus: 9 digits
  BE: { prefix: "+32", minLength: 9, maxLength: 9 },     // Belgium: 9 digits
  BZ: { prefix: "+501", minLength: 7, maxLength: 7 },    // Belize: 7 digits
  BJ: { prefix: "+229", minLength: 8, maxLength: 8 },    // Benin: 8 digits
  BT: { prefix: "+975", minLength: 8, maxLength: 8 },    // Bhutan: 8 digits
  BO: { prefix: "+591", minLength: 8, maxLength: 8 },    // Bolivia: 8 digits
  BA: { prefix: "+387", minLength: 8, maxLength: 8 },    // Bosnia: 8 digits
  BW: { prefix: "+267", minLength: 8, maxLength: 8 },    // Botswana: 8 digits
  BR: { prefix: "+55", minLength: 11, maxLength: 11 },   // Brazil: 11 digits (with area code)
  BN: { prefix: "+673", minLength: 7, maxLength: 7 },    // Brunei: 7 digits
  BG: { prefix: "+359", minLength: 9, maxLength: 9 },    // Bulgaria: 9 digits
  BF: { prefix: "+226", minLength: 8, maxLength: 8 },    // Burkina Faso: 8 digits
  BI: { prefix: "+257", minLength: 8, maxLength: 8 },    // Burundi: 8 digits
  // C
  CV: { prefix: "+238", minLength: 7, maxLength: 7 },    // Cabo Verde: 7 digits
  KH: { prefix: "+855", minLength: 9, maxLength: 9 },    // Cambodia: 9 digits
  CM: { prefix: "+237", minLength: 9, maxLength: 9 },    // Cameroon: 9 digits
  CA: { prefix: "+1", minLength: 10, maxLength: 10 },    // Canada: 10 digits
  CF: { prefix: "+236", minLength: 8, maxLength: 8 },    // Central African Republic: 8 digits
  TD: { prefix: "+235", minLength: 8, maxLength: 8 },    // Chad: 8 digits
  CL: { prefix: "+56", minLength: 9, maxLength: 9 },     // Chile: 9 digits
  CN: { prefix: "+86", minLength: 11, maxLength: 11 },   // China: 11 digits
  CO: { prefix: "+57", minLength: 10, maxLength: 10 },   // Colombia: 10 digits
  KM: { prefix: "+269", minLength: 7, maxLength: 7 },    // Comoros: 7 digits
  CG: { prefix: "+242", minLength: 9, maxLength: 9 },    // Congo: 9 digits
  CD: { prefix: "+243", minLength: 9, maxLength: 9 },    // Congo DRC: 9 digits
  CR: { prefix: "+506", minLength: 8, maxLength: 8 },    // Costa Rica: 8 digits
  CI: { prefix: "+225", minLength: 10, maxLength: 10 },  // Côte d'Ivoire: 10 digits
  HR: { prefix: "+385", minLength: 9, maxLength: 9 },    // Croatia: 9 digits
  CU: { prefix: "+53", minLength: 8, maxLength: 8 },     // Cuba: 8 digits
  CY: { prefix: "+357", minLength: 8, maxLength: 8 },    // Cyprus: 8 digits
  CZ: { prefix: "+420", minLength: 9, maxLength: 9 },    // Czech Republic: 9 digits
  // D
  DK: { prefix: "+45", minLength: 8, maxLength: 8 },     // Denmark: 8 digits
  DJ: { prefix: "+253", minLength: 8, maxLength: 8 },    // Djibouti: 8 digits
  DM: { prefix: "+1767", minLength: 7, maxLength: 7 },   // Dominica: 7 digits
  DO: { prefix: "+1809", minLength: 7, maxLength: 7 },   // Dominican Republic: 7 digits
  // E
  EC: { prefix: "+593", minLength: 9, maxLength: 9 },    // Ecuador: 9 digits
  EG: { prefix: "+20", minLength: 10, maxLength: 10 },   // Egypt: 10 digits
  SV: { prefix: "+503", minLength: 8, maxLength: 8 },    // El Salvador: 8 digits
  GQ: { prefix: "+240", minLength: 9, maxLength: 9 },    // Equatorial Guinea: 9 digits
  ER: { prefix: "+291", minLength: 7, maxLength: 7 },    // Eritrea: 7 digits
  EE: { prefix: "+372", minLength: 8, maxLength: 8 },    // Estonia: 8 digits
  SZ: { prefix: "+268", minLength: 8, maxLength: 8 },    // Eswatini: 8 digits
  ET: { prefix: "+251", minLength: 9, maxLength: 9 },    // Ethiopia: 9 digits
  // F
  FJ: { prefix: "+679", minLength: 7, maxLength: 7 },    // Fiji: 7 digits
  FI: { prefix: "+358", minLength: 9, maxLength: 10 },   // Finland: 9-10 digits
  FR: { prefix: "+33", minLength: 9, maxLength: 9 },     // France: 9 digits
  // G
  GA: { prefix: "+241", minLength: 8, maxLength: 8 },    // Gabon: 8 digits
  GM: { prefix: "+220", minLength: 7, maxLength: 7 },    // Gambia: 7 digits
  GE: { prefix: "+995", minLength: 9, maxLength: 9 },    // Georgia: 9 digits
  DE: { prefix: "+49", minLength: 10, maxLength: 11 },   // Germany: 10-11 digits
  GH: { prefix: "+233", minLength: 9, maxLength: 9 },    // Ghana: 9 digits
  GR: { prefix: "+30", minLength: 10, maxLength: 10 },   // Greece: 10 digits
  GD: { prefix: "+1473", minLength: 7, maxLength: 7 },   // Grenada: 7 digits
  GT: { prefix: "+502", minLength: 8, maxLength: 8 },    // Guatemala: 8 digits
  GN: { prefix: "+224", minLength: 9, maxLength: 9 },    // Guinea: 9 digits
  GW: { prefix: "+245", minLength: 9, maxLength: 9 },    // Guinea-Bissau: 9 digits
  GY: { prefix: "+592", minLength: 7, maxLength: 7 },    // Guyana: 7 digits
  // H
  HT: { prefix: "+509", minLength: 8, maxLength: 8 },    // Haiti: 8 digits
  HN: { prefix: "+504", minLength: 8, maxLength: 8 },    // Honduras: 8 digits
  HU: { prefix: "+36", minLength: 9, maxLength: 9 },     // Hungary: 9 digits
  // I
  IS: { prefix: "+354", minLength: 7, maxLength: 7 },    // Iceland: 7 digits
  IN: { prefix: "+91", minLength: 10, maxLength: 10 },   // India: 10 digits
  ID: { prefix: "+62", minLength: 10, maxLength: 12 },   // Indonesia: 10-12 digits
  IR: { prefix: "+98", minLength: 10, maxLength: 10 },   // Iran: 10 digits
  IQ: { prefix: "+964", minLength: 10, maxLength: 10 },  // Iraq: 10 digits
  IE: { prefix: "+353", minLength: 9, maxLength: 9 },    // Ireland: 9 digits
  IL: { prefix: "+972", minLength: 9, maxLength: 9 },    // Israel: 9 digits
  IT: { prefix: "+39", minLength: 10, maxLength: 10 },   // Italy: 10 digits
  // J
  JM: { prefix: "+1876", minLength: 7, maxLength: 7 },   // Jamaica: 7 digits
  JP: { prefix: "+81", minLength: 10, maxLength: 10 },   // Japan: 10 digits
  JO: { prefix: "+962", minLength: 9, maxLength: 9 },    // Jordan: 9 digits
  // K
  KZ: { prefix: "+7", minLength: 10, maxLength: 10 },    // Kazakhstan: 10 digits
  KE: { prefix: "+254", minLength: 9, maxLength: 9 },    // Kenya: 9 digits
  KI: { prefix: "+686", minLength: 8, maxLength: 8 },    // Kiribati: 8 digits
  XK: { prefix: "+383", minLength: 8, maxLength: 8 },    // Kosovo: 8 digits
  KW: { prefix: "+965", minLength: 8, maxLength: 8 },    // Kuwait: 8 digits
  KG: { prefix: "+996", minLength: 9, maxLength: 9 },    // Kyrgyzstan: 9 digits
  // L
  LA: { prefix: "+856", minLength: 10, maxLength: 10 },  // Laos: 10 digits
  LV: { prefix: "+371", minLength: 8, maxLength: 8 },    // Latvia: 8 digits
  LB: { prefix: "+961", minLength: 8, maxLength: 8 },    // Lebanon: 8 digits
  LS: { prefix: "+266", minLength: 8, maxLength: 8 },    // Lesotho: 8 digits
  LR: { prefix: "+231", minLength: 9, maxLength: 9 },    // Liberia: 9 digits
  LY: { prefix: "+218", minLength: 9, maxLength: 9 },    // Libya: 9 digits
  LI: { prefix: "+423", minLength: 7, maxLength: 7 },    // Liechtenstein: 7 digits
  LT: { prefix: "+370", minLength: 8, maxLength: 8 },    // Lithuania: 8 digits
  LU: { prefix: "+352", minLength: 9, maxLength: 9 },    // Luxembourg: 9 digits
  // M
  MG: { prefix: "+261", minLength: 9, maxLength: 9 },    // Madagascar: 9 digits
  MW: { prefix: "+265", minLength: 9, maxLength: 9 },    // Malawi: 9 digits
  MY: { prefix: "+60", minLength: 9, maxLength: 10 },    // Malaysia: 9-10 digits
  MV: { prefix: "+960", minLength: 7, maxLength: 7 },    // Maldives: 7 digits
  ML: { prefix: "+223", minLength: 8, maxLength: 8 },    // Mali: 8 digits
  MT: { prefix: "+356", minLength: 8, maxLength: 8 },    // Malta: 8 digits
  MH: { prefix: "+692", minLength: 7, maxLength: 7 },    // Marshall Islands: 7 digits
  MR: { prefix: "+222", minLength: 8, maxLength: 8 },    // Mauritania: 8 digits
  MU: { prefix: "+230", minLength: 8, maxLength: 8 },    // Mauritius: 8 digits
  MX: { prefix: "+52", minLength: 10, maxLength: 10 },   // Mexico: 10 digits
  FM: { prefix: "+691", minLength: 7, maxLength: 7 },    // Micronesia: 7 digits
  MD: { prefix: "+373", minLength: 8, maxLength: 8 },    // Moldova: 8 digits
  MC: { prefix: "+377", minLength: 8, maxLength: 8 },    // Monaco: 8 digits
  MN: { prefix: "+976", minLength: 8, maxLength: 8 },    // Mongolia: 8 digits
  ME: { prefix: "+382", minLength: 8, maxLength: 8 },    // Montenegro: 8 digits
  MA: { prefix: "+212", minLength: 9, maxLength: 9 },    // Morocco: 9 digits
  MZ: { prefix: "+258", minLength: 9, maxLength: 9 },    // Mozambique: 9 digits
  MM: { prefix: "+95", minLength: 9, maxLength: 10 },    // Myanmar: 9-10 digits
  // N
  NA: { prefix: "+264", minLength: 9, maxLength: 9 },    // Namibia: 9 digits
  NR: { prefix: "+674", minLength: 7, maxLength: 7 },    // Nauru: 7 digits
  NP: { prefix: "+977", minLength: 10, maxLength: 10 },  // Nepal: 10 digits
  NL: { prefix: "+31", minLength: 9, maxLength: 9 },     // Netherlands: 9 digits
  NZ: { prefix: "+64", minLength: 9, maxLength: 10 },    // New Zealand: 9-10 digits
  NI: { prefix: "+505", minLength: 8, maxLength: 8 },    // Nicaragua: 8 digits
  NE: { prefix: "+227", minLength: 8, maxLength: 8 },    // Niger: 8 digits
  NG: { prefix: "+234", minLength: 10, maxLength: 10 },  // Nigeria: 10 digits
  KP: { prefix: "+850", minLength: 10, maxLength: 10 },  // North Korea: 10 digits
  MK: { prefix: "+389", minLength: 8, maxLength: 8 },    // North Macedonia: 8 digits
  NO: { prefix: "+47", minLength: 8, maxLength: 8 },     // Norway: 8 digits
  // O
  OM: { prefix: "+968", minLength: 8, maxLength: 8 },    // Oman: 8 digits
  // P
  PK: { prefix: "+92", minLength: 10, maxLength: 10 },   // Pakistan: 10 digits
  PW: { prefix: "+680", minLength: 7, maxLength: 7 },    // Palau: 7 digits
  PS: { prefix: "+970", minLength: 9, maxLength: 9 },    // Palestine: 9 digits
  PA: { prefix: "+507", minLength: 8, maxLength: 8 },    // Panama: 8 digits
  PG: { prefix: "+675", minLength: 8, maxLength: 8 },    // Papua New Guinea: 8 digits
  PY: { prefix: "+595", minLength: 9, maxLength: 9 },    // Paraguay: 9 digits
  PE: { prefix: "+51", minLength: 9, maxLength: 9 },     // Peru: 9 digits
  PH: { prefix: "+63", minLength: 10, maxLength: 10 },   // Philippines: 10 digits
  PL: { prefix: "+48", minLength: 9, maxLength: 9 },     // Poland: 9 digits
  PT: { prefix: "+351", minLength: 9, maxLength: 9 },    // Portugal: 9 digits
  // Q
  QA: { prefix: "+974", minLength: 8, maxLength: 8 },    // Qatar: 8 digits
  // R
  RO: { prefix: "+40", minLength: 9, maxLength: 9 },     // Romania: 9 digits
  RU: { prefix: "+7", minLength: 10, maxLength: 10 },    // Russia: 10 digits
  RW: { prefix: "+250", minLength: 9, maxLength: 9 },    // Rwanda: 9 digits
  // S
  KN: { prefix: "+1869", minLength: 7, maxLength: 7 },   // Saint Kitts: 7 digits
  LC: { prefix: "+1758", minLength: 7, maxLength: 7 },   // Saint Lucia: 7 digits
  VC: { prefix: "+1784", minLength: 7, maxLength: 7 },   // Saint Vincent: 7 digits
  WS: { prefix: "+685", minLength: 7, maxLength: 7 },    // Samoa: 7 digits
  SM: { prefix: "+378", minLength: 10, maxLength: 10 },  // San Marino: 10 digits
  ST: { prefix: "+239", minLength: 7, maxLength: 7 },    // São Tomé: 7 digits
  SA: { prefix: "+966", minLength: 9, maxLength: 9 },    // Saudi Arabia: 9 digits
  SN: { prefix: "+221", minLength: 9, maxLength: 9 },    // Senegal: 9 digits
  RS: { prefix: "+381", minLength: 9, maxLength: 9 },    // Serbia: 9 digits
  SC: { prefix: "+248", minLength: 7, maxLength: 7 },    // Seychelles: 7 digits
  SL: { prefix: "+232", minLength: 8, maxLength: 8 },    // Sierra Leone: 8 digits
  SG: { prefix: "+65", minLength: 8, maxLength: 8 },     // Singapore: 8 digits
  SK: { prefix: "+421", minLength: 9, maxLength: 9 },    // Slovakia: 9 digits
  SI: { prefix: "+386", minLength: 8, maxLength: 8 },    // Slovenia: 8 digits
  SB: { prefix: "+677", minLength: 7, maxLength: 7 },    // Solomon Islands: 7 digits
  SO: { prefix: "+252", minLength: 8, maxLength: 8 },    // Somalia: 8 digits
  ZA: { prefix: "+27", minLength: 9, maxLength: 9 },     // South Africa: 9 digits
  KR: { prefix: "+82", minLength: 10, maxLength: 10 },   // South Korea: 10 digits
  SS: { prefix: "+211", minLength: 9, maxLength: 9 },    // South Sudan: 9 digits
  ES: { prefix: "+34", minLength: 9, maxLength: 9 },     // Spain: 9 digits
  LK: { prefix: "+94", minLength: 9, maxLength: 9 },     // Sri Lanka: 9 digits
  SD: { prefix: "+249", minLength: 9, maxLength: 9 },    // Sudan: 9 digits
  SR: { prefix: "+597", minLength: 7, maxLength: 7 },    // Suriname: 7 digits
  SE: { prefix: "+46", minLength: 9, maxLength: 9 },     // Sweden: 9 digits
  CH: { prefix: "+41", minLength: 9, maxLength: 9 },     // Switzerland: 9 digits
  SY: { prefix: "+963", minLength: 9, maxLength: 9 },    // Syria: 9 digits
  // T
  TW: { prefix: "+886", minLength: 9, maxLength: 9 },    // Taiwan: 9 digits
  TJ: { prefix: "+992", minLength: 9, maxLength: 9 },    // Tajikistan: 9 digits
  TZ: { prefix: "+255", minLength: 9, maxLength: 9 },    // Tanzania: 9 digits
  TH: { prefix: "+66", minLength: 9, maxLength: 9 },     // Thailand: 9 digits
  TL: { prefix: "+670", minLength: 8, maxLength: 8 },    // Timor-Leste: 8 digits
  TG: { prefix: "+228", minLength: 8, maxLength: 8 },    // Togo: 8 digits
  TO: { prefix: "+676", minLength: 7, maxLength: 7 },    // Tonga: 7 digits
  TT: { prefix: "+1868", minLength: 7, maxLength: 7 },   // Trinidad: 7 digits
  TN: { prefix: "+216", minLength: 8, maxLength: 8 },    // Tunisia: 8 digits
  TR: { prefix: "+90", minLength: 10, maxLength: 10 },   // Turkey: 10 digits
  TM: { prefix: "+993", minLength: 8, maxLength: 8 },    // Turkmenistan: 8 digits
  TV: { prefix: "+688", minLength: 6, maxLength: 6 },    // Tuvalu: 6 digits
  // U
  UG: { prefix: "+256", minLength: 9, maxLength: 9 },    // Uganda: 9 digits
  UA: { prefix: "+380", minLength: 9, maxLength: 9 },    // Ukraine: 9 digits
  AE: { prefix: "+971", minLength: 9, maxLength: 9 },    // UAE: 9 digits
  GB: { prefix: "+44", minLength: 10, maxLength: 10 },   // UK: 10 digits
  US: { prefix: "+1", minLength: 10, maxLength: 10 },    // USA: 10 digits
  UY: { prefix: "+598", minLength: 8, maxLength: 8 },    // Uruguay: 8 digits
  UZ: { prefix: "+998", minLength: 9, maxLength: 9 },    // Uzbekistan: 9 digits
  // V
  VU: { prefix: "+678", minLength: 7, maxLength: 7 },    // Vanuatu: 7 digits
  VA: { prefix: "+379", minLength: 10, maxLength: 10 },  // Vatican: 10 digits
  VE: { prefix: "+58", minLength: 10, maxLength: 10 },   // Venezuela: 10 digits
  VN: { prefix: "+84", minLength: 9, maxLength: 10 },    // Vietnam: 9-10 digits
  // Y
  YE: { prefix: "+967", minLength: 9, maxLength: 9 },    // Yemen: 9 digits
  // Z
  ZM: { prefix: "+260", minLength: 9, maxLength: 9 },    // Zambia: 9 digits
  ZW: { prefix: "+263", minLength: 9, maxLength: 9 },    // Zimbabwe: 9 digits
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
