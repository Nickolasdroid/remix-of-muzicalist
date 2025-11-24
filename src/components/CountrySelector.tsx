import { useState } from "react";
import { Globe } from "lucide-react";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";

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

const CountrySelector = () => {
  const [selectedCountry, setSelectedCountry] = useState(europeanCountries[34]); // Romania as default
  const [open, setOpen] = useState(false);

  const handleSelectCountry = (country: typeof europeanCountries[0]) => {
    setSelectedCountry(country);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-accent/20 hover:bg-accent/10 hover:border-accent gap-2"
        >
          <span className="text-xl">{selectedCountry.flag}</span>
          <Globe className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-accent/20" align="end">
        <ScrollArea className="h-96">
          <div className="p-2">
            <div className="text-sm font-semibold text-accent px-2 py-2">
              Select Country
            </div>
            <div className="space-y-1">
              {europeanCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleSelectCountry(country)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent/10 ${
                    selectedCountry.code === country.code
                      ? "bg-accent/20 text-accent"
                      : "text-foreground"
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span>{country.name}</span>
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default CountrySelector;
