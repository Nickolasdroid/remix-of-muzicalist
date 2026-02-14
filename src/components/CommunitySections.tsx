import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Star, ThumbsUp, MessageCircle, Eye, Share2, MapPin, CalendarDays, Megaphone } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

const PhoneMockup = () => (
  <div className="w-64 md:w-72 flex-shrink-0">
    <div className="rounded-[2rem] border-2 border-accent/30 bg-card overflow-hidden shadow-[0_0_40px_-5px_hsl(var(--accent)/0.4)] relative">
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-1.5 bg-black/80 text-white text-[9px]">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <span>●●●</span>
        </div>
      </div>

      {/* Artist image area */}
      <div className="aspect-[3/3.2] bg-gradient-to-br from-accent/30 via-accent/10 to-background relative flex items-end">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-background/40 backdrop-blur-sm flex items-center justify-center">
            <Play className="h-5 w-5 text-accent fill-accent" />
          </div>
        </div>
        {/* Artist info overlay */}
        <div className="relative z-10 p-3 w-full bg-gradient-to-t from-black/70 to-transparent">
          <h4 className="font-display font-bold text-sm text-white">Mark Rivers</h4>
          <p className="text-[10px] text-white/80">DJ · New York, NY</p>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-2.5 w-2.5 text-accent fill-accent" />
              ))}
              <span className="text-[9px] text-white/80 ml-1">4.9</span>
            </div>
            <span className="text-[8px] font-bold border border-accent text-accent px-2 py-0.5 rounded-md">BOOK</span>
          </div>
        </div>
      </div>

      {/* Engagement bar */}
      <div className="flex items-center justify-between px-3 py-1.5 text-[8px] text-muted-foreground border-b border-border/30">
        <span className="flex items-center gap-0.5"><ThumbsUp className="h-2.5 w-2.5" /> Like</span>
        <span className="flex items-center gap-0.5"><MessageCircle className="h-2.5 w-2.5" /> 121</span>
        <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" /> 87K</span>
        <span className="flex items-center gap-0.5"><Share2 className="h-2.5 w-2.5" /> Share</span>
      </div>

      {/* Event Request section inside phone */}
      <div className="p-2.5 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Megaphone className="h-3 w-3 text-accent" />
          <span className="text-[10px] font-display font-bold text-foreground">Event Request</span>
        </div>
        <p className="text-[8px] text-muted-foreground">Browse and apply to real gig opportunities.</p>

        {[
          { name: "Electric Club", location: "New York, NY", date: "Saturday, May 18" },
          { name: "Lucia Events", location: "Cluj-Napoca", date: "June 14" },
        ].map((event, i) => (
          <div key={i} className="rounded-md border border-accent/20 bg-secondary/50 p-2 flex items-center justify-between">
            <div className="space-y-0.5">
              <h5 className="font-display font-bold text-[9px] text-foreground">{event.name}</h5>
              <p className="text-[7px] text-muted-foreground flex items-center gap-0.5">
                <MapPin className="h-2 w-2 text-accent" /> {event.location}
              </p>
              <p className="text-[7px] text-muted-foreground flex items-center gap-0.5">
                <CalendarDays className="h-2 w-2 text-accent" /> {event.date}
              </p>
            </div>
            <span className="text-[7px] font-bold border border-accent text-accent px-1.5 py-0.5 rounded">APPLY NOW</span>
          </div>
        ))}
      </div>

      {/* Explore Feed button inside phone */}
      <div className="px-3 pb-3">
        <div className="w-full text-center py-1.5 rounded-lg bg-accent text-accent-foreground font-display font-bold text-[10px]">
          Explore Feed
        </div>
      </div>
    </div>
  </div>
);

const RightContent = () => (
  <div className="flex flex-col gap-6 md:gap-8 max-w-md">
    {/* Artist Feed */}
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 md:h-6 md:w-6 text-accent" />
        <h3 className="text-lg md:text-2xl font-display font-bold text-foreground">Artist Feed</h3>
      </div>
      <p className="text-sm md:text-base font-semibold text-foreground/90">
        Share performances, build your audience, and get booked.
      </p>
      <p className="text-xs md:text-sm text-muted-foreground">
        Post your performance videos, grow your followers, and get booked directly from your content.
      </p>
    </div>

    {/* Event Request */}
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 md:h-6 md:w-6 text-accent" />
        <h3 className="text-lg md:text-2xl font-display font-bold text-foreground">Event Request</h3>
      </div>
      <p className="text-sm md:text-base text-muted-foreground">
        Browse and apply to real gig opportunities.
      </p>

      {[
        { name: "Electric Club", location: "New York, NY", date: "Saturday, May 18" },
        { name: "Lucia Events", location: "Cluj-Napoca", date: "June 14, Budget" },
      ].map((event, i) => (
        <div key={i} className="rounded-xl border border-accent/20 bg-card/60 backdrop-blur-sm p-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <h5 className="font-display font-bold text-sm text-foreground">{event.name}</h5>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 text-accent" /> {event.location}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-accent" /> {event.date}
            </p>
          </div>
          <span className="text-xs font-bold border border-accent text-accent px-3 py-1 rounded-lg">APPLY NOW</span>
        </div>
      ))}
    </div>

    <Link to="/feed">
      <Button
        size="sm"
        className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300 text-xs md:text-sm px-6 py-2"
      >
        Explore Feed
      </Button>
    </Link>
  </div>
);

/* Compact mobile card for carousel */
const MobileCard = ({ type }: { type: "feed" | "events" }) => {
  if (type === "feed") {
    return (
      <div className="group relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 overflow-hidden transition-all duration-500 hover:border-accent/50 hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)]">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[linear-gradient(105deg,transparent_40%,hsl(var(--accent)/0.08)_45%,hsl(var(--accent)/0.15)_50%,hsl(var(--accent)/0.08)_55%,transparent_60%)] bg-[length:200%_100%] group-hover:animate-[shimmer_1.5s_ease-in-out]" />
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-display font-bold text-foreground">Artist Feed</h3>
          </div>
          <p className="text-sm font-semibold text-foreground/90">Share performances, build your audience, and get booked.</p>
          <p className="text-xs text-muted-foreground">Post your performance videos, grow your followers, and get booked directly from your content.</p>
          <Link to="/feed">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[var(--shadow-gold)] text-xs px-5 py-2 mt-1">
              Explore Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 overflow-hidden transition-all duration-500 hover:border-accent/50 hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)]">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[linear-gradient(105deg,transparent_40%,hsl(var(--accent)/0.08)_45%,hsl(var(--accent)/0.15)_50%,hsl(var(--accent)/0.08)_55%,transparent_60%)] bg-[length:200%_100%] group-hover:animate-[shimmer_1.5s_ease-in-out]" />
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-display font-bold text-foreground">Event Request</h3>
        </div>
        <p className="text-xs text-muted-foreground">Browse and apply to real gig opportunities.</p>
        {[
          { name: "Electric Club", location: "New York, NY", date: "Saturday, May 18" },
          { name: "Lucia Events", location: "Cluj-Napoca", date: "June 14" },
        ].map((event, i) => (
          <div key={i} className="rounded-lg border border-accent/20 bg-secondary/50 p-2.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <h5 className="font-display font-bold text-xs text-foreground">{event.name}</h5>
              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5 text-accent" /> {event.location}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5"><CalendarDays className="h-2.5 w-2.5 text-accent" /> {event.date}</p>
            </div>
            <span className="text-[9px] font-bold border border-accent text-accent px-2 py-0.5 rounded">APPLY NOW</span>
          </div>
        ))}
        <Link to="/announcements">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[var(--shadow-gold)] text-xs px-5 py-2 mt-1">
            View Opportunities
          </Button>
        </Link>
      </div>
    </div>
  );
};

const CommunitySections = () => {
  const isMobile = useIsMobile();

  return (
    <section className="py-12 md:py-28 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.08)_0%,transparent_70%)]" />

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-2 md:mb-4">
            The Muzicalist Community
          </h2>
          <p className="text-xs md:text-lg text-muted-foreground max-w-xl mx-auto">
            Not just booking. Connect, perform and get discovered.
          </p>
        </div>

        {isMobile ? (
          <Carousel opts={{ align: "start", loop: false }} className="w-full -mx-4">
            <CarouselContent className="-ml-2">
              <CarouselItem className="pl-2 basis-[88%]">
                <div className="pr-2">
                  <MobileCard type="feed" />
                </div>
              </CarouselItem>
              <CarouselItem className="pl-2 basis-[88%]">
                <div className="pr-2">
                  <MobileCard type="events" />
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="flex items-center justify-center gap-12 lg:gap-20 max-w-5xl mx-auto">
            <PhoneMockup />
            <RightContent />
          </div>
        )}
      </div>
    </section>
  );
};

export default CommunitySections;
