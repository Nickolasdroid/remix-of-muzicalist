import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import SocialStats from "@/components/SocialStats";
import { getAvatarOutlineClassesLarge } from "@/lib/subscriptionStyles";
import { useDominantColor } from "@/hooks/useDominantColor";

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
  /** No longer shown: profiles have no cover photo */
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
}: OfficialProfileHeaderProps) => {
  const headerColor = useDominantColor(avatarUrl);
  // Same header as artist profiles: big round photo, huge name, colour taken from the photo
  return (
    <div className="relative left-1/2 mb-2 w-screen -translate-x-1/2 md:left-0 md:-ml-8 md:w-[calc(100%+4rem)] md:translate-x-0">
      <header
        className="relative px-4 pb-5 pt-24 md:px-8 md:pb-6 md:pt-16 xl:pt-20"
        style={{ background: `linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%), ${headerColor}` }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-full -z-10 h-64"
          style={{ background: `linear-gradient(${headerColor.replace("rgb(", "rgba(").replace(")", ", 0.35)")}, transparent)` }}
        />
        <div className="relative z-10 flex items-end gap-4 md:gap-6">
          <div className={`relative p-1 rounded-full ${getAvatarOutlineClassesLarge(plan as any)} shadow-[0_4px_60px_rgba(0,0,0,0.5)] flex-shrink-0 group/avatar`}>
            <Avatar className="h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 xl:h-56 xl:w-56">
              <AvatarImage src={avatarUrl || undefined} alt={name} className="object-cover" />
              <AvatarFallback className="bg-foreground/10 font-display font-bold text-4xl">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {avatarExtra}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-white md:mb-2 md:text-sm">
              <VerifiedBadge size="sm" />
              <span>Admin</span>
            </p>
            <h1
              className="line-clamp-2 break-words font-figtree text-4xl font-black leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl notranslate"
              data-user-content="true"
              data-no-translate="true"
              translate="no"
            >
              {name}
            </h1>
            <SocialStats
              className="mt-2 md:mt-3"
              followersCount={followersCount}
              followingCount={followingCount}
              onFollowersClick={onFollowersClick}
              onFollowingClick={onFollowingClick}
              showFollowButton={showFollowButton}
              isFollowing={isFollowing}
              onFollowToggle={onFollowToggle}
            />
          </div>
        </div>
      </header>
    </div>
  );
};

export default OfficialProfileHeader;
