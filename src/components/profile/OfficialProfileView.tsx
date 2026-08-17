import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Megaphone } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import SocialStats from "@/components/SocialStats";
import FeedPostCard from "@/components/FeedPostCard";
import FeedAnnouncementCard from "@/components/FeedAnnouncementCard";
import { getAvatarOutlineClassesLarge } from "@/lib/subscriptionStyles";
import { getCoverGradient } from "@/lib/coverThemes";

export interface OfficialProfileData {
  id: string;
  stage_name?: string | null;
  first_name?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  cover_theme?: string | null;
  is_verified?: boolean | null;
  plan?: string | null;
  created_at?: string | null;
}


export interface OfficialPost {
  id: string;
  content: string;
  created_at: string;
  media_url: string | null;
  media_type: string | null;
  likes?: number;
  isLiked?: boolean;
  commentsCount?: number;
  promoted_until?: string | null;
}

export interface OfficialAnnouncement {
  id: string;
  description: string;
  created_at: string;
  is_premium?: boolean;
  media_url: string | null;
  media_type: string | null;
  location?: string | null;
  event_date?: string | null;
  budget?: string | number | null;
}

interface Props {
  profile: OfficialProfileData;
  posts: OfficialPost[];
  announcements: OfficialAnnouncement[];
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  onFollowToggle?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  onPostLike?: (id: string) => void;
  onComments?: (id: string, type: "post" | "announcement") => void;
  onShare?: (type: "post" | "announcement") => void;
  onMediaClick?: (media: { url: string; type: "image" | "video" }) => void;
  /** Rendered next to the header name (dashboard-only controls, e.g. avatar upload) */
  headerExtra?: React.ReactNode;
  /** Rendered above the Posts list (dashboard "+ Add" controls) */
  postsToolbar?: React.ReactNode;
  /** Rendered above the Announcements list (dashboard "+ Add" controls) */
  announcementsToolbar?: React.ReactNode;
  /** Per-item three-dot menu (dashboard management actions) */
  renderPostMenu?: (post: OfficialPost) => React.ReactNode;
  renderAnnouncementMenu?: (a: OfficialAnnouncement) => React.ReactNode;
  defaultTab?: string;
  value?: string;
  onValueChange?: (v: string) => void;
}

const triggerClass =
  "group relative flex flex-1 items-center justify-center gap-2 px-2 md:px-3 lg:px-4 py-2.5 rounded-xl border-0 font-medium text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-foreground/[0.04] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";
const indicatorClass =
  "pointer-events-none absolute bottom-0 left-1/2 h-[3px] w-[40%] -translate-x-1/2 rounded-full bg-[#D4AF37] opacity-0 transition-opacity duration-200 ease-in-out group-data-[state=active]:opacity-100";

/**
 * Official / Brand profile presentation (the Muzicalist account).
 *
 * Shares the same infrastructure as Artist and User profiles: the compact
 * SocialStats row and the canonical Feed content components — but exposes
 * only the two content types an official account produces.
 */
const OfficialProfileView = ({
  profile,
  posts,
  announcements,
  followersCount,
  followingCount,
  isFollowing,
  isOwnProfile,
  onFollowToggle,
  onFollowersClick,
  onFollowingClick,
  onPostLike,
  onComments,
  onShare,
  onMediaClick,
  headerExtra,
  postsToolbar,
  announcementsToolbar,
  renderPostMenu,
  renderAnnouncementMenu,
  defaultTab = "posts",
  value,
  onValueChange,
}: Props) => {
  const name = profile.stage_name || profile.first_name || "Muzicalist";

  const author = {
    id: profile.id,
    stageName: name,
    avatarUrl: profile.avatar_url,
    specializationLabel: "Admin",
    plan: profile.plan,
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <OfficialProfileHeader
        name={name}
        avatarUrl={profile.avatar_url}
        coverUrl={profile.cover_url}
        coverTheme={profile.cover_theme}
        plan={profile.plan}
        followersCount={followersCount}
        followingCount={followingCount}
        isFollowing={isFollowing}
        showFollowButton={!isOwnProfile}
        onFollowToggle={onFollowToggle}
        onFollowersClick={onFollowersClick}
        onFollowingClick={onFollowingClick}
        avatarExtra={headerExtra}
      />



      <Tabs value={value} defaultValue={value ? undefined : defaultTab} onValueChange={onValueChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6 h-auto p-1 md:p-1.5 gap-0.5 rounded-none md:rounded-[18px] -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full bg-card dark:bg-[#111111] border-y md:border border-border dark:border-[#2A2A2A]">
          <TabsTrigger value="posts" className={triggerClass}>
            <FileText strokeWidth={2.25} className="h-[1.4rem] w-[1.4rem] md:h-[1.15rem] md:w-[1.15rem] group-data-[state=active]:text-[#D4AF37]" />
            <span className="hidden sm:inline">Posts</span>
            <span className={indicatorClass} />
          </TabsTrigger>
          <TabsTrigger value="announcements" className={triggerClass}>
            <Megaphone strokeWidth={2.25} className="h-[1.4rem] w-[1.4rem] md:h-[1.15rem] md:w-[1.15rem] group-data-[state=active]:text-[#D4AF37]" />
            <span className="hidden sm:inline">Announcements</span>
            <span className={indicatorClass} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {postsToolbar}
          <div className="-mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
            <div className="w-full max-w-[500px] mx-auto space-y-3 md:space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg mx-4 md:mx-0">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No posts yet.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <FeedPostCard
                    key={post.id}
                    author={author}
                    content={post.content}
                    createdAt={post.created_at}
                    mediaUrl={post.media_url}
                    mediaType={post.media_type}
                    likes={post.likes || 0}
                    commentsCount={post.commentsCount || 0}
                    isLiked={!!post.isLiked}
                    promoted={!!post.promoted_until && new Date(post.promoted_until).getTime() > Date.now()}
                    menu={renderPostMenu?.(post)}
                    onLike={() => onPostLike?.(post.id)}
                    onComment={() => onComments?.(post.id, "post")}
                    onShare={() => onShare?.("post")}
                    onMediaClick={() =>
                      post.media_url &&
                      onMediaClick?.({ url: post.media_url, type: post.media_type === "video" ? "video" : "image" })
                    }
                  />
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="announcements">
          {announcementsToolbar}
          <div className="-mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
            <div className="w-full max-w-[500px] mx-auto space-y-3 md:space-y-4">
              {announcements.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg mx-4 md:mx-0">
                  <Megaphone className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No announcements yet.</p>
                </div>
              ) : (
                announcements.map((a) => (
                  <FeedAnnouncementCard
                    key={a.id}
                    author={author}
                    createdAt={a.created_at}
                    description={a.description}
                    location={a.location}
                    eventDate={a.event_date}
                    budget={a.budget}
                    typeLabel={a.is_premium ? "Promotion" : "Announcement"}
                    mediaUrl={a.media_url}
                    mediaType={a.media_type}
                    menu={renderAnnouncementMenu?.(a)}
                    onMediaClick={() =>
                      a.media_url &&
                      onMediaClick?.({ url: a.media_url, type: a.media_type === "video" ? "video" : "image" })
                    }
                  />
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfficialProfileView;
