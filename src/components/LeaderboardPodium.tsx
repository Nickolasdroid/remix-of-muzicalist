import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Star } from "lucide-react";
import { getAvatarOutlineClassesLarge } from "@/lib/subscriptionStyles";

interface PodiumArtist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  plan: string;
  rating: number;
  reviewCount: number;
}

interface LeaderboardPodiumProps {
  artists: PodiumArtist[];
}

const rankBadgeStyles: Record<number, string> = {
  1: "bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/30",
  2: "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-black shadow-lg shadow-gray-400/30",
  3: "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 text-black shadow-lg shadow-orange-500/30",
};

const LeaderboardPodium = ({ artists }: LeaderboardPodiumProps) => {
  if (artists.length === 0) return null;

  // Arrange: [2nd, 1st, 3rd] for podium layout
  const ordered = [artists[1], artists[0], artists[2]].filter(Boolean);

  return (
    <div className="flex items-end justify-center gap-3 md:gap-6 mb-8 md:mb-10 px-2">
      {ordered.map((artist, i) => {
        const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
        const isFirst = rank === 1;
        const avatarSize = isFirst ? "h-20 w-20 md:h-28 md:w-28" : "h-16 w-16 md:h-22 md:w-22";
        const wrapperPadding = isFirst ? "p-1" : "p-0.5";

        return (
          <Link
            key={artist.id}
            to={`/artist/${artist.id}`}
            className={`flex flex-col items-center group ${isFirst ? "mb-4 md:mb-6" : "mb-0"}`}
          >
            {/* Avatar with rank badge */}
            <div className="relative">
              {/* Rank badge */}
              <div
                className={`absolute -top-2 -right-1 md:-top-3 md:-right-2 z-10 w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm md:text-base font-bold ${rankBadgeStyles[rank]}`}
              >
                {rank}
              </div>
              <div
                className={`${wrapperPadding} rounded-full ${getAvatarOutlineClassesLarge(artist.plan)}`}
              >
                <Avatar className={`${avatarSize} border-2 border-background`}>
                  <AvatarImage src={artist.avatar_url || undefined} alt={artist.stage_name} />
                  <AvatarFallback className="bg-muted">
                    <User className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Name */}
            <span className="mt-2 font-semibold text-foreground text-sm md:text-base text-center truncate max-w-[100px] md:max-w-[140px] group-hover:text-accent transition-colors">
              {artist.stage_name}
            </span>

            {/* Rating */}
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3.5 w-3.5 md:h-4 md:w-4 text-accent fill-accent" />
              <span className="text-xs md:text-sm text-accent font-medium">
                {artist.rating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({artist.reviewCount})
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default LeaderboardPodium;
