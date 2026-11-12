import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { sortByPlanPriority } from "@/lib/planLimits";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { knownUserId } from "@/lib/knownUser";
import { Button } from "@/components/ui/button";
import HeaderFilterTrigger from "@/components/HeaderFilterTrigger";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Users, SlidersHorizontal } from "lucide-react";
import ArtistProfileCard from "@/components/ArtistProfileCard";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import GuestSidebar from "@/components/GuestSidebar";
import { getCountryFlag, getCountryName, getCountryNameVariants } from "@/lib/countryFlags";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
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
  sortOrder: string;
  setSortOrder: (value: string) => void;
  counties: string[];
}

const FilterContent = ({
  filterCategory,
  setFilterCategory,
  filterCounty,
  setFilterCounty,
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
        setSortOrder("none");
      }}
      className="w-full"
    >
      Clear All Filters
    </Button>
  </div>
);

/** Filters that narrow the list (sorting is not counted). */
const activeFilterCount = (props: FilterButtonProps) =>
  [props.filterCategory, props.filterCounty].filter((v) => v && v !== "all").length;

/**
 * Mobile: a filter icon in the top bar (next to the bell) that opens a drawer.
 * Desktop: the outlined "Filter" button with a popover, in the page header row.
 */
const FilterButton = (props: FilterButtonProps & { placement: "header" | "page"; mobileInHeader: boolean }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Signed-in: icon in the top bar next to the bell. Guests: the top bar holds the
    // login/register buttons, so the outlined button stays on the page.
    if ((props.placement === "header") !== props.mobileInHeader) return null;
    return (
      <Drawer>
        <DrawerTrigger asChild>
          {props.mobileInHeader ? (
            <HeaderFilterTrigger activeCount={activeFilterCount(props)} />
          ) : (
            <Button variant="outline" size="sm" className="text-xs h-9 px-3">
              <SlidersHorizontal className="h-3 w-3 mr-1" />
              Filter
              {activeFilterCount(props) > 0 && (
                <span className="ml-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                  {activeFilterCount(props)}
                </span>
              )}
            </Button>
          )}
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

  if (props.placement !== "page") return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs md:text-sm h-9 px-3">
          <SlidersHorizontal className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 z-50">
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

/** Desktop: the filters as grey chips in a row (a chosen value turns the chip lighter). */
const CHIP = "h-8 w-auto gap-1.5 rounded-full border-0 px-3.5 text-sm font-medium text-foreground focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-white/60 [&>svg]:opacity-70";
const chipTone = (active: boolean) => (active ? "bg-foreground/[0.24]" : "bg-foreground/[0.07] hover:bg-foreground/[0.12]");

const FilterChips = (props: FilterButtonProps) => (
  <div className="hidden flex-wrap items-center gap-2 md:flex">
    <Select value={props.filterCategory} onValueChange={props.setFilterCategory}>
      <SelectTrigger className={`${CHIP} ${chipTone(props.filterCategory !== "all")}`} aria-label="Category">
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
    <Select value={props.filterCounty} onValueChange={props.setFilterCounty}>
      <SelectTrigger className={`${CHIP} ${chipTone(props.filterCounty !== "all")}`} aria-label="Region">
        <SelectValue placeholder="All Regions" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Regions</SelectItem>
        {props.counties.map((c) => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Select value={props.sortOrder} onValueChange={props.setSortOrder}>
      <SelectTrigger className={`${CHIP} ${chipTone(props.sortOrder !== "none")}`} aria-label="Sort Alphabetically">
        <SelectValue placeholder="Recommended" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Recommended</SelectItem>
        <SelectItem value="a-z">A to Z</SelectItem>
        <SelectItem value="z-a">Z to A</SelectItem>
      </SelectContent>
    </Select>
    {activeFilterCount(props) + (props.sortOrder !== "none" ? 1 : 0) > 0 && (
      <button
        type="button"
        onClick={() => { props.setFilterCategory("all"); props.setFilterCounty("all"); props.setSortOrder("none"); }}
        className="h-8 px-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
      >
        Clear All Filters
      </button>
    )}
  </div>
);

interface Artist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  county: string;
  specialization: string | null;
  
  plan: string;
}

const CountryArtists = () => {
  const { country } = useParams<{ country: string }>();
  const [searchParams] = useSearchParams();
  const decodedCountry = country ? decodeURIComponent(country) : "";
  const displayName = getCountryName(decodedCountry);
  const [searchTerm, setSearchTerm] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookedArtistIds, setBookedArtistIds] = useState<Set<string>>(new Set());

  // Read initial values from URL params
  const urlSpecialization = searchParams.get("specialization");
  const urlRegion = searchParams.get("region");
  const urlDate = searchParams.get("date");

  const [filterCategory, setFilterCategory] = useState<string>(urlSpecialization || "all");
  const [filterCounty, setFilterCounty] = useState<string>(urlRegion || "all");
  
  const [sortOrder, setSortOrder] = useState<string>("none");
  const [currentUserId, setCurrentUserId] = useState<string | null>(knownUserId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    const fetchArtistsData = async () => {
      if (!decodedCountry) return;
      
      setLoading(true);
      
      // Get artist IDs first to filter out regular users
      const artistIds = await fetchArtistIds();
      if (artistIds.length === 0) {
        setArtists([]);
        setLoading(false);
        return;
      }

      // Get all name variants for this country (e.g. "Romania", "România", "Roumanie")
      const countryVariants = getCountryNameVariants(decodedCountry);

      const { data } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, county, specialization, plan')
        .in('country', countryVariants)
        .in('id', artistIds)
        .order('stage_name');

      const sorted = [...(data || [])].sort((a, b) => sortByPlanPriority(a, b));
      setArtists(sorted);

      // If a date is provided, fetch booked artist IDs for that date
      if (urlDate && data && data.length > 0) {
        const artistIdsInCountry = data.map(a => a.id);
        const { data: bookedIds } = await (supabase as any).rpc('get_booked_profile_ids', {
          _event_date: urlDate,
          _profile_ids: artistIdsInCountry,
        });

        if (bookedIds) {
          setBookedArtistIds(new Set<string>(bookedIds as string[]));
        }
      }

      setLoading(false);
    };

    fetchArtistsData();
  }, [decodedCountry, urlDate]);

  const counties = useMemo(() => {
    const uniqueCounties = [...new Set(artists.map(a => a.county).filter(Boolean))];
    return uniqueCounties.sort();
  }, [artists]);

  const filteredArtists = useMemo(() => {
    let result = [...artists];

    // Search filter - only by artist name
    if (searchTerm) {
      result = result.filter(artist =>
        artist.stage_name?.toLowerCase().includes(searchTerm.toLowerCase())
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


    // If date filter is active, sort available artists first
    if (urlDate) {
      result.sort((a, b) => {
        const aBooked = bookedArtistIds.has(a.id) ? 1 : 0;
        const bBooked = bookedArtistIds.has(b.id) ? 1 : 0;
        if (aBooked !== bBooked) return aBooked - bBooked;
        return a.stage_name.localeCompare(b.stage_name);
      });
    }

    // Sorting (overrides date sorting if explicitly set)
    if (sortOrder === "a-z") {
      result.sort((a, b) => a.stage_name.localeCompare(b.stage_name));
    } else if (sortOrder === "z-a") {
      result.sort((a, b) => b.stage_name.localeCompare(a.stage_name));
    }

    return result;
  }, [artists, searchTerm, filterCategory, filterCounty, sortOrder, urlDate, bookedArtistIds]);
  // A batch at a time; the next one appears near the bottom
  const { visible, hasMore, sentinelRef } = useInfiniteList(filteredArtists, 20, `${searchTerm}|${filterCategory}|${filterCounty}|${sortOrder}|${urlDate}`);

  const filterProps = { filterCategory, setFilterCategory, filterCounty, setFilterCounty, sortOrder, setSortOrder, counties };

  return (
    <div className={`min-h-screen bg-black ${currentUserId ? 'md:ml-[316px] md:py-2 md:pr-2 lg:ml-[356px]' : 'md:flex md:items-start md:gap-2 md:px-2 md:pb-2 md:pt-[72px]'}`}>
      <SEO title={`${country} — Book Musical Artists | Muzicalist`} description={`Discover singers, bands, DJs and instrumentalists in ${country}. Compare profiles and book the perfect artist for your event on Muzicalist.`} path={`/countries/${encodeURIComponent(country ?? "")}`} />
      {/* Phone: the count sits next to the name in the top bar, e.g. "România (124)" */}
      <Navigation mobileTitle={`${displayName}${loading ? "" : ` (${filteredArtists.length})`}`} mobileBackPath="/countries" mobileExtraAction={<FilterButton placement="header" mobileInHeader {...filterProps} />} hideMobileNotifications />

      {!currentUserId && <GuestSidebar />}
      <div className="min-h-screen min-w-0 flex-1 overflow-hidden bg-background pb-6 pt-14 md:min-h-[calc(100vh-80px)] md:rounded-lg md:pb-16 md:pt-0">
      {/* Big title on the left, as on the category pages */}
      <header
        className="hidden px-8 pb-6 pt-16 md:block lg:pt-20"
        style={{ background: "linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%), rgb(83,83,83)" }}
      >
        <h1 className="flex items-center gap-4 font-figtree text-6xl font-black tracking-[-0.04em] text-white lg:text-8xl">
          <span>{displayName}</span>
          {!loading && (
            <span className="align-baseline text-[0.5em] font-bold tracking-[-0.02em] text-white/70 tabular-nums notranslate" translate="no">
              ({filteredArtists.length})
            </span>
          )}
        </h1>
      </header>
      <div className="px-4 pt-4 md:px-8 md:pt-6" style={{ background: "linear-gradient(rgba(83,83,83,0.25) 0px, transparent 240px)" }}>
        <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center">
          <div className="relative md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by artist name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-full border-0 bg-foreground/[0.07] pl-10 pr-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 md:text-sm"
            />
          </div>
          <FilterChips {...filterProps} />
        </div>

        {urlDate && (
          <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20 text-center">
            <p className="text-sm text-muted-foreground">
              Showing availability for <span className="font-semibold text-foreground">{new Date(urlDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {loading ? null : filteredArtists.length > 0 ? (
            <div className="-mx-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:-mx-3">
              {visible.map(artist => (
                <ArtistProfileCard
                  key={artist.id}
                  id={artist.id}
                  stageName={artist.stage_name}
                  imageUrl={artist.avatar_url}
                  plan={artist.plan}
                  availabilityStatus={urlDate ? (bookedArtistIds.has(artist.id) ? "booked" : "available") : null}
                  searchDate={urlDate}
                />
              ))}
              {hasMore && <div ref={sentinelRef} className="col-span-full h-px" aria-hidden="true" />}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-base md:text-lg">
                {searchTerm || filterCategory !== "all" || filterCounty !== "all"
                   ? "No artists found matching your filters" 
                   : `No artists registered from ${displayName} yet`
                }
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default CountryArtists;
