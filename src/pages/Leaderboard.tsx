import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Trophy, ChevronDown, Search, Mic, Guitar, Headphones, Users, User, Star, Loader2, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
import CountryPickerButton from "@/components/CountryPickerButton";
import { getCountryNameVariants } from "@/lib/countryFlags";

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

  // Show loading while checking auth
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen md:ml-64 bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return <div className="min-h-screen md:ml-64 bg-gradient-to-br from-background to-secondary relative">
      <Navigation />
      
      <div className="relative z-10 pt-16 md:pt-8 pb-24 md:pb-20 px-0">
        <div className="px-4 md:container md:mx-auto">
          <div className="text-center mb-8 md:mb-12 py-0">
            <h1 className="hidden md:flex items-center justify-center gap-3 text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4 text-foreground">
              Leaderboard
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-accent shadow-[var(--shadow-gold)]">
                <Trophy className="h-6 w-6 md:h-8 md:w-8 text-accent-foreground" />
              </div>
            </h1>
            

            <div className="sm:flex-row gap-3 md:gap-4 justify-center mt-6 md:mt-8 items-center flex flex-row">
              <CountryPickerButton
                selectedCountry={selectedCountry}
                onCountryChange={(country) => {
                  setSelectedCountry(country);
                  setSelectedCounty("All Regions");
                }}
              />
              {isMobile ? (
                <Drawer open={regionDrawerOpen} onOpenChange={setRegionDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="w-auto min-w-[180px] justify-between">
                      {selectedCounty}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="px-4 pb-6">
                    <DrawerHeader className="text-left px-0">
                      <DrawerTitle>Select Region</DrawerTitle>
                      <p className="text-sm text-muted-foreground">Choose a region to filter by</p>
                    </DrawerHeader>
                    <ScrollArea className="h-72">
                      <div className="space-y-0.5">
                        {["All Regions", ...getAvailableCounties()].map(county => (
                          <button
                            key={county}
                            type="button"
                            onClick={() => { setSelectedCounty(county); setRegionDrawerOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-base rounded-md transition-colors hover:bg-accent/10 ${
                              selectedCounty === county ? "bg-accent/20 text-accent" : "text-foreground"
                            }`}
                          >
                            <MapPin className="h-5 w-5" />
                            <span className="flex-1 text-left font-medium">{county}</span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </DrawerContent>
                </Drawer>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-auto min-w-[180px] justify-between">
                      {selectedCounty}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="min-w-[180px] max-h-[300px] overflow-y-auto bg-card border-border">
                    {["All Regions", ...getAvailableCounties()].map(county => (
                      <DropdownMenuItem key={county} onClick={() => setSelectedCounty(county)} className="cursor-pointer">
                        {county}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="-mx-4 md:mx-0 md:max-w-3xl md:mx-auto md:rounded-xl md:border border-border md:overflow-hidden">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-4 p-0 h-auto rounded-none bg-transparent border-t border-b border-border">
              <TabsTrigger value="singers" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-3 md:py-4 text-xs md:text-base rounded-none border-r border-border bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:shadow-none transition-all duration-300">
                  <Mic className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden md:inline">Singers</span>
                </TabsTrigger>
                <TabsTrigger value="instrumentalists" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-3 md:py-4 text-xs md:text-base rounded-none border-r border-border bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:shadow-none transition-all duration-300">
                  <Guitar className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden md:inline">Instrumentalists</span>
                </TabsTrigger>
                <TabsTrigger value="djs" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-3 md:py-4 text-xs md:text-base rounded-none border-r border-border bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:shadow-none transition-all duration-300">
                  <Headphones className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden md:inline">DJs</span>
                </TabsTrigger>
                <TabsTrigger value="bands" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-3 md:py-4 text-xs md:text-base rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:shadow-none transition-all duration-300">
                  <Users className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden md:inline">Bands</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {loading ? <div className="text-center py-16">
                <p className="text-lg md:text-xl text-muted-foreground">Loading artists...</p>
              </div> : currentArtists.length > 0 ? <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow className="bg-transparent border-b border-border hover:bg-transparent">
                      <TableHead className="w-10 md:w-16 text-center font-semibold text-foreground px-2 md:px-4">Rank</TableHead>
                      <TableHead className="text-center font-semibold text-foreground px-2 md:px-4">Profile</TableHead>
                      <TableHead className="w-12 md:w-24 text-center font-semibold text-foreground px-1 md:px-4 text-xs md:text-sm">Reviews</TableHead>
                      <TableHead className="w-12 md:w-20 text-center font-semibold text-foreground px-1 md:px-4"><Star className="h-4 w-4 mx-auto text-accent fill-accent" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentArtists.map((artist, index) => <TableRow key={artist.id} className="border-b border-border/50 hover:bg-accent/10 transition-colors">
                        <TableCell className="text-center font-bold text-base md:text-lg text-foreground px-2 md:px-4">{index + 1}</TableCell>
                        <TableCell className="px-2 md:px-4">
                          <Link to={`/artist/${artist.id}`} className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity">
                            <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(artist.plan)} flex-shrink-0`}>
                              <Avatar className="h-9 w-9 md:h-11 md:w-11 border-2 border-background">
                                <AvatarImage src={artist.avatar_url || undefined} alt={artist.stage_name} />
                                <AvatarFallback className="bg-muted">
                                  <User className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <span className="font-medium text-foreground hover:text-accent transition-colors text-base md:text-lg truncate">{artist.stage_name}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground text-sm md:text-base px-1 md:px-4">{artistReviewCounts[artist.id] || 0}</TableCell>
                        <TableCell className="text-center font-semibold text-accent text-sm md:text-base px-1 md:px-4">{(artistRatings[artist.id] || 0).toFixed(1)}</TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table> : <div className="text-center py-16">
                <p className="text-lg md:text-xl text-muted-foreground">No artists found in this category</p>
              </div>}
          </div>
        </div>
      </div>
    </div>;
};
export default Leaderboard;