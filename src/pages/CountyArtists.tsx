import Navigation from "@/components/Navigation";
import { ArrowLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Artist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  plan: string;
  specialization: string | null;
}

const CountyArtists = () => {
  const { county } = useParams<{ county: string }>();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
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

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const getArtistsBySpecialization = (specialization: string) => {
    return artists.filter(artist => artist.specialization?.toLowerCase() === specialization.toLowerCase());
  };

  const categories = [
    { key: "singer", title: "Singers" },
    { key: "instrumentalist", title: "Instrumentalists" },
    { key: "dj", title: "DJs" },
    { key: "band", title: "Bands" },
  ];

  return (
    <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 md:pt-32 pb-24 md:pb-20">
        {/* Header with Back button and centered county name */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <Link to="/counties">
            <Button variant="outline" size="sm" className="text-xs md:text-sm h-9 px-3">
              <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Back
            </Button>
          </Link>

          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">
            {county}
          </h1>

          {/* Empty div to balance the flex layout */}
          <div className="w-[70px] md:w-[80px]" />
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading artists...</div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {categories.map((category) => {
              const categoryArtists = getArtistsBySpecialization(category.key);
              const isExpanded = expandedCategories[category.key];
              
              if (categoryArtists.length === 0) return null;
              
              return (
                <div key={category.key} className="border border-border rounded-lg overflow-hidden">
                  {/* Category row */}
                  <button
                    onClick={() => toggleCategory(category.key)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-base md:text-lg font-semibold text-foreground">
                      {category.title} ({categoryArtists.length})
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Expanded artist list */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {categoryArtists.map((artist) => (
                        <Link 
                          key={artist.id} 
                          to={`/artist/${artist.id}`}
                          className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors border-b border-border last:border-b-0"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={artist.avatar_url || undefined} alt={artist.stage_name} />
                            <AvatarFallback className="bg-accent/20 text-accent text-sm">
                              {artist.stage_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm md:text-base font-medium text-foreground">
                            {artist.stage_name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
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
