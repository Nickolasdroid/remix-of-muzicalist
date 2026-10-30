import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Clock, Loader2, MapPin, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getCountryCode } from "@/lib/countryFlags";
import { romanianLocalities } from "@/data/romanianLocalities";

/** Few enough that the list never needs its own scrollbar. */
const MAX_RESULTS = 6;
const RECENT_KEY = "mz_recent_places";
const RECENT_MAX = 3;

interface PhotonFeature {
  properties: {
    osm_id: number;
    osm_type?: string;
    name?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    locality?: string;
    suburb?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
  };
  geometry?: { coordinates: [number, number] };
}

interface LocationAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Country name (e.g. "Romania"), used to bias suggestions via ISO 3166-1 alpha-2. */
  country?: string | null;
  placeholder?: string;
  className?: string;
}

const ENDPOINT = "https://photon.komoot.io/api/";

// Place types we care about (cities, towns, villages, hamlets, suburbs, etc.)
const PLACE_VALUES = new Set([
  "city",
  "town",
  "village",
  "hamlet",
  "suburb",
  "neighbourhood",
  "locality",
  "municipality",
  "quarter",
  "borough",
]);

const formatLabel = (f: PhotonFeature): string => {
  const p = f.properties;
  const primary =
    p.name || p.city || p.town || p.village || p.hamlet || p.locality || p.suburb || p.district;
  const region = p.county || p.state;
  // Romanian places are stored as "Turda, Cluj" (parseRomanianPlace reads both forms)
  const isRo = (p.countrycode || "").toUpperCase() === "RO" || /^(romania|românia)$/i.test(p.country || "");
  const country = isRo ? undefined : p.country;
  return [primary, region, country].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).join(", ");
};

const featureKey = (f: PhotonFeature, idx: number) =>
  `${f.properties.osm_type || ""}-${f.properties.osm_id || idx}-${idx}`;

// Module-level cache shared across instances (session lifetime)
const suggestionCache = new Map<string, PhotonFeature[]>();
const localSuggestionCache = new Map<string, PhotonFeature[]>();

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[şș]/gi, "s")
    .replace(/[ţț]/gi, "t")
    .toLowerCase()
    .trim();

const romanianLocalityIndex = romanianLocalities.map(([name, county, population], idx) => ({
  name,
  county,
  population,
  idx,
  nameSearch: normalizeSearch(name),
  search: normalizeSearch(`${name} ${county}`),
}));

const toFeature = (locality: (typeof romanianLocalityIndex)[number]): PhotonFeature => ({
  properties: {
    osm_id: locality.idx,
    osm_type: "local",
    name: locality.name,
    county: locality.county,
    country: "Romania",
    countrycode: "RO",
    type: "locality",
    osm_value: "locality",
  },
});

/**
 * Ranking (the data is already sorted by population, largest first, so each tier keeps that order):
 * exact name > name starts with > a word in the name starts with > name contains > county matches.
 * "cluj" -> Cluj-Napoca first, then towns of Cluj county; "tur" -> Turda, Câmpia Turzii ...
 */
const getRomanianSuggestions = (q: string): PhotonFeature[] => {
  const normalized = normalizeSearch(q);
  const cached = localSuggestionCache.get(normalized);
  if (cached) return cached;

  const tiers: (typeof romanianLocalityIndex)[] = [[], [], [], [], []];
  for (const locality of romanianLocalityIndex) {
    const n = locality.nameSearch;
    if (n === normalized) tiers[0].push(locality);
    else if (n.startsWith(normalized)) tiers[1].push(locality);
    else if (n.split(/[\s-]+/).some((w) => w.startsWith(normalized))) tiers[2].push(locality);
    else if (n.includes(normalized)) tiers[3].push(locality);
    else if (normalizeSearch(locality.county).startsWith(normalized)) tiers[4].push(locality);
    if (tiers[0].length + tiers[1].length >= MAX_RESULTS) break;
  }

  const matches = tiers.flat().slice(0, MAX_RESULTS).map(toFeature);
  localSuggestionCache.set(normalized, matches);
  return matches;
};

/** Largest localities of a county (the list is sorted by population). */
const topLocalitiesInCounty = (county: string, n: number): PhotonFeature[] => {
  const key = normalizeSearch(county);
  return romanianLocalityIndex
    .filter((l) => normalizeSearch(l.county) === key && !/^sector \d/i.test(l.name))
    .slice(0, n)
    .map(toFeature);
};

/** Recently chosen places (labels), newest first. Browser-only convenience. */
const readRecent = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
};
const saveRecent = (label: string) => {
  try {
    const next = [label, ...readRecent().filter((l) => l !== label)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
};
/** "Turda, Cluj, Romania" -> a feature for display. */
const featureFromLabel = (label: string, idx: number): PhotonFeature => {
  const parts = label.split(",").map((x) => x.trim()).filter(Boolean);
  const ro = parts.length === 2 || /^(romania|românia)$/i.test(parts[2] || "");
  return { properties: { osm_id: -1 - idx, osm_type: "recent", name: parts[0], county: parts[1], country: ro ? "Romania" : parts[2], countrycode: ro ? "RO" : undefined } };
};

/** Primary line (place name) and secondary line (county / region, country only when abroad). */
const displayParts = (f: PhotonFeature, ro: boolean) => {
  const p = f.properties;
  const name = p.name || p.city || p.town || p.village || p.hamlet || p.locality || p.suburb || p.district || "";
  const region = p.county || p.state || "";
  const inRomania = (p.countrycode || "").toUpperCase() === "RO" || /^(romania|românia)$/i.test(p.country || "");
  let secondary: string;
  if (inRomania) {
    if (!region || region === name) secondary = region === "București" ? (ro ? "Municipiul București" : "Bucharest") : "";
    else if (region === "București") secondary = ro ? "Municipiul București" : "Bucharest";
    else secondary = ro ? `jud. ${region}` : `${region} County`;
  } else {
    secondary = [region !== name ? region : "", p.country].filter(Boolean).join(", ");
  }
  return { name, secondary };
};

/** Bolds the part of `text` that matches the typed query (diacritics-insensitive). */
const Highlight = ({ text, query }: { text: string; query: string }) => {
  const q = normalizeSearch(query);
  if (!q) return <>{text}</>;
  // Per-character normalisation keeps indexes aligned with the original text
  const chars = Array.from(text).map((c) => normalizeSearch(c) || c.toLowerCase());
  const flat = chars.join("");
  let at = flat.indexOf(q);
  if (at < 0) return <>{text}</>;
  // Prefer a match at a word start ("Câmpia Turzii" for "tur")
  const wordStart = flat.search(new RegExp(`(^|[\\s-])${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  if (wordStart >= 0) at = flat[wordStart] === q[0] ? wordStart : wordStart + 1;
  // Map flat index back to char index (each char normalises to one char)
  const orig = Array.from(text);
  return (
    <>
      {orig.slice(0, at).join("")}
      <span className="font-semibold text-foreground">{orig.slice(at, at + q.length).join("")}</span>
      {orig.slice(at + q.length).join("")}
    </>
  );
};

const LocationAutocomplete = ({
  id,
  value,
  onChange,
  country,
  placeholder = "Search a city, town or village...",
  className,
}: LocationAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Suggestions shown on focus before typing: recent picks and the viewer's county
  const [focusGroups, setFocusGroups] = useState<{ recent: PhotonFeature[]; county: PhotonFeature[]; countyName: string | null }>({ recent: [], county: [], countyName: null });
  const [touched, setTouched] = useState(false);
  const { i18n } = useTranslation();
  const ro = (i18n.language || "ro").startsWith("ro");
  const isRomania = (country ? getCountryCode(country) : null) === "RO";
  const internalChangeRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  // When the list opens near the bottom of a dialog/page, bring it into view
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => listRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 50);
    return () => window.clearTimeout(t);
  }, [open, results.length]);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const justSelectedRef = useRef(false);

  // Keep input in sync if the parent resets the value externally
  useEffect(() => {
    if (internalChangeRef.current) {
      internalChangeRef.current = false;
      return;
    }
    setQuery(value);
  }, [value]);

  // Load the viewer's county once (Romania only) for the "near you" suggestions
  useEffect(() => {
    if (!isRomania) return;
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("profiles").select("county").eq("id", session.user.id).maybeSingle();
      if (cancelled || !data?.county) return;
      setFocusGroups((g) => ({ ...g, countyName: data.county, county: topLocalitiesInCounty(data.county, 3) }));
    })();
    return () => {
      cancelled = true;
    };
  }, [isRomania]);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const lang = (navigator.language || "en").split("-")[0];
    const langParam = ["en", "de", "fr", "it", "ru"].includes(lang) ? lang : "en";
    const iso = country ? getCountryCode(country) : null;
    const cacheKey = `${q.toLowerCase()}|${iso || ""}|${langParam}`;

    if (iso === "RO") {
      const localResults = getRomanianSuggestions(q);
      setResults(localResults);
      setOpen(true);
      setActiveIndex(-1);
      setLoading(false);
      return;
    }

    // Serve from cache instantly
    const cached = suggestionCache.get(cacheKey);
    if (cached) {
      setResults(cached);
      setOpen(true);
      setActiveIndex(-1);
      setLoading(false);
      return;
    }

    // Try to derive results from a shorter cached prefix (instant, no network)
    const qLower = q.toLowerCase();
    for (let len = qLower.length - 1; len >= 2; len--) {
      const prefixKey = `${qLower.slice(0, len)}|${iso || ""}|${langParam}`;
      const prefixCached = suggestionCache.get(prefixKey);
      if (prefixCached && prefixCached.length > 0) {
        const qNorm = normalizeSearch(q);
        const refined = prefixCached.filter((f) => {
          const p = f.properties;
          const name = p.name || p.city || p.town || p.village || p.hamlet || p.locality || p.suburb || "";
          return normalizeSearch(name).includes(qNorm);
        });
        if (refined.length > 0) {
          setResults(refined.slice(0, MAX_RESULTS));
          setOpen(true);
          setActiveIndex(-1);
          setLoading(false);
          // Continue to fetch fresh results in background to enrich cache
          break;
        }
      }
    }

    setLoading(true);
    const handle = setTimeout(async () => {
      // Re-check cache after debounce in case a sibling request populated it
      const cachedLate = suggestionCache.get(cacheKey);
      if (cachedLate) {
        setResults(cachedLate);
        setOpen(true);
        setActiveIndex(-1);
        setLoading(false);
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const params = new URLSearchParams({
          q,
          limit: "20",
          lang: langParam,
        });
        const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Network error");
        const json = await res.json();
        const features: PhotonFeature[] = Array.isArray(json?.features) ? json.features : [];

        // Prefer populated places, but fall back to anything if that filter is empty
        const placeFeatures = features.filter((f) => {
          const v = f.properties.osm_value || f.properties.type;
          return v && PLACE_VALUES.has(v);
        });
        const baseFeatures = placeFeatures.length > 0 ? placeFeatures : features;

        let filtered = baseFeatures;
        if (iso) {
          const inCountry = baseFeatures.filter(
            (f) => (f.properties.countrycode || "").toUpperCase() === iso.toUpperCase()
          );
          filtered = inCountry.length > 0 ? inCountry : baseFeatures;
        }

        const sliced = filtered.slice(0, MAX_RESULTS);
        suggestionCache.set(cacheKey, sliced);
        setResults(sliced);
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [query, country]);

  const handleSelect = (f: PhotonFeature) => {
    const label = formatLabel(f);
    justSelectedRef.current = true;
    setQuery(label);
    onChange(label);
    saveRecent(label);
    setOpen(false);
    setResults([]);
  };

  const showingFocus = query.trim().length < 2;
  const focusRecent = focusGroups.recent;
  const recentKeys = new Set(focusRecent.map((f) => `${f.properties.name}|${f.properties.county}`));
  const focusCounty = focusGroups.county.filter((f) => !recentKeys.has(`${f.properties.name}|${f.properties.county}`));
  const visible = showingFocus ? [...focusRecent, ...focusCounty] : results;

  const openFocusSuggestions = () => {
    if (query.trim().length >= 2) {
      if (results.length > 0) setOpen(true);
      return;
    }
    const recent = readRecent().map(featureFromLabel);
    setFocusGroups((g) => ({ ...g, recent }));
    if (recent.length > 0 || focusGroups.county.length > 0) {
      setActiveIndex(-1);
      setOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || visible.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(visible[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const clear = () => {
    setQuery("");
    onChange("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Only a place picked from the list counts: typing again clears the chosen one
            if (value) {
              internalChangeRef.current = true;
              onChange("");
            }
            if (e.target.value.trim().length < 2) openFocusSuggestions();
          }}
          onFocus={openFocusSuggestions}
          onBlur={() => setTouched(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="pl-9 pr-9"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear location"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* In the page flow (not floating), so a dialog or page scrolls to show it instead of
          clipping it; no inner scrollbar. */}
      {open && (visible.length > 0 || (!showingFocus && !loading)) && (
        <div
          ref={listRef}
          className="mt-1.5 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-md overflow-hidden"
        >
          {visible.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-muted-foreground">No locations found</div>
          ) : (
            <ul className="py-1" role="listbox">
              {visible.map((r, idx) => {
                const { name, secondary } = displayParts(r, ro);
                const active = activeIndex === idx;
                const isRecent = r.properties.osm_type === "recent";
                const header =
                  showingFocus && idx === 0 && isRecent
                    ? "Recent"
                    : showingFocus && !isRecent && (idx === 0 || visible[idx - 1].properties.osm_type === "recent")
                    ? "In your county"
                    : null;
                return (
                  <Fragment key={featureKey(r, idx)}>
                    {header && (
                      <li role="presentation" className={cn("px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", idx === 0 ? "pt-1.5" : "pt-2.5")}>
                        {header}
                      </li>
                    )}
                    <li role="option" aria-selected={active}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelect(r)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          "w-full text-left px-3 py-2 flex items-center gap-3 transition-colors",
                          active ? "bg-muted" : "hover:bg-muted/60"
                        )}
                      >
                        {isRecent ? (
                          <Clock className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-muted-foreground")} />
                        ) : (
                          <MapPin className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-muted-foreground")} />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-foreground/90 notranslate" translate="no">
                            {showingFocus ? <span className="font-semibold text-foreground">{name}</span> : <Highlight text={name} query={query} />}
                          </span>
                          {secondary && (
                            <span className="block truncate text-xs text-muted-foreground notranslate" translate="no">{secondary}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  </Fragment>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Free text is not accepted: ask to pick from the list */}
      {touched && !open && query.trim().length > 0 && !value && (
        <p className="mt-1.5 text-xs text-amber-400">Choose a locality from the list.</p>
      )}
    </div>
  );
};

export default LocationAutocomplete;
