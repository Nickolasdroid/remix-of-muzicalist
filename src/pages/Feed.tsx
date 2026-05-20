import { useState, useEffect, useCallback, useRef } from "react";
import { formatSmartDate, formatDateNoYear } from "@/lib/utils";
import { Heart, MessageCircle, MoreHorizontal, Flag, Globe, Trash2, Loader2, Share2, Calendar, MapPin, DollarSign, ArrowRight, Plus, Pencil } from "lucide-react";
import EditContentDialog from "@/components/EditContentDialog";
import ExpandableText from "@/components/ExpandableText";
import { useNavigate, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
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
import AdminDeleteContentDialog from "@/components/AdminDeleteContentDialog";
import ReportContentDialog, { ReportableType } from "@/components/ReportContentDialog";
import CommentsDialog from "@/components/CommentsDialog";

const POSTS_PER_PAGE = 10;

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
}

interface MediaPreview {
  url: string;
  type: "image" | "video";
}

const Feed = () => {
  const navigate = useNavigate();
  const [feedFilter, setFeedFilter] = useState<"all" | "announcements">("all");
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<{ id: string; text: string; type: "post" | "announcement" } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [canCreate, setCanCreate] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useUserRole();
  const [adminDeleteTarget, setAdminDeleteTarget] = useState<{ id: string; type: "post" | "announcement" } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string; type: ReportableType } | null>(null);
  const [commentsTarget, setCommentsTarget] = useState<{ id: string; type: "post" | "announcement" } | null>(null);

  useEffect(() => {
    // Background auth check; doesn't block the feed fetch
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        const { data: prof } = await supabase
          .from('profiles')
          .select('plan, specialization')
          .eq('id', session.user.id)
          .maybeSingle();
        if (prof?.specialization && (prof.plan === 'Standard' || prof.plan === 'Premium')) {
          setCanCreate(true);
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
          .select(`id, profile_id, content, media_url, media_type, created_at, profiles!inner (stage_name, avatar_url, specialization, plan)`)
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

      // Batch likes counts, comment counts and (optionally) the current user's likes — eliminates N+1
      const [postLikesRes, promoLikesRes, userPostLikesRes, userPromoLikesRes, postCommentsRes, promoCommentsRes] = await Promise.all([
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
      }));

      const combined = [...postsWithProfiles, ...promoItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      if (append) {
        setFeedItems(prev => [...prev, ...combined]);
      } else {
        setFeedItems(combined);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive"
      });
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
  const needsBottomSpacing = useMobileBottomNavSpacing(contentRef, [feedItems.length, feedFilter, loading, canCreate, page, hasMore]);

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

  const getSpecializationLabel = (specialization: string | null) => {
    if (!specialization) return "User";
    return specialization;
  };

  const formatDate = formatSmartDate;

  if (loading) {
    return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-background`}>
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

  return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-background`}>
      <Navigation />
      
      <div className={`container mx-auto sm:px-4 pt-[60px] ${currentUserId ? 'md:pt-2' : 'md:pt-20'} ${needsBottomSpacing ? 'pb-16' : 'pb-0'} md:pb-0 px-0`}>
        <div ref={contentRef} className="max-w-[500px] mx-auto space-y-1">
          
          {/* Filter Tabs */}
          <div className="flex gap-2 px-2 sm:px-0 py-2">
            <Button
              variant={feedFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFeedFilter("all")}
              className={feedFilter === "all" ? "bg-accent text-accent-foreground hover:bg-accent/90" : "border-border text-muted-foreground hover:text-foreground"}
            >
              All
            </Button>
            <Button
              variant={feedFilter === "announcements" ? "default" : "outline"}
              size="sm"
              onClick={() => setFeedFilter("announcements")}
              className={feedFilter === "announcements" ? "bg-accent text-accent-foreground hover:bg-accent/90" : "border-border text-muted-foreground hover:text-foreground"}
            >
              Announcements
            </Button>
          </div>

          {(() => {
            const filteredAll = feedFilter === "announcements" ? feedItems.filter(i => i.type === "announcement") : feedItems;
            const GUEST_PREVIEW_COUNT = 2;
            const isGuest = !currentUserId;
            const filtered = isGuest ? filteredAll.slice(0, GUEST_PREVIEW_COUNT) : filteredAll;
            return filtered.length === 0 ? <Card className="p-8 text-center">
              <p className="text-muted-foreground">{feedFilter === "announcements" ? "No announcements yet." : "No posts yet. Be the first to share something!"}</p>
            </Card> : filtered.map(item =>
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
                              <h3 className="font-medium text-foreground cursor-pointer hover:underline">
                                {item.profile.stage_name}
                              </h3>
                            </Link>
                            {item.profile.plan === 'Premium' && <span className="text-accent text-xs">✓</span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{getSpecializationLabel(item.profile.specialization)}</span>
                            <span>·</span>
                            <span>{formatDate(item.created_at)}</span>
                            <span>·</span>
                            <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                              Promotion
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            const url = `${window.location.origin}/artist/${item.profile_id}`;
                            navigator.clipboard.writeText(url);
                            toast({ title: "Link copied", description: "The link has been copied to your clipboard." });
                          }}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            if (!currentUserId) {
                              navigate("/login");
                              return;
                            }
                            setReportTarget({ id: item.id, type: "announcement" });
                          }}>
                            <Flag className="h-4 w-4 mr-2" />
                            Report
                          </DropdownMenuItem>
                          {currentUserId === item.profile_id && <>
                            <DropdownMenuItem onClick={() => setEditItem({ id: item.id, text: item.content, type: "announcement" })}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteAnnouncementId(item.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>}
                          {isAdmin && currentUserId !== item.profile_id && (
                            <DropdownMenuItem onClick={() => setAdminDeleteTarget({ id: item.id, type: "announcement" })} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete (admin)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <ExpandableText text={item.content} className="mt-3 my-[5px]" />
                  </div>
                  
                  {item.media_url && <div className="mt-3 cursor-pointer bg-muted/30" onClick={() => setMediaPreview({
                    url: item.media_url!,
                    type: item.media_type === "video" ? "video" : "image"
                  })}>
                    {item.media_type === "video" ? <div className="relative w-full aspect-video">
                        <SmoothVideoPlayer src={item.media_url} className="absolute inset-0 w-full h-full" onClick={e => e.stopPropagation()} />
                      </div> : <img src={item.media_url} alt="Announcement media" className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity border-primary" />}
                  </div>}
                  
                  <div className="px-2 py-1">
                    <div className="flex items-center justify-around">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(item.id)}
                        aria-label={item.isLiked ? "Unlike announcement" : "Like announcement"}
                        aria-pressed={item.isLiked}
                        className={`flex-1 gap-2 rounded-md hover:bg-transparent hover:text-inherit ${item.isLiked ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        <Heart className={`w-7 h-7 ${item.isLiked ? "fill-current" : ""}`} />
                        {item.likes > 0 && <span className="text-base font-semibold tabular-nums">{item.likes}</span>}
                      </Button>

                      <Button variant="ghost" size="sm" onClick={currentUserId !== item.profile_id ? () => handleContact(item.profile_id) : undefined} className="flex-1 gap-2 rounded-md text-muted-foreground hover:bg-transparent hover:text-muted-foreground">
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-medium">Contact</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                /* Regular Post Card */
                <Card key={item.id} className="text-card-foreground overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary bg-background border-0">
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
                        <h3 className="font-medium text-foreground cursor-pointer hover:underline" onClick={() => navigate(`/artist/${item.profile_id}`)}>
                            {item.profile.stage_name}
                          </h3>
                          {item.profile.plan === 'Premium' && <span className="text-accent text-xs">✓</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{getSpecializationLabel(item.profile.specialization)}</span>
                          <span>·</span>
                          <span>{formatDate(item.created_at)}</span>
                          <span>·</span>
                          <Globe className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          const url = `${window.location.origin}/artist/${item.profile_id}`;
                          navigator.clipboard.writeText(url);
                          toast({ title: "Link copied", description: "The link has been copied to your clipboard." });
                        }}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          if (!currentUserId) {
                            navigate("/login");
                            return;
                          }
                          setReportTarget({ id: item.id, type: "post" });
                        }}>
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                        {currentUserId === item.profile_id && <>
                          <DropdownMenuItem onClick={() => setEditItem({ id: item.id, text: item.content, type: "post" })}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletePostId(item.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>}
                        {isAdmin && currentUserId !== item.profile_id && (
                          <DropdownMenuItem onClick={() => setAdminDeleteTarget({ id: item.id, type: "post" })} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete (admin)
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <ExpandableText text={item.content} className="mt-3 my-[5px]" />
                </div>
                
                {item.media_url && <div className="mt-3 cursor-pointer bg-muted/30" onClick={() => setMediaPreview({
            url: item.media_url!,
            type: item.media_type === "video" ? "video" : "image"
          })}>
            {item.media_type === "video" ? <div className="relative w-full aspect-video">
                        <SmoothVideoPlayer src={item.media_url} className="absolute inset-0 w-full h-full" onClick={e => e.stopPropagation()} />
                      </div> : <img src={item.media_url} alt="Post content" className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity border-primary" />}
                  </div>}
                <div className="px-2 py-1">
                  <div className="flex items-center justify-around">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(item.id)}
                      aria-label={item.isLiked ? "Unlike post" : "Like post"}
                      aria-pressed={item.isLiked}
                      className={`flex-1 gap-2 rounded-md hover:bg-transparent hover:text-inherit ${item.isLiked ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      <Heart className={`w-7 h-7 ${item.isLiked ? "fill-current" : ""}`} />
                      {item.likes > 0 && <span className="text-base font-semibold tabular-nums">{item.likes}</span>}
                    </Button>
                    
                    <Button variant="ghost" size="sm" onClick={currentUserId !== item.profile_id ? () => handleContact(item.profile_id) : undefined} className="flex-1 gap-2 rounded-md text-muted-foreground hover:bg-transparent hover:text-muted-foreground">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">Contact</span>
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
          onClick={() => navigate('/dashboard?tab=profile&section=posts&new=1')}
          size="icon"
          aria-label="Create post"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <InstagramZoomPreview media={mediaPreview} onClose={() => setMediaPreview(null)} />

      <EditContentDialog
        open={!!editItem}
        onOpenChange={(o) => !o && setEditItem(null)}
        table={editItem?.type === "announcement" ? "announcements" : "posts"}
        itemId={editItem?.id ?? null}
        initialText={editItem?.text ?? ""}
        onSaved={(newText) => {
          if (!editItem) return;
          setFeedItems(items => items.map(i => i.id === editItem.id ? { ...i, content: newText } : i));
        }}
      />

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
      <ReportContentDialog
        open={!!reportTarget}
        onOpenChange={(o) => !o && setReportTarget(null)}
        contentType={reportTarget?.type ?? "post"}
        contentId={reportTarget?.id ?? null}
      />
    </div>;
};
export default Feed;