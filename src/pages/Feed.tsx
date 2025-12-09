import { useState, useEffect } from "react";
import { Heart, Bookmark, Mail, Play, MoreVertical, Flag } from "lucide-react";
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

const Feed = () => {
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Fetch profiles for each post
        const postsWithProfiles = await Promise.all(
          (posts || []).map(async (post) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('stage_name, avatar_url, specialization, plan')
              .eq('id', post.profile_id)
              .maybeSingle();

            return {
              ...post,
              profile: profile || {
                stage_name: 'Unknown Artist',
                avatar_url: null,
                specialization: null,
                plan: 'Free'
              },
              isLiked: false,
              isSaved: false,
              likes: Math.floor(Math.random() * 100) // Placeholder until we add likes table
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
  }, []);

  const handleLike = (id: string) => {
    setFeedItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    );
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
      <div className="min-h-screen bg-background">
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-4xl font-display font-bold text-foreground mb-8">Feed</h1>
          
          {feedItems.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
            </Card>
          ) : (
            feedItems.map((item) => (
              <Card key={item.id} className="overflow-hidden border-border/40">
                <CardContent className="p-6">
                  {/* Artist Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className={`w-10 h-10 cursor-pointer border-2 ${item.profile.plan === 'Premium' ? 'border-accent' : 'border-burgundy'}`}
                        onClick={() => navigate(`/artist/${item.profile_id}`)}
                      >
                        <AvatarImage src={item.profile.avatar_url || undefined} alt={item.profile.stage_name} />
                        <AvatarFallback className={item.profile.plan === 'Premium' ? 'bg-accent/20 text-accent' : 'bg-burgundy/20 text-burgundy'}>
                          {item.profile.stage_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 
                          className="font-semibold text-foreground cursor-pointer hover:text-accent transition-colors"
                          onClick={() => navigate(`/artist/${item.profile_id}`)}
                        >
                          {item.profile.stage_name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getSpecializationLabel(item.profile.specialization)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
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
                          Report Problem
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Content */}
                  <p className="text-foreground mb-4 whitespace-pre-wrap">{item.content}</p>
                  
                  {/* Media */}
                  {item.media_url && (
                    <div className="relative rounded-lg overflow-hidden mb-4">
                      {item.media_type === "video" ? (
                        <div className="relative aspect-video bg-muted flex items-center justify-center">
                          <video 
                            src={item.media_url} 
                            controls
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <img 
                          src={item.media_url} 
                          alt="Post content"
                          className="w-full h-auto rounded-lg"
                        />
                      )}
                    </div>
                  )}
                </CardContent>

                {/* Actions */}
                <CardFooter className="p-6 pt-0 flex items-center justify-between border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(item.id)}
                      className={item.isLiked ? "text-accent" : ""}
                    >
                      <Heart className={`w-5 h-5 ${item.isLiked ? "fill-current" : ""}`} />
                      <span className="ml-2">{item.likes}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(item.id)}
                      className={item.isSaved ? "text-accent" : ""}
                    >
                      <Bookmark className={`w-5 h-5 ${item.isSaved ? "fill-current" : ""}`} />
                    </Button>
                  </div>

                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-accent/20"
                    onClick={() => handleContact(item.profile_id)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;
