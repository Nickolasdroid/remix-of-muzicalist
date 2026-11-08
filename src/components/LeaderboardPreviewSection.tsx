import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getThumbUrl } from "@/lib/imageUrl";
import { translateSpecialization } from "@/lib/specializationLabel";

interface TopArtist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  specialization: string | null;
  rating: number;
  reviewCount: number;
}

/**
 * The three artists with the most reviews (then the best rating), like the Leaderboard
 * page sorts them. Hidden until there are reviews to rank by.
 */
const LeaderboardPreviewSection = () => {
  const [top, setTop] = useState<TopArtist[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: reviews } = await supabase.from("reviews").select("profile_id, rating");
      if (cancelled || !reviews?.length) return;
      const byArtist: Record<string, number[]> = {};
      reviews.forEach((r: any) => (byArtist[r.profile_id] ||= []).push(r.rating));
      const ranked = Object.entries(byArtist)
        .map(([id, list]) => ({ id, reviewCount: list.length, rating: list.reduce((s, v) => s + v, 0) / list.length }))
        .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
        .slice(0, 10);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, stage_name, avatar_url, specialization")
        .in("id", ranked.map((r) => r.id))
        .not("specialization", "is", null);
      if (cancelled || !profiles) return;
      const byId = new Map(profiles.map((p: any) => [p.id, p]));
      setTop(
        ranked
          .filter((r) => byId.has(r.id))
          .slice(0, 3)
          .map((r) => ({ ...(byId.get(r.id) as any), rating: r.rating, reviewCount: r.reviewCount })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (top.length < 3) return null;

  return (
    <section className="px-4 py-16 md:px-8 md:py-24">
      <div className="container mx-auto max-w-6xl px-0">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-headline text-3xl font-bold tracking-[-0.025em] text-foreground md:text-[2.75rem]">Leaderboard</h2>
            <p className="mt-3 text-base text-muted-foreground md:text-lg">Artists ranked by their clients' reviews.</p>
          </div>
          <Link to="/leaderboard" className="shrink-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:text-[15px]">
            See full
          </Link>
        </div>

        <ol className="mt-8 md:mt-10">
          {top.map((a, i) => (
            <li key={a.id} className="border-t border-border last:border-b">
              <Link
                to={`/artist/${a.id}`}
                className="group flex items-center gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:gap-6 md:py-5"
              >
                <span className="w-8 font-headline text-3xl font-bold tabular-nums text-muted-foreground/70 md:w-12 md:text-5xl">{i + 1}</span>
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary md:h-16 md:w-16">
                  {a.avatar_url ? (
                    <img src={getThumbUrl(a.avatar_url, 128)} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground/60" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-foreground group-hover:underline group-hover:underline-offset-4 md:text-lg notranslate" translate="no" data-user-content="true">
                    {a.stage_name}
                  </span>
                  <span className="block truncate text-[13px] text-muted-foreground md:text-sm">{translateSpecialization(a.specialization)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-accent text-accent" aria-hidden="true" />
                  <span className="font-semibold tabular-nums text-foreground">{a.rating.toFixed(1)}</span>
                  <span className="tabular-nums">({a.reviewCount})</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default LeaderboardPreviewSection;
