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
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useMobileBottomNavSpacing } from "@/hooks/use-mobile-bottom-nav-spacing";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";
import { isAdExpired } from "@/lib/adExpiration";

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
  type: "post" | "promotion";
}

interface MediaPreview {
  url: string;
  type: "image" | "video";
}

const Feed = () => {
  const navigate = useNavigate();
  const [feedFilter, setFeedFilter] = useState<"all" | "promotions">("all");
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<{ id: string; text: string; type: "post" | "promotion" } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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
      setUserCountry('__all__');
    };
    checkAuth();
  }, []);

  const fetchPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!userCountry) return;
    
    try {
      const from = pageNum * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;
      
      // Fetch posts
      let postsQuery = supabase
        .from('posts')
        .select(`id, profile_id, content, media_url, media_type, created_at`);
      
      const { data: posts, error: postsError } = await postsQuery
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (postsError) throw postsError;

      // Fetch premium announcements (promotions)
      let promoQuery = supabase
        .from('announcements')
        .select(`*, profiles!inner (avatar_url, stage_name, county, specialization, plan, country)`)
        .eq('is_premium', true);
      
      const { data: promotions } = await promoQuery
        .order('created_at', { ascending: false })
        .range(from, to);

      // Check if there are more items
      const postsCount = posts?.length || 0;
      const promosCount = promotions?.length || 0;
      if (postsCount < POSTS_PER_PAGE && promosCount < POSTS_PER_PAGE) {
        setHasMore(false);
      }

      // Build post feed items
      const postsWithProfiles = await Promise.all((posts || []).map(async post => {
        const [profileResult, likesResult, userLikeResult] = await Promise.all([
          supabase.from('profiles').select('stage_name, avatar_url, specialization, plan').eq('id', post.profile_id).maybeSingle(),
          supabase.from('post_likes').select('id', { count: 'exact' }).eq('post_id', post.id),
          currentUserId ? supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle() : Promise.resolve({ data: null })
        ]);
        return {
          ...post,
          profile: profileResult.data || {
            stage_name: 'Unknown Artist',
            avatar_url: null,
            specialization: null,
            plan: 'Free'
          },
          isLiked: !!userLikeResult.data,
          isSaved: false,
          likes: likesResult.count || 0,
          type: "post" as const,
        };
      }));

      // Build promotion feed items (filter expired)
      const promoItems: FeedItem[] = (promotions || [])
        .filter(a => !isAdExpired(a))
        .map(a => ({
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
          isLiked: false,
          isSaved: false,
          likes: 0,
          type: "promotion" as const,
        }));

      // Merge and sort by created_at descending
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
  }, [currentUserId, userCountry]);

  useEffect(() => {
    if (userCountry) {
      fetchPosts(0);
    }
  }, [fetchPosts, userCountry]);

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
    if (!item || item.type === "promotion") return;

    setFeedItems(items => items.map(i => i.id === id ? {
      ...i,
      isLiked: !i.isLiked,
      likes: i.isLiked ? Math.max(0, i.likes - 1) : i.likes + 1
    } : i));
    try {
      if (item.isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', currentUserId);
      } else {
        await supabase.from('post_likes').insert({
          post_id: id,
          user_id: currentUserId
        });
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

  const handleContact = (profileId: string) => {
    navigate(`/artist/${profileId}`);
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
      toast({ title: "Announcement deleted", description: "Your promotion has been deleted." });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({ title: "Error", description: "Failed to delete promotion.", variant: "destructive" });
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
            <h1 className="text-4xl font-display font-bold text-foreground mb-8">Feed</h1>
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
              variant={feedFilter === "promotions" ? "default" : "outline"}
              size="sm"
              onClick={() => setFeedFilter("promotions")}
              className={feedFilter === "promotions" ? "bg-accent text-accent-foreground hover:bg-accent/90" : "border-border text-muted-foreground hover:text-foreground"}
            >
              Promotions
            </Button>
          </div>

          {(() => {
            const filtered = feedFilter === "promotions" ? feedItems.filter(i => i.type === "promotion") : feedItems;
            return filtered.length === 0 ? <Card className="p-8 text-center">
              <p className="text-muted-foreground">{feedFilter === "promotions" ? "No promotions yet." : "No posts yet. Be the first to share something!"}</p>
            </Card> : filtered.map(item =>
              item.type === "promotion" ? (
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
                            toast({ title: "Report submitted", description: "Thank you for reporting this problem. We'll review it shortly." });
                          }}>
                            <Flag className="h-4 w-4 mr-2" />
                            Report
                          </DropdownMenuItem>
                          {currentUserId === item.profile_id && <>
                            <DropdownMenuItem onClick={() => setEditItem({ id: item.id, text: item.content, type: "promotion" })}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteAnnouncementId(item.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>}
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
                        <video src={item.media_url} controls className="absolute inset-0 w-full h-full object-contain bg-black" onClick={e => e.stopPropagation()} />
                      </div> : <img src={item.media_url} alt="Promotion media" className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity border-primary" />}
                  </div>}
                  
                  <div className="px-2 py-1">
                    <div className="flex items-center justify-around">
                      <Button variant="ghost" size="sm" onClick={() => handleContact(item.profile_id)} className="flex-1 gap-2 rounded-md text-muted-foreground hover:bg-transparent hover:text-muted-foreground">
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
                          toast({ title: "Report submitted", description: "Thank you for reporting this problem. We'll review it shortly." });
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
                        <video src={item.media_url} controls className="absolute inset-0 w-full h-full object-contain bg-black" onClick={e => e.stopPropagation()} />
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
                    
                    <Button variant="ghost" size="sm" onClick={() => handleContact(item.profile_id)} className="flex-1 gap-2 rounded-md text-muted-foreground hover:bg-transparent hover:text-muted-foreground">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">Contact</span>
                    </Button>
                  </div>
                </div>
              </Card>
              )
            )
          })()}
          
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
        table={editItem?.type === "promotion" ? "announcements" : "posts"}
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
    </div>;
};
export default Feed;