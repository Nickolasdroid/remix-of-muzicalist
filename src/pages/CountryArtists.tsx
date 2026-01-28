import Navigation from "@/components/Navigation";
import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Users, Filter } from "lucide-react";
import ArtistProfileCard from "@/components/ArtistProfileCard";
import { getCountryFlag } from "@/lib/countryFlags";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";

interface FilterButtonProps {
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  filterCounty: string;
  setFilterCounty: (value: string) => void;
  filterExperience: string;
  setFilterExperience: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
  counties: string[];
}

const FilterContent = ({
  filterCategory,
  setFilterCategory,
  filterCounty,
  setFilterCounty,
  filterExperience,
  setFilterExperience,
  sortOrder,
  setSortOrder,
  counties,
}: FilterButtonProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <Select value={filterCategory} onValueChange={setFilterCategory}>
        <SelectTrigger id="category">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="Singer">Singer</SelectItem>
          <SelectItem value="Instrumentalist">Instrumentalist</SelectItem>
          <SelectItem value="DJ">DJ</SelectItem>
          <SelectItem value="Band">Band</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="county">Region</Label>
      <Select value={filterCounty} onValueChange={setFilterCounty}>
        <SelectTrigger id="county">
          <SelectValue placeholder="All Regions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Regions</SelectItem>
          {counties.map(county => (
            <SelectItem key={county} value={county}>{county}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="experience">Experience Level</Label>
      <Select value={filterExperience} onValueChange={setFilterExperience}>
        <SelectTrigger id="experience">
          <SelectValue placeholder="All Levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          <SelectItem value="Beginner">Beginner</SelectItem>
          <SelectItem value="Intermediate">Intermediate</SelectItem>
          <SelectItem value="Advanced">Advanced</SelectItem>
          <SelectItem value="Professional">Professional</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="sort">Sort Alphabetically</Label>
      <Select value={sortOrder} onValueChange={setSortOrder}>
        <SelectTrigger id="sort">
          <SelectValue placeholder="No Sorting" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Sorting</SelectItem>
          <SelectItem value="a-z">A to Z</SelectItem>
          <SelectItem value="z-a">Z to A</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Button 
      variant="outline" 
      onClick={() => {
        setFilterCategory("all");
        setFilterCounty("all");
        setFilterExperience("all");
        setSortOrder("none");
      }}
      className="w-full"
    >
      Clear All Filters
    </Button>
  </div>
);

const FilterButton = (props: FilterButtonProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs md:text-sm h-9 px-3">
            <Filter className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Filter
          </Button>
        </DrawerTrigger>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle>Filter Artists</DrawerTitle>
            <p className="text-sm text-muted-foreground">Apply filters to find the perfect artist</p>
          </DrawerHeader>
          <FilterContent {...props} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs md:text-sm h-9 px-3">
          <Filter className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-card border border-border z-50">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-1">Filter Artists</h4>
            <p className="text-sm text-muted-foreground">Apply filters to find the perfect artist</p>
          </div>
          <FilterContent {...props} />
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface Artist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  county: string;
  specialization: string | null;
  experience_level: string | null;
  plan: string;
}

const CountryArtists = () => {
  const { country } = useParams<{ country: string }>();
  const decodedCountry = country ? decodeURIComponent(country) : "";
  const [searchTerm, setSearchTerm] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterCounty, setFilterCounty] = useState<string>("all");
  const [filterExperience, setFilterExperience] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("none");

  useEffect(() => {
    const fetchArtists = async () => {
      if (!decodedCountry) return;
      
      setLoading(true);

      // First get artist user IDs from user_roles
      const { data: artistRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_type', 'artist');

      if (rolesError) {
        console.error('Error fetching artist roles:', rolesError);
        setArtists([]);
        setLoading(false);
        return;
      }

      const artistIds = artistRoles?.map(r => r.user_id) || [];

      if (artistIds.length === 0) {
        setArtists([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, county, specialization, experience_level, plan')
        .in('id', artistIds)
        .eq('country', decodedCountry)
        .order('stage_name');

      setArtists(data || []);
      setLoading(false);
    };

    fetchArtists();
  }, [decodedCountry]);

  const counties = useMemo(() => {
    const uniqueCounties = [...new Set(artists.map(a => a.county).filter(Boolean))];
    return uniqueCounties.sort();
  }, [artists]);

  const filteredArtists = useMemo(() => {
    let result = [...artists];

    // Search filter
    if (searchTerm) {
      result = result.filter(artist =>
        artist.stage_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.county?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== "all") {
      result = result.filter(artist => artist.specialization === filterCategory);
    }

    // County filter
    if (filterCounty !== "all") {
      result = result.filter(artist => artist.county === filterCounty);
    }

    // Experience filter
    if (filterExperience !== "all") {
      result = result.filter(artist => artist.experience_level?.toLowerCase() === filterExperience.toLowerCase());
    }

    // Sorting
    if (sortOrder === "a-z") {
      result.sort((a, b) => a.stage_name.localeCompare(b.stage_name));
    } else if (sortOrder === "z-a") {
      result.sort((a, b) => b.stage_name.localeCompare(a.stage_name));
    }

    return result;
  }, [artists, searchTerm, filterCategory, filterCounty, filterExperience, sortOrder]);

  return (
    <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 md:pt-32 pb-24 md:pb-20">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <Link to="/countries">
            <Button variant="outline" size="sm" className="text-xs md:text-sm h-9 px-3">
              <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Back
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-2xl md:text-3xl">{getCountryFlag(decodedCountry)}</span>
            <h1 className="hidden md:block text-xl md:text-2xl font-display font-bold text-foreground">{decodedCountry}</h1>
          </div>

          <FilterButton 
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterCounty={filterCounty}
            setFilterCounty={setFilterCounty}
            filterExperience={filterExperience}
            setFilterExperience={setFilterExperience}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            counties={counties}
          />
        </div>

        <div className="text-center mb-6 md:mb-8">
          <p className="text-muted-foreground mb-4">
            {loading ? "Loading artists..." : `${artists.length} artist${artists.length !== 1 ? 's' : ''} registered`}
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search artists by name, specialization, or region..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-12 h-12 md:h-14 text-base md:text-lg bg-card/50 backdrop-blur border-accent/20" 
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading artists...</p>
            </div>
          ) : filteredArtists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
              {filteredArtists.map(artist => (
                <ArtistProfileCard
                  key={artist.id}
                  id={artist.id}
                  stageName={artist.stage_name}
                  imageUrl={artist.avatar_url}
                  plan={artist.plan}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-base md:text-lg">
                {searchTerm || filterCategory !== "all" || filterCounty !== "all" || filterExperience !== "all"
                  ? "No artists found matching your filters" 
                  : `No artists registered from ${decodedCountry} yet`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountryArtists;
