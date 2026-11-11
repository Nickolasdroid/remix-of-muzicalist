import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import CountryFlagIcon from "@/components/CountryFlagIcon";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import GuestSidebar from "@/components/GuestSidebar";
import PlaceTile from "@/components/PlaceTile";
import { supabase } from "@/integrations/supabase/client";
import { getCountryDisplay } from "@/lib/countryFlags";
import { fetchArtistIds } from "@/hooks/use-artist-ids";

interface CountryData {
  original: string;
  name: string;
  flag: string | null;
  count?: number;
}

const Countries = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [userCountry, setUserCountry] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountriesAndUser = async () => {
      setLoading(true);

      const artistIds = await fetchArtistIds();

      if (artistIds.length === 0) {
        setCountries([]);
        setLoading(false);
        return;
      }

      const { data: profileCountries } = await supabase
        .from("profiles")
        .select("country")
        .in("id", artistIds)
        .not("country", "is", null);

      if (profileCountries) {
        const uniqueOriginals = [...new Set(profileCountries.map((p) => p.country).filter(Boolean))] as string[];

        const countryMap = new Map<string, CountryData>();
        uniqueOriginals.forEach((original) => {
          const display = getCountryDisplay(original);
          if (!countryMap.has(display.name)) {
            countryMap.set(display.name, {
              original,
              name: display.name,
              flag: display.flag,
              count: 0,
            });
          }
        });
        // How many artists per country ("România" and "Romania" count as one)
        profileCountries.forEach((p) => {
          const c = p.country && countryMap.get(getCountryDisplay(p.country).name);
          if (c) c.count = (c.count || 0) + 1;
        });
        const countryData = Array.from(countryMap.values());

        // Most artists first
        countryData.sort((a, b) => (b.count || 0) - (a.count || 0) || a.name.localeCompare(b.name));
        setCountries(countryData);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("country")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.country) {
          const display = getCountryDisplay(profile.country);
          setUserCountry({
            original: profile.country,
            name: display.name,
            flag: display.flag,
          });
        }
      }

      setLoading(false);
    };

    fetchCountriesAndUser();
  }, []);

  const filteredCountries = countries.filter(
    (country) => country.name && country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // The visitor's own country first, then the rest
  const ordered = userCountry
    ? [...filteredCountries.filter((c) => c.name === userCountry.name), ...filteredCountries.filter((c) => c.name !== userCountry.name)]
    : filteredCountries;

  return (
    <div className={`min-h-screen bg-black ${currentUserId ? "md:ml-[316px] md:py-2 md:pr-2 lg:ml-[356px]" : "md:flex md:items-start md:gap-2 md:px-2 md:pb-2 md:pt-[72px]"}`}>
      <SEO title="Browse Artists by Country | Muzicalist" description="Discover talented musicians from countries around the globe. Browse by country and book singers, bands, DJs and instrumentalists on Muzicalist." path="/countries" />
      <Navigation />
      {!currentUserId && <GuestSidebar />}

      <main
        className="min-h-screen min-w-0 flex-1 bg-background px-4 pb-24 pt-16 md:min-h-[calc(100vh-80px)] md:rounded-lg md:px-8 md:pb-12 md:pt-14"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0px, #121212 280px)" }}
      >
        <h1 className="hidden font-figtree text-6xl font-black tracking-[-0.04em] text-foreground md:block lg:text-7xl">Countries</h1>
        <p className="mt-2 hidden text-base text-muted-foreground md:block">Artists by the country they live in.</p>

        <div className="relative mt-0 max-w-md md:mt-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for a country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 w-full rounded-full border-0 bg-foreground/[0.07] pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
          />
        </div>

        <div className="mt-6 md:mt-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-lg bg-foreground/[0.05] md:h-20" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {ordered.map((country) => (
                <PlaceTile
                  key={country.original}
                  to={`/countries/${encodeURIComponent(country.original)}`}
                  icon={<CountryFlagIcon country={country.original} className="h-6 w-9 rounded-sm" />}
                  name={country.name}
                  count={country.count || 0}
                  highlight={userCountry && country.name === userCountry.name ? <><span> · </span><span>Your country</span></> : null}
                />
              ))}
            </div>
          )}

          {!loading && filteredCountries.length === 0 && (
            <p className="mt-10 text-base text-muted-foreground">
              {searchTerm ? `No countries found matching "${searchTerm}"` : "No countries with registered artists yet"}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Countries;
