import { useState, useEffect } from "react";
import { Heart, MessageCircle, MoreHorizontal, Flag, Globe, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
}

interface MediaPreview {
  url: string;
  type: "image" | "video";
}

const Feed = () => {
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data: posts, error } = await supabase
          .from('posts')
          .select(`
            id,
            profile_id,
            content,
            media_url,
            media_type,
            created_at
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch profiles and likes for each post
        const postsWithProfiles = await Promise.all(
          (posts || []).map(async (post) => {
            const [profileResult, likesResult, userLikeResult] = await Promise.all([
              supabase
                .from('profiles')
                .select('stage_name, avatar_url, specialization, plan')
                .eq('id', post.profile_id)
                .maybeSingle(),
              supabase
                .from('post_likes')
                .select('id', { count: 'exact' })
                .eq('post_id', post.id),
              currentUserId 
                ? supabase
                    .from('post_likes')
                    .select('id')
                    .eq('post_id', post.id)
                    .eq('user_id', currentUserId)
                    .maybeSingle()
                : Promise.resolve({ data: null })
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
              likes: likesResult.count || 0
            };
          })
        );

        setFeedItems(postsWithProfiles);
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
    };

    fetchPosts();
  }, [currentUserId]);

  const handleLike = async (id: string) => {
    if (!currentUserId) {
      toast({
        title: "Login Required",
        description: "Please log in to like posts.",
      });
      navigate('/login');
      return;
    }

    const item = feedItems.find(i => i.id === id);
    if (!item) return;

    // Optimistic update
    setFeedItems(items =>
      items.map(i =>
        i.id === id
          ? { ...i, isLiked: !i.isLiked, likes: i.isLiked ? i.likes - 1 : i.likes + 1 }
          : i
      )
    );

    try {
      if (item.isLiked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', currentUserId);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({ post_id: id, user_id: currentUserId });
      }
    } catch (error) {
      // Revert on error
      setFeedItems(items =>
        items.map(i =>
          i.id === id
            ? { ...i, isLiked: item.isLiked, likes: item.likes }
            : i
        )
      );
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = (id: string) => {
    setFeedItems(items =>
      items.map(item =>
        item.id === id ? { ...item, isSaved: !item.isSaved } : item
      )
    );
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

  const getSpecializationLabel = (specialization: string | null) => {
    if (!specialization) return "Artist";
    return specialization;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen ml-64 bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-display font-bold text-foreground mb-8">Feed</h1>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden border-border/40 animate-pulse">
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
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto px-0 sm:px-4 pt-[68px]">
        <div className="max-w-[500px] mx-auto space-y-1">
          
          {feedItems.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
            </Card>
          ) : (
            feedItems.map((item) => (
              <Card key={item.id} className="overflow-hidden border-border/40 shadow-sm rounded-lg">
                {/* Header */}
                <div className="p-4 pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`p-0.5 rounded-full ${
                          item.profile.plan === 'Premium' 
                            ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600' 
                            : 'bg-gradient-to-r from-red-500 via-red-600 to-red-500'
                        }`}
                      >
                        <Avatar 
                          className="w-10 h-10 cursor-pointer border-2 border-background"
                          onClick={() => navigate(`/artist/${item.profile_id}`)}
                        >
                          <AvatarImage src={item.profile.avatar_url || undefined} alt={item.profile.stage_name} />
                          <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                            {item.profile.stage_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 
                            className="font-semibold text-foreground cursor-pointer hover:underline"
                            onClick={() => navigate(`/artist/${item.profile_id}`)}
                          >
                            {item.profile.stage_name}
                          </h3>
                          {item.profile.plan === 'Premium' && (
                            <span className="text-accent text-xs">✓</span>
                          )}
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
                        <DropdownMenuItem 
                          onClick={() => {
                            toast({
                              title: "Report submitted",
                              description: "Thank you for reporting this problem. We'll review it shortly.",
                            });
                          }}
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                        {currentUserId === item.profile_id && (
                          <DropdownMenuItem 
                            onClick={() => setDeletePostId(item.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Content */}
                  <p className="text-foreground mt-3 whitespace-pre-wrap">{item.content}</p>
                </div>
                
                {/* Media - Natural aspect ratio for landscape images */}
                {item.media_url && (
                  <div 
                    className="mt-3 cursor-pointer bg-muted/30"
                    onClick={() => setMediaPreview({
                      url: item.media_url!,
                      type: item.media_type === "video" ? "video" : "image"
                    })}
                  >
                    {item.media_type === "video" ? (
                      <div className="relative w-full aspect-video">
                        <video 
                          src={item.media_url} 
                          controls
                          className="absolute inset-0 w-full h-full object-contain bg-black"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <img 
                        src={item.media_url} 
                        alt="Post content"
                        className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity"
                      />
                    )}
                  </div>
                )}

                {/* Reactions count */}
                {item.likes > 0 && (
                  <div className="px-4 py-2 flex items-center text-sm text-muted-foreground border-b border-border/40">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs">
                      <Heart className="h-3 w-3 fill-current" />
                    </span>
                  </div>
                )}

                {/* Actions - Facebook style */}
                <div className="px-2 py-1">
                  <div className="flex items-center justify-around">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(item.id)}
                      className={`flex-1 gap-2 rounded-md ${item.isLiked ? "text-red-500" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      <Heart className={`w-5 h-5 ${item.isLiked ? "fill-current" : ""}`} />
                      <span className="font-medium">Like</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleContact(item.profile_id)}
                      className="flex-1 gap-2 rounded-md text-muted-foreground hover:bg-muted"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">Contact</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Media Preview Dialog */}
      <Dialog open={!!mediaPreview} onOpenChange={() => setMediaPreview(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none [&>button]:text-white">
          <div className="flex items-center justify-center w-full h-full p-4">
            {mediaPreview?.type === "video" ? (
              <video 
                src={mediaPreview.url} 
                controls
                autoPlay
                className="max-w-full max-h-[85vh] object-contain"
              />
            ) : (
              <img 
                src={mediaPreview?.url} 
                alt="Full size preview"
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Post Confirmation Dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletePostId && handleDeletePost(deletePostId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Feed;
