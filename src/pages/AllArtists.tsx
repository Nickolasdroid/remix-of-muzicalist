import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, Star, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCountryFlag } from "@/lib/countryFlags";
import diamondIcon from "@/assets/diamond-icon.png";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

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

const AllArtists = () => {
  const [artists, setArtists] = useState<ArtistWithRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, stage_name, avatar_url, specialization, county, country, plan")
        .not("specialization", "is", null)
        .order("created_at", { ascending: false });

      if (error || !data) {
        setLoading(false);
        return;
      }

      const ids = data.map((a) => a.id);
      const { data: reviews } = await supabase
        .from("reviews")
        .select("profile_id, rating")
        .in("profile_id", ids);

      const ratingMap: Record<string, number[]> = {};
      reviews?.forEach((r) => {
        if (!ratingMap[r.profile_id]) ratingMap[r.profile_id] = [];
        ratingMap[r.profile_id].push(r.rating);
      });

      const withRatings: ArtistWithRating[] = data.map((a) => ({
        ...a,
        rating: ratingMap[a.id]
          ? Math.round(
              (ratingMap[a.id].reduce((s, v) => s + v, 0) / ratingMap[a.id].length) * 10
            ) / 10
          : null,
      }));

      setArtists(withRatings);
      setLoading(false);
    };

    fetchArtists();
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-24 md:pb-20">
        <div className="flex items-center gap-3 mb-6 md:mb-10">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            Discover Artists
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : artists.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">No artists found.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {artists.map((artist) => {
              const isFree = !artist.plan || artist.plan === "Free";
              const flag = artist.country ? getCountryFlag(artist.country) : "";

              return (
                <Link key={artist.id} to={`/artist/${artist.id}`} className="group block">
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
                        {artist.specialization}
                        {artist.county ? ` · ${artist.county}` : ""} {flag}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-accent fill-accent" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {artist.rating !== null ? artist.rating.toFixed(1) : "-"}
                          </span>
                        </div>
                        {isFree && (
                          <img src={diamondIcon} alt="Free tier" className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AllArtists;
