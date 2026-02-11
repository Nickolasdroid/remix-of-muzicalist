import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCountryFlag } from "@/lib/countryFlags";
import diamondIcon from "@/assets/diamond-icon.png";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ArtistData {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  specialization: string | null;
  county: string;
  country: string | null;
  plan: string;
}

interface ArtistWithRating extends ArtistData {
  rating: number | null;
}

const DiscoverArtistsSection = () => {
  const [artists, setArtists] = useState<ArtistWithRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, specialization, county, country, plan')
        .not('specialization', 'is', null)
        .limit(12);

      if (error || !data) {
        setLoading(false);
        return;
      }

      const ids = data.map(a => a.id);
      const { data: reviews } = await supabase
        .from('reviews')
        .select('profile_id, rating')
        .in('profile_id', ids);

      const ratingMap: Record<string, number[]> = {};
      reviews?.forEach(r => {
        if (!ratingMap[r.profile_id]) ratingMap[r.profile_id] = [];
        ratingMap[r.profile_id].push(r.rating);
      });

      const withRatings: ArtistWithRating[] = data.map(a => ({
        ...a,
        rating: ratingMap[a.id]
          ? Math.round((ratingMap[a.id].reduce((s, v) => s + v, 0) / ratingMap[a.id].length) * 10) / 10
          : null,
      }));

      setArtists(withRatings);
      setLoading(false);
    };

    fetchArtists();
  }, []);

  if (loading || artists.length === 0) return null;

  return (
    <section className="py-10 md:py-20 px-4 md:px-8">
      <div className="container mx-auto px-0">
        <div className="text-center mb-6 md:mb-12 px-2">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-2 md:mb-4">
            Discover Artists
          </h2>
        </div>

        <Carousel opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent className="-ml-3 md:-ml-4">
            {artists.map(artist => {
              const isFree = !artist.plan || artist.plan === 'Free';
              const flag = artist.country ? getCountryFlag(artist.country) : '';

              return (
                <CarouselItem key={artist.id} className="pl-3 md:pl-4 basis-1/2 md:basis-1/4">
                  <Link to={`/artist/${artist.id}`} className="group block">
                    <div className="overflow-hidden rounded-lg">
                      <div className="relative aspect-square overflow-hidden">
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
                      </div>

                      <div className="bg-card border-t border-border p-2 space-y-0.5">
                        <h3 className="text-base font-sans font-semibold text-foreground text-left group-hover:text-accent transition-colors truncate">
                          {artist.stage_name}
                        </h3>

                        <p className="text-xs text-muted-foreground truncate text-left">
                          {artist.specialization}{artist.county ? ` · ${artist.county}` : ''} {flag}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-accent fill-accent" />
                            <span className="text-sm font-medium text-muted-foreground">
                              {artist.rating !== null ? artist.rating.toFixed(1) : '-'}
                            </span>
                          </div>
                          {isFree && (
                            <img
                              src={diamondIcon}
                              alt="Free tier"
                              className="h-4 w-4"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};

export default DiscoverArtistsSection;
