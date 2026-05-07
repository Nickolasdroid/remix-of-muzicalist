import { Link } from "react-router-dom";
import { ChevronRight, Star, User, Trophy } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PreviewArtist {
  stage_name: string;
  rating: number;
  review_count: number;
}

const FICTIONAL_ARTISTS: PreviewArtist[] = [
  { stage_name: "Luna Vox", review_count: 248, rating: 4.9 },
  { stage_name: "DJ Nyx", review_count: 215, rating: 4.8 },
  { stage_name: "The Velvet Echo", review_count: 187, rating: 4.8 },
  { stage_name: "Marco Strings", review_count: 164, rating: 4.7 },
  { stage_name: "Aria Sol", review_count: 142, rating: 4.7 },
];

const LeaderboardPreviewSection = () => {
  const artists = FICTIONAL_ARTISTS;

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
                <TableRow key={artist.stage_name} className="border-b border-border/50 hover:bg-accent/10 transition-colors">
                  <TableCell className="text-center font-bold text-base md:text-lg text-foreground px-2 md:px-4">{index + 1}</TableCell>
                  <TableCell className="px-2 md:px-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Avatar className="h-9 w-9 md:h-11 md:w-11 border-2 border-background flex-shrink-0">
                        <AvatarFallback className="bg-foreground">
                          <User className="h-5 w-5 md:h-6 md:w-6 text-background" fill="currentColor" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground text-base md:text-lg truncate">
                        {artist.stage_name}
                      </span>
                    </div>
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
