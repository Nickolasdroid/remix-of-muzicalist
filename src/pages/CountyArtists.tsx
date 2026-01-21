import Navigation from "@/components/Navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Artist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  plan: string;
  specialization: string | null;
}

const CountyArtists = () => {
  const { county } = useParams<{ county: string }>();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      if (!county) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, plan, specialization')
        .ilike('county', county);
      
      if (error) {
        console.error('Error fetching artists:', error);
      } else {
        setArtists(data || []);
      }
      setLoading(false);
    };

    fetchArtists();
  }, [county]);

  const getArtistsBySpecialization = (specialization: string) => {
    return artists.filter(artist => artist.specialization?.toLowerCase() === specialization.toLowerCase());
  };

  const categories = [
    { key: "singer", title: "Singers", route: "singers" },
    { key: "instrumentalist", title: "Instrumentalists", route: "instrumentalists" },
    { key: "dj", title: "DJs", route: "djs" },
    { key: "band", title: "Bands", route: "bands" },
  ];

  return (
    <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 md:pt-32 pb-24 md:pb-20">
        <div className="flex items-center justify-between mb-8">
          <Link to="/counties">
            <Button variant="outline" size="sm" className="h-9 px-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <h1 className="text-xl md:text-2xl font-sans font-bold text-foreground text-center flex-1 mx-4">
            {county}
          </h1>
          
          <div className="w-[70px]" />
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading artists...</div>
        ) : (
          <div className="space-y-6 max-w-2xl mx-auto">
            {categories.map((category) => {
              const categoryArtists = getArtistsBySpecialization(category.key);
              
              if (categoryArtists.length === 0) return null;
              
              // Show max 3 artists in preview
              const previewArtists = categoryArtists.slice(0, 3);
              
              return (
                <div key={category.key} className="space-y-3">
                  <Link 
                    to={`/counties/${county}/${category.route}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-all duration-300"
                  >
                    <span className="text-lg font-semibold text-foreground">
                      {category.title} ({categoryArtists.length})
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                  
                  <div className="space-y-2 pl-2">
                    {previewArtists.map((artist) => {
                      const isPremium = artist.plan === 'Premium';
                      const avatarBorderColor = isPremium ? "border-accent" : "border-burgundy";
                      
                      return (
                        <Link key={artist.id} to={`/artist/${artist.id}`}>
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-300">
                            <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${avatarBorderColor} flex-shrink-0`}>
                              {artist.avatar_url ? (
                                <img src={artist.avatar_url} alt={artist.stage_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-accent/30 to-accent/10" />
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground">{artist.stage_name}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {artists.length === 0 && (
              <div className="text-center text-muted-foreground">
                No artists found in {county} yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CountyArtists;
