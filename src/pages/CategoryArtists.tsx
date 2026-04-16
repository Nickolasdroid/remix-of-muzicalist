import Navigation from "@/components/Navigation";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter } from "lucide-react";
import ArtistProfileCard from "@/components/ArtistProfileCard";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
import { getCountryName } from "@/lib/countryFlags";
import { sortByPlanPriority } from "@/lib/planLimits";
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
  filterCountry: string;
  setFilterCountry: (value: string) => void;
  filterCounty: string;
  setFilterCounty: (value: string) => void;
  filterExperience: string;
  setFilterExperience: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
  countries: string[];
  counties: string[];
}

const FilterContent = ({
  filterCountry,
  setFilterCountry,
  filterCounty,
  setFilterCounty,
  filterExperience,
  setFilterExperience,
  sortOrder,
  setSortOrder,
  countries,
  counties,
}: FilterButtonProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="country">Country</Label>
      <Select value={filterCountry} onValueChange={setFilterCountry}>
        <SelectTrigger id="country">
          <SelectValue placeholder="All Countries" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Countries</SelectItem>
          {countries.map(country => (
            <SelectItem key={country} value={country}>{getCountryName(country)}</SelectItem>
          ))}
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
        setFilterCountry("all");
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
  country: string | null;
  county: string;
  experience_level: string | null;
  plan: string;
  availabilityStatus?: "available" | "booked" | null;
}

const CategoryArtists = () => {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterCounty, setFilterCounty] = useState<string>("all");
  const [filterExperience, setFilterExperience] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("none");
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableCounties, setAvailableCounties] = useState<string[]>([]);
  const urlDate = searchParams.get('date');

  // Check auth and get country (guests see all countries)
  useEffect(() => {
    const checkAuthAndGetCountry = async () => {
      const countryFromUrl = searchParams.get('country');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        if (countryFromUrl) {
          setUserCountry(countryFromUrl);
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', session.user.id)
          .maybeSingle();
        setUserCountry(profile?.country || '__all__');
      } else {
        setCurrentUserId(null);
        setUserCountry(countryFromUrl || '__all__');
      }
    };
    checkAuthAndGetCountry();
  }, [navigate, searchParams]);

  useEffect(() => {
    const fetchArtists = async () => {
      if (!category || !userCountry) return;

      const categoryMap: Record<string, string> = {
        'Singers': 'Singer',
        'Instrumentalists': 'Instrumentalist',
        'DJs': 'DJ',
        'Bands': 'Band',
      };
      
      const specialization = categoryMap[category] || category;

      const artistIds = await fetchArtistIds();
      if (artistIds.length === 0) {
        setArtists([]);
        setAvailableCountries([]);
        setAvailableCounties([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, country, county, experience_level, plan')
        .eq('specialization', specialization as "Singer" | "Instrumentalist" | "DJ" | "Band")
        .in('id', artistIds);

      if (userCountry !== '__all__') {
        query = query.eq('country', userCountry);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching artists:', error);
      } else {
        let artistsWithAvailability: Artist[] = (data || []).map(a => ({ ...a, country: a.country ?? null, experience_level: a.experience_level ?? null }));
        
        // If a date is specified, check availability
        if (urlDate && artistsWithAvailability.length > 0) {
          const { data: bookedEvents } = await supabase
            .from('calendar_events')
            .select('profile_id')
            .eq('event_date', urlDate)
            .in('status', ['Booked', 'Blocked'])
            .in('profile_id', artistsWithAvailability.map(a => a.id));
          
          const bookedArtistIds = new Set(bookedEvents?.map(e => e.profile_id) || []);
          
          artistsWithAvailability = artistsWithAvailability.map(a => ({
            ...a,
            availabilityStatus: bookedArtistIds.has(a.id) ? 'booked' as const : 'available' as const,
          }));
          
          // Sort: available first
          artistsWithAvailability.sort((a, b) => {
            const aBooked = a.availabilityStatus === 'booked' ? 1 : 0;
            const bBooked = b.availabilityStatus === 'booked' ? 1 : 0;
            return aBooked - bBooked;
          });
        }
        
        setArtists(artistsWithAvailability);
        const countries = [...new Set(artistsWithAvailability.map(a => a.country).filter(Boolean) as string[] || [])].sort();
        setAvailableCountries(countries);
        const counties = [...new Set(artistsWithAvailability.map(a => a.county) || [])].sort();
        setAvailableCounties(counties);
      }
      setLoading(false);
    };

    if (userCountry) {
      fetchArtists();
    }
  }, [category, userCountry, urlDate]);

  // Update available counties when country filter changes
  const filteredCounties = useMemo(() => {
    if (filterCountry === "all") return availableCounties;
    const countiesForCountry = [...new Set(
      artists.filter(a => a.country === filterCountry).map(a => a.county)
    )].sort();
    return countiesForCountry;
  }, [artists, filterCountry, availableCounties]);

  const filteredArtists = useMemo(() => {
    let result = [...artists];

    if (filterCountry !== "all") {
      result = result.filter(artist => artist.country === filterCountry);
    }

    if (filterCounty !== "all") {
      result = result.filter(artist => artist.county === filterCounty);
    }

    if (filterExperience !== "all") {
      result = result.filter(artist => artist.experience_level?.toLowerCase() === filterExperience.toLowerCase());
    }

    if (sortOrder === "a-z") {
      result.sort((a, b) => a.stage_name.localeCompare(b.stage_name));
    } else if (sortOrder === "z-a") {
      result.sort((a, b) => b.stage_name.localeCompare(a.stage_name));
    }

    return result;
  }, [artists, filterCountry, filterCounty, filterExperience, sortOrder]);

  return (
    <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-background`}>
      <Navigation mobileTitle={category} mobileBackPath={currentUserId ? "/categories" : "/"} />
      
      <div className={`container mx-auto px-4 pt-20 ${currentUserId ? 'md:pt-8' : 'md:pt-24'} pb-24 md:pb-20`}>
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <Link to={currentUserId ? "/categories" : "/"} className="hidden md:block">
            <Button variant="outline" size="sm" className="text-xs md:text-sm h-9 px-3">
              <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Back
            </Button>
          </Link>

          <h1 className="hidden md:block text-xl md:text-2xl font-display font-bold text-foreground">
            {category}
          </h1>

          <FilterButton 
            filterCountry={filterCountry}
            setFilterCountry={setFilterCountry}
            filterCounty={filterCounty}
            setFilterCounty={setFilterCounty}
            filterExperience={filterExperience}
            setFilterExperience={setFilterExperience}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            countries={availableCountries}
            counties={filteredCounties}
          />
        </div>

        {urlDate && (
          <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20 text-center">
            <p className="text-sm text-muted-foreground">
              Showing availability for <span className="font-semibold text-foreground">{urlDate}</span>
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">Loading artists...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-w-7xl mx-auto">
            {filteredArtists.length > 0 ? (
              filteredArtists.map((artist) => (
              <ArtistProfileCard
                  key={artist.id}
                  id={artist.id}
                  stageName={artist.stage_name}
                  imageUrl={artist.avatar_url}
                  plan={artist.plan}
                  country={artist.country}
                  county={artist.county}
                  availabilityStatus={artist.availabilityStatus}
                  searchDate={urlDate}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <p className="text-xl text-muted-foreground">No artists found matching your filters</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryArtists;
