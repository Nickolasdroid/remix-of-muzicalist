import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Globe } from "lucide-react";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import CountryFlagIcon from "@/components/CountryFlagIcon";

// Full list of countries with flags for reference
const allCountries = [
  { name: "Afghanistan", flag: "🇦🇫", code: "AF" },
  { name: "Albania", flag: "🇦🇱", code: "AL" },
  { name: "Algeria", flag: "🇩🇿", code: "DZ" },
  { name: "Andorra", flag: "🇦🇩", code: "AD" },
  { name: "Angola", flag: "🇦🇴", code: "AO" },
  { name: "Antigua and Barbuda", flag: "🇦🇬", code: "AG" },
  { name: "Argentina", flag: "🇦🇷", code: "AR" },
  { name: "Armenia", flag: "🇦🇲", code: "AM" },
  { name: "Australia", flag: "🇦🇺", code: "AU" },
  { name: "Austria", flag: "🇦🇹", code: "AT" },
  { name: "Azerbaijan", flag: "🇦🇿", code: "AZ" },
  { name: "Bahamas", flag: "🇧🇸", code: "BS" },
  { name: "Bahrain", flag: "🇧🇭", code: "BH" },
  { name: "Bangladesh", flag: "🇧🇩", code: "BD" },
  { name: "Barbados", flag: "🇧🇧", code: "BB" },
  { name: "Belarus", flag: "🇧🇾", code: "BY" },
  { name: "Belgium", flag: "🇧🇪", code: "BE" },
  { name: "Belize", flag: "🇧🇿", code: "BZ" },
  { name: "Benin", flag: "🇧🇯", code: "BJ" },
  { name: "Bhutan", flag: "🇧🇹", code: "BT" },
  { name: "Bolivia", flag: "🇧🇴", code: "BO" },
  { name: "Bosnia and Herzegovina", flag: "🇧🇦", code: "BA" },
  { name: "Botswana", flag: "🇧🇼", code: "BW" },
  { name: "Brazil", flag: "🇧🇷", code: "BR" },
  { name: "Brunei", flag: "🇧🇳", code: "BN" },
  { name: "Bulgaria", flag: "🇧🇬", code: "BG" },
  { name: "Burkina Faso", flag: "🇧🇫", code: "BF" },
  { name: "Burundi", flag: "🇧🇮", code: "BI" },
  { name: "Cabo Verde", flag: "🇨🇻", code: "CV" },
  { name: "Cambodia", flag: "🇰🇭", code: "KH" },
  { name: "Cameroon", flag: "🇨🇲", code: "CM" },
  { name: "Canada", flag: "🇨🇦", code: "CA" },
  { name: "Central African Republic", flag: "🇨🇫", code: "CF" },
  { name: "Chad", flag: "🇹🇩", code: "TD" },
  { name: "Chile", flag: "🇨🇱", code: "CL" },
  { name: "China", flag: "🇨🇳", code: "CN" },
  { name: "Colombia", flag: "🇨🇴", code: "CO" },
  { name: "Comoros", flag: "🇰🇲", code: "KM" },
  { name: "Congo", flag: "🇨🇬", code: "CG" },
  { name: "Congo (DRC)", flag: "🇨🇩", code: "CD" },
  { name: "Costa Rica", flag: "🇨🇷", code: "CR" },
  { name: "Côte d'Ivoire", flag: "🇨🇮", code: "CI" },
  { name: "Croatia", flag: "🇭🇷", code: "HR" },
  { name: "Cuba", flag: "🇨🇺", code: "CU" },
  { name: "Cyprus", flag: "🇨🇾", code: "CY" },
  { name: "Czech Republic", flag: "🇨🇿", code: "CZ" },
  { name: "Denmark", flag: "🇩🇰", code: "DK" },
  { name: "Djibouti", flag: "🇩🇯", code: "DJ" },
  { name: "Dominica", flag: "🇩🇲", code: "DM" },
  { name: "Dominican Republic", flag: "🇩🇴", code: "DO" },
  { name: "Ecuador", flag: "🇪🇨", code: "EC" },
  { name: "Egypt", flag: "🇪🇬", code: "EG" },
  { name: "El Salvador", flag: "🇸🇻", code: "SV" },
  { name: "Equatorial Guinea", flag: "🇬🇶", code: "GQ" },
  { name: "Eritrea", flag: "🇪🇷", code: "ER" },
  { name: "Estonia", flag: "🇪🇪", code: "EE" },
  { name: "Eswatini", flag: "🇸🇿", code: "SZ" },
  { name: "Ethiopia", flag: "🇪🇹", code: "ET" },
  { name: "Fiji", flag: "🇫🇯", code: "FJ" },
  { name: "Finland", flag: "🇫🇮", code: "FI" },
  { name: "France", flag: "🇫🇷", code: "FR" },
  { name: "Gabon", flag: "🇬🇦", code: "GA" },
  { name: "Gambia", flag: "🇬🇲", code: "GM" },
  { name: "Georgia", flag: "🇬🇪", code: "GE" },
  { name: "Germany", flag: "🇩🇪", code: "DE" },
  { name: "Ghana", flag: "🇬🇭", code: "GH" },
  { name: "Greece", flag: "🇬🇷", code: "GR" },
  { name: "Grenada", flag: "🇬🇩", code: "GD" },
  { name: "Guatemala", flag: "🇬🇹", code: "GT" },
  { name: "Guinea", flag: "🇬🇳", code: "GN" },
  { name: "Guinea-Bissau", flag: "🇬🇼", code: "GW" },
  { name: "Guyana", flag: "🇬🇾", code: "GY" },
  { name: "Haiti", flag: "🇭🇹", code: "HT" },
  { name: "Honduras", flag: "🇭🇳", code: "HN" },
  { name: "Hong Kong", flag: "🇭🇰", code: "HK" },
  { name: "Hungary", flag: "🇭🇺", code: "HU" },
  { name: "Iceland", flag: "🇮🇸", code: "IS" },
  { name: "India", flag: "🇮🇳", code: "IN" },
  { name: "Indonesia", flag: "🇮🇩", code: "ID" },
  { name: "Iran", flag: "🇮🇷", code: "IR" },
  { name: "Iraq", flag: "🇮🇶", code: "IQ" },
  { name: "Ireland", flag: "🇮🇪", code: "IE" },
  { name: "Israel", flag: "🇮🇱", code: "IL" },
  { name: "Italy", flag: "🇮🇹", code: "IT" },
  { name: "Jamaica", flag: "🇯🇲", code: "JM" },
  { name: "Japan", flag: "🇯🇵", code: "JP" },
  { name: "Jordan", flag: "🇯🇴", code: "JO" },
  { name: "Kazakhstan", flag: "🇰🇿", code: "KZ" },
  { name: "Kenya", flag: "🇰🇪", code: "KE" },
  { name: "Kiribati", flag: "🇰🇮", code: "KI" },
  { name: "Kosovo", flag: "🇽🇰", code: "XK" },
  { name: "Kuwait", flag: "🇰🇼", code: "KW" },
  { name: "Kyrgyzstan", flag: "🇰🇬", code: "KG" },
  { name: "Laos", flag: "🇱🇦", code: "LA" },
  { name: "Latvia", flag: "🇱🇻", code: "LV" },
  { name: "Lebanon", flag: "🇱🇧", code: "LB" },
  { name: "Lesotho", flag: "🇱🇸", code: "LS" },
  { name: "Liberia", flag: "🇱🇷", code: "LR" },
  { name: "Libya", flag: "🇱🇾", code: "LY" },
  { name: "Liechtenstein", flag: "🇱🇮", code: "LI" },
  { name: "Lithuania", flag: "🇱🇹", code: "LT" },
  { name: "Luxembourg", flag: "🇱🇺", code: "LU" },
  { name: "Madagascar", flag: "🇲🇬", code: "MG" },
  { name: "Malawi", flag: "🇲🇼", code: "MW" },
  { name: "Malaysia", flag: "🇲🇾", code: "MY" },
  { name: "Maldives", flag: "🇲🇻", code: "MV" },
  { name: "Mali", flag: "🇲🇱", code: "ML" },
  { name: "Malta", flag: "🇲🇹", code: "MT" },
  { name: "Marshall Islands", flag: "🇲🇭", code: "MH" },
  { name: "Mauritania", flag: "🇲🇷", code: "MR" },
  { name: "Mauritius", flag: "🇲🇺", code: "MU" },
  { name: "Mexico", flag: "🇲🇽", code: "MX" },
  { name: "Micronesia", flag: "🇫🇲", code: "FM" },
  { name: "Moldova", flag: "🇲🇩", code: "MD" },
  { name: "Monaco", flag: "🇲🇨", code: "MC" },
  { name: "Mongolia", flag: "🇲🇳", code: "MN" },
  { name: "Montenegro", flag: "🇲🇪", code: "ME" },
  { name: "Morocco", flag: "🇲🇦", code: "MA" },
  { name: "Mozambique", flag: "🇲🇿", code: "MZ" },
  { name: "Myanmar", flag: "🇲🇲", code: "MM" },
  { name: "Namibia", flag: "🇳🇦", code: "NA" },
  { name: "Nauru", flag: "🇳🇷", code: "NR" },
  { name: "Nepal", flag: "🇳🇵", code: "NP" },
  { name: "Netherlands", flag: "🇳🇱", code: "NL" },
  { name: "New Zealand", flag: "🇳🇿", code: "NZ" },
  { name: "Nicaragua", flag: "🇳🇮", code: "NI" },
  { name: "Niger", flag: "🇳🇪", code: "NE" },
  { name: "Nigeria", flag: "🇳🇬", code: "NG" },
  { name: "North Korea", flag: "🇰🇵", code: "KP" },
  { name: "North Macedonia", flag: "🇲🇰", code: "MK" },
  { name: "Norway", flag: "🇳🇴", code: "NO" },
  { name: "Oman", flag: "🇴🇲", code: "OM" },
  { name: "Pakistan", flag: "🇵🇰", code: "PK" },
  { name: "Palau", flag: "🇵🇼", code: "PW" },
  { name: "Palestine", flag: "🇵🇸", code: "PS" },
  { name: "Panama", flag: "🇵🇦", code: "PA" },
  { name: "Papua New Guinea", flag: "🇵🇬", code: "PG" },
  { name: "Paraguay", flag: "🇵🇾", code: "PY" },
  { name: "Peru", flag: "🇵🇪", code: "PE" },
  { name: "Philippines", flag: "🇵🇭", code: "PH" },
  { name: "Poland", flag: "🇵🇱", code: "PL" },
  { name: "Portugal", flag: "🇵🇹", code: "PT" },
  { name: "Qatar", flag: "🇶🇦", code: "QA" },
  { name: "Romania", flag: "🇷🇴", code: "RO" },
  { name: "Russia", flag: "🇷🇺", code: "RU" },
  { name: "Rwanda", flag: "🇷🇼", code: "RW" },
  { name: "Saint Kitts and Nevis", flag: "🇰🇳", code: "KN" },
  { name: "Saint Lucia", flag: "🇱🇨", code: "LC" },
  { name: "Saint Vincent and the Grenadines", flag: "🇻🇨", code: "VC" },
  { name: "Samoa", flag: "🇼🇸", code: "WS" },
  { name: "San Marino", flag: "🇸🇲", code: "SM" },
  { name: "São Tomé and Príncipe", flag: "🇸🇹", code: "ST" },
  { name: "Saudi Arabia", flag: "🇸🇦", code: "SA" },
  { name: "Senegal", flag: "🇸🇳", code: "SN" },
  { name: "Serbia", flag: "🇷🇸", code: "RS" },
  { name: "Seychelles", flag: "🇸🇨", code: "SC" },
  { name: "Sierra Leone", flag: "🇸🇱", code: "SL" },
  { name: "Singapore", flag: "🇸🇬", code: "SG" },
  { name: "Slovakia", flag: "🇸🇰", code: "SK" },
  { name: "Slovenia", flag: "🇸🇮", code: "SI" },
  { name: "Solomon Islands", flag: "🇸🇧", code: "SB" },
  { name: "Somalia", flag: "🇸🇴", code: "SO" },
  { name: "South Africa", flag: "🇿🇦", code: "ZA" },
  { name: "South Korea", flag: "🇰🇷", code: "KR" },
  { name: "South Sudan", flag: "🇸🇸", code: "SS" },
  { name: "Spain", flag: "🇪🇸", code: "ES" },
  { name: "Sri Lanka", flag: "🇱🇰", code: "LK" },
  { name: "Sudan", flag: "🇸🇩", code: "SD" },
  { name: "Suriname", flag: "🇸🇷", code: "SR" },
  { name: "Sweden", flag: "🇸🇪", code: "SE" },
  { name: "Switzerland", flag: "🇨🇭", code: "CH" },
  { name: "Syria", flag: "🇸🇾", code: "SY" },
  { name: "Taiwan", flag: "🇹🇼", code: "TW" },
  { name: "Tajikistan", flag: "🇹🇯", code: "TJ" },
  { name: "Tanzania", flag: "🇹🇿", code: "TZ" },
  { name: "Thailand", flag: "🇹🇭", code: "TH" },
  { name: "Timor-Leste", flag: "🇹🇱", code: "TL" },
  { name: "Togo", flag: "🇹🇬", code: "TG" },
  { name: "Tonga", flag: "🇹🇴", code: "TO" },
  { name: "Trinidad and Tobago", flag: "🇹🇹", code: "TT" },
  { name: "Tunisia", flag: "🇹🇳", code: "TN" },
  { name: "Turkey", flag: "🇹🇷", code: "TR" },
  { name: "Turkmenistan", flag: "🇹🇲", code: "TM" },
  { name: "Tuvalu", flag: "🇹🇻", code: "TV" },
  { name: "Uganda", flag: "🇺🇬", code: "UG" },
  { name: "Ukraine", flag: "🇺🇦", code: "UA" },
  { name: "United Arab Emirates", flag: "🇦🇪", code: "AE" },
  { name: "United Kingdom", flag: "🇬🇧", code: "GB" },
  { name: "United States", flag: "🇺🇸", code: "US" },
  { name: "Uruguay", flag: "🇺🇾", code: "UY" },
  { name: "Uzbekistan", flag: "🇺🇿", code: "UZ" },
  { name: "Vanuatu", flag: "🇻🇺", code: "VU" },
  { name: "Vatican City", flag: "🇻🇦", code: "VA" },
  { name: "Venezuela", flag: "🇻🇪", code: "VE" },
  { name: "Vietnam", flag: "🇻🇳", code: "VN" },
  { name: "Yemen", flag: "🇾🇪", code: "YE" },
  { name: "Zambia", flag: "🇿🇲", code: "ZM" },
  { name: "Zimbabwe", flag: "🇿🇼", code: "ZW" },
];

interface CountrySelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  showLabel?: boolean;
  variant?: "icon" | "list" | "navigation";
  userCountry?: string | null;
}

const CountrySelector = ({ value, onChange, showLabel = false, variant = "icon", userCountry }: CountrySelectorProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [countriesWithArtists, setCountriesWithArtists] = useState<string[]>([]);
  
  // Fetch countries that have registered artists
  useEffect(() => {
    const fetchCountriesWithArtists = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('country');
      
      if (data) {
        const uniqueCountries = [...new Set(data.map(p => p.country).filter(Boolean))];
        setCountriesWithArtists(uniqueCountries as string[]);
      }
    };
    
    if (variant === "navigation") {
      fetchCountriesWithArtists();
    }
  }, [variant]);

  // Set default value based on user's country from profile
  useEffect(() => {
    if (variant === "navigation" && userCountry && !value) {
      // Find the country code from the user's country name
      const country = allCountries.find(c => 
        c.name.toLowerCase() === userCountry.toLowerCase() || 
        c.code === userCountry
      );
      if (country) {
        onChange?.(country.code);
      }
    }
  }, [userCountry, variant, value, onChange]);
  
  // Auto-detect user's country on mount (for list variant in registration)
  useEffect(() => {
    const detectCountry = async () => {
      if (variant === "list" && !value) {
        try {
          const res = await fetch('https://ipapi.co/country_code/');
          if (res.ok) {
            const code = await res.text();
            const country = allCountries.find(c => c.code === code.trim());
            if (country && onChange) {
              onChange(country.code);
            }
          }
        } catch {
          // Silently fail, user can select manually
        }
      }
    };
    detectCountry();
  }, [variant, value, onChange]);
  
  const getCountryByValue = (val: string | undefined) => {
    if (!val || val === "all") return null;
    return allCountries.find(c => c.code === val || c.name === val) || null;
  };
  
  const selectedCountry = getCountryByValue(value);

  const handleSelectCountry = (countryCode: string) => {
    onChange?.(countryCode);
    setOpen(false);
    setSearchTerm("");
  };

  // Normalize string for diacritic-insensitive comparison
  const normalizeString = (str: string) => 
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Get available countries based on variant
  const getAvailableCountries = () => {
    if (variant === "navigation") {
      // Only show countries that have registered artists (diacritic-insensitive)
      return allCountries.filter(country => 
        countriesWithArtists.some(c => 
          normalizeString(c) === normalizeString(country.name) || c === country.code
        )
      );
    }
    return allCountries;
  };

  const availableCountries = getAvailableCountries();
  
  const filteredCountries = availableCountries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Navigation variant - compact for header
  if (variant === "navigation") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            type="button"
            variant="ghost" 
            size="sm"
            className="h-8 px-2 hover:bg-accent/10"
          >
            {value === "all" || !selectedCountry ? (
              <Globe className="h-5 w-5 text-accent" />
            ) : (
              <span className="text-xl">{selectedCountry.flag}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 bg-card border-border z-50" align="end">
          <div className="p-3 border-b border-border">
            <Input
              placeholder={t("countries.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-background/50"
            />
          </div>
          <ScrollArea className="h-80">
            <div className="p-2">
              {/* All Countries option */}
              <button
                type="button"
                onClick={() => handleSelectCountry("all")}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent/10 ${
                  value === "all"
                    ? "bg-accent/20 text-accent"
                    : "text-foreground"
                }`}
              >
                <Globe className="h-5 w-5 text-accent" />
                <span className="flex-1 text-left font-medium">{t("countries.allCountries")}</span>
                {value === "all" && (
                  <Check className="h-4 w-4 text-accent" />
                )}
              </button>
              
              <div className="h-px bg-border my-2" />
              
              <div className="space-y-1">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelectCountry(country.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent/10 ${
                      selectedCountry?.code === country.code
                        ? "bg-accent/20 text-accent"
                        : "text-foreground"
                    }`}
                  >
                    <span className="text-xl">{country.flag}</span>
                    <span className="flex-1 text-left">{country.name}</span>
                    {selectedCountry?.code === country.code && (
                      <Check className="h-4 w-4 text-accent" />
                    )}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    {t("countries.noCountriesFound")}
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-2">
        {showLabel && <Label className="text-xs md:text-sm">{t("artistRegistration.country")}</Label>}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              type="button"
              variant="outline" 
              className="w-full justify-between bg-input border-border hover:bg-accent/10 hover:border-accent px-3 overflow-hidden"
            >
              {selectedCountry ? (
                <span className="truncate">{selectedCountry.name}</span>
              ) : (
                <span className="text-muted-foreground truncate">{t("artistRegistration.placeholders.selectCountry")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-card border-border z-50" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="p-3 border-b border-border">
              <Input
                placeholder={t("countries.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="bg-background/50"
              />
            </div>
            <ScrollArea className="h-80">
              <div className="p-2">
                <div className="space-y-1">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleSelectCountry(country.code)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent/10 ${
                        selectedCountry?.code === country.code
                          ? "bg-accent/20 text-accent"
                          : "text-foreground"
                      }`}
                    >
                      <span className="text-2xl">{country.flag}</span>
                      <span className="flex-1 text-left">{country.name}</span>
                      {selectedCountry?.code === country.code && (
                        <Check className="h-4 w-4 text-accent" />
                      )}
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      {t("countries.noCountriesFound")}
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          type="button"
          variant="outline" 
          className="w-full justify-between bg-input border-border hover:bg-accent/10 hover:border-accent px-3 h-10 overflow-hidden"
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2 min-w-0 overflow-hidden">
              <span className="text-lg flex-shrink-0">{selectedCountry.flag}</span>
              <span className="truncate">{selectedCountry.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground truncate">{t("artistRegistration.placeholders.selectCountry")}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border z-50" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="p-3 border-b border-border">
          <Input
            placeholder={t("countries.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="bg-background/50"
          />
        </div>
        <ScrollArea className="h-80">
          <div className="p-2">
            <div className="space-y-1">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelectCountry(country.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent/10 ${
                    selectedCountry?.code === country.code
                      ? "bg-accent/20 text-accent"
                      : "text-foreground"
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span className="flex-1 text-left">{country.name}</span>
                  {selectedCountry?.code === country.code && (
                    <Check className="h-4 w-4 text-accent" />
                  )}
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  {t("countries.noCountriesFound")}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export const getCountryNameByCode = (code: string): string => {
  const country = allCountries.find(c => c.code === code);
  return country?.name || code;
};

export default CountrySelector;
