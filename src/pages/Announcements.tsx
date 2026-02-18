import Navigation from "@/components/Navigation";
import { isAdExpired } from "@/lib/adExpiration";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ExpandableText from "@/components/ExpandableText";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, User, MessageCircle, MoreHorizontal, Flag, Trash2, Loader2, Globe, MapPin, DollarSign, ArrowRight, Share2 } from "lucide-react";
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
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndGetCountry = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', session.user.id)
          .maybeSingle();
        
        setUserCountry(profile?.country || '__all__');
      } else {
        setUserCountry('__all__');
      }
    };
    checkAuthAndGetCountry();
  }, []);

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
      
      let query = supabase
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
        .eq('is_premium', false); // Only standard ads, no promotions
      
      if (userCountry !== '__all__') {
        query = query.eq('profiles.country', userCountry);
      }
      
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (error) {
        console.error("Error fetching announcements:", error);
        return;
      }
      
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

  return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-background`}>
      <Navigation />
      
      <div className="container mx-auto pt-16 md:pt-[68px] pb-0 px-0">
        <div className="max-w-[500px] mx-auto space-y-1">
          {loading ? <div className="text-center text-muted-foreground">Loading announcements...</div> : (() => {
          const filteredAnnouncements = announcements.filter(a => !isAdExpired(a));
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
                          <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                            Ad
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
                          const url = `${window.location.origin}/artist/${announcement.profile_id}`;
                          navigator.clipboard.writeText(url);
                          toast({
                            title: "Link copied",
                            description: "The link has been copied to your clipboard."
                          });
                        }}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
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
                  {(announcement.location || announcement.event_date || announcement.budget) && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 mb-1 text-xs text-muted-foreground">
                      {announcement.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {announcement.location}
                        </span>
                      )}
                      {announcement.event_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(announcement.event_date).toLocaleDateString()}
                        </span>
                      )}
                      {announcement.budget && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {announcement.budget}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Action button */}
                <div className="px-2 py-1">
                  <div className="flex items-center justify-around">
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `/artist/${announcement.profile_id}`} className="flex-1 gap-2 rounded-md text-accent hover:bg-transparent hover:text-accent">
                      <ArrowRight className="w-5 h-5" />
                      <span className="font-medium">Apply Now</span>
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