import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Megaphone, Newspaper } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

/* Compact card for carousel */
const MobileCard = ({ type }: { type: "feed" | "events" }) => {
  if (type === "feed") {
    return (
      <div className="group relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 overflow-hidden transition-all duration-500 hover:border-accent/50 hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)]">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[linear-gradient(105deg,transparent_40%,hsl(var(--accent)/0.08)_45%,hsl(var(--accent)/0.15)_50%,hsl(var(--accent)/0.08)_55%,transparent_60%)] bg-[length:200%_100%] group-hover:animate-[shimmer_1.5s_ease-in-out]" />
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-display font-bold text-foreground">Artist Feed</h3>
          </div>
          <p className="text-foreground/90 text-base font-normal">Share performances, build your audience, and get booked.</p>
          <p className="text-foreground/90 text-base font-normal">Post your performance videos, grow your followers, and turn visibility into real bookings.</p>
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
           <h3 className="text-lg font-display font-bold text-foreground">Event Opportunities</h3>
        </div>
        <p className="text-foreground/90 text-base font-normal">Browse real event requests, apply quickly, and secure new bookings.</p>
        <p className="text-foreground/90 text-base font-normal">Connect with verified organizers and turn opportunities into confirmed events.</p>
        <Link to="/announcements">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[var(--shadow-gold)] text-xs px-5 py-2 mt-1">
            Explore Announcements
          </Button>
        </Link>
      </div>
    </div>
  );
};

const CommunitySections = () => {
  return (
    <section className="py-12 md:py-28 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.08)_0%,transparent_70%)]" />

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-2 md:mb-4">
            Posts & Event Opportunities
          </h2>
          <p className="md:text-lg text-muted-foreground max-w-xl mx-auto text-sm">
            Share performances, explore real event requests, and turn activity into bookings.
          </p>
        </div>

        <Carousel opts={{ align: "start", loop: false }} className="w-full -mx-4 md:mx-0">
          <CarouselContent className="-ml-2">
            <CarouselItem className="pl-2 basis-[88%] md:basis-1/2 lg:basis-1/2">
              <div className="pr-2">
                <MobileCard type="feed" />
              </div>
            </CarouselItem>
            <CarouselItem className="pl-2 basis-[88%] md:basis-1/2 lg:basis-1/2">
              <div className="pr-2">
                <MobileCard type="events" />
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default CommunitySections;
