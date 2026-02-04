import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ExpandableText from "@/components/ExpandableText";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, User, MessageCircle, MoreHorizontal, Flag, Trash2, Loader2, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import InstagramZoomPreview from "@/components/InstagramZoomPreview";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";

const ANNOUNCEMENTS_PER_PAGE = 10;

interface MediaPreview {
  url: string;
  type: "image" | "video";
}
const Announcements = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'promotion' | 'ads'>('all');
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndGetCountry = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }
      setCurrentUserId(session.user.id);
      
      // Get user's country from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', session.user.id)
        .maybeSingle();
      
      setUserCountry(profile?.country || null);
    };
    checkAuthAndGetCountry();
  }, [navigate]);

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', announcementId);
      if (error) throw error;
      setAnnouncements(items => items.filter(item => item.id !== announcementId));
      toast({
        title: "Announcement deleted",
        description: "Your announcement has been deleted."
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: "Failed to delete announcement.",
        variant: "destructive"
      });
    } finally {
      setDeleteAnnouncementId(null);
    }
  };

  const fetchAnnouncements = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!userCountry) return;
    
    try {
      const from = pageNum * ANNOUNCEMENTS_PER_PAGE;
      const to = from + ANNOUNCEMENTS_PER_PAGE - 1;
      
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          profiles!inner (
            avatar_url,
            stage_name,
            county,
            specialization,
            plan,
            country
          )
        `)
        .eq('profiles.country', userCountry)
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (error) {
        console.error("Error fetching announcements:", error);
        return;
      }
      
      // Check if there are more announcements
      if (!data || data.length < ANNOUNCEMENTS_PER_PAGE) {
        setHasMore(false);
      }
      
      if (append) {
        setAnnouncements(prev => [...prev, ...(data || [])]);
      } else {
        setAnnouncements(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [userCountry]);

  useEffect(() => {
    if (userCountry) {
      fetchAnnouncements(0);
    }
  }, [fetchAnnouncements, userCountry]);

  const loadMoreAnnouncements = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchAnnouncements(nextPage, true);
  }, [page, fetchAnnouncements]);

  const { loadMoreRef, isLoadingMore } = useInfiniteScroll(loadMoreAnnouncements, hasMore);
  return <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto pt-16 md:pt-[68px] pb-0 px-0">
        {/* Filter buttons */}
        <div className="max-w-[500px] mx-auto mb-1">
          <div className="flex gap-2 rounded-none border-none">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')} className={filter === 'all' ? 'bg-accent text-accent-foreground hover:bg-accent' : 'hover:bg-transparent hover:text-foreground'}>
              All
            </Button>
            <Button variant={filter === 'promotion' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('promotion')} className={filter === 'promotion' ? 'bg-accent text-accent-foreground hover:bg-accent' : 'hover:bg-transparent hover:text-foreground'}>
              Promotions
            </Button>
            <Button variant={filter === 'ads' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('ads')} className={filter === 'ads' ? 'bg-accent text-accent-foreground hover:bg-accent' : 'hover:bg-transparent hover:text-foreground'}>
              Ads
            </Button>
          </div>
        </div>

        <div className="max-w-[500px] mx-auto space-y-1">
          {loading ? <div className="text-center text-muted-foreground">Loading announcements...</div> : (() => {
          const filteredAnnouncements = announcements.filter(a => {
            if (filter === 'all') return true;
            if (filter === 'promotion') return a.is_premium === true;
            if (filter === 'ads') return a.is_premium === false;
            return true;
          });
          return filteredAnnouncements.length === 0 ? <div className="text-center text-muted-foreground border-0 rounded-none">No announcements yet.</div> : filteredAnnouncements.map(announcement => <Card key={announcement.id} className="overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary">
                {/* Header */}
                <div className="p-4 pb-0 border-black border-none shadow-none rounded-none px-[6px] py-[3px]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Link to={`/artist/${announcement.profile_id}`}>
                        <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(announcement.profiles?.plan)}`}>
                          <Avatar className="w-10 h-10 cursor-pointer border-2 border-background">
                            <AvatarImage src={announcement.profiles?.avatar_url || ""} alt={announcement.profiles?.stage_name || "Artist"} />
                            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                              {(announcement.profiles?.stage_name || "A").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </Link>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/artist/${announcement.profile_id}`}>
                            <h3 className="font-medium text-foreground cursor-pointer hover:underline">
                              {announcement.profiles?.stage_name || "Artist"}
                            </h3>
                          </Link>
                          {announcement.profiles?.plan === 'Premium' && <span className="text-accent text-xs">✓</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{announcement.profiles?.specialization || "User"}</span>
                          <span>·</span>
                          <span>{new Date(announcement.date).toLocaleDateString()}</span>
                          <span>·</span>
                          {announcement.is_premium ? <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                              Promotion
                            </Badge> : <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                              Ad
                            </Badge>}
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
                      toast({
                        title: "Report submitted",
                        description: "Thank you for reporting this problem. We'll review it shortly."
                      });
                    }}>
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                        {currentUserId === announcement.profile_id && <DropdownMenuItem onClick={() => setDeleteAnnouncementId(announcement.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Content */}
                  <ExpandableText text={announcement.description} className="mt-3 my-[5px]" />
                </div>
                
                {/* Media for premium announcements - Natural aspect ratio for landscape images */}
                {announcement.is_premium && announcement.media_url && <div className="mt-3 cursor-pointer bg-muted/30" onClick={() => setMediaPreview({
              url: announcement.media_url!,
              type: announcement.media_type === "video" ? "video" : "image"
            })}>
                    {announcement.media_type === "video" ? <div className="relative w-full aspect-video">
                        <video src={announcement.media_url} controls className="absolute inset-0 w-full h-full object-contain bg-black" onClick={e => e.stopPropagation()} />
                      </div> : <img src={announcement.media_url} alt="Announcement media" className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity border-primary" />}
                  </div>}
                
                {/* Contact button */}
                <div className="px-2 py-1">
                  <div className="flex items-center justify-around">
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `/artist/${announcement.profile_id}`} className="flex-1 gap-2 rounded-md text-muted-foreground hover:bg-transparent hover:text-muted-foreground">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">Contact</span>
                    </Button>
                  </div>
                </div>
              </Card>);
        })()}
          
          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="py-4 flex justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading more announcements...</span>
              </div>
            )}
            {!hasMore && announcements.length > 0 && (
              <p className="text-muted-foreground text-sm">No more announcements to load</p>
            )}
          </div>
        </div>
      </div>

      {/* Media Preview Dialog */}
      <InstagramZoomPreview media={mediaPreview} onClose={() => setMediaPreview(null)} />

      {/* Delete Announcement Confirmation Dialog */}
      <AlertDialog open={!!deleteAnnouncementId} onOpenChange={open => !open && setDeleteAnnouncementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
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
export default Announcements;