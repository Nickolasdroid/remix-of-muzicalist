import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar, User } from "lucide-react";
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
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          profiles (
            avatar_url,
            stage_name,
            county,
            specialization,
            plan
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching announcements:", error);
      } else {
        setAnnouncements(data || []);
      }
      setLoading(false);
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6">
            Announcements
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find opportunities or post your availability for events and collaborations
          </p>
        </div>

        <div className="max-w-[500px] mx-auto space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center text-muted-foreground">No announcements yet.</div>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="overflow-hidden border-border/40 shadow-sm rounded-lg">
                {/* Header - matching Feed layout */}
                <div className="p-4 pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Link to={`/artist/${announcement.profile_id}`}>
                        <div 
                          className={`p-0.5 rounded-full ${
                            announcement.profiles?.plan === 'Premium' 
                              ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600' 
                              : 'bg-gradient-to-r from-red-500 via-red-600 to-red-500'
                          }`}
                        >
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
                          {announcement.profiles?.plan === 'Premium' && (
                            <span className="text-accent text-xs">✓</span>
                          )}
                          {announcement.is_premium && (
                            <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                              Promotion
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{announcement.profiles?.specialization || "Artist"}</span>
                          <span>·</span>
                          <span>{new Date(announcement.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-foreground mt-3 whitespace-pre-wrap">{announcement.description}</p>
                </div>
                
                {/* Media for premium announcements - edge to edge */}
                {announcement.is_premium && announcement.media_url && (
                  <div 
                    className="cursor-pointer bg-muted/30"
                    onClick={() => setMediaPreview({
                      url: announcement.media_url!,
                      type: announcement.media_type === "video" ? "video" : "image"
                    })}
                  >
                    {announcement.media_type === "video" ? (
                      <div className="relative w-full aspect-video">
                        <video 
                          src={announcement.media_url} 
                          className="absolute inset-0 w-full h-full object-cover bg-black"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <div className="relative w-full aspect-[4/5] sm:aspect-video">
                        <img 
                          src={announcement.media_url} 
                          alt="Announcement media"
                          className="absolute inset-0 w-full h-full object-cover hover:opacity-95 transition-opacity"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Footer removed - date is now in header */}
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
    </div>
  );
};

export default Announcements;
