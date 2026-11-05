import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useState, type ReactNode } from "react";
import { FileText, Megaphone } from "lucide-react";
import ContentKindChips, { announcementKind, type ContentKind } from "@/components/profile/ContentKindChips";
import FeedPostCard from "@/components/FeedPostCard";
import AnnouncementList from "@/components/opportunities/AnnouncementList";
import OfficialProfileHeader from "@/components/profile/OfficialProfileHeader";
import { SectionHeaderWithUsage } from "@/components/dashboard/SectionLayout";
import { PostsGrid, PostsViewSwitcher, usePostsViewMode } from "@/components/post/PostsView";


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
  /** Several photos (posts.media jsonb) */
  media?: unknown;
  /** Availability post date */
  available_on?: string | null;
  available_from?: string | null;
  available_until?: string | null;
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
  headerExtra?: ReactNode;
  /** Rendered above the Posts list (dashboard "+ Add" controls) */
  postsToolbar?: ReactNode;
  /** Rendered above the Announcements list (dashboard "+ Add" controls) */
  announcementsToolbar?: ReactNode;
  /** Per-item three-dot menu (dashboard management actions) */
  renderPostMenu?: (post: OfficialPost) => ReactNode;
  renderAnnouncementMenu?: (a: OfficialAnnouncement) => ReactNode;
  defaultTab?: string;
  value?: string;
  onValueChange?: (v: string) => void;
}

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
  const [postsViewMode, setPostsViewMode] = usePostsViewMode();
  // Posts · Events · Collaborations, the same names as in the feed
  const [kind, setKind] = useState<ContentKind>(value === "announcements" || defaultTab === "announcements" ? "collab" : "posts");
  const hasGig = (announcements as any[]).some((a) => announcementKind(a, "gig") === "gig");
  const hasCollab = (announcements as any[]).some((a) => announcementKind(a, "gig") === "collab");

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



      <Tabs value="posts" onValueChange={onValueChange} className="w-full">

        <TabsContent value="posts">
          <ContentKindChips
            value={kind}
            onChange={setKind}
            className="mb-4"
            options={[{ k: "posts" }, ...(hasGig || (isOwnProfile && announcementsToolbar) ? [{ k: "gig" as const }] : []), ...(hasCollab ? [{ k: "collab" as const }] : [])]}
          />
          {kind === "posts" ? <>
          <SectionHeaderWithUsage
            icon={<FileText className="h-5 w-5 text-accent" />}
            title="Posts"
            action={<div className="flex items-center gap-2"><PostsViewSwitcher mode={postsViewMode} onChange={setPostsViewMode} />{postsToolbar}</div>}
            className="mb-4"
          />
          <div className="-mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
            <div className="w-full max-w-[500px] mx-auto space-y-2 md:space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-lg mx-4 md:mx-0">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No posts yet.</p>
                </div>
              ) : postsViewMode === "grid" ? (
                <>
                  <PostsGrid
                    items={posts.map((post) => ({ id: post.id, kind: "post", text: post.content, mediaUrl: post.media_url, mediaType: post.media_type }))}
                  />
                </>
              ) : (
                posts.map((post) => (
                  <FeedPostCard
                    key={post.id}
                    postId={post.id}
                    author={author}
                    content={post.content}
                    createdAt={post.created_at}
                    mediaUrl={post.media_url}
                    mediaType={post.media_type}
                    media={post.media}
                    availableOn={post.available_on}
                    availableFrom={post.available_from}
                    availableUntil={post.available_until}
                    likes={post.likes || 0}
                    commentsCount={post.commentsCount || 0}
                    isLiked={!!post.isLiked}
                    promoted={!!post.promoted_until && new Date(post.promoted_until).getTime() > Date.now()}
                    menu={renderPostMenu?.(post)}
                    onLike={() => onPostLike?.(post.id)}
                    onComment={() => onComments?.(post.id, "post")}
                    onShare={() => onShare?.("post")}
                    onMediaClick={(it) => it && onMediaClick?.(it)}
                  />
                ))
              )}
            </div>
          </div>
          </> : <>
          {announcementsToolbar}
          <div className="-mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
            <div className="w-full max-w-[500px] mx-auto space-y-2 md:space-y-4">
              <AnnouncementList
                announcements={(announcements as any[]).filter((a) => announcementKind(a, "gig") === kind)}
                profile={profile as any}
                onMediaClick={(m) => onMediaClick?.(m)}
                empty={
                  <div className="text-center py-12 border border-dashed border-border rounded-lg mx-4 md:mx-0">
                    <Megaphone className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">Nothing here yet.</p>
                  </div>
                }
              />
            </div>
          </div>
          </>}
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default OfficialProfileView;
