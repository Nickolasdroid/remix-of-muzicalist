import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import PlaceTile from "@/components/PlaceTile";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CountryPickerButton from "@/components/CountryPickerButton";
import { getCountryNameVariants, getCountryName } from "@/lib/countryFlags";


const Counties = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [counties, setCounties] = useState<string[]>([]);
  const [countyCounts, setCountyCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Check auth and auto-select country from available artist countries (alphabetical)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Efficient server-side ranking: country with the most active artists first.
      const { data: rows } = await supabase.rpc('get_artist_country_counts');

      const ranked = (rows || []) as { country: string; artist_count: number }[];
      const topCount = ranked[0]?.artist_count ?? 0;
      // Deterministic tie-break: among countries with the same highest count,
      // pick alphabetically by full country name.
      const top = ranked
        .filter((r) => r.artist_count === topCount)
        .sort((a, b) => getCountryName(a.country).localeCompare(getCountryName(b.country)))[0];

      setSelectedCountry(top?.country || null);
      // No artists anywhere yet: show the empty message instead of loading forever
      if (!top) setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // Fetch counties when country changes
  const fetchCounties = useCallback(async () => {
    if (!selectedCountry) return;
    setIsLoading(true);

    const variants = getCountryNameVariants(selectedCountry);

    let query = supabase
      .from('profiles')
      .select('county')
      .not('county', 'is', null)
      .not('specialization', 'is', null)
      .in('country', variants);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching counties:', error);
      setIsLoading(false);
      return;
    }

    const uniqueCounties = [...new Set(data.map(p => p.county))].filter(Boolean).sort();
    // How many artists per region
    const counts: Record<string, number> = {};
    data.forEach((p) => { if (p.county) counts[p.county] = (counts[p.county] || 0) + 1; });
    setCountyCounts(counts);
    setCounties(uniqueCounties);
    setIsLoading(false);
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry) {
      fetchCounties();
    }
  }, [selectedCountry, fetchCounties]);

  const filteredCounties = counties.filter(county => 
    county.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black md:ml-[316px] md:py-2 md:pr-2 lg:ml-[356px]">
      <SEO title="Browse Artists by County | Muzicalist" description="Find musical artists in every county. Browse local singers, bands, DJs and instrumentalists and book the right one for your event on Muzicalist." path="/counties" />
      <Navigation />

      <main
        className="min-h-screen min-w-0 bg-background px-4 pb-24 pt-16 md:min-h-[calc(100vh-80px)] md:rounded-lg md:px-8 md:pb-12 md:pt-14"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0px, #121212 280px)" }}
      >
        <h1 className="hidden font-figtree text-6xl font-black tracking-[-0.04em] text-foreground md:block lg:text-7xl">Regions</h1>
        <p className="mt-2 hidden text-base text-muted-foreground md:block">Artists by the region they live in.</p>

        {/* Country, then search, on one row on computers */}
        <div className="mt-0 flex flex-col gap-3 md:mt-6 md:flex-row md:items-center">
          <CountryPickerButton
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            hideAllOption
          />
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for a region..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-12 w-full rounded-full border-0 bg-foreground/[0.07] pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <div className="mt-6 md:mt-8">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-lg bg-foreground/[0.05] md:h-20" />
              ))}
            </div>
          ) : counties.length === 0 ? (
            <p className="mt-10 text-base text-muted-foreground">No regions with registered artists yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCounties.map(county => (
                <PlaceTile
                  key={county}
                  to={`/counties/${county}`}
                  icon={<MapPin className="h-5 w-5 text-muted-foreground" />}
                  name={county}
                  count={countyCounts[county] || 0}
                />
              ))}
            </div>
          )}

          {!isLoading && counties.length > 0 && filteredCounties.length === 0 && (
            <p className="mt-10 text-base text-muted-foreground">No regions found matching "{searchTerm}"</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Counties;
