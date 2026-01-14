// Country to flag emoji mapping
const countryFlags: Record<string, string> = {
  "Albania": "🇦🇱",
  "Andorra": "🇦🇩",
  "Austria": "🇦🇹",
  "Belarus": "🇧🇾",
  "Belgium": "🇧🇪",
  "Bosnia and Herzegovina": "🇧🇦",
  "Bulgaria": "🇧🇬",
  "Croatia": "🇭🇷",
  "Cyprus": "🇨🇾",
  "Czech Republic": "🇨🇿",
  "Denmark": "🇩🇰",
  "Estonia": "🇪🇪",
  "Finland": "🇫🇮",
  "France": "🇫🇷",
  "Germany": "🇩🇪",
  "Greece": "🇬🇷",
  "Hungary": "🇭🇺",
  "Iceland": "🇮🇸",
  "Ireland": "🇮🇪",
  "Italy": "🇮🇹",
  "Kosovo": "🇽🇰",
  "Latvia": "🇱🇻",
  "Liechtenstein": "🇱🇮",
  "Lithuania": "🇱🇹",
  "Luxembourg": "🇱🇺",
  "Malta": "🇲🇹",
  "Moldova": "🇲🇩",
  "Monaco": "🇲🇨",
  "Montenegro": "🇲🇪",
  "Netherlands": "🇳🇱",
  "North Macedonia": "🇲🇰",
  "Norway": "🇳🇴",
  "Poland": "🇵🇱",
  "Portugal": "🇵🇹",
  "Romania": "🇷🇴",
  "Russia": "🇷🇺",
  "San Marino": "🇸🇲",
  "Serbia": "🇷🇸",
  "Slovakia": "🇸🇰",
  "Slovenia": "🇸🇮",
  "Spain": "🇪🇸",
  "Sweden": "🇸🇪",
  "Switzerland": "🇨🇭",
  "Ukraine": "🇺🇦",
  "United Kingdom": "🇬🇧",
  "Vatican City": "🇻🇦",
  "United States": "🇺🇸",
  "Canada": "🇨🇦",
  "Australia": "🇦🇺",
  "Brazil": "🇧🇷",
  "Argentina": "🇦🇷",
  "Mexico": "🇲🇽",
  "Japan": "🇯🇵",
  "China": "🇨🇳",
  "India": "🇮🇳",
  "South Korea": "🇰🇷",
  "Turkey": "🇹🇷",
  "Israel": "🇮🇱",
  "South Africa": "🇿🇦",
  "New Zealand": "🇳🇿",
};

// Code to flag mapping for country codes
const codeToFlag: Record<string, string> = {
  "AL": "🇦🇱", "AD": "🇦🇩", "AT": "🇦🇹", "BY": "🇧🇾", "BE": "🇧🇪",
  "BA": "🇧🇦", "BG": "🇧🇬", "HR": "🇭🇷", "CY": "🇨🇾", "CZ": "🇨🇿",
  "DK": "🇩🇰", "EE": "🇪🇪", "FI": "🇫🇮", "FR": "🇫🇷", "DE": "🇩🇪",
  "GR": "🇬🇷", "HU": "🇭🇺", "IS": "🇮🇸", "IE": "🇮🇪", "IT": "🇮🇹",
  "XK": "🇽🇰", "LV": "🇱🇻", "LI": "🇱🇮", "LT": "🇱🇹", "LU": "🇱🇺",
  "MT": "🇲🇹", "MD": "🇲🇩", "MC": "🇲🇨", "ME": "🇲🇪", "NL": "🇳🇱",
  "MK": "🇲🇰", "NO": "🇳🇴", "PL": "🇵🇱", "PT": "🇵🇹", "RO": "🇷🇴",
  "RU": "🇷🇺", "SM": "🇸🇲", "RS": "🇷🇸", "SK": "🇸🇰", "SI": "🇸🇮",
  "ES": "🇪🇸", "SE": "🇸🇪", "CH": "🇨🇭", "UA": "🇺🇦", "GB": "🇬🇧",
  "VA": "🇻🇦", "US": "🇺🇸", "CA": "🇨🇦", "AU": "🇦🇺", "BR": "🇧🇷",
  "AR": "🇦🇷", "MX": "🇲🇽", "JP": "🇯🇵", "CN": "🇨🇳", "IN": "🇮🇳",
  "KR": "🇰🇷", "TR": "🇹🇷", "IL": "🇮🇱", "ZA": "🇿🇦", "NZ": "🇳🇿",
};

/**
 * Normalize string for diacritic-insensitive comparison
 */
const normalizeString = (str: string) => 
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Get flag emoji for a country name or code
 * @param country - Country name or 2-letter code
 * @returns Flag emoji or null if not found
 */
export const getCountryFlag = (country: string | null | undefined): string | null => {
  if (!country) return null;
  
  // Try direct name match first
  if (countryFlags[country]) {
    return countryFlags[country];
  }
  
  // Try code match (uppercase)
  const upperCode = country.toUpperCase();
  if (codeToFlag[upperCode]) {
    return codeToFlag[upperCode];
  }
  
  // Try diacritic-insensitive name match
  const normalizedInput = normalizeString(country);
  for (const [name, flag] of Object.entries(countryFlags)) {
    if (normalizeString(name) === normalizedInput) {
      return flag;
    }
  }
  
  return null;
};
