import { useState, useEffect } from "react";
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

// Full list of countries with flags for reference
const allCountries = [
  { name: "Albania", flag: "🇦🇱", code: "AL" },
  { name: "Andorra", flag: "🇦🇩", code: "AD" },
  { name: "Austria", flag: "🇦🇹", code: "AT" },
  { name: "Belarus", flag: "🇧🇾", code: "BY" },
  { name: "Belgium", flag: "🇧🇪", code: "BE" },
  { name: "Bosnia and Herzegovina", flag: "🇧🇦", code: "BA" },
  { name: "Bulgaria", flag: "🇧🇬", code: "BG" },
  { name: "Croatia", flag: "🇭🇷", code: "HR" },
  { name: "Cyprus", flag: "🇨🇾", code: "CY" },
  { name: "Czech Republic", flag: "🇨🇿", code: "CZ" },
  { name: "Denmark", flag: "🇩🇰", code: "DK" },
  { name: "Estonia", flag: "🇪🇪", code: "EE" },
  { name: "Finland", flag: "🇫🇮", code: "FI" },
  { name: "France", flag: "🇫🇷", code: "FR" },
  { name: "Germany", flag: "🇩🇪", code: "DE" },
  { name: "Greece", flag: "🇬🇷", code: "GR" },
  { name: "Hungary", flag: "🇭🇺", code: "HU" },
  { name: "Iceland", flag: "🇮🇸", code: "IS" },
  { name: "Ireland", flag: "🇮🇪", code: "IE" },
  { name: "Italy", flag: "🇮🇹", code: "IT" },
  { name: "Kosovo", flag: "🇽🇰", code: "XK" },
  { name: "Latvia", flag: "🇱🇻", code: "LV" },
  { name: "Liechtenstein", flag: "🇱🇮", code: "LI" },
  { name: "Lithuania", flag: "🇱🇹", code: "LT" },
  { name: "Luxembourg", flag: "🇱🇺", code: "LU" },
  { name: "Malta", flag: "🇲🇹", code: "MT" },
  { name: "Moldova", flag: "🇲🇩", code: "MD" },
  { name: "Monaco", flag: "🇲🇨", code: "MC" },
  { name: "Montenegro", flag: "🇲🇪", code: "ME" },
  { name: "Netherlands", flag: "🇳🇱", code: "NL" },
  { name: "North Macedonia", flag: "🇲🇰", code: "MK" },
  { name: "Norway", flag: "🇳🇴", code: "NO" },
  { name: "Poland", flag: "🇵🇱", code: "PL" },
  { name: "Portugal", flag: "🇵🇹", code: "PT" },
  { name: "Romania", flag: "🇷🇴", code: "RO" },
  { name: "Russia", flag: "🇷🇺", code: "RU" },
  { name: "San Marino", flag: "🇸🇲", code: "SM" },
  { name: "Serbia", flag: "🇷🇸", code: "RS" },
  { name: "Slovakia", flag: "🇸🇰", code: "SK" },
  { name: "Slovenia", flag: "🇸🇮", code: "SI" },
  { name: "Spain", flag: "🇪🇸", code: "ES" },
  { name: "Sweden", flag: "🇸🇪", code: "SE" },
  { name: "Switzerland", flag: "🇨🇭", code: "CH" },
  { name: "Ukraine", flag: "🇺🇦", code: "UA" },
  { name: "United Kingdom", flag: "🇬🇧", code: "GB" },
  { name: "Vatican City", flag: "🇻🇦", code: "VA" },
  // Additional world countries
  { name: "United States", flag: "🇺🇸", code: "US" },
  { name: "Canada", flag: "🇨🇦", code: "CA" },
  { name: "Australia", flag: "🇦🇺", code: "AU" },
  { name: "Brazil", flag: "🇧🇷", code: "BR" },
  { name: "Argentina", flag: "🇦🇷", code: "AR" },
  { name: "Mexico", flag: "🇲🇽", code: "MX" },
  { name: "Japan", flag: "🇯🇵", code: "JP" },
  { name: "China", flag: "🇨🇳", code: "CN" },
  { name: "India", flag: "🇮🇳", code: "IN" },
  { name: "South Korea", flag: "🇰🇷", code: "KR" },
  { name: "Turkey", flag: "🇹🇷", code: "TR" },
  { name: "Israel", flag: "🇮🇱", code: "IL" },
  { name: "South Africa", flag: "🇿🇦", code: "ZA" },
  { name: "New Zealand", flag: "🇳🇿", code: "NZ" },
];

interface CountrySelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  showLabel?: boolean;
  variant?: "icon" | "list" | "navigation";
  userCountry?: string | null;
}

const CountrySelector = ({ value, onChange, showLabel = false, variant = "icon", userCountry }: CountrySelectorProps) => {
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
    if (variant === "list" && !value) {
      fetch('https://ipapi.co/country_code/')
        .then(res => res.text())
        .then(code => {
          const country = allCountries.find(c => c.code === code.trim());
          if (country) {
            onChange?.(country.code);
          }
        })
        .catch(() => {
          // Silently fail, user can select manually
        });
    }
  }, [variant]);
  
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
              placeholder="Search countries..."
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
                <span className="flex-1 text-left font-medium">All Countries</span>
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
                    No countries found
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
        {showLabel && <Label className="text-xs md:text-sm">Country</Label>}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              type="button"
              variant="outline" 
              className="w-full justify-between bg-input border-border hover:bg-accent/10 hover:border-accent px-3"
            >
              {selectedCountry ? (
                <span>{selectedCountry.name}</span>
              ) : (
                <span className="text-muted-foreground">Select country</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-card border-border z-50" align="start">
            <div className="p-3 border-b border-border">
              <Input
                placeholder="Search countries..."
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
                      No countries found
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
    <div className="space-y-2">
      {showLabel && <Label className="text-xs md:text-sm">Country</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            type="button"
            variant="outline" 
            className="justify-between bg-input border-border hover:bg-accent/10 hover:border-accent px-3"
          >
            {selectedCountry ? (
              <span className="text-xl">{selectedCountry.flag}</span>
            ) : (
              <span className="text-xl">🌍</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 bg-card border-border z-50" align="start">
          <ScrollArea className="h-96">
            <div className="p-2">
              <div className="space-y-1">
                {allCountries.map((country) => (
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
              </div>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CountrySelector;
