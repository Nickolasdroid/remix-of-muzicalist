import Navigation from "@/components/Navigation";
import { recordCategoryInterest } from "@/lib/visitorTaste";
import SEO from "@/components/SEO";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HeaderFilterTrigger from "@/components/HeaderFilterTrigger";
import { SlidersHorizontal } from "lucide-react";
import ArtistProfileCard from "@/components/ArtistProfileCard";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import GuestSidebar from "@/components/GuestSidebar";
import { CATEGORY_TILES } from "@/components/CategoryTile";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
import { getCountryName, getCountryNameVariants } from "@/lib/countryFlags";
import { sortByPlanPriority } from "@/lib/planLimits";
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
  [props.filterCountry, props.filterCounty].filter((v) => v && v !== "all").length;

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

  // Desktop uses the chip row instead
  return null;
};

/** Desktop: the filters as grey chips in a row (a chosen value turns the chip lighter). */
const CHIP = "h-8 w-auto gap-1.5 rounded-full border-0 px-3.5 text-sm font-medium text-foreground focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-white/60 [&>svg]:opacity-70";
const chipTone = (active: boolean) => (active ? "bg-foreground/[0.24]" : "bg-foreground/[0.07] hover:bg-foreground/[0.12]");

const FilterChips = (props: FilterButtonProps) => (
  <div className="hidden flex-wrap items-center gap-2 md:flex">
    {props.countries.length > 1 && (
      <Select value={props.filterCountry} onValueChange={(v) => { props.setFilterCountry(v); props.setFilterCounty("all"); }}>
        <SelectTrigger className={`${CHIP} ${chipTone(props.filterCountry !== "all")}`} aria-label="Country">
          <SelectValue placeholder="All Countries" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Countries</SelectItem>
          {props.countries.map((c) => (
            <SelectItem key={c} value={c}>{getCountryName(c)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
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
        onClick={() => { props.setFilterCountry("all"); props.setFilterCounty("all"); props.setSortOrder("none"); }}
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
  country: string | null;
  county: string;
  
  plan: string;
  availabilityStatus?: "available" | "booked" | null;
}

const CategoryArtists = () => {
  const { category } = useParams<{ category: string }>();
  const { t } = useTranslation();
  const tile = CATEGORY_TILES.find((c) => c.path === `/categories/${category}`);
  const categoryLabel = tile ? t(`platformStats.${tile.statKey}`) : category ?? "";
  // Remember the category for "Recommended artists" on the home page
  useEffect(() => {
    const spec = ({ Singers: "Singer", Instrumentalists: "Instrumentalist", DJs: "DJ", Bands: "Band" } as Record<string, string>)[category ?? ""];
    if (spec) recordCategoryInterest(spec);
  }, [category]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterCounty, setFilterCounty] = useState<string>("all");
  
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
        .select('id, stage_name, avatar_url, country, county, plan')
        .eq('specialization', specialization as "Singer" | "Instrumentalist" | "DJ" | "Band")
        .in('id', artistIds);

      if (userCountry !== '__all__') {
        const variants = getCountryNameVariants(userCountry);
        query = query.in('country', variants);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching artists:', error);
      } else {
        let artistsWithAvailability: Artist[] = (data || []).map(a => ({ ...a, country: a.country ?? null }));
        
        // If a date is specified, check availability
        if (urlDate && artistsWithAvailability.length > 0) {
          const { data: bookedIds } = await (supabase as any).rpc('get_booked_profile_ids', {
            _event_date: urlDate,
            _profile_ids: artistsWithAvailability.map(a => a.id),
          });

          const bookedArtistIds = new Set<string>((bookedIds as string[] | null) || []);
          
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
        
        // Sort by plan priority (Premium > Standard > Free)
        artistsWithAvailability.sort((a, b) => sortByPlanPriority(a, b));
        setArtists(artistsWithAvailability);
        // Dedupe countries by their normalized display name (e.g. "România" and "Romania" -> one entry)
        const countryMap = new Map<string, string>();
        for (const a of artistsWithAvailability) {
          if (!a.country) continue;
          const displayName = getCountryName(a.country);
          if (!countryMap.has(displayName)) {
            countryMap.set(displayName, a.country);
          }
        }
        const countries = [...countryMap.values()].sort((x, y) => getCountryName(x).localeCompare(getCountryName(y)));
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
    const variants = new Set(getCountryNameVariants(filterCountry));
    const countiesForCountry = [...new Set(
      artists.filter(a => a.country && variants.has(a.country)).map(a => a.county)
    )].sort();
    return countiesForCountry;
  }, [artists, filterCountry, availableCounties]);

  const filteredArtists = useMemo(() => {
    let result = [...artists];

    if (filterCountry !== "all") {
      const variants = new Set(getCountryNameVariants(filterCountry));
      result = result.filter(artist => artist.country && variants.has(artist.country));
    }

    if (filterCounty !== "all") {
      result = result.filter(artist => artist.county === filterCounty);
    }


    if (sortOrder === "a-z") {
      result.sort((a, b) => a.stage_name.localeCompare(b.stage_name));
    } else if (sortOrder === "z-a") {
      result.sort((a, b) => b.stage_name.localeCompare(a.stage_name));
    }

    return result;
  }, [artists, filterCountry, filterCounty, sortOrder]);
  // A batch at a time; the next one appears near the bottom
  const { visible, hasMore, sentinelRef } = useInfiniteList(filteredArtists, 20, `${category}|${filterCountry}|${filterCounty}|${sortOrder}`);

  const filterProps = { filterCountry, setFilterCountry, filterCounty, setFilterCounty, sortOrder, setSortOrder, countries: availableCountries, counties: filteredCounties };

  return (
    <div className={`min-h-screen bg-black ${currentUserId ? 'md:ml-[316px] md:py-2 md:pr-2 lg:ml-[356px]' : 'md:flex md:items-start md:gap-2 md:px-2 md:pb-2 md:pt-[72px]'}`}>
      <SEO
        title={`${category} — Book ${category} for Your Event | Muzicalist`}
        description={`Browse and book the best ${category?.toLowerCase()} on Muzicalist. Compare profiles, reviews, prices and availability, then send a booking request in minutes.`}
        path={`/categories/${encodeURIComponent(category ?? "")}`}
      />
      {/* Phone: the count sits next to the name in the top bar, e.g. "Soliști (186)" */}
      <Navigation mobileTitle={`${categoryLabel}${loading ? "" : ` (${filteredArtists.length})`}`} mobileBackPath={currentUserId ? "/categories" : "/"} mobileExtraAction={currentUserId ? <FilterButton placement="header" mobileInHeader {...filterProps} /> : undefined} hideMobileNotifications />
      
      {!currentUserId && <GuestSidebar />}
      <div className="min-h-screen min-w-0 flex-1 overflow-hidden bg-background pb-6 pt-14 md:min-h-[calc(100vh-80px)] md:rounded-lg md:pb-16 md:pt-0">
      {/* Header in the category's colour (as on its tile), big title on the left */}
      <header
        className="hidden px-8 pb-6 pt-16 md:block lg:pt-20"
        style={{ background: `linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%), ${tile?.color ?? "rgb(83,83,83)"}` }}
      >
        <h1 className="font-figtree text-6xl font-black tracking-[-0.04em] text-white lg:text-8xl">
          {categoryLabel}
          {/* How many, on the same line, lighter so the name stays the main thing */}
          {!loading && (
            <span className="ml-3 align-baseline text-[0.5em] font-bold tracking-[-0.02em] text-white/70 tabular-nums notranslate lg:ml-4" translate="no">
              ({filteredArtists.length})
            </span>
          )}
        </h1>
      </header>
      <div
        className="px-4 pt-4 md:px-8 md:pt-6"
        style={{ background: `linear-gradient(${tile ? tile.color + "40" : "transparent"} 0px, transparent 240px)` }}
      >
        <div className="mb-4 md:mb-6">
          <FilterChips {...filterProps} />
          {/* Phone, guests: the filter button (signed-in users have it in the top bar) */}
          {!currentUserId && (
            <div className="flex justify-end md:hidden">
              <FilterButton placement="page" mobileInHeader={false} {...filterProps} />
            </div>
          )}
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
          <div className="-mx-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:-mx-3">
            {filteredArtists.length > 0 ? (
              visible.map((artist) => (
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
        {!loading && hasMore && <div ref={sentinelRef} className="h-px" aria-hidden="true" />}
      </div>
      </div>
    </div>
  );
};

export default CategoryArtists;
