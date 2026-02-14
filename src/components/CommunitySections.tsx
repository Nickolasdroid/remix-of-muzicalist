import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Star, ThumbsUp, MessageCircle, Share2, MapPin, CalendarDays } from "lucide-react";

const CommunitySections = () => {
  return (
    <>
      {/* A Real Musical Community */}
      <section className="py-16 md:py-28 px-4 md:px-8 relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.08)_0%,transparent_70%)]" />

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-4">
              A Real Musical Community
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-xl mx-auto">
              Not just booking. Connect, perform and get discovered.
            </p>
          </div>

          {/* Share Your Talent */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            {/* Phone mockup placeholder */}
            <div className="w-64 md:w-80 flex-shrink-0">
              <div className="rounded-[2rem] border-2 border-accent/30 bg-card overflow-hidden shadow-[var(--shadow-elegant)]">
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 py-2 text-[10px] text-muted-foreground">
                  <span>9:41</span>
                  <div className="flex gap-1 items-center">
                    <span>●●●</span>
                  </div>
                </div>
                {/* Image placeholder */}
                <div className="aspect-[3/4] bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center relative">
                  <div className="w-14 h-14 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center">
                    <Play className="h-6 w-6 text-accent fill-accent" />
                  </div>
                  <p className="absolute bottom-16 left-4 text-xs text-muted-foreground italic">
                    Artist image placeholder
                  </p>
                </div>
                {/* Card info */}
                <div className="p-4 space-y-2">
                  <h4 className="font-display font-bold text-foreground">Artist Name</h4>
                  <p className="text-xs text-muted-foreground">Category · Location</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-accent fill-accent" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">4.9</span>
                    <span className="ml-auto text-[10px] font-bold border border-accent text-accent px-2 py-0.5 rounded">BOOK</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> 87K
                    <Share2 className="h-3 w-3 ml-2" /> 121
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Like</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Comment</span>
                    <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Share</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-3xl font-display font-bold text-foreground mb-3">
                Share Your Talent
              </h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mb-6">
                Artists post performances, grow followers and get booked directly from their content.
              </p>
              <Link to="/feed">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 py-5 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300"
                >
                  Explore Feed
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Discover Event Opportunities */}
      <section className="py-16 md:py-28 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.06)_0%,transparent_70%)]" />

        <div className="container mx-auto relative z-10">
          <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16">
            {/* Text */}
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-3xl font-display font-bold text-foreground mb-3">
                Discover Event Opportunities
              </h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mb-6">
                Event organizers post requests. Artists apply and secure gigs fast.
              </p>
              <Link to="/announcements">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 py-5 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300"
                >
                  View Opportunities
                </Button>
              </Link>
            </div>

            {/* Phone mockup placeholder */}
            <div className="w-64 md:w-80 flex-shrink-0">
              <div className="rounded-[2rem] border-2 border-accent/30 bg-card overflow-hidden shadow-[var(--shadow-elegant)]">
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 py-2 text-[10px] text-muted-foreground">
                  <span>9:41</span>
                  <div className="flex gap-1 items-center">
                    <span>●●●</span>
                  </div>
                </div>
                {/* Event list placeholder */}
                <div className="p-3 space-y-3">
                  <span className="text-[10px] font-bold border border-accent text-accent px-2 py-0.5 rounded">Sponsored</span>

                  {[
                    { name: "Electric Club", location: "New York, NY", date: "Saturday, May 18", budget: "€3500" },
                    { name: "Lucia Events", location: "Cluj-Napoca", date: "Wedding, June 14", budget: "€1200" },
                    { name: "Summit Festival", location: "Bucharest", date: "Wednesday, June 19", budget: "€750" },
                  ].map((event, i) => (
                    <div key={i} className="rounded-lg border border-border/50 bg-secondary/50 p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display font-bold text-sm text-foreground">{event.name}</h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" /> {event.location}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-2.5 w-2.5" /> {event.date}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-accent">Budget: {event.budget}</span>
                        <span className="text-[9px] font-bold border border-accent text-accent px-1.5 py-0.5 rounded">APPLY NOW</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CommunitySections;
