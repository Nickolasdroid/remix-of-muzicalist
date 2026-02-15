import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Music, CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { getCountryFlag, getCountryName, getCountryCode } from "@/lib/countryFlags";
import { countryAdminDivisions } from "@/lib/countryAdminDivisions";
import { useEffect } from "react";

const categories = ["Singer", "Instrumentalist", "DJ", "Band"] as const;

const HeroSearchBar = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [locationOpen, setLocationOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const [countriesWithArtists, setCountriesWithArtists] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState("");

  useEffect(() => {
    const fetchCountries = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("country")
        .not("specialization", "is", null);
      if (data) {
        const unique = [...new Set(data.map((p) => p.country).filter(Boolean))] as string[];
        setCountriesWithArtists(unique.sort((a, b) => getCountryName(a).localeCompare(getCountryName(b))));
      }
    };
    fetchCountries();
  }, []);

  const countryCode = selectedCountry ? getCountryCode(selectedCountry) : null;
  const regions = countryCode ? countryAdminDivisions[countryCode]?.regions || [] : [];

  const locationLabel = selectedCountry
    ? `${getCountryFlag(selectedCountry)} ${selectedRegion || getCountryName(selectedCountry)}`
    : "Location";

  const categoryLabel = selectedCategory || "Artist Type";
  const dateLabel = selectedDate ? format(selectedDate, "MMM d, yyyy") : "Date";

  const handleSearch = () => {
    if (selectedCountry) {
      const countryName = getCountryName(selectedCountry);
      let path = `/countries/${encodeURIComponent(countryName)}`;
      const params = new URLSearchParams();
      if (selectedCategory) params.set("specialization", selectedCategory);
      if (selectedRegion) params.set("region", selectedRegion);
      if (selectedDate) params.set("date", format(selectedDate, "yyyy-MM-dd"));
      const qs = params.toString();
      navigate(qs ? `${path}?${qs}` : path);
    } else {
      navigate("/countries");
    }
  };

  const filteredCountries = countriesWithArtists.filter((c) =>
    getCountryName(c).toLowerCase().includes(countrySearch.toLowerCase())
  );

  // --- Location picker content ---
  const locationContent = (
    <div className="space-y-2">
      <input
        placeholder="Search country..."
        value={countrySearch}
        onChange={(e) => setCountrySearch(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <ScrollArea className="h-48">
        <div className="space-y-0.5">
          {filteredCountries.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setSelectedCountry(c);
                setSelectedRegion(null);
                setCountrySearch("");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-base rounded-md transition-colors hover:bg-accent/10",
                selectedCountry === c && "bg-accent/20 text-accent"
              )}
            >
              <span className="text-xl">{getCountryFlag(c)}</span>
              <span className="font-medium">{getCountryName(c)}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
      {selectedCountry && regions.length > 0 && (
        <>
          <div className="border-t border-border pt-2">
            <p className="text-xs text-muted-foreground mb-1 px-1">Region</p>
            <ScrollArea className="h-36">
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => { setSelectedRegion(null); setLocationOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 text-left px-4 py-3 text-base font-medium rounded-md hover:bg-accent/10",
                    !selectedRegion && "bg-accent/20 text-accent"
                  )}
                >
                  All Regions
                </button>
                {regions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setSelectedRegion(r); setLocationOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 text-left px-4 py-3 text-base font-medium rounded-md hover:bg-accent/10",
                      selectedRegion === r && "bg-accent/20 text-accent"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );

  // --- Category picker content ---
  const categoryContent = (
    <div className="space-y-0.5 p-2">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => { setSelectedCategory(cat); setCategoryOpen(false); }}
          className={cn(
            "w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-accent/10 transition-colors",
            selectedCategory === cat && "bg-accent/20 text-accent"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  const fieldClass = "flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors text-sm font-medium whitespace-nowrap";
  const dividerClass = "w-px bg-border/50 self-stretch my-2";

  // Mobile: stacked layout
  if (isMobile) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden shadow-lg">
          {/* Category */}
          <Drawer open={categoryOpen} onOpenChange={setCategoryOpen}>
            <DrawerTrigger asChild>
              <button type="button" className={cn(fieldClass, "w-full border-b border-border/30")}>
                <Music className="h-4 w-4 text-accent shrink-0" />
                <span className="text-foreground/90">{categoryLabel}</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="px-4 pb-6">
              <DrawerHeader className="text-left px-0">
                <DrawerTitle>Select Artist Type</DrawerTitle>
              </DrawerHeader>
              {categoryContent}
            </DrawerContent>
          </Drawer>

          {/* Location */}
          <Drawer open={locationOpen} onOpenChange={setLocationOpen}>
            <DrawerTrigger asChild>
              <button type="button" className={cn(fieldClass, "w-full border-b border-border/30")}>
                <MapPin className="h-4 w-4 text-accent shrink-0" />
                <span className="truncate text-foreground/90">{locationLabel}</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="px-4 pb-6">
              <DrawerHeader className="text-left px-0">
                <DrawerTitle>Select Location</DrawerTitle>
              </DrawerHeader>
              {locationContent}
            </DrawerContent>
          </Drawer>

          {/* Date */}
          <Drawer open={dateOpen} onOpenChange={setDateOpen}>
            <DrawerTrigger asChild>
              <button type="button" className={cn(fieldClass, "w-full border-b border-border/30")}>
                <CalendarIcon className="h-4 w-4 text-accent shrink-0" />
                <span className="text-foreground/90">{dateLabel}</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="px-4 pb-6">
              <DrawerHeader className="text-left px-0">
                <DrawerTitle>Select Date</DrawerTitle>
              </DrawerHeader>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setDateOpen(false); }}
                  disabled={(date) => date < new Date()}
                  className="p-3 pointer-events-auto"
                />
              </div>
            </DrawerContent>
          </Drawer>

          {/* Search */}
          <Button
            onClick={handleSearch}
            className="w-full rounded-none rounded-b-2xl bg-accent text-accent-foreground hover:bg-accent/90 py-3 text-base font-semibold"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>
    );
  }

  // Desktop: horizontal bar
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center bg-card/90 backdrop-blur-sm rounded-full border border-border/50 overflow-hidden shadow-lg">
        {/* Category */}
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={cn(fieldClass, "flex-1 min-w-0 rounded-l-full")}>
              <Music className="h-4 w-4 text-accent shrink-0" />
              <span className="truncate text-foreground/90">{categoryLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0 bg-card border-border z-50" align="start">
            {categoryContent}
          </PopoverContent>
        </Popover>

        <div className={dividerClass} />

        {/* Location */}
        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={cn(fieldClass, "flex-1 min-w-0")}>
              <MapPin className="h-4 w-4 text-accent shrink-0" />
              <span className="truncate text-foreground/90">{locationLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 bg-card border-border z-50" align="center">
            {locationContent}
          </PopoverContent>
        </Popover>

        <div className={dividerClass} />

        {/* Date */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={cn(fieldClass, "flex-1 min-w-0")}>
              <CalendarIcon className="h-4 w-4 text-accent shrink-0" />
              <span className="truncate text-foreground/90">{dateLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { setSelectedDate(d); setDateOpen(false); }}
              disabled={(date) => date < new Date()}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-3 text-base font-semibold m-1.5 shadow-[var(--shadow-gold)]"
        >
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
};

export default HeroSearchBar;
