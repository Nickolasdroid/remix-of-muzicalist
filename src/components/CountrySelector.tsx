import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Label } from "./ui/label";

const europeanCountries = [
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
];

interface CountrySelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  showLabel?: boolean;
  variant?: "icon" | "list";
}

const CountrySelector = ({ value, onChange, showLabel = false, variant = "icon" }: CountrySelectorProps) => {
  const [open, setOpen] = useState(false);
  
  // Auto-detect user's country on mount
  useEffect(() => {
    if (!value) {
      fetch('https://ipapi.co/country_code/')
        .then(res => res.text())
        .then(code => {
          const country = europeanCountries.find(c => c.code === code.trim());
          if (country) {
            onChange?.(country.code);
          }
        })
        .catch(() => {
          // Silently fail, user can select manually
        });
    }
  }, []);
  
  const selectedCountry = europeanCountries.find(c => c.code === value) || null;

  const handleSelectCountry = (country: typeof europeanCountries[0]) => {
    onChange?.(country.code);
    setOpen(false);
  };

  if (variant === "list") {
    return (
      <div className="space-y-2">
        {showLabel && <Label>Country *</Label>}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              type="button"
              variant="outline" 
              className="w-full justify-between bg-input border-border hover:bg-accent/10 hover:border-accent px-3"
            >
              {selectedCountry ? (
                <span className="flex items-center gap-2">
                  <span className="text-xl">{selectedCountry.flag}</span>
                  <span>{selectedCountry.name}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Select country</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-card border-border z-50" align="start">
            <ScrollArea className="h-96">
              <div className="p-2">
                <div className="space-y-1">
                  {europeanCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleSelectCountry(country)}
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
  }

  return (
    <div className="space-y-2">
      {showLabel && <Label>Country *</Label>}
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
                {europeanCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
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