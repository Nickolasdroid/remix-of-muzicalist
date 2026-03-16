import Navigation from "@/components/Navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ArtistProfileCard from "@/components/ArtistProfileCard";

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    const fetchArtistsData = async () => {
      if (!county) return;
      
      setLoading(true);
      
      // Get artist IDs first to filter out regular users
      const artistIds = await fetchArtistIds();
      if (artistIds.length === 0) {
        setArtists([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, plan, specialization')
        .ilike('county', county)
        .in('id', artistIds);
      
      if (error) {
        console.error('Error fetching artists:', error);
      } else {
        setArtists(data || []);
      }
      setLoading(false);
    };

    fetchArtistsData();
  }, [county]);


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
    <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-background`}>
      <Navigation mobileTitle={county} mobileBackPath="/counties" />
      
      <div className="container mx-auto px-4 pt-20 md:pt-8 pb-24 md:pb-20">
        <div className="hidden md:flex items-center justify-between mb-6 md:mb-8">
          <Link to="/counties">
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
        ) : (
          <div className="space-y-10 md:space-y-16 max-w-7xl mx-auto">
            {categories.map((category) => {
              const categoryArtists = getArtistsBySpecialization(category.key);
              
              if (categoryArtists.length === 0) return null;
              
              return (
                <div key={category.key} className="space-y-4 md:space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-sans font-bold text-accent uppercase">
                      {category.displayTitle} ({categoryArtists.length})
                    </h2>
                    <Link to={`/counties/${county}/${category.key}`}>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full border-accent text-accent hover:bg-accent hover:text-accent-foreground h-8 w-8 md:h-10 md:w-10"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                  
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    className="w-full max-w-7xl mx-auto"
                  >
                    <CarouselContent className="-ml-1">
                      {categoryArtists.map((artist) => (
                        <CarouselItem key={artist.id} className="pl-1 basis-1/2 md:basis-1/3 lg:basis-1/4">
                          <ArtistProfileCard
                            id={artist.id}
                            stageName={artist.stage_name}
                            imageUrl={artist.avatar_url}
                            plan={artist.plan}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-0" />
                    <CarouselNext className="right-0" />
                  </Carousel>
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
