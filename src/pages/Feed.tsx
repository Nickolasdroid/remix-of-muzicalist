import PostActions from "@/components/PostActions";
import CardAuthorHeader from "@/components/CardAuthorHeader";
import { useState, useEffect, useCallback, useRef } from "react";
import { formatSmartDate, formatDateNoYear } from "@/lib/utils";
import { Heart, MessageCircle, MoreHorizontal, Flag, Globe, Trash2, Loader2, Send, Calendar, MapPin, DollarSign, ArrowRight, Plus, Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import PostMediaFrame from "@/components/PostMediaFrame";
import ExpandableText, { TextMention } from "@/components/ExpandableText";
import PostMedia from "@/components/post/PostMedia";
import AvailabilityBlock from "@/components/post/AvailabilityBlock";
import { postMediaItems } from "@/lib/postMedia";
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
import PostComposerDialog from "@/components/post/PostComposerDialog";
import InstagramZoomPreview from "@/components/InstagramZoomPreview";
import SmoothVideoPlayer from "@/components/SmoothVideoPlayer";
import GuestContentGate from "@/components/GuestContentGate";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
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
import StoriesBar from "@/components/stories/StoriesBar";
import Announcements from "@/pages/Announcements";
import AnnouncementList from "@/components/opportunities/AnnouncementList";
import { canPost, canPublishPosts } from "@/lib/planLimits";
import { fetchCollabStatuses, isOpenToCollabs } from "@/lib/collabStatus";
import CreateChooser, { type CreateChoice } from "@/components/composer/CreateChooser";

const POSTS_PER_PAGE = 10;

/** Known post sources. Unknown/future values fall back to "user" behaviour. */
type PostKind = "user" | "artist_joined";

interface FeedItem {
  id: string;
  profile_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  /** Several photos (posts.media) */
  media?: unknown;
  /** Availability post date */
  availableOn?: string | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  created_at: string;
  profile: {
    stage_name: string;
    avatar_url: string | null;
    specialization: string | null;
    plan: string;
    county?: string | null;
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
  const [searchParams, setSearchParams] = useSearchParams();

  // One feed, several views: ?f=posts | gig | collab | available (default: everything)
  type FeedFilter = "all" | "posts" | "gig" | "collab" | "available";
  const rawFilter = searchParams.get("f");
  const requestedFilter: FeedFilter = rawFilter === "posts" || rawFilter === "gig" || rawFilter === "collab" || rawFilter === "available" ? rawFilter : "all";
  const setFilter = (f: FeedFilter) => {
    const next = new URLSearchParams(searchParams);
    if (f === "all") next.delete("f");
    else next.set("f", f);
    next.delete("post");
    setSearchParams(next, { replace: true });
    window.scrollTo({ top: 0 });
  };
  // Keep the active filter chip visible: scroll only the chip row, only when the filter changes
  const chipsRef = useRef<HTMLDivElement>(null);
  const [chipsAtEnd, setChipsAtEnd] = useState(false);
  // Who is looking, for the personal order of "All"
  const [viewer, setViewer] = useState<{ isArtist: boolean; specialization: string | null; county: string | null } | null>(null);
  // Filters depend on who is looking: artists look for gigs and collaborators, organizers for
  // artists. A link with a filter the viewer doesn't have opens "All" instead of an empty view.
  const filterChoices: FeedFilter[] = !viewer ? ["all", "posts"] : viewer.isArtist ? ["all", "posts", "gig", "collab"] : ["all", "posts", "available"];
  const filter: FeedFilter = viewer && !filterChoices.includes(requestedFilter) ? "all" : requestedFilter;
  // Open opportunities mixed into "All" for artists
  const [opportunities, setOpportunities] = useState<any[]>([]);
  // Stories stay Standard/Premium; posts are open to every artist plan
  const [canCreateStories, setCanCreateStories] = useState(false);
  // Collaborations: Standard / Premium artists
  const [canCreateCollab, setCanCreateCollab] = useState(false);
  const [showChooser, setShowChooser] = useState(false);
  const [storySignal, setStorySignal] = useState(0);
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
          .select('plan, specialization, billing, subscription_current_period_end, county')
          .eq('id', session.user.id)
          .maybeSingle();
        setViewer({ isArtist: !!prof?.specialization, specialization: prof?.specialization ?? null, county: (prof as any)?.county ?? null });
        if (prof?.specialization && (prof.plan === 'Standard' || prof.plan === 'Premium')) {
          setCanCreateStories(true);
        }
        if (prof?.specialization && canPost(prof.plan)) {
          setCanCreateCollab(true);
        }
        if (prof?.specialization && canPublishPosts(prof.plan)) {
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

  useEffect(() => {
    const row = chipsRef.current;
    const chip = row?.querySelector<HTMLElement>('[data-active="true"]');
    if (!row || !chip) return;
    row.scrollLeft = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
    setChipsAtEnd(row.scrollLeft + row.clientWidth >= row.scrollWidth - 4);
  }, [filter, currentUserId]);

  const [showComposer, setShowComposer] = useState(false);

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
          // "*" so newer post columns (media, available_on) are read when present
          .select(`*, profiles!posts_profile_id_fkey!inner (stage_name, avatar_url, specialization, plan, county)`)
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
        media: post.media ?? null,
        availableOn: post.available_on ?? null,
        availableFrom: post.available_from ?? null,
        availableUntil: post.available_until ?? null,
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
          county: a.profiles?.county || null,
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

  // Open "Artist wanted" / "Collaborator wanted" announcements for the artist's "All" view,
  // the ones for their specialization and county first.
  useEffect(() => {
    if (!viewer?.isArtist || !currentUserId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select(`*, profiles!inner (avatar_url, stage_name, first_name, last_name, county, specialization, plan, country)`)
        .in("kind", ["gig", "collab"])
        .neq("profile_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(30);
      // The viewer's collaboration status: open -> matching collaborations rank like matching events;
      // "in a band, not looking" -> no collaborations mixed into All (the Collaborations filter still has them)
      const status = (await fetchCollabStatuses([currentUserId]))[currentUserId] ?? null;
      if (!active) return;
      const openToCollabs = isOpenToCollabs(status);
      const score = (a: any) => {
        const mine = a.seeking === viewer.specialization && (a.kind === "gig" || (a.kind === "collab" && openToCollabs));
        const near = !!viewer.county && a.county === viewer.county;
        if (mine && near) return 0;
        if (mine) return 1;
        if (a.kind === "gig" && near) return 2;
        if (a.kind === "collab" && near) return 3;
        return 4;
      };
      const open = ((data as any[]) || []).filter((a) => !isAdExpired(a) && !(status === "band_closed" && a.kind === "collab"));
      setOpportunities(open.map((a) => ({ ...a, type: "announcement" })).sort((x, y) => score(x) - score(y)).slice(0, 8));
    })();
    return () => {
      active = false;
    };
  }, [viewer, currentUserId]);

  const loadMorePosts = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPosts(nextPage, true);
  }, [page, fetchPosts]);

  const { loadMoreRef, isLoadingMore } = useInfiniteScroll(loadMorePosts, hasMore);

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

  const todayYmd = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const isOpenAvailability = (item: FeedItem) => item.type === "post" && !!item.availableOn && item.availableOn >= todayYmd;

  /** The loaded feed narrowed to the chosen view, in the viewer's order. */
  function viewFeed(items: FeedItem[]): FeedItem[] {
    if (filter === "posts") return items.filter((i) => i.type === "post");
    if (filter === "available") return items.filter(isOpenAvailability);
    // Organizers: open dates of artists from the first page come first. Only the first page
    // is reordered, so items loaded later never jump above what was already seen.
    if (viewer && !viewer.isArtist) {
      const head = items.slice(0, POSTS_PER_PAGE * 2);
      const boosted = [...head.filter(isOpenAvailability), ...head.filter((i) => !isOpenAvailability(i))];
      return [...boosted, ...items.slice(head.length)];
    }
    return items;
  }

  /** "All" for artists: one matching opportunity after every 3 feed items, never two in a row. */
  function withOpportunities(items: FeedItem[]): ({ item: FeedItem } | { opp: any })[] {
    const out: ({ item: FeedItem } | { opp: any })[] = [];
    const opps = filter === "all" ? opportunities : [];
    let o = 0;
    items.forEach((item, i) => {
      out.push({ item });
      if ((i + 1) % 3 === 0 && o < opps.length) out.push({ opp: opps[o++] });
    });
    return out;
  }


  if (loading) {
    // Same frame as the loaded feed, so nothing jumps when the posts arrive.
    return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-background mx-0`}>
        <Navigation />
        <div className={`container mx-auto sm:px-4 pt-[60px] ${currentUserId ? 'md:pt-2' : 'md:pt-20'} pb-0 px-0`}>
          <div className="max-w-[500px] mx-auto space-y-2 sm:space-y-3" aria-busy="true">
            {[1, 2, 3].map(i => <div key={i} className="rounded-2xl border border-border/70 bg-card px-3.5 py-3 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-3.5 w-32 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-3.5 w-11/12 bg-muted rounded mb-2" />
                <div className="h-3.5 w-2/3 bg-muted rounded mb-3" />
                <div className="-mx-3.5 h-56 bg-muted" />
              </div>)}
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
      
      <div className={`container mx-auto sm:px-4 pt-[60px] ${currentUserId ? 'md:pt-2' : 'md:pt-20'} pb-0 px-0`}>
        <div ref={contentRef} className="max-w-[500px] mx-auto space-y-2 sm:space-y-3">
          <h1 className="sr-only">Musical Community Feed</h1>

          <StoriesBar currentUserId={currentUserId} canPublish={canCreateStories} openComposerSignal={storySignal} />

          {currentUserId && (
            <div className="relative">
            <div
              ref={chipsRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                setChipsAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
              }}
              className="flex gap-1.5 overflow-x-auto px-3 sm:px-0 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Feed filter"
            >
              {([
                { k: "all", label: "All" },
                { k: "posts", label: "Posts" },
                // Named by what they show: events looking for artists, collaborations, free artists
                { k: "gig", label: "Events" },
                { k: "collab", label: "Collaborations" },
                { k: "available", label: "Free to book" },
              ] as { k: FeedFilter; label: string }[]).filter((f) => filterChoices.includes(f.k)).map((f) => (
                <button
                  key={f.k}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.k}
                  data-active={filter === f.k ? "true" : undefined}
                  onClick={() => setFilter(f.k)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    filter === f.k ? "border-accent bg-accent/15 text-accent font-medium" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* Hint that more filters are to the right on narrow screens */}
            {!chipsAtEnd && (
              <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-background to-transparent" aria-hidden="true" />
            )}
            </div>
          )}

          {(filter === "gig" || filter === "collab") && <Announcements key={filter} embeddedKind={filter} />}
          
          {filter !== "gig" && filter !== "collab" && (() => {
            const filteredAll = viewFeed(feedItems);
            const GUEST_PREVIEW_COUNT = 2;
            const isGuest = !currentUserId;
            const filtered = isGuest ? filteredAll.slice(0, GUEST_PREVIEW_COUNT) : filteredAll;
            if (filtered.length === 0 && !loadError && filter !== "all") {
              return <Card className="p-8 text-center">
                <p className="text-muted-foreground">{filter === "available" ? "No artists have announced free dates yet." : "No posts yet."}</p>
              </Card>;
            }
            return filtered.length === 0 ? (loadError ? <Card className="p-8 text-center space-y-3">
              <p className="text-muted-foreground">Couldn't load the feed right now.</p>
              <Button variant="outline" onClick={() => { setLoadError(false); setHasMore(true); setPage(0); setLoading(true); fetchPosts(0); }}>
                Try again
              </Button>
            </Card> : <Card className="p-8 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
            </Card>) : withOpportunities(filtered).map(entry => "opp" in entry ? (
              <AnnouncementList
                key={`opp-${entry.opp.id}`}
                announcements={[entry.opp]}
                legacyApply
                onMediaClick={setMediaPreview}
                onDeleted={(id) => setOpportunities((list) => list.filter((x) => x.id !== id))}
                onUpdated={(id, patch) => setOpportunities((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
              />
            ) : ((item: FeedItem) =>
              item.type === "announcement" ? (
                /* Promotion Card */
                <Card key={`promo-${item.id}`} className="text-card-foreground overflow-hidden my-0 rounded-2xl border border-border/70 bg-card shadow-sm">
                  <div className="px-3.5 pt-3 pb-0">
                    <div className="flex items-start justify-between">
                      <CardAuthorHeader
                      name={item.profile.stage_name}
                      avatarUrl={item.profile.avatar_url}
                      plan={item.profile.plan}
                      verified={adminIds.has(item.profile_id)}
                      specialization={getSpecializationLabel(item.profile.specialization, item.profile_id)}
                      time={formatDate(item.created_at)}
                      onClick={() => navigate(`/artist/${item.profile_id}`)}
                      extra={<>
                        <span>·</span>
                        <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Promotion</Badge>
                      </>}
                    />
                      
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

                    <ExpandableText text={item.content} className="mt-2 text-[15px] leading-normal" />
                  </div>
                  
                  {item.media_url && <PostMediaFrame url={item.media_url} type={item.media_type} alt="Announcement media" onClick={() => setMediaPreview({
                    url: item.media_url!,
                    type: item.media_type === "video" ? "video" : "image"
                  })} />}
                  <PostActions isLiked={item.isLiked} onLike={() => handleLike(item.id)} onComment={() => setCommentsTarget({ id: item.id, type: "announcement" })} onShare={() => sharePost({ profileId: item.profile_id, stageName: item.profile.stage_name, type: "announcement" })} likes={item.likes} likeTargetId={item.id} likeTargetType="announcement" commentsCount={item.commentsCount} />

                </Card>
              ) : (
                /* Regular Post Card */
                <Card key={item.id} id={`feed-post-${item.id}`} className="text-card-foreground overflow-hidden my-0 rounded-2xl border border-border/70 bg-card shadow-sm">
                <div className="px-3.5 pt-3 pb-0">
                  <div className="flex items-start justify-between">
                    <CardAuthorHeader
                      name={item.profile.stage_name}
                      avatarUrl={item.profile.avatar_url}
                      plan={item.profile.plan}
                      verified={adminIds.has(item.profile_id)}
                      specialization={getSpecializationLabel(item.profile.specialization, item.profile_id)}
                      time={formatDate(item.created_at)}
                      onClick={() => navigate(`/artist/${item.profile_id}`)}
                      extra={<>
                        <span>·</span>
                        <Globe className="h-3 w-3" />
                        {item.promoted && (
                          <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                            {t("postPromotion.promoted", "Promoted")}
                          </Badge>
                        )}
                      </>}
                    />
                    
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

                  {/* Posts are limited to 200 chars at creation — always render the full text, no "more" control. */}
                  <ExpandableText text={item.content} maxLength={200} className="mt-2 text-[15px] leading-normal" mentions={item.mentions} />
                </div>
                
                {item.availableOn && (
                  <AvailabilityBlock profileId={item.profile_id} date={item.availableOn} from={item.availableFrom} until={item.availableUntil} isOwner={currentUserId === item.profile_id} />
                )}
                <PostMedia
                  items={postMediaItems(item)}
                  text={item.content}
                  onMediaClick={(it) => setMediaPreview(it)}
                />
                <PostActions isLiked={item.isLiked} onLike={() => handleLike(item.id)} onComment={() => setCommentsTarget({ id: item.id, type: "post" })} onShare={() => sharePost({ profileId: item.profile_id, stageName: item.profile.stage_name, type: "post" })} likes={item.likes} likeTargetId={item.id} commentsCount={item.commentsCount} />

              </Card>
              ))(entry.item)
            )
          })()}
          
          {filter === "gig" || filter === "collab" ? null : currentUserId ? (
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

      {/* Organizers: the + creates an event ("looking for an artist") */}
      {viewer && !viewer.isArtist && (
        <Button
          onClick={() => navigate('/user-dashboard?new=announcement')}
          size="icon"
          aria-label="New event"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Artists: the + asks what to create (post, story, collaboration) */}
      {canCreate && (
        <Button
          onClick={() => setShowChooser(true)}
          size="icon"
          aria-label="Create"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <CreateChooser
        open={showChooser}
        onOpenChange={setShowChooser}
        canCreateStories={canCreateStories}
        canCreateCollab={canCreateCollab}
        onUpgrade={() => navigate('/my-plan')}
        onChoose={(choice: CreateChoice) => {
          if (choice === 'post') setShowComposer(true);
          else if (choice === 'story') setStorySignal((n) => n + 1);
          else navigate('/dashboard?tab=profile&section=posts&new=collab');
        }}
      />

      <PostComposerDialog
        open={showComposer}
        onOpenChange={setShowComposer}
        onPublished={async () => { setPage(0); setHasMore(true); await fetchPosts(0, false); }}
      />

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
