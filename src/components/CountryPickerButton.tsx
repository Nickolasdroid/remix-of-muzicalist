import { useState, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getCountryName } from "@/lib/countryFlags";
import { useIsMobile } from "@/hooks/use-mobile";
import CountryFlagIcon from "@/components/CountryFlagIcon";

const normalizeString = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

interface CountryPickerButtonProps {
  selectedCountry: string | null;
  onCountryChange: (country: string) => void;
  hideAllOption?: boolean;
}

const CountryList = ({
  filtered,
  selectedCountry,
  onSelect,
  hideAllOption,
}: {
  filtered: { dbValue: string; displayName: string }[];
  selectedCountry: string | null;
  onSelect: (dbValue: string) => void;
  hideAllOption?: boolean;
}) => (
  <div className="py-2 space-y-0.5">
    {!hideAllOption && (
      <button
        type="button"
        onClick={() => onSelect("__all__")}
        className={`w-full flex items-center gap-3 px-4 py-3 text-base rounded-md transition-colors hover:bg-accent/10 ${
          selectedCountry === "__all__" ? "bg-accent/20 text-accent" : "text-foreground"
        }`}
      >
        <Globe className="h-5 w-5 text-accent" />
        <span className="flex-1 text-left font-medium">All Countries</span>
        {selectedCountry === "__all__" && <Check className="h-5 w-5 text-accent" />}
      </button>
    )}

    {filtered.map(({ dbValue, displayName: name }) => {
      const isSelected =
        selectedCountry && selectedCountry !== "__all__"
          ? normalizeString(getCountryName(selectedCountry)) === normalizeString(name)
          : false;

      return (
        <button
          key={dbValue}
          type="button"
          onClick={() => onSelect(dbValue)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-base rounded-md transition-colors hover:bg-accent/10 ${
            isSelected ? "bg-accent/20 text-accent" : "text-foreground"
          }`}
        >
          <CountryFlagIcon country={dbValue} className="h-5 w-7 flex-shrink-0 rounded-sm shadow-sm" />
          <span className="flex-1 text-left font-medium">{name}</span>
          {isSelected && <Check className="h-5 w-5 text-accent" />}
        </button>
      );
    })}

    {filtered.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No countries found</p>}
  </div>
);

const CountryPickerButton = ({ selectedCountry, onCountryChange, hideAllOption }: CountryPickerButtonProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [countriesWithArtists, setCountriesWithArtists] = useState<string[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchCountries = async () => {
      const { data } = await supabase.from("profiles").select("country").not("specialization", "is", null);

      if (data) {
        const rawValues = [...new Set(data.map((p) => p.country).filter(Boolean))] as string[];
        const resolved = rawValues.map((val) => ({
          dbValue: val,
          displayName: getCountryName(val),
        }));
        const uniqueMap = new Map<string, string>();
        resolved.forEach(({ dbValue, displayName }) => {
          if (displayName && !uniqueMap.has(normalizeString(displayName))) {
            uniqueMap.set(normalizeString(displayName), dbValue);
          }
        });
        setCountriesWithArtists(Array.from(uniqueMap.values()));
      }
    };
    fetchCountries();
  }, []);

  const availableCountries = countriesWithArtists
    .map((dbVal) => ({
      dbValue: dbVal,
      displayName: getCountryName(dbVal),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const filtered = availableCountries.filter((c) => c.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

  const isAll = selectedCountry === "__all__";
  const displayName = isAll ? "All Countries" : selectedCountry ? getCountryName(selectedCountry) : null;

  const handleSelect = (dbValue: string) => {
    onCountryChange(dbValue);
    setOpen(false);
    setSearchTerm("");
  };

  const searchInput = (
    <Input
      placeholder="Search country..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="bg-background/50"
    />
  );

  const triggerButton = (
    <Button
      variant="outline"
      className="h-10 px-4 gap-2 border-accent/20 hover:bg-accent/10 hover:border-accent transition-all max-w-full overflow-hidden"
    >
      {isAll || !selectedCountry ? (
        <Globe className="h-4 w-4 text-accent flex-shrink-0" />
      ) : (
        <CountryFlagIcon country={selectedCountry} className="h-4 w-6 flex-shrink-0 rounded-sm shadow-sm" />
      )}
      <span className="text-sm font-medium truncate">{displayName || "Select Country"}</span>
      <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="px-4 pb-6" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DrawerHeader className="text-left px-0">
            <DrawerTitle>Select Country</DrawerTitle>
          </DrawerHeader>
          <div className="mb-3">{searchInput}</div>
          <ScrollArea className="h-72">
            <div className="space-y-0.5">
              <CountryList filtered={filtered} selectedCountry={selectedCountry} onSelect={handleSelect} hideAllOption={hideAllOption} />
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-card border-border z-50" align="center" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="p-3 border-b border-border">{searchInput}</div>
        <ScrollArea className="h-64">
          <CountryList filtered={filtered} selectedCountry={selectedCountry} onSelect={handleSelect} hideAllOption={hideAllOption} />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default CountryPickerButton;