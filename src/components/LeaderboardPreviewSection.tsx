import { Link } from "react-router-dom";
import { ChevronRight, Star, User, Trophy, Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PreviewArtist {
  stage_name: string;
  rating: number;
  review_count: number;
}

const FICTIONAL_TOP3: PreviewArtist[] = [
  { stage_name: "Artist 1", review_count: 248, rating: 4.9 },
  { stage_name: "Artist 2", review_count: 215, rating: 4.8 },
  { stage_name: "Artist 3", review_count: 187, rating: 4.8 },
];

const podiumStyles: Record<number, {
  ring: string;
  crown: string;
  badgeBg: string;
  gradient: string;
  height: string;
  delay: string;
  glow: string;
}> = {
  1: {
    ring: "ring-[hsl(45_95%_55%)] shadow-[0_0_60px_hsl(45_95%_55%/0.7)]",
    crown: "text-[hsl(45_95%_60%)] drop-shadow-[0_0_10px_hsl(45_95%_55%/0.9)]",
    badgeBg: "bg-gradient-to-b from-[hsl(45_95%_60%)] to-[hsl(40_85%_45%)] text-black",
    gradient: "bg-gradient-to-b from-[hsl(45_95%_55%/0.9)] via-[hsl(40_85%_45%/0.7)] to-[hsl(35_70%_30%/0.4)]",
    glow: "bg-[hsl(45_95%_55%/0.35)]",
    height: "h-28 md:h-36",
    delay: "[animation-delay:0.1s]",
  },
  2: {
    ring: "ring-[hsl(0_0%_75%)] shadow-[0_0_40px_hsl(0_0%_75%/0.5)]",
    crown: "text-[hsl(0_0%_80%)] drop-shadow-[0_0_8px_hsl(0_0%_80%/0.8)]",
    badgeBg: "bg-gradient-to-b from-[hsl(0_0%_85%)] to-[hsl(0_0%_55%)] text-black",
    gradient: "bg-gradient-to-b from-[hsl(0_0%_80%/0.85)] via-[hsl(0_0%_55%/0.6)] to-[hsl(0_0%_25%/0.4)]",
    glow: "bg-[hsl(0_0%_75%/0.25)]",
    height: "h-20 md:h-24",
    delay: "[animation-delay:0.3s]",
  },
  3: {
    ring: "ring-[hsl(25_75%_50%)] shadow-[0_0_40px_hsl(25_75%_50%/0.5)]",
    crown: "text-[hsl(25_85%_55%)] drop-shadow-[0_0_8px_hsl(25_85%_55%/0.8)]",
    badgeBg: "bg-gradient-to-b from-[hsl(25_85%_55%)] to-[hsl(20_70%_35%)] text-black",
    gradient: "bg-gradient-to-b from-[hsl(25_75%_50%/0.85)] via-[hsl(20_70%_35%/0.6)] to-[hsl(15_60%_20%/0.4)]",
    glow: "bg-[hsl(25_75%_50%/0.25)]",
    height: "h-16 md:h-20",
    delay: "[animation-delay:0.5s]",
  },
};

const LeaderboardPreviewSection = () => {
  const top3 = FICTIONAL_TOP3;
  // Visual order: 2nd, 1st, 3rd
  const visualOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

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
          <div className="flex items-center justify-start gap-2 px-4 pt-4">
            <Crown className="h-5 w-5 text-accent fill-accent" />
            <span className="text-sm md:text-base font-bold tracking-wider text-accent uppercase">
              Top 10 Artists
            </span>
          </div>

          <div className="px-4 pt-6 pb-6 md:pt-10 md:pb-10 bg-gradient-to-b from-accent/5 to-transparent">
            <div className="flex items-end justify-center gap-2 md:gap-6 max-w-2xl mx-auto">
              {visualOrder.map((artist) => {
                const rank = top3.indexOf(artist) + 1;
                const s = podiumStyles[rank];
                const isFirst = rank === 1;
                return (
                  <div
                    key={artist.stage_name}
                    className={`flex-1 flex flex-col items-center animate-podium-rise ${s.delay}`}
                  >
                    <div className="group flex flex-col items-center w-full">
                      <Crown
                        className={`${isFirst ? "h-7 w-7 md:h-9 md:w-9" : "h-5 w-5 md:h-7 md:w-7"} ${s.crown} animate-crown-bounce fill-current`}
                        strokeWidth={1.5}
                      />
                      <div className="relative animate-podium-float mt-1 mb-3">
                        <div className={`absolute inset-0 rounded-full blur-2xl animate-podium-glow ${s.glow}`} />
                        <div className="relative">
                          <Avatar
                            className={`${isFirst ? "h-20 w-20 md:h-28 md:w-28" : "h-14 w-14 md:h-20 md:w-20"} ring-4 ${s.ring} transition-transform duration-300 group-hover:scale-105`}
                          >
                            <AvatarFallback className="bg-foreground">
                              <User className="h-8 w-8 text-background" fill="currentColor" />
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -top-2 -left-2 ${isFirst ? "h-8 w-8 text-sm md:h-9 md:w-9 md:text-base" : "h-7 w-7 text-xs md:h-8 md:w-8 md:text-sm"} rounded-full ${s.badgeBg} font-bold flex items-center justify-center shadow-lg ring-2 ring-background`}
                          >
                            {rank}
                          </div>
                        </div>
                      </div>
                      <div className="text-center w-full px-1">
                        <p
                          className={`font-semibold text-foreground truncate notranslate ${isFirst ? "text-sm md:text-lg" : "text-xs md:text-sm"}`}
                          data-user-content="true"
                          data-no-translate="true"
                          translate="no"
                        >
                          {artist.stage_name}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Star className={`${isFirst ? "h-4 w-4" : "h-3 w-3"} text-accent fill-accent`} />
                          <span
                            className={`font-semibold text-accent ${isFirst ? "text-sm md:text-base" : "text-xs md:text-sm"}`}
                          >
                            {artist.rating.toFixed(1)}
                          </span>
                        </div>
                        <p
                          className={`text-muted-foreground mt-0.5 ${isFirst ? "text-[11px] md:text-xs" : "text-[10px] md:text-xs"}`}
                        >
                          {artist.review_count} reviews
                        </p>
                      </div>
                    </div>
                    <div
                      className={`mt-3 w-full ${s.height} rounded-t-lg ${s.gradient} border-t border-x border-white/10 shadow-[inset_0_2px_0_hsl(0_0%_100%/0.15)] relative overflow-hidden`}
                    >
                      <div
                        className={`absolute inset-x-0 top-0 h-1 ${isFirst ? "bg-[hsl(45_95%_70%)]" : rank === 2 ? "bg-[hsl(0_0%_90%)]" : "bg-[hsl(25_85%_65%)]"} opacity-80`}
                      />
                      <div
                        className={`absolute inset-0 flex items-center justify-center text-3xl md:text-5xl font-black ${isFirst ? "text-black/30" : "text-black/25"}`}
                      >
                        {rank}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardPreviewSection;
