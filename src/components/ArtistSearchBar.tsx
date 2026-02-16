import { useState, useEffect } from "react";
import { getCountryName } from "@/lib/countryFlags";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
import { toast } from "sonner";
import { getCurrencyForCountry } from "@/lib/countryCurrencies";

const EVENT_TYPES = [
  "Wedding", "Birthday", "Corporate Event", "Concert", "Festival",
  "Private Party", "Club Event", "Restaurant", "Funeral", "Other"
];

const ArtistSearchBar = () => {
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [counties, setCounties] = useState<string[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedExperience, setSelectedExperience] = useState<string>("");
  const [minEvents, setMinEvents] = useState("");
  const [minReviews, setMinReviews] = useState("");
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [budget, setBudget] = useState("");
  const [userCurrency, setUserCurrency] = useState("RON");

  const categories = ["Singer", "Instrumentalist", "DJ", "Band"];
  const genres = [
    "Pop", "Rock", "Jazz", "Classical", "Electronic", "Hip Hop", "Folk",
    "R&B", "Country", "Reggae", "Blues", "Metal"
  ];
  const experienceLevels = ["Beginner", "Intermediate", "Advanced", "Professional"];

  // Fetch user's country for currency
  useEffect(() => {
    const fetchUserCurrency = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', user.id)
          .single();
        if (profile?.country) {
          setUserCurrency(getCurrencyForCountry(profile.country));
        }
      }
    };
    fetchUserCurrency();
  }, []);

  // Fetch countries where artists are registered
  useEffect(() => {
    const fetchCountriesData = async () => {
      const artistIds = await fetchArtistIds();
      if (artistIds.length === 0) {
        setCountries([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .in('id', artistIds)
        .not('country', 'is', null);

      if (!error && data) {
        const uniqueCountries = [...new Set(data.map(p => p.country).filter(Boolean))] as string[];
        setCountries(uniqueCountries.sort());
      }
    };
    fetchCountriesData();
  }, []);

  // Fetch counties when country changes
  useEffect(() => {
    const fetchCountiesData = async () => {
      if (!selectedCountry) {
        setCounties([]);
        return;
      }

      const artistIds = await fetchArtistIds();
      if (artistIds.length === 0) {
        setCounties([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('county')
        .eq('country', selectedCountry)
        .in('id', artistIds)
        .not('county', 'is', null);

      if (!error && data) {
        const uniqueCounties = [...new Set(data.map(p => p.county).filter(Boolean))] as string[];
        setCounties(uniqueCounties.sort());
      }
    };
    fetchCountiesData();
  }, [selectedCountry]);

  // Update currency when selected country changes
  useEffect(() => {
    if (selectedCountry) {
      setUserCurrency(getCurrencyForCountry(selectedCountry));
    }
  }, [selectedCountry]);

  const isAtLeastOneFieldFilled = () => {
    return !!(
      selectedCountry ||
      selectedCounty ||
      selectedCategory ||
      selectedGenre ||
      selectedExperience ||
      minEvents ||
      minReviews ||
      selectedEventType ||
      budget
    );
  };

  const handleSearch = () => {
    if (!isAtLeastOneFieldFilled()) {
      toast.error("Please fill in at least one field to search.");
      return;
    }
    // TODO: implement actual search logic
    toast.success("Searching...");
  };

  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 border border-border shadow-[var(--shadow-elegant)]">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-accent" />
        <h3 className="text-lg md:text-xl font-display font-bold text-foreground">
          Search Artists
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {/* Country */}
        <div className="space-y-1">
          <Label htmlFor="country" className="text-xs">Country</Label>
          <Select value={selectedCountry} onValueChange={(v) => { setSelectedCountry(v); setSelectedCounty(""); }}>
            <SelectTrigger id="country" className="h-9 text-sm">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {getCountryName(country)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Region/County */}
        <div className="space-y-1">
          <Label htmlFor="county" className="text-xs">Region</Label>
          <Select value={selectedCounty} onValueChange={setSelectedCounty} disabled={!selectedCountry}>
            <SelectTrigger id="county" className="h-9 text-sm">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {counties.map((county) => (
                <SelectItem key={county} value={county.toLowerCase()}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="space-y-1">
          <Label htmlFor="category" className="text-xs">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category" className="h-9 text-sm">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat.toLowerCase()}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Musical Genre */}
        <div className="space-y-1">
          <Label htmlFor="genre" className="text-xs">Genre</Label>
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger id="genre" className="h-9 text-sm">
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              {genres.map((genre) => (
                <SelectItem key={genre} value={genre.toLowerCase()}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Experience Level */}
        <div className="space-y-1">
          <Label htmlFor="experience" className="text-xs">Experience</Label>
          <Select value={selectedExperience} onValueChange={setSelectedExperience}>
            <SelectTrigger id="experience" className="h-9 text-sm">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {experienceLevels.map((level) => (
                <SelectItem key={level} value={level.toLowerCase()}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Events */}
        <div className="space-y-1">
          <Label htmlFor="events" className="text-xs">Min. Events</Label>
          <Input
            id="events"
            type="number"
            placeholder="0"
            min="0"
            value={minEvents}
            onChange={(e) => setMinEvents(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Minimum Reviews */}
        <div className="space-y-1">
          <Label htmlFor="reviews" className="text-xs">Min. Reviews</Label>
          <Input
            id="reviews"
            type="number"
            placeholder="0"
            min="0"
            value={minReviews}
            onChange={(e) => setMinReviews(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Event Type */}
        <div className="space-y-1">
          <Label htmlFor="eventType" className="text-xs">Event Type</Label>
          <Select value={selectedEventType} onValueChange={setSelectedEventType}>
            <SelectTrigger id="eventType" className="h-9 text-sm">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type.toLowerCase()}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Budget */}
        <div className="space-y-1">
          <Label htmlFor="budget" className="text-xs">Budget ({userCurrency})</Label>
          <Input
            id="budget"
            type="number"
            placeholder={`0 (${userCurrency})`}
            min="0"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Search Button */}
        <div className="hidden md:flex items-end">
          <Button
            size="default"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-9"
            onClick={handleSearch}
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Mobile Search Button */}
      <div className="mt-4 md:hidden">
        <Button
          size="default"
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={handleSearch}
        >
          <Search className="mr-2 h-4 w-4" />
          Search Artists
        </Button>
      </div>
    </div>
  );
};

export default ArtistSearchBar;
