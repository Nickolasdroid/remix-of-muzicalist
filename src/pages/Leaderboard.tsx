import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trophy, ChevronDown, Search, Mic, Guitar, Headphones, Users, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCounty, setSelectedCounty] = useState<string>("All Regions");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistRatings, setArtistRatings] = useState<ArtistRating>({});
  const [artistReviewCounts, setArtistReviewCounts] = useState<ArtistReviewCount>({});
  const [loading, setLoading] = useState(true);
  const [countrySearch, setCountrySearch] = useState<string>("");

  // Get countries with registered artists
  const getAvailableCountries = () => {
    const artistCountries = [...new Set(artists.map(artist => artist.country).filter(Boolean))];
    return allCountries.filter(country => artistCountries.some(ac => ac === country.code || ac === country.name || ac?.toLowerCase() === country.name.toLowerCase() ||
    // Handle diacritics variations (e.g., România vs Romania)
    ac?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === country.name.toLowerCase()));
  };
  const availableCountries = getAvailableCountries();
  const filteredCountries = availableCountries.filter(country => country.name.toLowerCase().includes(countrySearch.toLowerCase()));

  // Get unique counties from artists based on selected country
  const getAvailableCounties = () => {
    let filteredArtists = artists;
    if (selectedCountry) {
      const countryName = allCountries.find(c => c.code === selectedCountry)?.name;
      filteredArtists = artists.filter(artist => artist.country === selectedCountry || artist.country === countryName || artist.country?.toLowerCase() === countryName?.toLowerCase() || artist.country?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === countryName?.toLowerCase());
    }
    const counties = [...new Set(filteredArtists.map(artist => artist.county))].sort();
    return counties;
  };
  useEffect(() => {
    // Reset county when country changes
    setSelectedCounty("All Regions");
  }, [selectedCountry]);
  useEffect(() => {
    const fetchArtists = async () => {
      const {
        data,
        error
      } = await supabase.from('profiles').select('id, stage_name, specialization, county, country, plan, avatar_url, number_of_events').order('number_of_events', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching artists:', error);
      } else {
        setArtists(data || []);
      }
      setLoading(false);
    };
    fetchArtists();
  }, []);

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

    // Filter by country (handle both code, name, and diacritics)
    if (selectedCountry) {
      const countryName = allCountries.find(c => c.code === selectedCountry)?.name;
      filtered = filtered.filter(artist => artist.country === selectedCountry || artist.country === countryName || artist.country?.toLowerCase() === countryName?.toLowerCase() || artist.country?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === countryName?.toLowerCase());
    }

    // Filter by county
    if (selectedCounty !== "All Regions") {
      filtered = filtered.filter(artist => artist.county === selectedCounty);
    }
    return filtered;
  };
  const categories = {
    singers: getArtistsBySpecialization('Singer'),
    instrumentalists: getArtistsBySpecialization('Instrumentalist'),
    djs: getArtistsBySpecialization('DJ'),
    bands: getArtistsBySpecialization('Band')
  };
  return <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="pt-20 md:pt-32 pb-24 md:pb-20 px-0 py-[78px]">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-12 py-0">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent mb-4 md:mb-6 shadow-[var(--shadow-gold)]">
              <Trophy className="h-8 w-8 md:h-10 md:w-10 text-accent-foreground" />
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4 text-foreground">Leaderboard</h1>
            

            <div className="sm:flex-row gap-3 md:gap-4 justify-center mt-6 md:mt-8 items-center flex flex-row">
              <DropdownMenu onOpenChange={open => !open && setCountrySearch("")}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto min-w-[180px] justify-between">
                    {selectedCountry ? availableCountries.find(c => c.code === selectedCountry)?.name : "All Countries"}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="min-w-[220px] p-0 bg-card border-border">
                  <div className="p-2 border-b border-border" onKeyDown={e => e.stopPropagation()}>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search country..." value={countrySearch} onChange={e => setCountrySearch(e.target.value)} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} className="pl-8 h-8 bg-input" autoComplete="off" />
                    </div>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto">
                    <DropdownMenuItem onClick={() => {
                    setSelectedCountry("");
                    setCountrySearch("");
                  }} className="cursor-pointer font-medium">
                      All Countries
                    </DropdownMenuItem>
                    {filteredCountries.length > 0 ? filteredCountries.map(country => <DropdownMenuItem key={country.code} onClick={() => {
                    setSelectedCountry(country.code);
                    setCountrySearch("");
                  }} className="cursor-pointer">
                          {country.name}
                        </DropdownMenuItem>) : <div className="p-2 text-sm text-muted-foreground text-center">
                        No countries found
                      </div>}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto min-w-[180px] justify-between">
                    {selectedCounty}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="min-w-[180px] max-h-[300px] overflow-y-auto bg-card border-border">
                  {["All Regions", ...getAvailableCounties()].map(county => <DropdownMenuItem key={county} onClick={() => setSelectedCounty(county)} className="cursor-pointer">
                      {county}
                    </DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs defaultValue="singers" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-6 md:mb-12 p-1 rounded-none md:rounded-xl -mx-4 md:mx-auto w-[calc(100%+2rem)] md:w-full md:bg-card/50 md:border-2 md:border-accent/30">
              <TabsTrigger value="singers" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 text-xs md:text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground md:rounded-lg transition-all duration-300">
                <Mic className="h-4 w-4" />
                <span className="hidden md:inline">Singers</span>
              </TabsTrigger>
              <TabsTrigger value="instrumentalists" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 text-xs md:text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground md:rounded-lg transition-all duration-300">
                <Guitar className="h-4 w-4" />
                <span className="hidden md:inline">Instrumentalists</span>
              </TabsTrigger>
              <TabsTrigger value="djs" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 text-xs md:text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground md:rounded-lg transition-all duration-300">
                <Headphones className="h-4 w-4" />
                <span className="hidden md:inline">DJs</span>
              </TabsTrigger>
              <TabsTrigger value="bands" className="flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 text-xs md:text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground md:rounded-lg transition-all duration-300">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Bands</span>
              </TabsTrigger>
            </TabsList>

            {loading ? <div className="text-center py-16">
                <p className="text-lg md:text-xl text-muted-foreground">Loading artists...</p>
              </div> : Object.entries(categories).map(([key, categoryArtists]) => <TabsContent key={key} value={key} className="-mx-4 md:mx-0">
                  {categoryArtists.length > 0 ? <div className="md:max-w-3xl md:mx-auto md:rounded-xl md:border border-border">
                      <Table className="table-fixed w-full">
                        <TableHeader>
                          <TableRow className="bg-card/80 border-b border-border hover:bg-card/80">
                            <TableHead className="w-10 md:w-16 text-center font-semibold text-foreground px-2 md:px-4">Rank</TableHead>
                            <TableHead className="font-semibold text-foreground px-2 md:px-4">Profile</TableHead>
                            <TableHead className="w-12 md:w-24 text-center font-semibold text-foreground px-1 md:px-4 text-xs md:text-sm">Reviews</TableHead>
                            <TableHead className="w-12 md:w-20 text-center font-semibold text-foreground px-1 md:px-4">Rating</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryArtists.map((artist, index) => <TableRow key={artist.id} className="border-b border-border/50 hover:bg-accent/10 transition-colors">
                              <TableCell className="text-center font-bold text-base md:text-lg text-foreground px-2 md:px-4">{index + 1}</TableCell>
                              <TableCell className="px-2 md:px-4">
                                <Link to={`/artist/${artist.id}`} className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity">
                                  <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-accent/50 flex-shrink-0">
                                    <AvatarImage src={artist.avatar_url || undefined} alt={artist.stage_name} />
                                    <AvatarFallback className="bg-muted">
                                      <User className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-foreground hover:text-accent transition-colors text-sm md:text-base truncate">{artist.stage_name}</span>
                                </Link>
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground text-sm md:text-base px-1 md:px-4">{artistReviewCounts[artist.id] || 0}</TableCell>
                              <TableCell className="text-center font-semibold text-accent text-sm md:text-base px-1 md:px-4">{(artistRatings[artist.id] || 0).toFixed(1)}</TableCell>
                            </TableRow>)}
                        </TableBody>
                      </Table>
                    </div> : <div className="text-center py-16">
                      <p className="text-lg md:text-xl text-muted-foreground">No artists found in this category</p>
                    </div>}
                </TabsContent>)}
          </Tabs>
        </div>
      </div>
    </div>;
};
export default Leaderboard;