import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, User, MessageCircle, MoreHorizontal, Flag, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
interface MediaPreview {
  url: string;
  type: "image" | "video";
}
const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'promotion' | 'ads'>('all');
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);
  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const {
        error
      } = await supabase.from('announcements').delete().eq('id', announcementId);
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
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const {
        data,
        error
      } = await supabase.from("announcements").select(`
          *,
          profiles (
            avatar_url,
            stage_name,
            county,
            specialization,
            plan
          )
        `).order("created_at", {
        ascending: false
      });
      if (error) {
        console.error("Error fetching announcements:", error);
      } else {
        setAnnouncements(data || []);
      }
      setLoading(false);
    };
    fetchAnnouncements();
  }, []);
  return <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto pt-16 md:pt-[68px] pb-24 md:pb-20 px-0">
        {/* Filter buttons */}
        <div className="max-w-[500px] mx-auto mb-1">
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')} className={filter === 'all' ? 'bg-accent text-accent-foreground' : ''}>
              All
            </Button>
            <Button variant={filter === 'promotion' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('promotion')} className={filter === 'promotion' ? 'bg-accent text-accent-foreground' : ''}>
              Promotions
            </Button>
            <Button variant={filter === 'ads' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('ads')} className={filter === 'ads' ? 'bg-accent text-accent-foreground' : ''}>
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
          return filteredAnnouncements.length === 0 ? <div className="text-center text-muted-foreground border-0">No announcements yet.</div> : filteredAnnouncements.map(announcement => <Card key={announcement.id} className="overflow-hidden border-border/40 shadow-sm rounded-lg">
                {/* Header - matching Feed layout */}
                <div className="p-4 pb-0 px-0 py-[15px]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Link to={`/artist/${announcement.profile_id}`}>
                        <div className={`p-0.5 rounded-full ${announcement.profiles?.plan === 'Premium' ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600' : 'bg-gradient-to-r from-red-500 via-red-600 to-red-500'}`}>
                          <Avatar className="w-10 h-10 border-2 border-background">
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
                            <h3 className="font-semibold text-foreground hover:underline">
                              {announcement.profiles?.stage_name || "Artist"}
                            </h3>
                          </Link>
                          {announcement.profiles?.plan === 'Premium' && <span className="text-accent text-xs">✓</span>}
                          {announcement.is_premium && <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                              Promotion
                            </Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{announcement.profiles?.specialization || "Artist"}</span>
                          <span>·</span>
                          <span>{new Date(announcement.date).toLocaleDateString()}</span>
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
                  <p className="text-foreground mt-3 whitespace-pre-wrap my-0 mx-[4px]">{announcement.description}</p>
                </div>
                
                {/* Media for premium announcements - Natural aspect ratio for landscape images */}
                {announcement.is_premium && announcement.media_url && <div className="mt-3 cursor-pointer bg-muted/30" onClick={() => setMediaPreview({
              url: announcement.media_url!,
              type: announcement.media_type === "video" ? "video" : "image"
            })}>
                    {announcement.media_type === "video" ? <div className="relative w-full aspect-video">
                        <video src={announcement.media_url} controls className="absolute inset-0 w-full h-full object-contain bg-black" onClick={e => e.stopPropagation()} />
                      </div> : <img src={announcement.media_url} alt="Announcement media" className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity" />}
                  </div>}
                
                {/* Contact button */}
                <div className="px-2 py-2">
                  <div className="flex items-center justify-around">
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `/artist/${announcement.profile_id}`} className="flex-1 gap-2 rounded-md text-muted-foreground hover:bg-muted">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">Contact</span>
                    </Button>
                  </div>
                </div>
              </Card>);
        })()}
        </div>
      </div>

      {/* Media Preview Dialog */}
      <Dialog open={!!mediaPreview} onOpenChange={() => setMediaPreview(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none [&>button]:text-white">
          <div className="flex items-center justify-center w-full h-full p-4">
            {mediaPreview?.type === "video" ? <video src={mediaPreview.url} controls autoPlay className="max-w-full max-h-[85vh] object-contain" /> : <img src={mediaPreview?.url} alt="Full size preview" className="max-w-full max-h-[85vh] object-contain" />}
          </div>
        </DialogContent>
      </Dialog>

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