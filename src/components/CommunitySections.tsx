import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Star, ThumbsUp, MessageCircle, Share2, MapPin, CalendarDays } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

const ShareYourTalentCard = () => (
  <div className="group relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 md:p-8 overflow-hidden transition-all duration-500 hover:border-accent/50 hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)]">
    {/* Shine overlay */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[linear-gradient(105deg,transparent_40%,hsl(var(--accent)/0.08)_45%,hsl(var(--accent)/0.15)_50%,hsl(var(--accent)/0.08)_55%,transparent_60%)] bg-[length:200%_100%] group-hover:animate-[shimmer_1.5s_ease-in-out]" />

    <div className="relative z-10 flex flex-col items-center text-center gap-4">
      <h3 className="text-lg md:text-2xl font-display font-bold text-foreground">
        Share Your Talent
      </h3>

      {/* Mini phone mockup */}
      <div className="w-44 md:w-52 flex-shrink-0">
        <div className="rounded-2xl border border-accent/20 bg-card overflow-hidden shadow-md">
          <div className="aspect-[3/4] bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center relative">
            <div className="w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-4 w-4 text-accent fill-accent" />
            </div>
          </div>
          <div className="p-2.5 space-y-1.5">
            <h4 className="font-display font-bold text-xs text-foreground">Artist Name</h4>
            <p className="text-[9px] text-muted-foreground">Category · Location</p>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-2.5 w-2.5 text-accent fill-accent" />
              ))}
              <span className="text-[8px] text-muted-foreground ml-1">4.9</span>
            </div>
            <div className="flex items-center justify-between border-t border-border/50 pt-1.5 text-[8px] text-muted-foreground">
              <span className="flex items-center gap-0.5"><ThumbsUp className="h-2 w-2" /> Like</span>
              <span className="flex items-center gap-0.5"><MessageCircle className="h-2 w-2" /> Comment</span>
              <span className="flex items-center gap-0.5"><Share2 className="h-2 w-2" /> Share</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs md:text-sm text-muted-foreground max-w-xs">
        Artists post performances, grow followers and get booked directly from their content.
      </p>

      <Link to="/feed">
        <Button
          size="sm"
          className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300 text-xs md:text-sm px-5 py-2"
        >
          Explore Feed
        </Button>
      </Link>
    </div>
  </div>
);

const EventOpportunitiesCard = () => (
  <div className="group relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 md:p-8 overflow-hidden transition-all duration-500 hover:border-accent/50 hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)]">
    {/* Shine overlay */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[linear-gradient(105deg,transparent_40%,hsl(var(--accent)/0.08)_45%,hsl(var(--accent)/0.15)_50%,hsl(var(--accent)/0.08)_55%,transparent_60%)] bg-[length:200%_100%] group-hover:animate-[shimmer_1.5s_ease-in-out]" />

    <div className="relative z-10 flex flex-col items-center text-center gap-4">
      <h3 className="text-lg md:text-2xl font-display font-bold text-foreground">
        Discover Events
      </h3>

      {/* Mini phone mockup */}
      <div className="w-44 md:w-52 flex-shrink-0">
        <div className="rounded-2xl border border-accent/20 bg-card overflow-hidden shadow-md">
          <div className="p-2 space-y-1.5">
            <span className="text-[8px] font-bold border border-accent text-accent px-1.5 py-0.5 rounded">Sponsored</span>
            {[
              { name: "Electric Club", location: "New York", date: "Sat, May 18", budget: "€3500" },
              { name: "Lucia Events", location: "Cluj-Napoca", date: "Jun 14", budget: "€1200" },
              { name: "Summit Festival", location: "Bucharest", date: "Jun 19", budget: "€750" },
            ].map((event, i) => (
              <div key={i} className="rounded-md border border-border/50 bg-secondary/50 p-2 space-y-0.5">
                <h4 className="font-display font-bold text-[10px] text-foreground">{event.name}</h4>
                <p className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="h-2 w-2" /> {event.location}
                </p>
                <p className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                  <CalendarDays className="h-2 w-2" /> {event.date}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-accent">{event.budget}</span>
                  <span className="text-[7px] font-bold border border-accent text-accent px-1 py-0.5 rounded">APPLY</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs md:text-sm text-muted-foreground max-w-xs">
        Event organizers post requests. Artists apply and secure gigs fast.
      </p>

      <Link to="/announcements">
        <Button
          size="sm"
          className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300 text-xs md:text-sm px-5 py-2"
        >
          View Opportunities
        </Button>
      </Link>
    </div>
  </div>
);

const CommunitySections = () => {
  const isMobile = useIsMobile();

  return (
    <section className="py-12 md:py-28 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.08)_0%,transparent_70%)]" />

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-2 md:mb-4">
            A Real Musical Community
          </h2>
          <p className="text-xs md:text-lg text-muted-foreground max-w-xl mx-auto">
            Not just booking. Connect, perform and get discovered.
          </p>
        </div>

        {isMobile ? (
          <Carousel opts={{ align: "start", loop: false }} className="w-full">
            <CarouselContent className="-ml-3">
              <CarouselItem className="pl-3 basis-[85%]">
                <ShareYourTalentCard />
              </CarouselItem>
              <CarouselItem className="pl-3 basis-[85%]">
                <EventOpportunitiesCard />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
            <ShareYourTalentCard />
            <EventOpportunitiesCard />
          </div>
        )}
      </div>
    </section>
  );
};

export default CommunitySections;
