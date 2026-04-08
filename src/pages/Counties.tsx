import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CountryPickerButton from "@/components/CountryPickerButton";


const Counties = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [counties, setCounties] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Check auth and get user's country
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .maybeSingle();

      setSelectedCountry(profile?.country || null);
    };
    checkAuth();
  }, [navigate]);

  // Fetch counties when country changes
  const fetchCounties = useCallback(async () => {
    if (!selectedCountry) return;
    setIsLoading(true);

    let query = supabase
      .from('profiles')
      .select('county')
      .not('county', 'is', null)
      .not('specialization', 'is', null)
      .eq('country', selectedCountry);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching counties:', error);
      setIsLoading(false);
      return;
    }

    const uniqueCounties = [...new Set(data.map(p => p.county))].filter(Boolean).sort();
    setCounties(uniqueCounties);
    setIsLoading(false);
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry) {
      fetchCounties();
    }
  }, [selectedCountry, fetchCounties]);

  const filteredCounties = counties.filter(county => 
    county.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen md:ml-64 bg-gradient-to-br from-background to-secondary relative">
      <Navigation />
      
      <div className="relative z-10 container mx-auto px-4 pt-20 md:pt-8 pb-24 md:pb-20">
        <div className="text-center mb-8 md:mb-16">
          <h1 className="hidden md:block text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 md:mb-6">Regions</h1>
          
          <div className="flex justify-center mb-4">
            <CountryPickerButton
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
            />
          </div>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-accent z-10" />
            <Input 
              type="text" 
              placeholder="Search for a region..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-12 h-12 md:h-14 text-base md:text-lg bg-card/50 backdrop-blur border-accent/20" 
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : counties.length === 0 ? (
            <div className="text-center mt-12">
              <p className="text-muted-foreground text-base md:text-lg">No regions with registered artists yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredCounties.map(county => (
                <Link key={county} to={`/counties/${county}`}>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 md:py-6 w-full flex items-center justify-start gap-2 md:gap-3 hover:bg-accent/10 hover:border-accent transition-all group"
                  >
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-accent group-hover:scale-110 transition-transform" />
                    <span className="text-sm md:text-lg font-medium truncate">{county}</span>
                  </Button>
                </Link>
              ))}
            </div>
          )}

          {!isLoading && counties.length > 0 && filteredCounties.length === 0 && (
            <div className="text-center mt-12">
              <p className="text-muted-foreground text-base md:text-lg">No regions found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Counties;
