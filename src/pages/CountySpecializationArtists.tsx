import Navigation from "@/components/Navigation";
import { ArrowLeft } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Artist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  plan: string;
}

type SpecializationType = "Singer" | "Instrumentalist" | "DJ" | "Band";

const specializationMap: Record<string, SpecializationType> = {
  singer: "Singer",
  instrumentalist: "Instrumentalist",
  dj: "DJ",
  band: "Band",
};

const specializationTitles: Record<string, string> = {
  singer: "Singers",
  instrumentalist: "Instrumentalists",
  dj: "DJs",
  band: "Bands",
};

const CountySpecializationArtists = () => {
  const { county, specialization } = useParams<{ county: string; specialization: string }>();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      if (!county || !specialization) return;
      
      const dbSpecialization = specializationMap[specialization.toLowerCase()];
      if (!dbSpecialization) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, plan')
        .ilike('county', county)
        .eq('specialization', dbSpecialization);
      
      if (error) {
        console.error('Error fetching artists:', error);
      } else {
        setArtists(data || []);
      }
      setLoading(false);
    };

    fetchArtists();
  }, [county, specialization]);

  const title = specialization ? specializationTitles[specialization.toLowerCase()] || specialization : '';

  return (
    <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 md:pt-32 pb-24 md:pb-20">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <Link to={`/counties/${county}`}>
            <Button variant="outline" className="h-9 px-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-sans font-bold text-foreground">
            {county}
          </h1>
          <div className="w-[76px]" /> {/* Spacer for alignment */}
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading artists...</div>
        ) : artists.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No {title?.toLowerCase()} found in {county} yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
            {artists.map((artist) => {
              const isPremium = artist.plan === 'Premium';
              const borderColor = isPremium ? "border-accent/30" : "border-burgundy/30";
              const hoverBorderColor = isPremium ? "hover:border-accent" : "hover:border-burgundy";
              const hoverBgColor = isPremium ? "hover:bg-accent/5" : "hover:bg-burgundy/5";
              const avatarBorderColor = isPremium ? "border-accent" : "border-burgundy";
              
              return (
                <Link key={artist.id} to={`/artist/${artist.id}`}>
                  <div className={`flex items-center gap-4 p-3 rounded-lg border ${borderColor} ${hoverBorderColor} ${hoverBgColor} transition-all duration-300`}>
                    <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${avatarBorderColor} flex-shrink-0`}>
                      {artist.avatar_url ? (
                        <img src={artist.avatar_url} alt={artist.stage_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent/30 to-accent/10" />
                      )}
                    </div>
                    <p className="text-lg font-semibold text-foreground">{artist.stage_name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CountySpecializationArtists;
