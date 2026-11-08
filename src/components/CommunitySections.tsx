import { Link } from "react-router-dom";
import artistFeedImg from "@/assets/artist-feed-mockup.webp";

const BLOCKS = [
  {
    title: "Artist posts",
    text: "Artists share videos from their shows, photos and the dates they're free. Follow them and see what they're up to.",
    link: "/feed",
    linkLabel: "See posts",
  },
  {
    title: "Events looking for artists",
    text: "Organizers post the event and the kind of artist they need. Artists answer with a price, and the organizer picks.",
    link: "/feed?f=gig",
    linkLabel: "See events",
  },
];

const CommunitySections = () => (
  <section className="px-4 py-16 md:px-8 md:py-24">
    <div className="container mx-auto grid max-w-6xl items-center gap-10 px-0 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
      <div className="overflow-hidden rounded-3xl bg-secondary lg:order-2">
        <img
          src={artistFeedImg}
          alt="A singer on stage, as a post in the Muzicalist feed"
          className="aspect-[4/3] h-full w-full object-cover lg:aspect-[5/4]"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div>
        <h2 className="font-headline text-3xl font-bold tracking-[-0.025em] text-foreground md:text-[2.75rem] md:leading-[1.08]">
          More than a list of names
        </h2>
        <div className="mt-8 space-y-8 md:mt-10">
          {BLOCKS.map((b) => (
            <div key={b.title} className="border-t border-border pt-6">
              <h3 className="font-headline text-xl font-semibold tracking-[-0.015em] text-foreground md:text-2xl">{b.title}</h3>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground md:text-base">{b.text}</p>
              <Link
                to={b.link}
                className="mt-4 inline-block rounded-sm text-[15px] font-semibold text-foreground underline decoration-border underline-offset-[6px] transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {b.linkLabel}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default CommunitySections;
