import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import { ArrowLeft } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { knownUserId } from "@/lib/knownUser";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
import { sortByPlanPriority } from "@/lib/planLimits";
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(knownUserId);

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
        const sorted = [...(data || [])].sort((a, b) => sortByPlanPriority(a, b));
        setArtists(sorted);
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
      displayTitle: "Singers",
      href: `/counties/${county}/soloists`,
    },
    {
      key: "instrumentalist",
      title: "Instrumentalists",
      displayTitle: "Instrumentalists",
      href: `/counties/${county}/instrumentalists`,
    },
    {
      key: "dj",
      title: "DJs",
      displayTitle: "DJs",
      href: `/counties/${county}/djs`,
    },
    {
      key: "band",
      title: "Bands",
      displayTitle: "Bands",
      href: `/counties/${county}/bands`,
    },
  ];

  return (
    <div className={`min-h-screen ${currentUserId ? 'md:ml-[316px] lg:ml-[356px]' : ''} bg-background`}>
      <SEO title={`${county} — Musical Artists for Hire | Muzicalist`} description={`Find and book singers, bands, DJs and instrumentalists in ${county}. Compare profiles, reviews, prices and availability on Muzicalist.`} path={`/counties/${encodeURIComponent(county ?? "")}`} />
      <Navigation mobileTitle={county} mobileBackPath="/counties" hideMobileNotifications />
      
      <div className={`container mx-auto px-4 pt-20 ${currentUserId ? 'md:pt-8' : 'md:pt-24'} pb-6 md:pb-20`}>
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
                <div key={category.key} className="space-y-2 md:space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <h2 className="font-figtree text-[22px] font-bold leading-tight tracking-[-0.01em] text-white md:text-2xl">
                      <span>{category.displayTitle}</span>{" "}
                      <span className="tabular-nums notranslate" translate="no">({categoryArtists.length})</span>
                    </h2>
                    <Link
                      to={`/counties/${county}/${category.key}`}
                      className="shrink-0 text-sm font-bold text-white/60 transition-colors hover:text-white hover:underline"
                    >
                      Show all
                    </Link>
                  </div>
                  
                  <Carousel
                    opts={{
                      align: "start",
                      loop: false,
                    }}
                    className="w-full max-w-7xl mx-auto"
                  >
                    <CarouselContent className="-ml-2 md:-ml-3">
                      {categoryArtists.map((artist) => (
                        <CarouselItem key={artist.id} className="pl-2 md:pl-3 basis-[44%] sm:basis-[29%] md:basis-1/4 lg:basis-1/5">
                          <ArtistProfileCard
                            id={artist.id}
                            stageName={artist.stage_name}
                            imageUrl={artist.avatar_url}
                            plan={artist.plan}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {/* Phones swipe; the arrows are for mouse users */}
                    <CarouselPrevious className="left-0 hidden md:flex md:disabled:hidden" />
                    <CarouselNext className="right-0 hidden md:flex md:disabled:hidden" />
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
