import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Search, Globe, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCountryFlag } from "@/lib/countryFlags";

const Countries = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountriesAndUser = async () => {
      setLoading(true);
      
      // Fetch distinct countries from profiles
      const { data: profileCountries } = await supabase
        .from('profiles')
        .select('country')
        .not('country', 'is', null);

      if (profileCountries) {
        const uniqueCountries = [...new Set(profileCountries.map(p => p.country).filter(Boolean))] as string[];
        setCountries(uniqueCountries.sort());
      }

      // Get current user's country
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile?.country) {
          setUserCountry(profile.country);
        }
      }

      setLoading(false);
    };

    fetchCountriesAndUser();
  }, []);

  const filteredCountries = countries.filter(country => 
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 md:pt-32 pb-24 md:pb-20">
        <div className="text-center mb-8 md:mb-16">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 md:mb-6">Countries</h1>
          
          {/* User's current country indicator */}
          {userCountry && (
            <div className="mb-6 flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-accent" />
              <span>Your country: <span className="font-medium text-foreground">{userCountry} {getCountryFlag(userCountry)}</span></span>
            </div>
          )}

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredCountries.map(country => (
                <Link key={country} to={`/countries/${encodeURIComponent(country)}`}>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 md:py-6 w-full flex items-center justify-start gap-2 md:gap-3 hover:bg-accent/10 hover:border-accent transition-all group"
                  >
                    <span className="text-lg md:text-xl">{getCountryFlag(country)}</span>
                    <span className="text-sm md:text-lg font-medium truncate">{country}</span>
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
