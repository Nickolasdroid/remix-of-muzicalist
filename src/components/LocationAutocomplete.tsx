import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCountryCode } from "@/lib/countryFlags";
import { romanianLocalities } from "@/data/romanianLocalities";

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
  const country = p.country;
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

const getRomanianSuggestions = (q: string): PhotonFeature[] => {
  const normalized = normalizeSearch(q);
  const cached = localSuggestionCache.get(normalized);
  if (cached) return cached;

  const exactOrPrefix: typeof romanianLocalityIndex = [];
  const contains: typeof romanianLocalityIndex = [];
  for (const locality of romanianLocalityIndex) {
    if (locality.nameSearch.startsWith(normalized)) exactOrPrefix.push(locality);
    else if (locality.search.includes(normalized)) contains.push(locality);
    if (exactOrPrefix.length >= 8) break;
  }

  const matches = [...exactOrPrefix, ...contains].slice(0, 8).map((locality) => ({
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
  }));

  localSuggestionCache.set(normalized, matches);
  return matches;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const justSelectedRef = useRef(false);

  // Keep input in sync if the parent resets the value externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

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

    setLoading(true);
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const params = new URLSearchParams({
          q,
          limit: "10",
          lang: langParam,
        });
        // Restrict to populated places to reduce payload
        ["city", "town", "village", "hamlet", "suburb"].forEach((t) =>
          params.append("osm_tag", `place:${t}`)
        );
        const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Network error");
        const json = await res.json();
        const features: PhotonFeature[] = Array.isArray(json?.features) ? json.features : [];

        const placeFeatures = features.filter((f) => {
          const v = f.properties.osm_value || f.properties.type;
          return v && PLACE_VALUES.has(v);
        });

        let filtered = placeFeatures;
        if (iso) {
          const inCountry = placeFeatures.filter(
            (f) => (f.properties.countrycode || "").toUpperCase() === iso.toUpperCase()
          );
          filtered = inCountry.length > 0 ? inCountry : placeFeatures;
        }

        const sliced = filtered.slice(0, 8);
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
    }, 300);
    return () => clearTimeout(handle);
  }, [query, country]);

  const handleSelect = (f: PhotonFeature) => {
    const label = formatLabel(f);
    justSelectedRef.current = true;
    setQuery(label);
    onChange(label);
    setOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
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
            if (!e.target.value) onChange("");
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
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

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover text-popover-foreground shadow-md overflow-hidden">
          {results.length === 0 && !loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No locations found</div>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {results.map((r, idx) => {
                const label = formatLabel(r);
                return (
                  <li key={featureKey(r, idx)}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm flex items-start gap-2",
                        activeIndex === idx ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                      )}
                    >
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
