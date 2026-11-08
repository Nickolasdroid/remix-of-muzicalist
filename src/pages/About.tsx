import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, User } from "lucide-react";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import GuestSignupBar from "@/components/GuestSignupBar";
import { useHomeArtists, type HomeArtist } from "@/hooks/useHomeArtists";
import { getThumbUrl } from "@/lib/imageUrl";
import { translateSpecialization } from "@/lib/specializationLabel";
import { cn } from "@/lib/utils";
import singerImg from "@/assets/singer-silhouette.png";
import instrumentalistImg from "@/assets/instrumentalist-silhouette.png";
import djImg from "@/assets/dj-silhouette.png";
import bandImg from "@/assets/band-silhouette.png";

type Category = "Singer" | "Instrumentalist" | "DJ" | "Band";

const CATEGORIES: { value: Category; statKey: string; href: string; color: string; img: string }[] = [
  { value: "Singer", statKey: "singers", href: "/categories/Singers", color: "#B3261E", img: singerImg },
  { value: "Instrumentalist", statKey: "instrumentalists", href: "/categories/Instrumentalists", color: "#1E4D8C", img: instrumentalistImg },
  { value: "DJ", statKey: "djs", href: "/categories/DJs", color: "#6A2FB5", img: djImg },
  { value: "Band", statKey: "bands", href: "/categories/Bands", color: "#1F7A5C", img: bandImg },
];

const SHELF_SIZE = 10;

/** A row of artists, Spotify style: title, "Show all", then items side by side. */
const Shelf = ({
  title,
  showAllHref,
  artists,
  round = false,
  showRating = false,
}: {
  title: string;
  showAllHref: string;
  artists: HomeArtist[];
  round?: boolean;
  showRating?: boolean;
}) => {
  const { t } = useTranslation();
  if (artists.length === 0) return null;
  return (
    <section className="mt-8 first:mt-6 md:mt-10">
      <div className="mb-2 flex items-end justify-between gap-4 px-1">
        <h2 className="font-figtree text-[22px] font-bold leading-tight tracking-[-0.01em] text-white md:text-2xl">{title}</h2>
        <Link to={showAllHref} className="shrink-0 text-sm font-bold text-white/60 transition-colors hover:text-white hover:underline">
          Show all
        </Link>
      </div>
      <div className="-mx-1 flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {artists.slice(0, SHELF_SIZE).map((a) => (
          <Link
            key={a.id}
            to={`/artist/${a.id}`}
            className="group w-[44%] shrink-0 rounded-md p-2.5 transition-colors hover:bg-white/[0.07] focus-visible:bg-white/[0.07] focus-visible:outline-none sm:w-[29%] md:w-[188px] md:p-3"
          >
            <div className={cn("aspect-square overflow-hidden bg-white/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.5)]", round ? "rounded-full" : "rounded-md")}>
              {a.avatar_url ? (
                <img src={getThumbUrl(a.avatar_url, 320)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <User className="h-10 w-10 text-white/30" />
                </span>
              )}
            </div>
            <p className="mt-2.5 truncate font-figtree text-base font-medium text-white notranslate" translate="no" data-user-content="true">
              {a.stage_name}
            </p>
            <p className="mt-0.5 truncate font-figtree text-sm text-white/60">
              {showRating && a.rating !== null ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  <span className="tabular-nums">{a.rating.toFixed(1)}</span>
                  <span className="tabular-nums">({a.reviewCount})</span>
                </span>
              ) : (
                <>
                  <span>{translateSpecialization(a.specialization)}</span>
                  {a.county ? (
                    <>
                      <span>, </span>
                      <span className="notranslate" translate="no">{a.county}</span>
                    </>
                  ) : null}
                </>
              )}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

/**
 * Public home page for visitors without an account: one dark panel with filter chips
 * and rows of artists, a "browse categories" grid and a sign-up bar at the bottom.
 */
const About = () => {
  const { t } = useTranslation();
  const all = useHomeArtists();
  const [category, setCategory] = useState<Category | null>(null);

  const { recommended, topRated, newest } = useMemo(() => {
    const list = (all || []).filter((a) => !category || a.specialization === category);
    return {
      // Plan order (Premium first) is the placement the plans promise
      recommended: list,
      topRated: list
        .filter((a) => a.rating !== null)
        .sort((x, y) => y.rating! - x.rating! || y.reviewCount - x.reviewCount),
      newest: [...list].sort((x, y) => (y.created_at || "").localeCompare(x.created_at || "")),
    };
  }, [all, category]);

  const active = CATEGORIES.find((c) => c.value === category);
  const showAllHref = active ? active.href : "/artists";

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="px-0 pb-8 pt-14 md:px-2 md:pt-[72px]">
        <div
          className="min-h-[70vh] rounded-none px-3 pb-10 pt-4 md:rounded-lg md:px-6 md:pt-6"
          style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.16) 0px, #121212 320px)" }}
        >
          <h1 className="sr-only">Muzicalist: find and book artists for your event</h1>

          {/* Filter chips */}
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Artist type">
            {[{ value: null as Category | null, label: "All" }, ...CATEGORIES.map((c) => ({ value: c.value as Category | null, label: t(`platformStats.${c.statKey}`) }))].map((chip) => {
              const selected = category === chip.value;
              return (
                <button
                  key={chip.label}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setCategory(chip.value)}
                  className={cn(
                    "h-8 shrink-0 rounded-full px-3.5 font-figtree text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                    selected ? "bg-white/[0.24] font-medium text-white" : "bg-white/[0.07] text-white hover:bg-white/[0.12]",
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {all === null ? (
            <div className="mt-8 flex gap-4" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-[44%] shrink-0 sm:w-[29%] md:w-[188px]">
                  <div className="aspect-square animate-pulse rounded-md bg-white/[0.06]" />
                  <div className="mt-3 h-3.5 w-3/4 animate-pulse rounded bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <Shelf title="Recommended artists" showAllHref={showAllHref} artists={recommended} round />
              <Shelf title="Top rated" showAllHref="/leaderboard" artists={topRated} showRating />
              <Shelf title="New on Muzicalist" showAllHref={showAllHref} artists={newest} />
            </>
          )}

          {!category && (
            <section className="mt-10">
              <h2 className="mb-4 px-1 font-figtree text-[22px] font-bold leading-tight tracking-[-0.01em] text-white md:text-2xl">Browse categories</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.value}
                    to={c.href}
                    className="relative aspect-[16/10] overflow-hidden rounded-lg p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    style={{ backgroundColor: c.color }}
                  >
                    <span className="relative z-10 font-figtree text-lg font-bold text-white md:text-2xl">{t(`platformStats.${c.statKey}`)}</span>
                    <img
                      src={c.img}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="absolute -bottom-3 -right-5 h-[78%] rotate-[25deg] object-contain opacity-90"
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />

      <GuestSignupBar />
    </div>
  );
};

export default About;
