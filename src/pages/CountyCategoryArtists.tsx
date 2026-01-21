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

const CountyCategoryArtists = () => {
  const { county, category } = useParams<{ county: string; category: string }>();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryTitles: Record<string, string> = {
    singers: "Singers",
    instrumentalists: "Instrumentalists",
    djs: "DJs",
    bands: "Bands",
  };

  const categoryKeys: Record<string, string> = {
    singers: "singer",
    instrumentalists: "instrumentalist",
    djs: "dj",
    bands: "band",
  };

  useEffect(() => {
    const fetchArtists = async () => {
      if (!county || !category) return;
      
      const specializationKey = categoryKeys[category.toLowerCase()] || category;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, plan')
        .ilike('county', county)
        .ilike('specialization', specializationKey);
      
      if (error) {
        console.error('Error fetching artists:', error);
      } else {
        setArtists(data || []);
      }
      setLoading(false);
    };

    fetchArtists();
  }, [county, category]);

  const displayTitle = categoryTitles[category?.toLowerCase() || ''] || category;

  return (
    <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 md:pt-32 pb-24 md:pb-20">
        <div className="flex items-center justify-between mb-8">
          <Link to={`/counties/${county}`}>
            <Button variant="outline" size="sm" className="h-9 px-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <h1 className="text-xl md:text-2xl font-sans font-bold text-foreground text-center flex-1 mx-4">
            {displayTitle}
          </h1>
          
          <div className="w-[70px]" />
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading artists...</div>
        ) : artists.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No {displayTitle?.toLowerCase()} found in {county} yet.
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {artists.map((artist) => {
              const isPremium = artist.plan === 'Premium';
              const borderColor = isPremium ? "border-accent/30" : "border-burgundy/30";
              const hoverBorderColor = isPremium ? "hover:border-accent" : "hover:border-burgundy";
              const hoverBgColor = isPremium ? "hover:bg-accent/5" : "hover:bg-burgundy/5";
              const avatarBorderColor = isPremium ? "border-accent" : "border-burgundy";
              
              return (
                <Link key={artist.id} to={`/artist/${artist.id}`}>
                  <div className={`flex items-center gap-4 p-3 rounded-lg border ${borderColor} ${hoverBorderColor} ${hoverBgColor} transition-all duration-300`}>
                    <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${avatarBorderColor} flex-shrink-0`}>
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

export default CountyCategoryArtists;
