import { useState, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getCountryFlag } from "@/lib/countryFlags";

const allCountries = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
  "Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Congo (DRC)","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
  "Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hong Kong","Hungary",
  "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
  "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway",
  "Oman",
  "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar",
  "Romania","România","Russia","Rwanda",
  "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","São Tomé and Príncipe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Vanuatu","Vatican City","Venezuela","Vietnam",
  "Yemen","Zambia","Zimbabwe",
];

const normalizeString = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

interface CountryPickerButtonProps {
  selectedCountry: string | null;
  onCountryChange: (country: string) => void;
}

const CountryPickerButton = ({ selectedCountry, onCountryChange }: CountryPickerButtonProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [countriesWithArtists, setCountriesWithArtists] = useState<string[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("country")
        .not("specialization", "is", null);

      if (data) {
        const unique = [...new Set(data.map((p) => p.country).filter(Boolean))] as string[];
        unique.sort((a, b) => a.localeCompare(b));
        setCountriesWithArtists(unique);
      }
    };
    fetchCountries();
  }, []);

  const availableCountries = countriesWithArtists.length > 0
    ? allCountries.filter((c) =>
        countriesWithArtists.some((db) => normalizeString(db) === normalizeString(c))
      )
    : [];

  const filtered = availableCountries.filter((c) =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const flag = getCountryFlag(selectedCountry);

  const handleSelect = (country: string) => {
    // Find the DB name (with diacritics) matching this country
    const dbName = countriesWithArtists.find(
      (db) => normalizeString(db) === normalizeString(country)
    );
    onCountryChange(dbName || country);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 px-4 gap-2 border-accent/20 hover:bg-accent/10 hover:border-accent transition-all"
        >
          {flag ? (
            <span className="text-lg">{flag}</span>
          ) : (
            <Globe className="h-4 w-4 text-accent" />
          )}
          <span className="text-sm font-medium truncate max-w-[200px]">
            {selectedCountry || "Select Country"}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-card border-border z-50" align="center">
        <div className="p-3 border-b border-border">
          <Input
            placeholder="Search country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="bg-background/50"
          />
        </div>
        <ScrollArea className="h-64">
          <div className="p-2 space-y-0.5">
            {filtered.map((country) => {
              const isSelected = selectedCountry
                ? normalizeString(selectedCountry) === normalizeString(country)
                : false;
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent/10 ${
                    isSelected ? "bg-accent/20 text-accent" : "text-foreground"
                  }`}
                >
                  <span className="text-lg">{getCountryFlag(country)}</span>
                  <span className="flex-1 text-left">{country}</span>
                  {isSelected && <Check className="h-4 w-4 text-accent" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No countries found
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default CountryPickerButton;
