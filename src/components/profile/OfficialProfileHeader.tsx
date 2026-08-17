import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import SocialStats from "@/components/SocialStats";
import { getAvatarOutlineClassesLarge } from "@/lib/subscriptionStyles";
import { getCoverGradient } from "@/lib/coverThemes";

export interface OfficialProfileHeaderProps {
  name: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  coverTheme?: string | null;
  plan?: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  showFollowButton?: boolean;
  onFollowToggle?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  /** Rendered inside the avatar ring (e.g. dashboard upload overlay) */
  avatarExtra?: React.ReactNode;
  /** Rendered on top of the cover (e.g. dashboard cover controls) */
  coverExtra?: React.ReactNode;
}

/**
 * Single source of truth for the Muzicalist Admin profile presentation.
 * Used by both the public admin profile and the admin dashboard.
 */
const OfficialProfileHeader = ({
  name,
  avatarUrl,
  coverUrl,
  coverTheme,
  plan,
  followersCount,
  followingCount,
  isFollowing,
  showFollowButton,
  onFollowToggle,
  onFollowersClick,
  onFollowingClick,
  avatarExtra,
  coverExtra,
}: OfficialProfileHeaderProps) => {
  return (
    <div className="relative left-1/2 mb-6 w-screen -translate-x-1/2 md:left-0 md:mb-8 md:w-full md:translate-x-0">
      <div className="relative w-full aspect-[16/7] md:aspect-[16/6] lg:aspect-[16/5] xl:aspect-[16/4] md:rounded-2xl overflow-hidden bg-gradient-to-br from-accent/20 via-card to-secondary">
        {coverUrl ? (
          <img src={coverUrl} alt={`${name} cover`} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: getCoverGradient(coverTheme) }} />
        )}

        {/* Smooth fade into the page background */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-full"
          style={{
            background:
              "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.98) 12%, hsl(var(--background) / 0.9) 25%, hsl(var(--background) / 0.7) 42%, hsl(var(--background) / 0.45) 60%, hsl(var(--background) / 0.2) 78%, hsl(var(--background) / 0) 100%)",
          }}
        />

        {coverExtra}
      </div>

      <div className="px-4 md:px-0 -mt-10 md:-mt-12 lg:-mt-14 xl:-mt-16 flex items-end gap-3 md:gap-4 lg:gap-5 relative z-10">
        <div
          className={`relative p-1 rounded-full ${getAvatarOutlineClassesLarge(plan as any)} shadow-xl flex-shrink-0 group/avatar`}
        >
          <Avatar className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 border-2 md:border-4 border-background">
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-accent/30 to-accent/10 font-display font-bold text-2xl">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {avatarExtra}
        </div>
        <div className="flex-1 min-w-0 pb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h1
              className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-display font-bold text-foreground truncate notranslate"
              data-user-content="true"
              data-no-translate="true"
              translate="no"
            >
              {name}
            </h1>
            <VerifiedBadge size="md" />
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground text-sm md:text-sm lg:text-base mt-0.5 md:mt-1 flex-wrap">
            <span className="font-medium">Admin</span>
          </div>
        </div>
      </div>

      <SocialStats
        className="mx-4 md:mx-0 mt-3 md:mt-4"
        followersCount={followersCount}
        followingCount={followingCount}
        onFollowersClick={onFollowersClick}
        onFollowingClick={onFollowingClick}
        showFollowButton={showFollowButton}
        isFollowing={isFollowing}
        onFollowToggle={onFollowToggle}
      />
    </div>
  );
};

export default OfficialProfileHeader;
