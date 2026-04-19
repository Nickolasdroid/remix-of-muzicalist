import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCountryCode } from "@/lib/countryFlags";

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  type?: string;
  address?: Record<string, string>;
}

interface LocationAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Country name (e.g. "Romania"), used to restrict suggestions via ISO 3166-1 alpha-2. */
  country?: string | null;
  placeholder?: string;
  className?: string;
}

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

const formatLabel = (r: NominatimResult): string => {
  const a = r.address || {};
  const primary =
    a.village || a.hamlet || a.town || a.city || a.municipality ||
    a.suburb || a.locality || a.county || r.name || r.display_name.split(",")[0];
  const region = a.county || a.state_district || a.state || a.region;
  const country = a.country;
  return [primary, region, country].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).join(", ");
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
  const [results, setResults] = useState<NominatimResult[]>([]);
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
    setLoading(true);
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const params = new URLSearchParams({
          q,
          format: "json",
          addressdetails: "1",
          limit: "8",
          "accept-language": navigator.language || "en",
        });
        const iso = country ? getCountryCode(country) : null;
        if (iso) params.set("countrycodes", iso.toLowerCase());
        const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
          signal: controller.signal,
          headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error("Network error");
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query, country]);

  const handleSelect = (r: NominatimResult) => {
    const label = formatLabel(r);
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
                  <li key={r.place_id}>
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
