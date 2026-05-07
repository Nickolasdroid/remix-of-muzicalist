import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star, User, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";
import { fetchArtistIds } from "@/hooks/use-artist-ids";

interface PreviewArtist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  plan: string;
  rating: number;
  review_count: number;
}

const LeaderboardPreviewSection = () => {
  const [artists, setArtists] = useState<PreviewArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const artistIds = await fetchArtistIds();
      if (artistIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: reviews } = await supabase
        .from('reviews')
        .select('profile_id, rating')
        .in('profile_id', artistIds);

      const ratingsMap: Record<string, number[]> = {};
      reviews?.forEach(r => {
        if (!ratingsMap[r.profile_id]) ratingsMap[r.profile_id] = [];
        ratingsMap[r.profile_id].push(r.rating);
      });

      const ranked = Object.entries(ratingsMap)
        .map(([id, ratings]) => ({
          id,
          review_count: ratings.length,
          rating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        }))
        .sort((a, b) => b.review_count - a.review_count || b.rating - a.rating)
        .slice(0, 5);

      if (ranked.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, plan')
        .in('id', ranked.map(r => r.id));

      const merged: PreviewArtist[] = ranked
        .map(r => {
          const p = profiles?.find(pr => pr.id === r.id);
          if (!p) return null;
          return {
            id: r.id,
            stage_name: p.stage_name,
            avatar_url: p.avatar_url,
            plan: p.plan,
            rating: r.rating,
            review_count: r.review_count,
          };
        })
        .filter(Boolean) as PreviewArtist[];

      setArtists(merged);
      setLoading(false);
    };
    load();
  }, []);

  if (loading || artists.length === 0) return null;

  return (
    <section className="py-10 md:py-20 px-4 md:px-8">
      <div className="container mx-auto px-0">
        <div className="mb-6 md:mb-12 px-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 md:gap-3 text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
              <Trophy className="h-6 w-6 md:h-9 md:w-9 text-accent" />
              Leaderboard
            </h2>
            <Link
              to="/leaderboard"
              className="flex items-center gap-1 text-sm md:text-base text-accent hover:text-accent/80 font-medium transition-colors"
            >
              See full
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto rounded-lg border border-border overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-transparent border-b border-border hover:bg-transparent">
                <TableHead className="w-10 md:w-16 text-center font-semibold text-foreground px-2 md:px-4">Rank</TableHead>
                <TableHead className="text-center font-semibold text-foreground px-2 md:px-4">Profile</TableHead>
                <TableHead className="w-12 md:w-24 text-center font-semibold text-foreground px-1 md:px-4 text-xs md:text-sm">Reviews</TableHead>
                <TableHead className="w-12 md:w-20 text-center font-semibold text-foreground px-1 md:px-4">
                  <Star className="h-4 w-4 mx-auto text-accent fill-accent" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artists.map((artist, index) => (
                <TableRow key={artist.id} className="border-b border-border/50 hover:bg-accent/10 transition-colors">
                  <TableCell className="text-center font-bold text-base md:text-lg text-foreground px-2 md:px-4">{index + 1}</TableCell>
                  <TableCell className="px-2 md:px-4">
                    <Link to={`/artist/${artist.id}`} className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity">
                      <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(artist.plan)} flex-shrink-0`}>
                        <Avatar className="h-9 w-9 md:h-11 md:w-11 border-2 border-background">
                          <AvatarImage src={artist.avatar_url || undefined} alt={artist.stage_name} />
                          <AvatarFallback className="bg-muted">
                            <User className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="font-medium text-foreground hover:text-accent transition-colors text-base md:text-lg truncate">
                        {artist.stage_name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground text-sm md:text-base px-1 md:px-4">{artist.review_count}</TableCell>
                  <TableCell className="text-center font-semibold text-accent text-sm md:text-base px-1 md:px-4">{artist.rating.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardPreviewSection;
