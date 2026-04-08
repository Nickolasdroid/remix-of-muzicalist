import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCountryDisplay } from "@/lib/countryFlags";
import { fetchArtistIds } from "@/hooks/use-artist-ids";


interface CountryData {
  original: string;
  name: string;
  flag: string | null;
}

const Countries = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [userCountry, setUserCountry] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountriesAndUser = async () => {
      setLoading(true);
      
      // Get artist IDs first to filter out regular users
      const artistIds = await fetchArtistIds();
      
      if (artistIds.length === 0) {
        setCountries([]);
        setLoading(false);
        return;
      }

      // Fetch distinct countries from artist profiles only
      const { data: profileCountries } = await supabase
        .from('profiles')
        .select('country')
        .in('id', artistIds)
        .not('country', 'is', null);

      if (profileCountries) {
        const uniqueOriginals = [...new Set(profileCountries.map(p => p.country).filter(Boolean))] as string[];
        
        // Convert to display format with standardized names
        const countryData: CountryData[] = uniqueOriginals.map(original => {
          const display = getCountryDisplay(original);
          return {
            original,
            name: display.name,
            flag: display.flag,
          };
        });
        
        // Sort by standardized name
        countryData.sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryData);
      }

      // Get current user's country
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile?.country) {
          const display = getCountryDisplay(profile.country);
          setUserCountry({
            original: profile.country,
            name: display.name,
            flag: display.flag,
          });
        }
      }

      setLoading(false);
    };

    fetchCountriesAndUser();
  }, []);

  const filteredCountries = countries.filter(country => 
    country.name && country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-gradient-to-br from-background to-secondary relative`}>
      <Navigation />
      
      <div className={`relative z-10 container mx-auto px-4 pt-20 ${currentUserId ? 'md:pt-8' : 'md:pt-24'} pb-24 md:pb-20`}>
        <div className="text-center mb-8 md:mb-16">
          <h1 className="hidden md:block text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 md:mb-6">Countries</h1>
          
          {/* User's current country indicator */}
          {userCountry && (
            <div className="mb-6 flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-accent" />
              <span>Your country: <span className="font-medium text-foreground">{userCountry.flag} {userCountry.name}</span></span>
            </div>
          )}

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-accent z-10" />
            <Input 
              type="text" 
              placeholder="Search for a country..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-12 h-12 md:h-14 text-base md:text-lg bg-card/50 backdrop-blur border-accent/20" 
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading countries...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredCountries.map(country => (
                <Link key={country.original} to={`/countries/${encodeURIComponent(country.original)}`}>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 md:py-6 w-full flex items-center justify-start gap-3 md:gap-4 hover:bg-accent/10 hover:border-accent transition-all group px-4"
                  >
                    <span className="text-2xl md:text-3xl flex-shrink-0">{country.flag}</span>
                    <span className="text-sm md:text-base font-medium text-left">{country.name}</span>
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>

        {!loading && filteredCountries.length === 0 && (
          <div className="text-center mt-12">
            <p className="text-muted-foreground text-base md:text-lg">
              {searchTerm ? `No countries found matching "${searchTerm}"` : "No countries with registered artists yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Countries;
