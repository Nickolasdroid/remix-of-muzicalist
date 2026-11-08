import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Trophy, ChevronDown, Search, Mic, Guitar, Headphones, User, Star, Loader2, MapPin, Crown } from "lucide-react";
import BandIcon from "@/components/icons/BandIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";
import PlanBadge from "@/components/PlanBadge";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
import CountryPickerButton from "@/components/CountryPickerButton";
import { getCountryNameVariants, getCountryFlag } from "@/lib/countryFlags";
import ArtistCardStatusBadge from "@/components/ArtistCardStatusBadge";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { getThumbUrl } from "@/lib/imageUrl";
import { translateSpecialization } from "@/lib/specializationLabel";

const allCountries = [{
  name: "Afghanistan",
  code: "AF"
}, {
  name: "Albania",
  code: "AL"
}, {
  name: "Algeria",
  code: "DZ"
}, {
  name: "Andorra",
  code: "AD"
}, {
  name: "Angola",
  code: "AO"
}, {
  name: "Antigua and Barbuda",
  code: "AG"
}, {
  name: "Argentina",
  code: "AR"
}, {
  name: "Armenia",
  code: "AM"
}, {
  name: "Australia",
  code: "AU"
}, {
  name: "Austria",
  code: "AT"
}, {
  name: "Azerbaijan",
  code: "AZ"
}, {
  name: "Bahamas",
  code: "BS"
}, {
  name: "Bahrain",
  code: "BH"
}, {
  name: "Bangladesh",
  code: "BD"
}, {
  name: "Barbados",
  code: "BB"
}, {
  name: "Belarus",
  code: "BY"
}, {
  name: "Belgium",
  code: "BE"
}, {
  name: "Belize",
  code: "BZ"
}, {
  name: "Benin",
  code: "BJ"
}, {
  name: "Bhutan",
  code: "BT"
}, {
  name: "Bolivia",
  code: "BO"
}, {
  name: "Bosnia and Herzegovina",
  code: "BA"
}, {
  name: "Botswana",
  code: "BW"
}, {
  name: "Brazil",
  code: "BR"
}, {
  name: "Brunei",
  code: "BN"
}, {
  name: "Bulgaria",
  code: "BG"
}, {
  name: "Burkina Faso",
  code: "BF"
}, {
  name: "Burundi",
  code: "BI"
}, {
  name: "Cabo Verde",
  code: "CV"
}, {
  name: "Cambodia",
  code: "KH"
}, {
  name: "Cameroon",
  code: "CM"
}, {
  name: "Canada",
  code: "CA"
}, {
  name: "Central African Republic",
  code: "CF"
}, {
  name: "Chad",
  code: "TD"
}, {
  name: "Chile",
  code: "CL"
}, {
  name: "China",
  code: "CN"
}, {
  name: "Colombia",
  code: "CO"
}, {
  name: "Comoros",
  code: "KM"
}, {
  name: "Congo",
  code: "CG"
}, {
  name: "Costa Rica",
  code: "CR"
}, {
  name: "Croatia",
  code: "HR"
}, {
  name: "Cuba",
  code: "CU"
}, {
  name: "Cyprus",
  code: "CY"
}, {
  name: "Czech Republic",
  code: "CZ"
}, {
  name: "Denmark",
  code: "DK"
}, {
  name: "Djibouti",
  code: "DJ"
}, {
  name: "Dominica",
  code: "DM"
}, {
  name: "Dominican Republic",
  code: "DO"
}, {
  name: "Ecuador",
  code: "EC"
}, {
  name: "Egypt",
  code: "EG"
}, {
  name: "El Salvador",
  code: "SV"
}, {
  name: "Equatorial Guinea",
  code: "GQ"
}, {
  name: "Eritrea",
  code: "ER"
}, {
  name: "Estonia",
  code: "EE"
}, {
  name: "Eswatini",
  code: "SZ"
}, {
  name: "Ethiopia",
  code: "ET"
}, {
  name: "Fiji",
  code: "FJ"
}, {
  name: "Finland",
  code: "FI"
}, {
  name: "France",
  code: "FR"
}, {
  name: "Gabon",
  code: "GA"
}, {
  name: "Gambia",
  code: "GM"
}, {
  name: "Georgia",
  code: "GE"
}, {
  name: "Germany",
  code: "DE"
}, {
  name: "Ghana",
  code: "GH"
}, {
  name: "Greece",
  code: "GR"
}, {
  name: "Grenada",
  code: "GD"
}, {
  name: "Guatemala",
  code: "GT"
}, {
  name: "Guinea",
  code: "GN"
}, {
  name: "Guinea-Bissau",
  code: "GW"
}, {
  name: "Guyana",
  code: "GY"
}, {
  name: "Haiti",
  code: "HT"
}, {
  name: "Honduras",
  code: "HN"
}, {
  name: "Hungary",
  code: "HU"
}, {
  name: "Iceland",
  code: "IS"
}, {
  name: "India",
  code: "IN"
}, {
  name: "Indonesia",
  code: "ID"
}, {
  name: "Iran",
  code: "IR"
}, {
  name: "Iraq",
  code: "IQ"
}, {
  name: "Ireland",
  code: "IE"
}, {
  name: "Israel",
  code: "IL"
}, {
  name: "Italy",
  code: "IT"
}, {
  name: "Ivory Coast",
  code: "CI"
}, {
  name: "Jamaica",
  code: "JM"
}, {
  name: "Japan",
  code: "JP"
}, {
  name: "Jordan",
  code: "JO"
}, {
  name: "Kazakhstan",
  code: "KZ"
}, {
  name: "Kenya",
  code: "KE"
}, {
  name: "Kiribati",
  code: "KI"
}, {
  name: "Kosovo",
  code: "XK"
}, {
  name: "Kuwait",
  code: "KW"
}, {
  name: "Kyrgyzstan",
  code: "KG"
}, {
  name: "Laos",
  code: "LA"
}, {
  name: "Latvia",
  code: "LV"
}, {
  name: "Lebanon",
  code: "LB"
}, {
  name: "Lesotho",
  code: "LS"
}, {
  name: "Liberia",
  code: "LR"
}, {
  name: "Libya",
  code: "LY"
}, {
  name: "Liechtenstein",
  code: "LI"
}, {
  name: "Lithuania",
  code: "LT"
}, {
  name: "Luxembourg",
  code: "LU"
}, {
  name: "Madagascar",
  code: "MG"
}, {
  name: "Malawi",
  code: "MW"
}, {
  name: "Malaysia",
  code: "MY"
}, {
  name: "Maldives",
  code: "MV"
}, {
  name: "Mali",
  code: "ML"
}, {
  name: "Malta",
  code: "MT"
}, {
  name: "Marshall Islands",
  code: "MH"
}, {
  name: "Mauritania",
  code: "MR"
}, {
  name: "Mauritius",
  code: "MU"
}, {
  name: "Mexico",
  code: "MX"
}, {
  name: "Micronesia",
  code: "FM"
}, {
  name: "Moldova",
  code: "MD"
}, {
  name: "Monaco",
  code: "MC"
}, {
  name: "Mongolia",
  code: "MN"
}, {
  name: "Montenegro",
  code: "ME"
}, {
  name: "Morocco",
  code: "MA"
}, {
  name: "Mozambique",
  code: "MZ"
}, {
  name: "Myanmar",
  code: "MM"
}, {
  name: "Namibia",
  code: "NA"
}, {
  name: "Nauru",
  code: "NR"
}, {
  name: "Nepal",
  code: "NP"
}, {
  name: "Netherlands",
  code: "NL"
}, {
  name: "New Zealand",
  code: "NZ"
}, {
  name: "Nicaragua",
  code: "NI"
}, {
  name: "Niger",
  code: "NE"
}, {
  name: "Nigeria",
  code: "NG"
}, {
  name: "North Korea",
  code: "KP"
}, {
  name: "North Macedonia",
  code: "MK"
}, {
  name: "Norway",
  code: "NO"
}, {
  name: "Oman",
  code: "OM"
}, {
  name: "Pakistan",
  code: "PK"
}, {
  name: "Palau",
  code: "PW"
}, {
  name: "Palestine",
  code: "PS"
}, {
  name: "Panama",
  code: "PA"
}, {
  name: "Papua New Guinea",
  code: "PG"
}, {
  name: "Paraguay",
  code: "PY"
}, {
  name: "Peru",
  code: "PE"
}, {
  name: "Philippines",
  code: "PH"
}, {
  name: "Poland",
  code: "PL"
}, {
  name: "Portugal",
  code: "PT"
}, {
  name: "Qatar",
  code: "QA"
}, {
  name: "Romania",
  code: "RO"
}, {
  name: "Russia",
  code: "RU"
}, {
  name: "Rwanda",
  code: "RW"
}, {
  name: "Saint Kitts and Nevis",
  code: "KN"
}, {
  name: "Saint Lucia",
  code: "LC"
}, {
  name: "Saint Vincent and the Grenadines",
  code: "VC"
}, {
  name: "Samoa",
  code: "WS"
}, {
  name: "San Marino",
  code: "SM"
}, {
  name: "Sao Tome and Principe",
  code: "ST"
}, {
  name: "Saudi Arabia",
  code: "SA"
}, {
  name: "Senegal",
  code: "SN"
}, {
  name: "Serbia",
  code: "RS"
}, {
  name: "Seychelles",
  code: "SC"
}, {
  name: "Sierra Leone",
  code: "SL"
}, {
  name: "Singapore",
  code: "SG"
}, {
  name: "Slovakia",
  code: "SK"
}, {
  name: "Slovenia",
  code: "SI"
}, {
  name: "Solomon Islands",
  code: "SB"
}, {
  name: "Somalia",
  code: "SO"
}, {
  name: "South Africa",
  code: "ZA"
}, {
  name: "South Korea",
  code: "KR"
}, {
  name: "South Sudan",
  code: "SS"
}, {
  name: "Spain",
  code: "ES"
}, {
  name: "Sri Lanka",
  code: "LK"
}, {
  name: "Sudan",
  code: "SD"
}, {
  name: "Suriname",
  code: "SR"
}, {
  name: "Sweden",
  code: "SE"
}, {
  name: "Switzerland",
  code: "CH"
}, {
  name: "Syria",
  code: "SY"
}, {
  name: "Taiwan",
  code: "TW"
}, {
  name: "Tajikistan",
  code: "TJ"
}, {
  name: "Tanzania",
  code: "TZ"
}, {
  name: "Thailand",
  code: "TH"
}, {
  name: "Timor-Leste",
  code: "TL"
}, {
  name: "Togo",
  code: "TG"
}, {
  name: "Tonga",
  code: "TO"
}, {
  name: "Trinidad and Tobago",
  code: "TT"
}, {
  name: "Tunisia",
  code: "TN"
}, {
  name: "Turkey",
  code: "TR"
}, {
  name: "Turkmenistan",
  code: "TM"
}, {
  name: "Tuvalu",
  code: "TV"
}, {
  name: "Uganda",
  code: "UG"
}, {
  name: "Ukraine",
  code: "UA"
}, {
  name: "United Arab Emirates",
  code: "AE"
}, {
  name: "United Kingdom",
  code: "GB"
}, {
  name: "United States",
  code: "US"
}, {
  name: "Uruguay",
  code: "UY"
}, {
  name: "Uzbekistan",
  code: "UZ"
}, {
  name: "Vanuatu",
  code: "VU"
}, {
  name: "Vatican City",
  code: "VA"
}, {
  name: "Venezuela",
  code: "VE"
}, {
  name: "Vietnam",
  code: "VN"
}, {
  name: "Yemen",
  code: "YE"
}, {
  name: "Zambia",
  code: "ZM"
}, {
  name: "Zimbabwe",
  code: "ZW"
}];
interface Artist {
  id: string;
  stage_name: string;
  specialization: string | null;
  county: string;
  country: string | null;
  plan: string;
  avatar_url: string | null;
  number_of_events: number;
}
interface ArtistRating {
  [key: string]: number;
}
interface ArtistReviewCount {
  [key: string]: number;
}

/** Empty state per category: the leaderboard only lists artists with at least one review. */
const EMPTY_COPY: Record<string, { title: string; cta: string; path: string }> = {
  singers: { title: "No reviewed singers yet", cta: "See all singers", path: "Singers" },
  instrumentalists: { title: "No reviewed instrumentalists yet", cta: "See all instrumentalists", path: "Instrumentalists" },
  djs: { title: "No reviewed DJs yet", cta: "See all DJs", path: "DJs" },
  bands: { title: "No reviewed bands yet", cta: "See all bands", path: "Bands" },
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedCounty, setSelectedCounty] = useState<string>("All Regions");
  const [selectedCategory, setSelectedCategory] = useState<string>("singers");
  const [regionDrawerOpen, setRegionDrawerOpen] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistRatings, setArtistRatings] = useState<ArtistRating>({});
  const [artistReviewCounts, setArtistReviewCounts] = useState<ArtistReviewCount>({});
  const [loading, setLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Check authentication and get user's country
  useEffect(() => {
    const checkAuthAndGetCountry = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Get user's country from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .maybeSingle();
      
      const country = profile?.country || null;
      setUserCountry(country);
      setSelectedCountry(country);
      setIsAuthChecked(true);
    };
    checkAuthAndGetCountry();
  }, [navigate]);

  // Get unique counties from artists in user's country
  const getAvailableCounties = () => {
    const counties = [...new Set(artists.map(artist => artist.county))].sort();
    return counties;
  };

  useEffect(() => {
    if (!isAuthChecked || !selectedCountry) return;
    
    const fetchArtistsData = async () => {
      // Get artist IDs first to filter out regular users
      const artistIds = await fetchArtistIds();
      if (artistIds.length === 0) {
        setArtists([]);
        setLoading(false);
        return;
      }

      const countryVariants = getCountryNameVariants(selectedCountry);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, stage_name, specialization, county, country, plan, avatar_url, number_of_events')
        .in('country', countryVariants)
        .in('id', artistIds)
        .order('number_of_events', { ascending: false });
      
      if (error) {
        console.error('Error fetching artists:', error);
      } else {
        setArtists(data || []);
      }
      setLoading(false);
    };
    fetchArtistsData();
  }, [isAuthChecked, selectedCountry]);

  // Fetch reviews and calculate average ratings for all artists
  useEffect(() => {
    const fetchRatings = async () => {
      const {
        data: reviews,
        error
      } = await supabase.from('reviews').select('profile_id, rating');
      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      // Calculate average rating and count per artist
      const ratingsMap: {
        [key: string]: number[];
      } = {};
      reviews?.forEach(review => {
        if (!ratingsMap[review.profile_id]) {
          ratingsMap[review.profile_id] = [];
        }
        ratingsMap[review.profile_id].push(review.rating);
      });
      const averageRatings: ArtistRating = {};
      const reviewCounts: ArtistReviewCount = {};
      Object.entries(ratingsMap).forEach(([profileId, ratings]) => {
        averageRatings[profileId] = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        reviewCounts[profileId] = ratings.length;
      });
      setArtistRatings(averageRatings);
      setArtistReviewCounts(reviewCounts);
    };
    fetchRatings();
  }, []);

  const getArtistsBySpecialization = (specialization: string) => {
    let filtered = artists.filter(artist => artist.specialization?.toLowerCase() === specialization.toLowerCase());

    // Only include artists who have at least one review (rating > 0)
    filtered = filtered.filter(artist => artistRatings[artist.id] && artistRatings[artist.id] > 0);

    // Filter by county
    if (selectedCounty !== "All Regions") {
      filtered = filtered.filter(artist => artist.county === selectedCounty);
    }

    // Sort by number of reviews (descending), then by rating (descending)
    filtered.sort((a, b) => {
      const reviewsA = artistReviewCounts[a.id] || 0;
      const reviewsB = artistReviewCounts[b.id] || 0;
      
      // Primary sort: most reviews first
      if (reviewsB !== reviewsA) {
        return reviewsB - reviewsA;
      }
      
      // Secondary sort: highest rating first
      const ratingA = artistRatings[a.id] || 0;
      const ratingB = artistRatings[b.id] || 0;
      return ratingB - ratingA;
    });

    return filtered;
  };

  const categoryMap: { [key: string]: string } = {
    singers: 'Singer',
    instrumentalists: 'Instrumentalist',
    djs: 'DJ',
    bands: 'Band'
  };

  const currentArtists = getArtistsBySpecialization(categoryMap[selectedCategory]);

  // Progressive rendering of the complete ranking (data is already loaded in one query).
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedCategory, selectedCounty, selectedCountry]);
  const { loadMoreRef } = useInfiniteScroll(
    async () => setVisibleCount((c) => c + PAGE_SIZE),
    visibleCount < currentArtists.length,
  );

  // Show loading while checking auth
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen md:ml-64 bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const chipClass = (selected: boolean) =>
    `h-9 shrink-0 rounded-full px-4 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
      selected ? "bg-foreground/[0.24] font-medium" : "bg-foreground/[0.07] hover:bg-foreground/[0.12]"
    }`;
  const categoryChips = [
    { value: "singers", label: "Singers" },
    { value: "instrumentalists", label: "Instrumentalists" },
    { value: "djs", label: "DJs" },
    { value: "bands", label: "Bands" },
  ];
  const regionTrigger = (
    <button type="button" className={`${chipClass(selectedCounty !== "All Regions")} inline-flex items-center gap-1.5`}>
      <span className="truncate">{selectedCounty}</span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>
  );

  return <div className="min-h-screen md:ml-64 bg-background relative">
      <SEO title="Top Rated Artists — Leaderboard | Muzicalist" description="See the highest-rated musical artists on Muzicalist, ranked by client reviews and engagement. Find proven performers for your next event." path="/leaderboard" />
      <Navigation hideMobileNotifications />

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-10 pt-16 md:px-8 md:pb-20 md:pt-10">
        {/* Header, like a Spotify chart */}
        <h1 className="hidden text-4xl font-display font-bold tracking-[-0.03em] text-foreground md:block md:text-6xl">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground md:mt-3 md:text-base">Artists with the best reviews from their clients.</p>

        {/* Filters: artist type, then country and region */}
        <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:mt-8 md:px-0 [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Artist type">
          {categoryChips.map((c) => (
            <button key={c.value} type="button" role="tab" aria-selected={selectedCategory === c.value} onClick={() => setSelectedCategory(c.value)} className={chipClass(selectedCategory === c.value)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <CountryPickerButton
            selectedCountry={selectedCountry}
            onCountryChange={(country) => {
              setSelectedCountry(country);
              setSelectedCounty("All Regions");
            }}
            hideAllOption
          />
          {isMobile ? (
            <Drawer open={regionDrawerOpen} onOpenChange={setRegionDrawerOpen}>
              <DrawerTrigger asChild>{regionTrigger}</DrawerTrigger>
              <DrawerContent className="px-4 pb-6">
                <DrawerHeader className="text-left px-0">
                  <DrawerTitle>Select Region</DrawerTitle>
                </DrawerHeader>
                <ScrollArea className="h-72">
                  <div className="space-y-0.5">
                    {["All Regions", ...getAvailableCounties()].map(county => (
                      <button
                        key={county}
                        type="button"
                        onClick={() => { setSelectedCounty(county); setRegionDrawerOpen(false); }}
                        className={`w-full rounded-md px-4 py-3 text-left text-base transition-colors hover:bg-foreground/[0.07] ${selectedCounty === county ? "font-bold text-foreground" : "text-muted-foreground"}`}
                      >
                        {county}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </DrawerContent>
            </Drawer>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>{regionTrigger}</DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[200px] max-h-[300px] overflow-y-auto">
                {["All Regions", ...getAvailableCounties()].map(county => (
                  <DropdownMenuItem key={county} onClick={() => setSelectedCounty(county)} className={`cursor-pointer ${selectedCounty === county ? "font-bold" : ""}`}>
                    {county}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Ranking, like a chart's track list */}
        <div className="mt-8">
          {loading ? (
            <div className="space-y-2" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-md bg-foreground/[0.04]" />)}
            </div>
          ) : currentArtists.length > 0 ? (
            <>
              <div className="hidden grid-cols-[3rem_1fr_auto] gap-4 border-b border-border px-3 pb-2 text-sm text-muted-foreground md:grid">
                <span className="text-right">#</span>
                <span>Artist</span>
                <span>Reviews</span>
              </div>
              <ol className="mt-2">
                {currentArtists.slice(0, visibleCount).map((artist, index) => (
                  <li key={artist.id}>
                    <Link
                      to={`/artist/${artist.id}`}
                      className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-foreground/[0.07] focus-visible:bg-foreground/[0.07] focus-visible:outline-none md:grid-cols-[3rem_1fr_auto] md:gap-4 md:px-3"
                    >
                      <span className={`text-right font-display font-bold tabular-nums ${index < 3 ? "text-xl text-foreground md:text-2xl" : "text-base text-muted-foreground"}`}>{index + 1}</span>
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarImage src={artist.avatar_url ? getThumbUrl(artist.avatar_url, 96) : undefined} alt="" loading="lazy" />
                          <AvatarFallback className="bg-secondary"><User className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate text-base font-medium text-foreground notranslate" data-user-content="true" data-no-translate="true" translate="no">{artist.stage_name}</span>
                          <span className="block truncate text-sm text-muted-foreground">
                            <span>{translateSpecialization(artist.specialization)}</span>
                            {artist.county ? <><span>, </span><span className="notranslate" translate="no">{artist.county}</span></> : null}
                          </span>
                        </span>
                      </span>
                      <ArtistCardStatusBadge
                        rating={artistReviewCounts[artist.id] > 0 ? artistRatings[artist.id] ?? null : null}
                        reviewCount={artistReviewCounts[artist.id] || 0}
                      />
                    </Link>
                  </li>
                ))}
              </ol>
              {visibleCount < currentArtists.length && (
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          ) : (
            <p className="border-t border-border pt-6 text-base text-muted-foreground">
              <span>{EMPTY_COPY[selectedCategory]?.title ?? "No reviewed artists yet"}</span>
              <span>. </span>
              <Link
                to={`/categories/${EMPTY_COPY[selectedCategory]?.path ?? "Singers"}${selectedCountry ? `?country=${encodeURIComponent(selectedCountry)}` : ""}`}
                className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
              >
                {EMPTY_COPY[selectedCategory]?.cta ?? "See all artists"}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>;
};
export default Leaderboard;