import Navigation from "@/components/Navigation";
import { ArrowLeft, Grid, List, User } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Artist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  plan: string;
  specialization: string | null;
}

const CountyArtists = () => {
  const { county } = useParams<{ county: string }>();
  const [viewModes, setViewModes] = useState<Record<string, 'carousel' | 'list'>>({
    singer: 'carousel',
    instrumentalist: 'carousel',
    dj: 'carousel',
    band: 'carousel',
  });
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

  const toggleViewMode = (category: string) => {
    setViewModes(prev => ({
      ...prev,
      [category]: prev[category] === 'carousel' ? 'list' : 'carousel'
    }));
  };

  const getArtistsBySpecialization = (specialization: string) => {
    return artists.filter(artist => artist.specialization?.toLowerCase() === specialization.toLowerCase());
  };

  const categories = [
    {
      key: "singer",
      title: "Singers",
      displayTitle: "SINGERS",
      href: `/counties/${county}/soloists`,
    },
    {
      key: "instrumentalist",
      title: "Instrumentalists",
      displayTitle: "INSTRUMENTALISTS",
      href: `/counties/${county}/instrumentalists`,
    },
    {
      key: "dj",
      title: "DJs",
      displayTitle: "DJS",
      href: `/counties/${county}/djs`,
    },
    {
      key: "band",
      title: "Bands",
      displayTitle: "BANDS",
      href: `/counties/${county}/bands`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <Link to="/counties">
          <Button variant="outline" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Counties
          </Button>
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground">
            {county}
          </h1>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading artists...</div>
        ) : (
          <div className="space-y-16 max-w-7xl mx-auto">
            {categories.map((category) => {
              const categoryArtists = getArtistsBySpecialization(category.key);
              
              if (categoryArtists.length === 0) return null;
              
              return (
                <div key={category.key} className="space-y-8">
                  <div className="flex items-center justify-center gap-4">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-accent uppercase border-b-2 border-accent pb-2">
                      {category.displayTitle} ({categoryArtists.length})
                    </h2>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleViewMode(category.key)}
                      className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    >
                      {viewModes[category.key] === 'carousel' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
                    </Button>
                  </div>
                  
                  {viewModes[category.key] === 'carousel' ? (
                    <Carousel
                      opts={{
                        align: "start",
                        loop: true,
                      }}
                      className="w-full max-w-7xl mx-auto"
                    >
                      <CarouselContent>
                        {categoryArtists.map((artist) => {
                          const isPremium = artist.plan === 'Premium';
                          const borderColor = isPremium ? "border-accent" : "border-burgundy";
                          
                          return (
                            <CarouselItem key={artist.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                              <div className="p-2">
                                <Link to={`/artist/${artist.id}`} className="group">
                                  <div className={`relative aspect-square rounded-lg overflow-hidden border-2 ${borderColor} transition-all duration-300 hover:shadow-[var(--shadow-gold)] hover:scale-105`}>
                                    {artist.avatar_url ? (
                                      <img 
                                        src={artist.avatar_url} 
                                        alt={artist.stage_name} 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-card to-secondary flex items-center justify-center">
                                        <User className="h-16 w-16 text-accent" />
                                      </div>
                                    )}
                                    
                                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-3">
                                      <h3 className="text-base font-display font-semibold text-foreground text-center group-hover:text-accent transition-colors">
                                        {artist.stage_name}
                                      </h3>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            </CarouselItem>
                          );
                        })}
                      </CarouselContent>
                      <CarouselPrevious className="left-0" />
                      <CarouselNext className="right-0" />
                    </Carousel>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                      {categoryArtists.map((artist) => {
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
