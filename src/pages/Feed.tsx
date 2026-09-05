import { useState, useEffect, useCallback, useRef } from "react";
import { formatSmartDate, formatDateNoYear } from "@/lib/utils";
import { Heart, MessageCircle, MoreHorizontal, Flag, Globe, Trash2, Loader2, Send, Calendar, MapPin, DollarSign, ArrowRight, Plus, Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import PostMediaFrame from "@/components/PostMediaFrame";
import ExpandableText, { TextMention } from "@/components/ExpandableText";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PostActionsMenu from "@/components/PostActionsMenu";
import PromotePostDialog from "@/components/PromotePostDialog";
import { getPostPromotionLimit, PROMOTION_SLOT_KIND } from "@/lib/planLimits";
import { rankFeedItems, isPromotionActive } from "@/lib/feedRanking";
import { getPeriodStart } from "@/lib/billingPeriod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { LikeCountButton } from "@/components/LikesDialog";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import InstagramZoomPreview from "@/components/InstagramZoomPreview";
import SmoothVideoPlayer from "@/components/SmoothVideoPlayer";
import GuestContentGate from "@/components/GuestContentGate";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useMobileBottomNavSpacing } from "@/hooks/use-mobile-bottom-nav-spacing";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";
import { isAdExpired } from "@/lib/adExpiration";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminIds } from "@/hooks/useAdminIds";
import VerifiedBadge from "@/components/VerifiedBadge";
import AdminDeleteContentDialog from "@/components/AdminDeleteContentDialog";
import ReportContentDialog, { ReportableType } from "@/components/ReportContentDialog";
import CommentsDialog from "@/components/CommentsDialog";
import { sharePost } from "@/lib/sharePost";
import SEO from "@/components/SEO";
import { translateSpecialization } from "@/lib/specializationLabel";

const POSTS_PER_PAGE = 10;

/** Known post sources. Unknown/future values fall back to "user" behaviour. */
type PostKind = "user" | "artist_joined";

interface FeedItem {
  id: string;
  profile_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  profile: {
    stage_name: string;
    avatar_url: string | null;
    specialization: string | null;
    plan: string;
  };
  isLiked: boolean;
  isSaved: boolean;
  likes: number;
  commentsCount: number;
  type: "post" | "announcement";
  /** Post source: regular member post or auto-generated artist introduction */
  postKind?: PostKind;
  /** Only set for `artist_joined` posts: the artist being introduced */
  subjectProfileId?: string | null;
  /** Real profile mentions attached to this content (from `post_mentions`) */
  mentions?: TextMention[];
  promoted?: boolean;
  promotedUntil?: string | null;
  /** Optional ranking signal (see lib/feedRanking) */
  engagement?: number;
}

interface MediaPreview {
  url: string;
  type: "image" | "video";
}

const Feed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const errorNotifiedRef = useRef(false);
  const [page, setPage] = useState(0);
  const [canCreate, setCanCreate] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useUserRole();
  const adminIds = useAdminIds();
  const [adminDeleteTarget, setAdminDeleteTarget] = useState<{ id: string; type: "post" | "announcement" } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string; type: ReportableType } | null>(null);
  const [commentsTarget, setCommentsTarget] = useState<{ id: string; type: "post" | "announcement" } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // Existing promotion entitlement, reused from the Dashboard business logic.
  const [promotionLimit, setPromotionLimit] = useState(0);
  const [promotionsUsed, setPromotionsUsed] = useState(0);
  const [promoteTarget, setPromoteTarget] = useState<{ id: string; promotedUntil: string | null } | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const promotionsRemaining = promotionLimit - promotionsUsed;

  // Deep link support: /feed?post=<id> (used by mention notifications).
  useEffect(() => {
    const targetId = searchParams.get("post");
    if (!targetId || loading) return;
    const el = document.getElementById(`feed-post-${targetId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchParams, loading, feedItems]);

  useEffect(() => {
    // Background auth check; doesn't block the feed fetch
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        const { data: prof } = await supabase
          .from('profiles')
          .select('plan, specialization, billing, subscription_current_period_end')
          .eq('id', session.user.id)
          .maybeSingle();
        if (prof?.specialization && (prof.plan === 'Standard' || prof.plan === 'Premium')) {
          setCanCreate(true);
        }
        if (prof?.specialization) {
          setPromotionLimit(getPostPromotionLimit(prof.plan));
          const { data: slots } = await supabase
            .from('consumed_ad_slots')
            .select('consumed_at, kind')
            .eq('profile_id', session.user.id)
            .gte('consumed_at', getPeriodStart(prof as any).toISOString());
          setPromotionsUsed((slots || []).filter((s: any) => s.kind === PROMOTION_SLOT_KIND.post).length);
        }
      }
    });
  }, []);

  const fetchPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      const from = pageNum * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      // Fetch posts and premium announcements in parallel, joining the profile in one go
      const [postsRes, promosRes] = await Promise.all([
        supabase
          .from('posts')
          // `posts` has two FKs to `profiles` (author + introduced artist), so the
          // author embed must be disambiguated explicitly by constraint name.
          .select(`id, profile_id, content, media_url, media_type, created_at, promoted_until, post_kind, subject_profile_id, profiles!posts_profile_id_fkey!inner (stage_name, avatar_url, specialization, plan)`)
          .order('created_at', { ascending: false })
          .range(from, to),
        supabase
          .from('announcements')
          .select(`*, profiles!inner (avatar_url, stage_name, county, specialization, plan, country)`)
          .eq('is_premium', true)
          .order('created_at', { ascending: false })
          .range(from, to),
      ]);

      if (postsRes.error) throw postsRes.error;

      const posts = (postsRes.data || []) as any[];
      const promotions = (promosRes.data || []).filter((a: any) => !isAdExpired(a)) as any[];

      if (posts.length < POSTS_PER_PAGE && promotions.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }

      const postIds = posts.map(p => p.id);
      const promoIds = promotions.map(p => p.id);

      // Batch likes counts, comment counts, mentions and (optionally) the current user's likes — eliminates N+1
      const [postLikesRes, promoLikesRes, userPostLikesRes, userPromoLikesRes, postCommentsRes, promoCommentsRes, mentionsRes] = await Promise.all([
        postIds.length
          ? supabase.from('post_likes').select('post_id').in('post_id', postIds)
          : Promise.resolve({ data: [] as any[] }),
        promoIds.length
          ? (supabase as any).from('announcement_likes').select('announcement_id').in('announcement_id', promoIds)
          : Promise.resolve({ data: [] as any[] }),
        currentUserId && postIds.length
          ? supabase.from('post_likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds)
          : Promise.resolve({ data: [] as any[] }),
        currentUserId && promoIds.length
          ? (supabase as any).from('announcement_likes').select('announcement_id').eq('user_id', currentUserId).in('announcement_id', promoIds)
          : Promise.resolve({ data: [] as any[] }),
        postIds.length
          ? (supabase as any).from('comments').select('post_id').in('post_id', postIds)
          : Promise.resolve({ data: [] as any[] }),
        promoIds.length
          ? (supabase as any).from('comments').select('announcement_id').in('announcement_id', promoIds)
          : Promise.resolve({ data: [] as any[] }),
        // One batched request for every mention on this page — no N+1.
        postIds.length
          ? (supabase as any)
              .from('post_mentions')
              .select('post_id, mentioned_profile_id, profiles!post_mentions_mentioned_profile_id_fkey (stage_name, slug)')
              .in('post_id', postIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const postLikeCounts = new Map<string, number>();
      (postLikesRes.data || []).forEach((r: any) => postLikeCounts.set(r.post_id, (postLikeCounts.get(r.post_id) || 0) + 1));
      const promoLikeCounts = new Map<string, number>();
      (promoLikesRes.data || []).forEach((r: any) => promoLikeCounts.set(r.announcement_id, (promoLikeCounts.get(r.announcement_id) || 0) + 1));
      const userPostLikes = new Set<string>((userPostLikesRes.data || []).map((r: any) => r.post_id));
      const userPromoLikes = new Set<string>((userPromoLikesRes.data || []).map((r: any) => r.announcement_id));
      const postCommentCounts = new Map<string, number>();
      (postCommentsRes.data || []).forEach((r: any) => postCommentCounts.set(r.post_id, (postCommentCounts.get(r.post_id) || 0) + 1));
      const promoCommentCounts = new Map<string, number>();
      (promoCommentsRes.data || []).forEach((r: any) => promoCommentCounts.set(r.announcement_id, (promoCommentCounts.get(r.announcement_id) || 0) + 1));
      // Mentions are optional: posts without any simply get an empty list.
      const mentionsByPost = new Map<string, TextMention[]>();
      ((mentionsRes as any)?.data || []).forEach((r: any) => {
        if (!r.profiles?.stage_name) return;
        const list = mentionsByPost.get(r.post_id) || [];
        list.push({ profileId: r.mentioned_profile_id, name: r.profiles.stage_name, slug: r.profiles.slug });
        mentionsByPost.set(r.post_id, list);
      });


      const postsWithProfiles: FeedItem[] = posts.map((post: any) => ({
        id: post.id,
        profile_id: post.profile_id,
        content: post.content,
        media_url: post.media_url,
        media_type: post.media_type,
        created_at: post.created_at,
        profile: post.profiles || { stage_name: 'Unknown Artist', avatar_url: null, specialization: null, plan: 'Free' },
        isLiked: userPostLikes.has(post.id),
        isSaved: false,
        likes: postLikeCounts.get(post.id) || 0,
        commentsCount: postCommentCounts.get(post.id) || 0,
        type: "post" as const,
        postKind: post.post_kind === "artist_joined" ? "artist_joined" : "user",
        subjectProfileId: post.subject_profile_id ?? null,
        mentions: mentionsByPost.get(post.id) || [],
        promoted: !!post.promoted_until && new Date(post.promoted_until).getTime() > Date.now(),
        promotedUntil: post.promoted_until || null,
      }));

      const promoItems: FeedItem[] = promotions.map((a: any) => ({
        id: a.id,
        profile_id: a.profile_id,
        content: a.description,
        media_url: a.media_url,
        media_type: a.media_type,
        created_at: a.created_at,
        profile: {
          stage_name: a.profiles?.stage_name || 'Unknown Artist',
          avatar_url: a.profiles?.avatar_url || null,
          specialization: a.profiles?.specialization || null,
          plan: a.profiles?.plan || 'Free',
        },
        isLiked: userPromoLikes.has(a.id),
        isSaved: false,
        likes: promoLikeCounts.get(a.id) || 0,
        commentsCount: promoCommentCounts.get(a.id) || 0,
        type: "announcement" as const,
        promoted: isPromotionActive(a),
        promotedUntil: a.promoted_until || null,
      }));

      // ONE unified feed: normal and promoted content ranked together.
      // Promotion is only an extra ranking signal (see lib/feedRanking).
      const combined = rankFeedItems(
        [...postsWithProfiles, ...promoItems].map((item) => ({
          ...item,
          engagement: item.likes + item.commentsCount,
        })),
      );

      if (append) {
        setFeedItems(prev => [...prev, ...combined]);
      } else {
        setFeedItems(combined);
      }
      setLoadError(false);
      errorNotifiedRef.current = false;
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Stop the infinite-scroll sentinel from re-firing the same failed request
      // in a loop; surface the failure once and let the user retry manually.
      setHasMore(false);
      setLoadError(true);
      if (!errorNotifiedRef.current) {
        errorNotifiedRef.current = true;
        toast({
          title: "Error",
          description: "Failed to load posts. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  const loadMorePosts = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPosts(nextPage, true);
  }, [page, fetchPosts]);

  const { loadMoreRef, isLoadingMore } = useInfiniteScroll(loadMorePosts, hasMore);
  const needsBottomSpacing = useMobileBottomNavSpacing(contentRef, [feedItems.length, loading, canCreate, page, hasMore]);

  const handleLike = async (id: string) => {
    if (!currentUserId) {
      toast({
        title: "Login Required",
        description: "Please log in to like posts."
      });
      navigate('/login');
      return;
    }
    const item = feedItems.find(i => i.id === id);
    if (!item) return;

    setFeedItems(items => items.map(i => i.id === id ? {
      ...i,
      isLiked: !i.isLiked,
      likes: i.isLiked ? Math.max(0, i.likes - 1) : i.likes + 1
    } : i));
    try {
      if (item.isLiked) {
        if (item.type === "announcement") {
          await (supabase as any).from('announcement_likes').delete().eq('announcement_id', id).eq('user_id', currentUserId);
        } else {
          await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', currentUserId);
        }
      } else {
        if (item.type === "announcement") {
          await (supabase as any).from('announcement_likes').insert({ announcement_id: id, user_id: currentUserId });
        } else {
          await supabase.from('post_likes').insert({ post_id: id, user_id: currentUserId });
        }
      }
    } catch (error) {
      setFeedItems(items => items.map(i => i.id === id ? {
        ...i,
        isLiked: item.isLiked,
        likes: item.likes
      } : i));
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = (id: string) => {
    setFeedItems(items => items.map(item => item.id === id ? {
      ...item,
      isSaved: !item.isSaved
    } : item));
  };

  const handleContact = (profileId: string, adId?: string) => {
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    if (profileId === currentUserId) return;

    const params = new URLSearchParams({ artistId: profileId });
    if (adId) params.set('adId', adId);
    navigate(`/messages?${params.toString()}`);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setFeedItems(items => items.filter(item => item.id !== postId));
      toast({ title: "Post deleted", description: "Your post has been deleted." });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" });
    } finally {
      setDeletePostId(null);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', announcementId);
      if (error) throw error;
      setFeedItems(items => items.filter(item => item.id !== announcementId));
      toast({ title: "Announcement deleted", description: "Your announcement has been deleted." });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({ title: "Error", description: "Failed to delete announcement.", variant: "destructive" });
    } finally {
      setDeleteAnnouncementId(null);
    }
  };

  const getSpecializationLabel = (specialization: string | null, profileId?: string) => {
    if (profileId && adminIds.has(profileId)) return "Admin";
    if (!specialization) return "User";
    return translateSpecialization(specialization);
  };

  const formatDate = formatSmartDate;

  if (loading) {
    return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-background mx-0`}>
        <Navigation />
        <div className={`container mx-auto px-4 pt-20 ${currentUserId ? 'md:pt-8' : 'md:pt-24'} pb-20 md:pb-12`}>
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-display font-bold text-foreground mb-8">Posts</h1>
            <div className="space-y-6">
              {[1, 2, 3].map(i => <Card key={i} className="overflow-hidden border-border/40 animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </div>
      </div>;
  }

  return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-background mx-0`}>
      <SEO
        title="Musical Community Feed | Muzicalist"
        description="Discover the latest posts, announcements and promotions from musical artists worldwide on Muzicalist."
        path="/feed"
      />
      <Navigation />
      
      <div className={`container mx-auto sm:px-4 pt-[60px] ${currentUserId ? 'md:pt-2' : 'md:pt-20'} ${needsBottomSpacing ? 'pb-16' : 'pb-0'} md:pb-0 px-0`}>
        <div ref={contentRef} className="max-w-[500px] mx-auto space-y-1">
          <h1 className="sr-only">Musical Community Feed</h1>
          
          {(() => {
            const filteredAll = feedItems;
            const GUEST_PREVIEW_COUNT = 2;
            const isGuest = !currentUserId;
            const filtered = isGuest ? filteredAll.slice(0, GUEST_PREVIEW_COUNT) : filteredAll;
            return filtered.length === 0 ? (loadError ? <Card className="p-8 text-center space-y-3">
              <p className="text-muted-foreground">Couldn't load the feed right now.</p>
              <Button variant="outline" onClick={() => { setLoadError(false); setHasMore(true); setPage(0); setLoading(true); fetchPosts(0); }}>
                Try again
              </Button>
            </Card> : <Card className="p-8 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
            </Card>) : filtered.map(item =>
              item.type === "announcement" ? (
                /* Promotion Card */
                <Card key={`promo-${item.id}`} className="text-card-foreground overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary bg-background border-0">
                  <div className="p-4 pb-0 border-black border-none shadow-none rounded-none px-[6px] py-[3px]">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Link to={`/artist/${item.profile_id}`}>
                          <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(item.profile.plan)}`}>
                            <Avatar className="w-10 h-10 cursor-pointer border-2 border-background">
                              <AvatarImage src={item.profile.avatar_url || ""} alt={item.profile.stage_name} />
                              <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                {item.profile.stage_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </Link>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link to={`/artist/${item.profile_id}`}>
                              <h3 className="font-medium text-foreground cursor-pointer hover:underline notranslate" data-user-content="true" data-no-translate="true" translate="no">
                                {item.profile.stage_name}
                              </h3>
                            </Link>
                            {adminIds.has(item.profile_id) && <VerifiedBadge size="sm" />}

                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{getSpecializationLabel(item.profile.specialization, item.profile_id)}</span>
                            <span>·</span>
                            <span>{formatDate(item.created_at)}</span>
                            <span>·</span>
                            <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                              Promotion
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <PostActionsMenu
                        open={openMenuId === `announcement-${item.id}`}
                        onOpenChange={(open) => setOpenMenuId(open ? `announcement-${item.id}` : null)}
                        actions={[
                          {
                            key: 'report',
                            label: t('dashboardPosts.report', 'Report'),
                            icon: Flag,
                            onSelect: () => {
                              if (!currentUserId) { navigate("/login"); return; }
                              setReportTarget({ id: item.id, type: "announcement" });
                            },
                          },
                          ...(currentUserId === item.profile_id ? [{
                            key: 'delete',
                            label: t('dashboardPosts.delete', 'Delete'),
                            icon: Trash2,
                            destructive: true,
                            onSelect: () => setDeleteAnnouncementId(item.id),
                          }] : []),
                          ...(isAdmin && currentUserId !== item.profile_id ? [{
                            key: 'admin-delete',
                            label: t('dashboardPosts.deleteAdmin', 'Delete (admin)'),
                            icon: Trash2,
                            destructive: true,
                            onSelect: () => setAdminDeleteTarget({ id: item.id, type: "announcement" }),
                          }] : []),
                        ]}
                      />
                    </div>

                    <ExpandableText text={item.content} className="mt-3 my-[5px]" />
                  </div>
                  
                  {item.media_url && <PostMediaFrame url={item.media_url} type={item.media_type} alt="Announcement media" onClick={() => setMediaPreview({
                    url: item.media_url!,
                    type: item.media_type === "video" ? "video" : "image"
                  })} />}
                  <div className="flex items-center gap-2 px-2 py-0 mt-1">
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLike(item.id)}
                        aria-label={item.isLiked ? "Unlike promotion" : "Like promotion"}
                        aria-pressed={item.isLiked}
                        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-7 [&_svg]:shrink-0 h-10 w-10 rounded-full hover:bg-transparent hover:text-inherit active:bg-transparent text-muted-foreground mx-0 my-0 px-0 py-0 ${item.isLiked ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        <Heart className={`lucide lucide-heart !h-7 !w-7 ${item.isLiked ? "fill-current" : ""}`} />
                      </Button>
                      <LikeCountButton count={item.likes} targetId={item.id} targetType="announcement" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCommentsTarget({ id: item.id, type: "announcement" })}
                          aria-label="Comment"
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-7 [&_svg]:shrink-0 h-10 w-10 rounded-full hover:bg-transparent hover:text-inherit active:bg-transparent text-muted-foreground mx-0 my-0 px-0 py-0"
                        >
                          <MessageCircle className="lucide lucide-message-circle !w-7 !h-7" />
                        </Button>
                        {item.commentsCount > 0 && <span className="text-sm font-semibold text-foreground -ml-1">{item.commentsCount}</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => sharePost({ profileId: item.profile_id, stageName: item.profile.stage_name, type: "announcement" })}
                        aria-label="Share"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-7 [&_svg]:shrink-0 h-10 w-10 rounded-full hover:bg-transparent hover:text-inherit active:bg-transparent text-muted-foreground mx-0 my-0 px-0 py-0"
                      >
                        <Send className="lucide lucide-share-2 !w-7 !h-7 rotate-[20deg]" />
                      </Button>
                    </div>
                  </div>

                </Card>
              ) : (
                /* Regular Post Card */
                <Card key={item.id} id={`feed-post-${item.id}`} className="text-card-foreground overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary bg-background border-0">
                <div className="p-4 pb-0 border-black border-none shadow-none rounded-none px-[6px] py-[3px]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(item.profile.plan)}`}>
                        <Avatar className="w-10 h-10 cursor-pointer border-2 border-background" onClick={() => navigate(`/artist/${item.profile_id}`)}>
                          <AvatarImage src={item.profile.avatar_url || undefined} alt={item.profile.stage_name} />
                          <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                            {item.profile.stage_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground cursor-pointer hover:underline notranslate" data-user-content="true" data-no-translate="true" translate="no" onClick={() => navigate(`/artist/${item.profile_id}`)}>
                            {item.profile.stage_name}
                          </h3>
                          {adminIds.has(item.profile_id) && <VerifiedBadge size="sm" />}

                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{getSpecializationLabel(item.profile.specialization, item.profile_id)}</span>
                          <span>·</span>
                          <span>{formatDate(item.created_at)}</span>
                          <span>·</span>
                          <Globe className="h-3 w-3" />
                          {item.promoted && (
                            <>
                              <span>·</span>
                              <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                                {t("postPromotion.promoted", "Promoted")}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <PostActionsMenu
                      open={openMenuId === `post-${item.id}`}
                      onOpenChange={(open) => setOpenMenuId(open ? `post-${item.id}` : null)}
                      actions={[
                        {
                          key: 'report',
                          label: t('dashboardPosts.report', 'Report'),
                          icon: Flag,
                          onSelect: () => {
                            if (!currentUserId) { navigate("/login"); return; }
                            setReportTarget({ id: item.id, type: "post" });
                          },
                        },
                        // Promote is only exposed to the post owner when their plan grants entitlements.
                        ...(currentUserId === item.profile_id && promotionLimit > 0 ? [{
                          key: 'promote',
                          label: item.promoted
                            ? t('postPromotion.managePromotion', 'Manage promotion')
                            : t('postPromotion.promote', 'Promote'),
                          icon: Megaphone,
                          onSelect: () => setPromoteTarget({ id: item.id, promotedUntil: item.promotedUntil || null }),
                        }] : []),
                        ...(currentUserId === item.profile_id ? [{
                          key: 'delete',
                          label: t('dashboardPosts.delete', 'Delete'),
                          icon: Trash2,
                          destructive: true,
                          onSelect: () => setDeletePostId(item.id),
                        }] : []),
                        ...(isAdmin && currentUserId !== item.profile_id ? [{
                          key: 'admin-delete',
                          label: t('dashboardPosts.deleteAdmin', 'Delete (admin)'),
                          icon: Trash2,
                          destructive: true,
                          onSelect: () => setAdminDeleteTarget({ id: item.id, type: "post" }),
                        }] : []),
                      ]}
                    />
                  </div>

                  <ExpandableText text={item.content} className="mt-3 my-[5px]" mentions={item.mentions} />
                </div>
                
                {item.media_url && <PostMediaFrame url={item.media_url} type={item.media_type} alt="Post content" onClick={() => setMediaPreview({
            url: item.media_url!,
            type: item.media_type === "video" ? "video" : "image"
          })} />}
                <div className="flex items-center gap-2 px-2 py-0 mt-1">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleLike(item.id)}
                      aria-label={item.isLiked ? "Unlike post" : "Like post"}
                      aria-pressed={item.isLiked}
                      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-7 [&_svg]:shrink-0 h-10 w-10 rounded-full hover:bg-transparent hover:text-inherit active:bg-transparent text-muted-foreground mx-0 my-0 px-0 py-0 ${item.isLiked ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      <Heart className={`lucide lucide-heart !h-7 !w-7 ${item.isLiked ? "fill-current" : ""}`} />
                    </Button>
                    <LikeCountButton count={item.likes} targetId={item.id} />
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCommentsTarget({ id: item.id, type: "post" })}
                        aria-label="Comment"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-7 [&_svg]:shrink-0 h-10 w-10 rounded-full hover:bg-transparent hover:text-inherit active:bg-transparent text-muted-foreground mx-0 my-0 px-0 py-0"
                      >
                        <MessageCircle className="lucide lucide-message-circle !w-7 !h-7" />
                      </Button>
                      {item.commentsCount > 0 && <span className="text-sm font-semibold text-foreground -ml-1">{item.commentsCount}</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => sharePost({ profileId: item.profile_id, stageName: item.profile.stage_name, type: "post" })}
                      aria-label="Share"
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-7 [&_svg]:shrink-0 h-10 w-10 rounded-full hover:bg-transparent hover:text-inherit active:bg-transparent text-muted-foreground mx-0 my-0 px-0 py-0"
                    >
                      <Send className="lucide lucide-share-2 !w-7 !h-7 rotate-[20deg]" />
                    </Button>
                  </div>
                </div>

              </Card>
              )
            )
          })()}
          
          {currentUserId ? (
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more posts...</span>
                </div>
              )}
              {!hasMore && feedItems.length > 0 && (
                <p className="text-muted-foreground text-sm">No more posts to load</p>
              )}
            </div>
          ) : (
            feedItems.length > 0 && (
              <GuestContentGate
                title="Sign in to see the full feed"
                description="Create a free account or log in to keep scrolling, like posts, and contact artists."
              />
            )
          )}
        </div>
      </div>

      {canCreate && (
        <Button
          onClick={() => navigate('/dashboard/posts/new')}
          size="icon"
          aria-label="Create post"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <InstagramZoomPreview media={mediaPreview} onClose={() => setMediaPreview(null)} />


      {/* Delete Post Confirmation Dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={open => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePostId && handleDeletePost(deletePostId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Promotion Confirmation Dialog */}
      <AlertDialog open={!!deleteAnnouncementId} onOpenChange={open => !open && setDeleteAnnouncementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this promotion? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAnnouncementId && handleDeleteAnnouncement(deleteAnnouncementId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminDeleteContentDialog
        open={!!adminDeleteTarget}
        onOpenChange={(o) => !o && setAdminDeleteTarget(null)}
        contentType={adminDeleteTarget?.type ?? "post"}
        onConfirm={async (reason) => {
          if (!adminDeleteTarget) return;
          const table = adminDeleteTarget.type === "post" ? "posts" : "announcements";
          const { error } = await supabase.from(table).delete().eq("id", adminDeleteTarget.id);
          if (error) {
            toast({ title: "Error", description: "Failed to delete content.", variant: "destructive" });
          } else {
            setFeedItems((items) => items.filter((it) => it.id !== adminDeleteTarget.id));
            toast({ title: "Content removed", description: `Reason: ${reason}` });
          }
          setAdminDeleteTarget(null);
        }}
      />
      <PromotePostDialog
        open={!!promoteTarget}
        onOpenChange={(o) => { if (!o) setPromoteTarget(null); }}
        isPromoted={!!promoteTarget?.promotedUntil && new Date(promoteTarget.promotedUntil).getTime() > Date.now()}
        promotedUntil={promoteTarget?.promotedUntil}
        remaining={promotionsRemaining}
        isSaving={isPromoting}
        onConfirm={async () => {
          if (!promoteTarget) return;
          setIsPromoting(true);
          try {
            const { error } = await (supabase as any).rpc('promote_post', { p_post_id: promoteTarget.id });
            if (error) throw error;
            setPromotionsUsed((n) => n + 1);
            setPromoteTarget(null);
            await fetchPosts(0, false);
            toast({ title: t('postPromotion.successTitle', 'Post promoted'), description: t('postPromotion.successBody', 'Your post is now receiving increased distribution in the Muzicalist feed.') });
          } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
          } finally {
            setIsPromoting(false);
          }
        }}
      />
      <ReportContentDialog
        open={!!reportTarget}
        onOpenChange={(o) => !o && setReportTarget(null)}
        contentType={reportTarget?.type ?? "post"}
        contentId={reportTarget?.id ?? null}
      />
      <CommentsDialog
        open={!!commentsTarget}
        onOpenChange={(o) => !o && setCommentsTarget(null)}
        targetType={commentsTarget?.type ?? "post"}
        targetId={commentsTarget?.id ?? null}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onCountChange={(count) => {
          if (!commentsTarget) return;
          setFeedItems((items) => items.map((i) => i.id === commentsTarget.id ? { ...i, commentsCount: count } : i));
        }}
      />
    </div>;
};
export default Feed;