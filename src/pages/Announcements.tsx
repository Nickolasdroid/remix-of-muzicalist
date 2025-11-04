import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Music } from "lucide-react";

const Announcements = () => {
  const announcements = [
    {
      id: 1,
      title: "Wedding Band Needed - Bucharest",
      type: "Event Request",
      description: "Looking for a professional band for a wedding in Bucharest on June 15th. Preference for bands that can play traditional and modern music.",
      location: "București",
      date: "June 15, 2025",
      category: "Band",
    },
    {
      id: 2,
      title: "DJ Available for Corporate Events",
      type: "Artist Offer",
      description: "Experienced DJ with 10+ years, available for corporate events, conferences, and parties. Professional equipment included.",
      location: "Cluj-Napoca",
      date: "Available",
      category: "DJ",
    },
    {
      id: 3,
      title: "Singer Needed for Restaurant",
      type: "Job Offer",
      description: "Popular restaurant in Timișoara looking for a singer for weekend performances. Jazz and lounge music preferred.",
      location: "Timiș",
      date: "Starting May 2025",
      category: "Singer",
    },
    {
      id: 4,
      title: "Violinist Available for Events",
      type: "Artist Offer",
      description: "Classical violinist available for weddings, private events, and concerts. Repertoire includes classical, modern, and traditional Romanian music.",
      location: "Brașov",
      date: "Available",
      category: "Instrumentalist",
    },
  ];

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
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="p-6 bg-card/50 backdrop-blur border-accent/20 hover:border-accent/40 transition-all hover:shadow-[var(--shadow-gold)]">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant={announcement.type === "Artist Offer" ? "default" : "outline"} className="bg-accent/10 text-accent border-accent/30">
                      {announcement.type}
                    </Badge>
                    <Badge variant="outline" className="border-accent/20">
                      {announcement.category}
                    </Badge>
                  </div>
                  
                  <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                    {announcement.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-4">
                    {announcement.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      {announcement.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-accent" />
                      {announcement.date}
                    </div>
                  </div>
                </div>
                
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-[var(--shadow-gold)]">
                  Contact
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
