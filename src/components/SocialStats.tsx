import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface SocialStatsProps {
  followersCount: number;
  followingCount: number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  /** Show the Follow / Following action (only when viewing someone else's profile) */
  showFollowButton?: boolean;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  className?: string;
}

/**
 * Shared, compact social row used across artist/user dashboards and public profiles:
 *   "0 Followers · 2 Following"   [ Follow ]
 */
const SocialStats = ({
  followersCount,
  followingCount,
  onFollowersClick,
  onFollowingClick,
  showFollowButton = false,
  isFollowing = false,
  onFollowToggle,
  className = "",
}: SocialStatsProps) => {
  const { t } = useTranslation();

  return (
    <div className={`flex items-center gap-3 text-sm text-muted-foreground ${className}`}>
      <button
        type="button"
        onClick={onFollowersClick}
        disabled={!onFollowersClick}
        className="hover:text-foreground transition-colors disabled:cursor-default"
      >
        <span className="font-semibold text-foreground">{followersCount}</span> {t("social.followers")}
      </button>
      <span className="opacity-50" aria-hidden="true">·</span>
      <button
        type="button"
        onClick={onFollowingClick}
        disabled={!onFollowingClick}
        className="hover:text-foreground transition-colors disabled:cursor-default"
      >
        <span className="font-semibold text-foreground">{followingCount}</span> {t(showFollowButton ? "social.followingThirdPerson" : "social.following")}
      </button>

      {showFollowButton && (
        <Button
          onClick={onFollowToggle}
          variant={isFollowing ? "outline" : "secondary"}
          size="sm"
          className={`ml-auto rounded-full px-4 md:px-5 transition-all ${
            isFollowing
              ? "border-border bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              : "bg-secondary text-foreground hover:bg-secondary/80 hover:scale-[1.03]"
          }`}
        >
          {isFollowing ? t("social.followingAction") : t("social.follow")}
        </Button>
      )}
    </div>
  );
};

export default SocialStats;
