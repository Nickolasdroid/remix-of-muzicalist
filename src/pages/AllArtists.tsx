import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { User, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCountryFlag } from "@/lib/countryFlags";
import ArtistTile from "@/components/ArtistTile";
import { translateSpecialization } from "@/lib/specializationLabel";
import ArtistCardStatusBadge from "@/components/ArtistCardStatusBadge";
import { getThumbUrl } from "@/lib/imageUrl";

import Navigation from "@/components/Navigation";
import { knownUserId } from "@/lib/knownUser";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useInfiniteList } from "@/hooks/useInfiniteList";

interface ArtistData {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  specialization: string | null;
  county: string;
  country: string | null;
  plan: string;
  created_at: string;
}

interface ArtistWithRating extends ArtistData {
  rating: number | null;
  reviewCount: number;
}


const normalize = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const AllArtists = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [allArtists, setArtists] = useState<ArtistWithRating[]>([]);
  // Header search: name, artist type or place, accents ignored
  const artists = query
    ? allArtists.filter((a) =>
        normalize([a.stage_name, a.specialization, translateSpecialization(a.specialization), a.county, a.country].filter(Boolean).join(" ")).includes(normalize(query)),
      )
    : allArtists;
  const [loading, setLoading] = useState(true);
  // A batch at a time; the next one appears near the bottom
  const { visible, hasMore, sentinelRef } = useInfiniteList(artists, 20, query);

  useEffect(() => {
    const fetchArtists = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, stage_name, avatar_url, specialization, county, country, plan, created_at")
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
        reviewCount: ratingMap[a.id]?.length ?? 0,
      }));

      setArtists(withRatings);
      setLoading(false);
    };

    fetchArtists();
  }, []);

  // Signed in: the page sits to the right of the left sidebar
  const [currentUserId] = useState<string | null>(knownUserId);

  return (
    <div className={`min-h-screen bg-background ${currentUserId ? "md:ml-[316px] lg:ml-[356px]" : ""}`}>
      <SEO title="All Artists — Browse & Book Musicians | Muzicalist" description="Browse every artist on Muzicalist: singers, bands, DJs and instrumentalists. Filter by category, location and availability, then book directly." path="/artists" />
      <Navigation mobileTitle="Discover Artists" mobileBackPath="/" hideMobileNotifications />

      <div className={`container mx-auto px-4 md:px-8 pt-20 ${currentUserId ? "md:pt-10" : "md:pt-24"} pb-6 md:pb-20`}>
        <div className="hidden md:flex items-center gap-3 mb-6 md:mb-10">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            {query ? (
              <>
                <span>Results for</span> <span className="notranslate" translate="no">„{query}”</span>
              </>
            ) : (
              "Discover Artists"
            )}
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : artists.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">{query ? "No artists match your search." : "No artists found."}</p>
        ) : (
          <div className="-mx-2 grid grid-cols-2 md:-mx-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((artist) => (
              <ArtistTile
                key={artist.id}
                id={artist.id}
                stageName={artist.stage_name}
                imageUrl={artist.avatar_url}
                plan={artist.plan}
                specialization={artist.specialization}
                county={artist.county}
                country={artist.country}
                rating={artist.rating}
                reviewCount={artist.reviewCount}
              />
            ))}
          </div>
        )}
        {hasMore && <div ref={sentinelRef} className="h-px" aria-hidden="true" />}
      </div>

      <Footer />
    </div>
  );
};

export default AllArtists;
