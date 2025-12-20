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
              <Card key={announcement.id} className="overflow-hidden bg-card/50 backdrop-blur border-accent/20 hover:border-accent/40 transition-all hover:shadow-[var(--shadow-gold)]">
                <div className="p-6">
                  <div className="flex gap-4">
                    <Link to={`/artist/${announcement.profile_id}`} className="shrink-0 hover:opacity-80 transition-opacity">
                      <div 
                        className={`p-0.5 rounded-full ${
                          announcement.profiles?.plan === 'Premium' 
                            ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600' 
                            : 'bg-gradient-to-r from-red-500 via-red-600 to-red-500'
                        }`}
                      >
                        <Avatar className="h-16 w-16 border-2 border-background">
                          <AvatarImage src={announcement.profiles?.avatar_url || ""} alt={announcement.profiles?.stage_name || "Artist"} />
                          <AvatarFallback>
                            <User className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </Link>
                    
                    <div className="flex-1 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Link to={`/artist/${announcement.profile_id}`} className="hover:text-accent transition-colors">
                            <span className="font-display font-bold text-foreground text-lg">
                              {announcement.profiles?.stage_name || "Artist"}
                            </span>
                          </Link>
                          {announcement.is_premium && (
                            <Badge className="bg-accent/10 text-accent border-accent/30">
                              Promotion
                            </Badge>
                          )}
                        </div>
                        {announcement.profiles?.specialization && (
                          <span className="text-sm text-muted-foreground mb-3 block">
                            {announcement.profiles.specialization}
                          </span>
                        )}
                        
                        <p className="text-muted-foreground">
                          {announcement.description}
                        </p>
                      </div>
                      
                      <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-[var(--shadow-gold)]">
                        Contact
                      </Button>
                    </div>
                  </div>
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
                
                <div className="px-6 pb-4 pt-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 text-accent" />
                    {new Date(announcement.date).toLocaleDateString()}
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
    </div>
  );
};

export default Announcements;
