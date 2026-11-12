import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import GuestSidebar from "@/components/GuestSidebar";
import CategoryTile, { CATEGORY_TILES } from "@/components/CategoryTile";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { knownUserId } from "@/lib/knownUser";
import { Search, GitCompare, MessageCircle, TrendingUp, Check, X } from "lucide-react";
import logo from "@/assets/logo.webp";
import heroConcert from "@/assets/about-hero-concert.webp";
import storyLive from "@/assets/about-story-live.webp";
import { usePlatformStats } from "@/hooks/usePlatformStats";

const STEPS = [
  { icon: Search, title: "Discover", desc: "Search and discover talented artists." },
  { icon: GitCompare, title: "Compare", desc: "View profiles and compare ratings." },
  { icon: MessageCircle, title: "Connect", desc: "Contact artists directly." },
  { icon: TrendingUp, title: "Grow", desc: "Book, collaborate and create opportunities." },
];

const OLD_WAY = [
  "Finding reliable musicians is difficult",
  "Time-consuming search process",
  "Limited visibility for artists",
  "No trusted verification system",
];

const NEW_WAY = [
  "Verified artist profiles",
  "Smart search and filtering",
  "Direct communication",
  "Better visibility and opportunities",
];

const H2 = "font-figtree text-[22px] font-bold leading-tight tracking-[-0.01em] text-foreground md:text-2xl";

/** Gold for the main action, outline for the second one (same as the rest of the site). */
const Actions = () => (
  <div className="flex flex-col gap-3 sm:flex-row">
    <Link
      to="/artists"
      className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-sm font-bold text-accent-foreground transition-transform hover:scale-[1.03]"
    >
      Find Artists
    </Link>
    <Link
      to="/register"
      className="inline-flex h-12 items-center justify-center rounded-full border border-foreground/40 px-8 text-sm font-bold text-foreground transition-colors hover:border-foreground"
    >
      Join Muzicalist
    </Link>
  </div>
);

/**
 * About page, in the app frame: a photo banner like an artist page, then plain sections
 * (how it works, why, numbers per artist type, story). Guests also get the sign-up buttons.
 */
const AboutUs = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => (knownUserId() ? true : null));
  const { stats } = usePlatformStats();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setIsAuthenticated(!!session?.user));
    supabase.auth.getSession().then(({ data: { session } }) => setIsAuthenticated(!!session?.user));
    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) return null;
  const guest = !isAuthenticated;

  return (
    <div
      className={`min-h-screen bg-black ${
        guest ? "md:flex md:items-start md:gap-2 md:px-2 md:pb-2 md:pt-[72px]" : "md:ml-[316px] md:py-2 md:pr-2 lg:ml-[356px]"
      }`}
    >
      <SEO
        title="About Muzicalist — The Global Stage for Musical Artists"
        description="Muzicalist connects talented musicians with clients worldwide. Learn how our platform helps artists get discovered and helps clients book with confidence."
        path="/about"
      />
      <Navigation />
      {guest && <GuestSidebar />}

      <main className="min-w-0 flex-1 overflow-hidden bg-background pb-20 pt-14 md:pb-0 md:min-h-[calc(100vh-80px)] md:rounded-lg md:pt-0">
        {/* Banner */}
        <header className="relative flex min-h-[300px] items-end overflow-hidden md:min-h-[380px]">
          <img src={heroConcert} alt="" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/50 to-black/20" />
          <div className="relative w-full px-4 pb-6 md:px-8 md:pb-8">
            <img src={logo} alt="" className="mb-4 h-12 w-12 object-contain md:h-14 md:w-14" />
            <h1 className="font-figtree text-4xl font-bold leading-none tracking-[-0.03em] text-white md:text-7xl">About Muzicalist</h1>
            <p className="mt-4 max-w-xl text-base text-white/80 md:text-lg">Connecting artists, opportunities and music communities worldwide.</p>
          </div>
        </header>

        <div className="space-y-12 px-4 pb-12 pt-2 md:space-y-16 md:px-8">
          {guest && <Actions />}

          {/* Mission */}
          <section className="max-w-3xl">
            <p className="font-figtree text-2xl font-bold leading-snug tracking-[-0.01em] text-foreground md:text-[32px] md:leading-tight">
              <span>Muzicalist exists to make discovering, connecting with and promoting</span> <span>musical talent</span>{" "}
              <span>simpler, faster and more professional.</span>
            </p>
          </section>

          {/* How it works: a real sequence, so the steps are numbered */}
          <section>
            <h2 className={H2}>How It Works</h2>
            <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-lg bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08]">
                      <s.icon className="h-5 w-5 text-foreground" />
                    </span>
                    <span className="font-figtree text-sm font-bold tabular-nums text-muted-foreground">{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-figtree text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Why */}
          <section>
            <h2 className={H2}>Why Muzicalist?</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-white/[0.04] p-5 md:p-6">
                <h3 className="font-figtree text-lg font-bold text-muted-foreground">The Old Way</h3>
                <ul className="mt-4 space-y-3">
                  {OLD_WAY.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground md:text-base">
                      <X className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-white/[0.08] p-5 md:p-6">
                <h3 className="flex items-center gap-2 font-figtree text-lg font-bold text-foreground">
                  <img src={logo} alt="" className="h-5 w-5 object-contain" />
                  <span>A Better Way</span>
                </h3>
                <ul className="mt-4 space-y-3">
                  {NEW_WAY.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground md:text-base">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Numbers: the four artist types, each tile opens its list */}
          <section>
            <h2 className={H2}>Numbers that matter.</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {CATEGORY_TILES.map((tile) => (
                <CategoryTile key={tile.value} tile={tile} count={stats ? (stats as unknown as Record<string, number>)[tile.statKey] : undefined} />
              ))}
            </div>
          </section>

          {/* Story and vision */}
          <section className="grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-10">
            <div>
              <h2 className={H2}>Built to bridge artists and clients.</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Muzicalist was created to solve a common problem: talented artists were difficult to discover, while clients struggled to find reliable musicians.
              </p>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                We built a platform that brings both sides together in one trusted place.
              </p>
              <h2 className={`${H2} mt-8`}>A global network for music.</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                <span>Building the world's most trusted network for</span> <span>musicians and music opportunities</span>.
              </p>
            </div>
            <img src={storyLive} alt="" loading="lazy" width={1024} height={1024} className="aspect-[4/3] w-full rounded-lg object-cover" />
          </section>

          {/* Closing call to action, guests only */}
          {guest && (
            <section className="rounded-lg bg-white/[0.04] p-6 md:p-10">
              <h2 className="max-w-2xl font-figtree text-2xl font-bold leading-tight tracking-[-0.01em] text-foreground md:text-4xl">
                <span>Ready to join the future of</span> <span>music networking?</span>
              </h2>
              <p className="mt-3 max-w-xl text-base text-muted-foreground">Become part of a growing community of artists and clients worldwide.</p>
              <div className="mt-6">
                <Actions />
              </div>
            </section>
          )}
        </div>

        {guest && <Footer embedded />}
      </main>
    </div>
  );
};

export default AboutUs;
