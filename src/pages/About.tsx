import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import DiscoverArtistsSection from "@/components/DiscoverArtistsSection";
import AISearchShowcase from "@/components/AISearchShowcase";
import CommunitySections from "@/components/CommunitySections";
import LeaderboardPreviewSection from "@/components/LeaderboardPreviewSection";
import HeroSearchBar from "@/components/HeroSearchBar";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useHomeArtists, type HomeArtist } from "@/hooks/useHomeArtists";
import { getThumbUrl } from "@/lib/imageUrl";
import { translateSpecialization } from "@/lib/specializationLabel";
import { cn } from "@/lib/utils";
import ctaPhoto from "@/assets/about-story-live.webp";

/** One artist photo in the hero: the artists themselves are the first thing a visitor sees. */
const HeroPortrait = ({ artist, className }: { artist: HomeArtist; className?: string }) => (
  <Link
    to={`/artist/${artist.id}`}
    className={cn("group relative block overflow-hidden rounded-2xl bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
  >
    <img
      src={getThumbUrl(artist.avatar_url!, 480)}
      alt={artist.stage_name}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      loading="eager"
      decoding="async"
    />
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3.5 pb-3 pt-10">
      <p className="truncate text-[15px] font-semibold text-white notranslate" translate="no" data-user-content="true">
        {artist.stage_name}
      </p>
      <p className="truncate text-xs text-white/70">{translateSpecialization(artist.specialization)}</p>
    </div>
  </Link>
);

const CATEGORY_LINKS = [
  { key: "singers", href: "/categories/Singers" },
  { key: "instrumentalists", href: "/categories/Instrumentalists" },
  { key: "djs", href: "/categories/DJs" },
  { key: "bands", href: "/categories/Bands" },
] as const;

const About = () => {
  const { t } = useTranslation();
  const { stats } = usePlatformStats();
  const artists = useHomeArtists();
  const withPhoto = (artists || []).filter((a) => !!a.avatar_url);
  const portraits = withPhoto.length >= 4 ? withPhoto.slice(0, 4) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="px-4 pt-24 pb-14 md:px-8 md:pt-36 md:pb-24">
        <div className="container mx-auto grid max-w-6xl items-center gap-12 px-0 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
          <div>
            <h1 className="font-headline text-[2.6rem] font-bold leading-[1.02] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-[4.5rem]">
              Find the right artist for your event
            </h1>
            <p className="mt-5 max-w-[34rem] text-base leading-relaxed text-muted-foreground md:mt-6 md:text-lg">
              Singers, DJs, bands and instrumentalists. See their work, check when they're free and book with a contract.
            </p>
            <div className="mt-8 md:mt-10">
              <HeroSearchBar />
            </div>
            <nav aria-label="Categories" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm md:mt-7">
              {CATEGORY_LINKS.map(({ key, href }) => (
                <Link key={key} to={href} className="group inline-flex items-baseline gap-1.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="font-semibold tabular-nums text-foreground">{stats ? stats[key] : "—"}</span>
                  <span className="text-muted-foreground transition-colors group-hover:text-foreground">{t(`platformStats.${key}`)}</span>
                </Link>
              ))}
            </nav>
          </div>

          {portraits.length === 4 && (
            <>
              {/* Desktop: two staggered columns */}
              <div className="hidden grid-cols-2 gap-4 lg:grid">
                <div className="space-y-4">
                  <HeroPortrait artist={portraits[0]} className="aspect-[3/4]" />
                  <HeroPortrait artist={portraits[1]} className="aspect-[4/3]" />
                </div>
                <div className="space-y-4 pt-14">
                  <HeroPortrait artist={portraits[2]} className="aspect-[4/3]" />
                  <HeroPortrait artist={portraits[3]} className="aspect-[3/4]" />
                </div>
              </div>
              {/* Phones and tablets: a row to swipe */}
              <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
                {portraits.map((a) => (
                  <HeroPortrait key={a.id} artist={a} className="aspect-[3/4] w-[44%] shrink-0 snap-start sm:w-[30%]" />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <DiscoverArtistsSection artists={artists ? artists.filter((a) => !portraits.includes(a)) : null} />

      <AISearchShowcase />

      <CommunitySections />

      <LeaderboardPreviewSection />

      {/* How it works: a real sequence, so the steps are numbered */}
      <section className="px-4 py-16 md:px-8 md:py-24">
        <div className="container mx-auto max-w-6xl px-0">
          <h2 className="font-headline text-3xl font-bold tracking-[-0.025em] text-foreground md:text-[2.75rem]">
            How Muzicalist Works
          </h2>
          <ol className="mt-10 grid gap-10 md:mt-14 md:grid-cols-3 md:gap-8">
            {[
              { step: 1, title: "Search", description: "Find artists by location, genre and availability." },
              { step: 2, title: "Connect", description: "Chat and finalize event details directly." },
              { step: 3, title: "Book", description: "Confirm your artist and organize your event with confidence." },
            ].map(({ step, title, description }) => (
              <li key={step} className="border-t border-border pt-6">
                <span className="font-headline text-sm font-semibold tabular-nums text-muted-foreground">{step}</span>
                <h3 className="mt-3 font-headline text-2xl font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
                <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* For artists */}
      <section className="px-4 pb-16 md:px-8 md:pb-24">
        <div className="container mx-auto max-w-6xl px-0">
          <div className="relative overflow-hidden rounded-3xl">
            <img src={ctaPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/20" />
            <div className="relative max-w-xl px-6 py-14 md:px-14 md:py-20">
              <h2 className="font-headline text-3xl font-bold tracking-[-0.025em] text-white md:text-5xl">Are you an artist?</h2>
              <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">
                Create your profile for free, show what you do and get booking requests.
              </p>
              <Button asChild size="lg" className="mt-8 h-12 rounded-full bg-accent px-7 text-[15px] font-semibold text-accent-foreground hover:bg-accent/90">
                <Link to="/register">Create artist profile</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
