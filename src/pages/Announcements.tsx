import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            specialization
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
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

        <div className="max-w-5xl mx-auto space-y-6">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center text-muted-foreground">No announcements yet.</div>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="p-6 bg-card/50 backdrop-blur border-accent/20 hover:border-accent/40 transition-all hover:shadow-[var(--shadow-gold)]">
                <div className="flex gap-6">
                  <div className="flex items-center gap-3 shrink-0">
                    <Avatar className="h-16 w-16 border-2 border-accent ring-2 ring-accent/30">
                      <AvatarImage src={announcement.profiles?.avatar_url || ""} alt={announcement.profiles?.stage_name || "Artist"} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-display font-bold text-foreground text-lg">
                      {announcement.profiles?.stage_name || "Artist"}
                    </span>
                  </div>
                  
                  <div className="flex-1 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {announcement.is_premium && (
                          <Badge className="bg-accent/10 text-accent border-accent/30">
                            Premium
                          </Badge>
                        )}
                        {announcement.profiles?.specialization && (
                          <Badge variant="outline" className="border-accent/20">
                            {announcement.profiles.specialization}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground mb-4">
                        {announcement.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-accent" />
                          {announcement.profiles?.county || "Unknown"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-accent" />
                          {new Date(announcement.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-[var(--shadow-gold)]">
                      Contact
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
