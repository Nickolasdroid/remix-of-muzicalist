import { HelpCircle, Lock } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const PLACEHOLDER_COUNT = 12;

const TrendingArtistsSection = () => {
  const placeholders = Array.from({ length: PLACEHOLDER_COUNT });

  return (
    <section className="py-10 md:py-20 px-4 md:px-8">
      <div className="container mx-auto px-0">
        <div className="text-center mb-6 md:mb-12 px-2">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            Trending Artists
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Lock className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            <p className="text-sm md:text-lg text-muted-foreground">
              Launching Soon
            </p>
          </div>
        </div>

        <Carousel opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent className="-ml-3 md:-ml-4">
            {placeholders.map((_, index) => (
              <CarouselItem
                key={index}
                className="pl-3 md:pl-4 basis-1/2 md:basis-1/4"
              >
                <div className="overflow-hidden rounded-lg opacity-60">
                  <div className="relative aspect-square bg-gradient-to-br from-card to-secondary flex items-center justify-center">
                    <HelpCircle className="h-20 w-20 md:h-24 md:w-24 text-muted-foreground/40" />
                  </div>
                  <div className="bg-card border-t border-border p-2 space-y-0.5">
                    <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-1 md:-left-12" />
          <CarouselNext className="right-1 md:-right-12" />
        </Carousel>
      </div>
    </section>
  );
};

export default TrendingArtistsSection;
