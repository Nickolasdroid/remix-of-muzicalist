import { useState, useEffect } from "react";
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
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";

const ArtistSearchBar = () => {
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [counties, setCounties] = useState<string[]>([]);

  const categories = ["Singer", "Instrumentalist", "DJ", "Band"];
  const genres = [
    "Pop", "Rock", "Jazz", "Classical", "Electronic", "Hip Hop", "Folk", 
    "R&B", "Country", "Reggae", "Blues", "Metal"
  ];
  const experienceLevels = ["Beginner", "Intermediate", "Advanced", "Professional"];

  // Fetch countries where artists are registered
  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .not('country', 'is', null);

      if (!error && data) {
        const uniqueCountries = [...new Set(data.map(p => p.country).filter(Boolean))] as string[];
        setCountries(uniqueCountries.sort());
      }
    };
    fetchCountries();
  }, []);

  // Fetch counties when country changes
  useEffect(() => {
    const fetchCounties = async () => {
      if (!selectedCountry) {
        setCounties([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('county')
        .eq('country', selectedCountry)
        .not('county', 'is', null);

      if (!error && data) {
        const uniqueCounties = [...new Set(data.map(p => p.county).filter(Boolean))] as string[];
        setCounties(uniqueCounties.sort());
      }
    };
    fetchCounties();
  }, [selectedCountry]);

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
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger id="country" className="h-9 text-sm">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Region/County */}
        <div className="space-y-1">
          <Label htmlFor="county" className="text-xs">Region</Label>
          <Select disabled={!selectedCountry}>
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
          <Select>
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
          <Select>
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
          <Select>
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
            className="h-9 text-sm"
          />
        </div>

        {/* Age */}
        <div className="space-y-1">
          <Label htmlFor="age" className="text-xs">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="Any"
            min="18"
            max="100"
            className="h-9 text-sm"
          />
        </div>

        {/* Price Range - spans 2 columns */}
        <div className="col-span-2 space-y-2">
          <Label className="text-xs">Price Range (RON)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="From"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
              className="h-9 text-sm flex-1"
            />
            <span className="text-muted-foreground text-sm">-</span>
            <Input
              type="number"
              placeholder="To"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
              className="h-9 text-sm flex-1"
            />
          </div>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={10000}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{priceRange[0]} RON</span>
            <span>{priceRange[1]} RON</span>
          </div>
        </div>

        {/* Search Button - spans remaining column on desktop */}
        <div className="hidden md:flex items-end">
          <Button 
            size="default"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-9"
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
        >
          <Search className="mr-2 h-4 w-4" />
          Search Artists
        </Button>
      </div>
    </div>
  );
};

export default ArtistSearchBar;
