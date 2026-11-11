import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, User, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import GuestSidebar from "@/components/GuestSidebar";
import CategoryTile, { CATEGORY_TILES, type ArtistCategoryValue } from "@/components/CategoryTile";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { goBack } from "@/lib/backNavigation";
import { trackActivityEvent } from "@/lib/activityTracker";
import { translateSpecialization } from "@/lib/specializationLabel";
import { sortByPlanPriority } from "@/lib/planLimits";
import { getCountryRegions } from "@/lib/countryAdminDivisions";
import { getThumbUrl } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";

interface Result {
  id: string;
  slug?: string | null;
  stage_name: string;
  avatar_url: string | null;
  specialization: string | null;
  country: string | null;
  county: string | null;
  plan?: string | null;
}

const RECENT_KEY = "muzicalist.recentSearches";
const norm = (v: string) => v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Words people type for each artist type (Romanian and English)
const TYPE_WORDS: Record<ArtistCategoryValue, string[]> = {
  Singer: ["solist", "solisti", "solista", "cantaret", "cantareata", "singer", "singers", "voce", "vocalist"],
  Instrumentalist: ["instrumentist", "instrumentisti", "instrumentalist", "muzician", "chitarist", "pianist", "violonist", "saxofonist", "toboșar", "tobosar"],
  DJ: ["dj", "djs", "deejay"],
  Band: ["formatie", "formatii", "trupa", "trupe", "band", "bands", "orchestra"],
};
const FILLER = new Set(["in", "din", "la", "de", "pentru", "for", "the", "a", "un", "o", "si", "and", "?"]);
const RO_COUNTIES = getCountryRegions("RO");

/** "solist in cluj" → type Singer, county Cluj, no name left. */
const parseQuery = (q: string) => {
  let rest = ` ${norm(q).replace(/[?!.,]/g, " ")} `;
  let type: ArtistCategoryValue | null = null;
  for (const [t, words] of Object.entries(TYPE_WORDS) as [ArtistCategoryValue, string[]][]) {
    const hit = words.find((w) => rest.includes(` ${norm(w)} `));
    if (hit) {
      type = t;
      rest = rest.replace(` ${norm(hit)} `, " ");
      break;
    }
  }
  let county: string | null = null;
  for (const c of [...RO_COUNTIES].sort((a, b) => b.length - a.length)) {
    const n = norm(c);
    if (rest.includes(` ${n} `)) {
      county = c;
      rest = rest.replace(` ${n} `, " ");
      break;
    }
  }
  const name = rest.split(/\s+/).filter((w) => w && !FILLER.has(w)).join(" ");
  return { type, county, name };
};

const readRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 8);
  } catch {
    return [];
  }
};
const writeRecent = (list: string[]) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
  } catch {
    /* storage unavailable */
  }
};

const Search = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [query, setQuery] = useState(params.get("q") || "");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<ArtistCategoryValue | null>(null);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(!!session));
  }, []);

  // Header search on other pages lands here with ?q=
  useEffect(() => {
    const q = params.get("q") || "";
    setQuery((cur) => (cur === q ? cur : q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Search as you type
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const parsed = parseQuery(q);
      let req = supabase
        .from("profiles")
        .select("id, slug, stage_name, avatar_url, specialization, country, county, plan")
        .not("specialization", "is", null)
        .limit(40);
      if (parsed.type) req = req.eq("specialization", parsed.type as any);
      if (parsed.county) req = req.ilike("county", `%${parsed.county}%`);
      if (parsed.name) {
        const like = `%${parsed.name.replace(/[%,()]/g, " ")}%`;
        req = parsed.type || parsed.county ? req.ilike("stage_name", like) : req.or(`stage_name.ilike.${like},county.ilike.${like}`);
      }
      const { data } = await req;
      setResults([...((data as Result[]) || [])].sort((a, b) => sortByPlanPriority(a as any, b as any)));
      setType(parsed.type);
      setLoading(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const remember = (q: string) => {
    const v = q.trim();
    if (v.length < 2) return;
    const next = [v, ...recent.filter((r) => norm(r) !== norm(v))];
    setRecent(next.slice(0, 8));
    writeRecent(next);
  };

  const filtered = useMemo(() => (type ? results.filter((r) => r.specialization === type) : results), [results, type]);
  const [top, ...rest] = filtered;
  const hasQuery = query.trim().length >= 2;

  const subtitle = (r: Result) => (
    <>
      <span>{translateSpecialization(r.specialization)}</span>
      {r.county ? (
        <>
          <span aria-hidden="true"> · </span>
          <span className="notranslate" translate="no">{r.county}</span>
        </>
      ) : null}
      {r.country && !/^ro(mania)?$/i.test(r.country) ? (
        <>
          <span aria-hidden="true">, </span>
          <span>{r.country}</span>
        </>
      ) : null}
    </>
  );

  const open = (r: Result) => {
    remember(query);
    trackActivityEvent("search_result_click");
  };

  const searchField = (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        remember(query);
        setParams(query.trim() ? { q: query.trim() } : {}, { replace: true });
        inputRef.current?.blur();
      }}
      className="relative w-full"
    >
      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("navigation.searchArtists", "Which artist are you looking for?")}
        aria-label="Search artists"
        autoFocus={!params.get("q") && typeof window !== "undefined" && window.innerWidth < 768}
        className="h-10 w-full rounded-full border-0 bg-foreground/[0.1] pl-11 pr-11 text-base text-foreground placeholder:text-muted-foreground focus:bg-foreground/[0.14] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setParams({}, { replace: true });
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </form>
  );

  const content = (
    <div className="min-h-screen min-w-0 flex-1 bg-background px-4 pb-24 pt-16 md:min-h-[calc(100vh-80px)] md:rounded-lg md:px-8 md:pb-12 md:pt-4">
      <div className="mx-auto max-w-5xl">
        <h1 className="sr-only">Search</h1>

        {!hasQuery ? (
          <>
            {recent.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-bold text-foreground md:text-2xl">Recent searches</h2>
                <ul className="mt-2">
                  {recent.map((r) => (
                    <li key={r} className="-mx-2 flex items-center rounded-md hover:bg-foreground/[0.07]">
                      <button type="button" onClick={() => setQuery(r)} className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left">
                        <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate text-base text-foreground notranslate" translate="no">{r}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = recent.filter((x) => x !== r);
                          setRecent(next);
                          writeRecent(next);
                        }}
                        aria-label="Remove"
                        className="mr-1 rounded-full p-2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-8">
              <h2 className="text-xl font-bold text-foreground md:text-2xl">Browse categories</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                {CATEGORY_TILES.map((tile) => (
                  <CategoryTile key={tile.value} tile={tile} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Type filter */}
            <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:mt-5 md:px-0 [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Artist type">
              {[{ v: null as ArtistCategoryValue | null, label: <span>All</span> }, ...CATEGORY_TILES.map((c) => ({ v: c.value as ArtistCategoryValue | null, label: <span>{t(`platformStats.${c.statKey}`)}</span> }))].map((chip) => {
                const selected = type === chip.v;
                return (
                  <button
                    key={chip.v ?? "all"}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setType(chip.v)}
                    className={cn(
                      "h-8 shrink-0 rounded-full px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                      selected ? "bg-foreground/[0.24] font-medium text-foreground" : "bg-foreground/[0.07] text-foreground hover:bg-foreground/[0.12]",
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="mt-8 space-y-3" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-12 w-12 animate-pulse rounded-full bg-foreground/[0.08]" />
                    <div className="h-3.5 w-1/3 animate-pulse rounded bg-foreground/[0.08]" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-8">
                <p className="text-base font-bold text-foreground">
                  <span>No artists for</span> <span className="notranslate" translate="no">“{query.trim()}”</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Try only the county (for example “Cluj”) or only the type (for example “DJ”).</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                {/* Top result: the whole card opens the profile */}
                <section>
                  <h2 className="mb-3 text-xl font-bold text-foreground md:text-2xl">Top result</h2>
                  <Link
                    to={`/artist/${top.slug || top.id}`}
                    onClick={() => open(top)}
                    className="block rounded-lg bg-foreground/[0.05] p-5 transition-colors hover:bg-foreground/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    <div className="h-24 w-24 overflow-hidden rounded-full bg-foreground/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                      {top.avatar_url ? (
                        <img src={getThumbUrl(top.avatar_url, 240)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="m-auto mt-7 h-10 w-10 text-foreground/30" />
                      )}
                    </div>
                    <p className="mt-5 truncate text-3xl font-bold tracking-[-0.02em] text-foreground notranslate" translate="no" data-user-content="true">
                      {top.stage_name}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle(top)}</p>
                  </Link>
                </section>

                {/* The rest */}
                {rest.length > 0 && (
                  <section>
                    <h2 className="mb-2 text-xl font-bold text-foreground md:text-2xl">Artists</h2>
                    <ul>
                      {rest.map((r) => (
                        <li key={r.id}>
                          <Link
                            to={`/artist/${r.slug || r.id}`}
                            onClick={() => open(r)}
                            className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-foreground/[0.07] focus-visible:bg-foreground/[0.07] focus-visible:outline-none"
                          >
                            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-foreground/[0.08]">
                              {r.avatar_url ? (
                                <img src={getThumbUrl(r.avatar_url, 120)} alt="" loading="lazy" className="h-full w-full object-cover" />
                              ) : (
                                <User className="m-auto mt-3 h-6 w-6 text-foreground/30" />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-base font-medium text-foreground notranslate" translate="no" data-user-content="true">
                                {r.stage_name}
                              </span>
                              <span className="block truncate text-sm text-muted-foreground">{subtitle(r)}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Search Musical Artists | Muzicalist"
        description="Search singers, bands, DJs and instrumentalists by name, type or county. Find the perfect artist on Muzicalist."
        path="/search"
      />
      <Navigation hideMobileHeader={true} />

      {/* Phone: back arrow and the search field on top */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center gap-2 bg-black px-3 md:hidden">
        <button type="button" onClick={() => goBack(navigate, signedIn ? "/feed" : "/")} aria-label="Back" className="shrink-0 p-2 text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        {searchField}
      </div>

      {signedIn ? (
        <main className="md:ml-[316px] md:py-2 md:pr-2 lg:ml-[356px]">{content}</main>
      ) : (
        <main className="md:flex md:items-start md:gap-2 md:px-2 md:pb-2 md:pt-[72px]">
          {signedIn === false && <GuestSidebar />}
          {content}
        </main>
      )}
    </div>
  );
};

export default Search;
