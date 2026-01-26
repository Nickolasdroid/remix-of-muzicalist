import Navigation from "@/components/Navigation";
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Users } from "lucide-react";
import SimpleArtistCard from "@/components/SimpleArtistCard";
import { getCountryFlag } from "@/lib/countryFlags";

const CountryArtists = () => {
  const { country } = useParams<{ country: string }>();
  const decodedCountry = country ? decodeURIComponent(country) : "";
  const [searchTerm, setSearchTerm] = useState("");
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      if (!decodedCountry) return;
      
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('country', decodedCountry)
        .order('stage_name');

      setArtists(data || []);
      setLoading(false);
    };

    fetchArtists();
  }, [decodedCountry]);

  const filteredArtists = artists.filter(artist =>
    artist.stage_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.county?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 md:pt-32 pb-24 md:pb-20">
        {/* Back button */}
        <Link to="/countries" className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Countries</span>
        </Link>

        <div className="text-center mb-8 md:mb-16">
          <div className="flex items-center justify-center gap-3 mb-4 md:mb-6">
            <span className="text-4xl md:text-5xl">{getCountryFlag(decodedCountry)}</span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground">{decodedCountry}</h1>
          </div>
          
          <p className="text-muted-foreground mb-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredArtists.map(artist => (
                <SimpleArtistCard
                  key={artist.id}
                  id={artist.id}
                  name={`${artist.first_name} ${artist.last_name}`}
                  stageName={artist.stage_name}
                  imageUrl={artist.avatar_url}
                  isPremium={artist.plan !== 'Free'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-base md:text-lg">
                {searchTerm 
                  ? `No artists found matching "${searchTerm}"` 
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
