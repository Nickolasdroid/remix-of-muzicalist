import { Link } from "react-router-dom";
import { Star, User } from "lucide-react";
import { getThumbUrl } from "@/lib/imageUrl";
import { translateSpecialization } from "@/lib/specializationLabel";
import type { HomeArtist } from "@/hooks/useHomeArtists";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/** Home page row of artists: photo first, name and details under it, nothing boxed. */
const DiscoverArtistsSection = ({ artists }: { artists: HomeArtist[] | null }) => {
  if (!artists || artists.length === 0) return null;

  return (
    <section className="px-4 py-10 md:px-8 md:py-16">
      <div className="container mx-auto max-w-6xl px-0">
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <h2 className="font-headline text-3xl font-bold tracking-[-0.025em] text-foreground md:text-[2.75rem]">
            Discover artists
          </h2>
          <Link to="/artists" className="shrink-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:text-[15px]">
            See all
          </Link>
        </div>

        <Carousel opts={{ align: "start", loop: false }} className="w-full">
          <CarouselContent className="-ml-3 md:-ml-5">
            {artists.map((artist) => (
              <CarouselItem key={artist.id} className="basis-[46%] pl-3 sm:basis-1/3 md:basis-1/4 md:pl-5 lg:basis-1/5">
                <Link to={`/artist/${artist.id}`} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="aspect-square overflow-hidden rounded-xl bg-secondary">
                    {artist.avatar_url ? (
                      <img
                        src={getThumbUrl(artist.avatar_url, 320)}
                        alt={artist.stage_name}
                        width={320}
                        height={320}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground/60" />
                      </div>
                    )}
                  </div>
                  <h3
                    className="mt-3 truncate text-[15px] font-semibold text-foreground notranslate"
                    data-user-content="true"
                    data-no-translate="true"
                    translate="no"
                  >
                    {artist.stage_name}
                  </h3>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    <span>{translateSpecialization(artist.specialization)}</span>
                    {artist.county ? (
                      <>
                        <span>, </span>
                        <span className="notranslate" translate="no">{artist.county}</span>
                      </>
                    ) : null}
                  </p>
                  {artist.rating !== null && (
                    <p className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
                      <span className="font-medium tabular-nums text-foreground">{artist.rating.toFixed(1)}</span>
                      <span className="tabular-nums">({artist.reviewCount})</span>
                    </p>
                  )}
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-5 top-[38%] border-border bg-background/90" />
          <CarouselNext className="hidden md:flex -right-5 top-[38%] border-border bg-background/90" />
        </Carousel>
      </div>
    </section>
  );
};

export default DiscoverArtistsSection;
