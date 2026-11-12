import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageLoading from "@/components/PageLoading";
import SEO from "@/components/SEO";
import CategoryTile, { CATEGORY_TILES } from "@/components/CategoryTile";
import { Mic, Guitar, Headphones } from "lucide-react";
import BandIcon from "@/components/icons/BandIcon";
import { supabase } from "@/integrations/supabase/client";
import { knownUserId } from "@/lib/knownUser";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
import CountryPickerButton from "@/components/CountryPickerButton";
import { getCountryNameVariants } from "@/lib/countryFlags";


const Categories = () => {
  const navigate = useNavigate();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(knownUserId);
  const [counts, setCounts] = useState({
    Singer: 0,
    Instrumentalist: 0,
    DJ: 0,
    Band: 0
  });

  // Check authentication and get user's country (guests see all countries)
  useEffect(() => {
    const checkAuthAndGetCountry = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', session.user.id)
          .maybeSingle();
        
        setSelectedCountry(profile?.country || '__all__');
      } else {
        setCurrentUserId(null);
        setSelectedCountry('__all__');
      }
      setIsAuthChecked(true);
    };
    checkAuthAndGetCountry();
  }, [navigate]);

  useEffect(() => {
    if (!isAuthChecked || !selectedCountry) return;
    
    const fetchCounts = async () => {
      const artistIds = await fetchArtistIds();
      if (artistIds.length === 0) {
        setCounts({ Singer: 0, Instrumentalist: 0, DJ: 0, Band: 0 });
        return;
      }

      let query = supabase
        .from("profiles")
        .select("id, specialization")
        .in("id", artistIds);
      
      if (selectedCountry !== '__all__') {
        const variants = getCountryNameVariants(selectedCountry);
        query = query.in("country", variants);
      }

      const { data } = await query;
      
      if (data) {
        const newCounts = {
          Singer: 0,
          Instrumentalist: 0,
          DJ: 0,
          Band: 0
        };
        data.forEach(profile => {
          if (profile.specialization && newCounts[profile.specialization as keyof typeof newCounts] !== undefined) {
            newCounts[profile.specialization as keyof typeof newCounts]++;
          }
        });
        setCounts(newCounts);
      }
    };
    fetchCounts();
  }, [isAuthChecked, selectedCountry]);

  const countryParam = selectedCountry ? `?country=${encodeURIComponent(selectedCountry)}` : '';
  if (!isAuthChecked) {
    return <PageLoading />;
  }

  return <div className={`min-h-screen ${currentUserId ? 'md:ml-[316px] lg:ml-[356px]' : ''} bg-background relative`}>
      <SEO title="Artist Categories — Singers, Bands, DJs & Instrumentalists | Muzicalist" description="Explore musical artists by category: professional singers, complete bands, expert DJs and skilled instrumentalists, ready to book for your event." path="/categories" />
      <Navigation />
      
      <div className={`relative z-10 mx-auto max-w-6xl px-4 pt-16 ${currentUserId ? 'md:pt-10' : 'md:pt-24'} pb-10 md:px-8 md:pb-20`}>
        <h1 className="hidden text-4xl font-display font-bold tracking-[-0.03em] text-foreground md:block md:text-6xl">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground md:mt-3 md:text-base">Choose the kind of artist you're looking for.</p>
        <div className="mt-5 md:mt-8">
          <CountryPickerButton selectedCountry={selectedCountry} onCountryChange={setSelectedCountry} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:gap-5 lg:grid-cols-4">
          {CATEGORY_TILES.map((tile) => (
            <CategoryTile key={tile.value} tile={tile} href={`${tile.path}${countryParam}`} count={counts[tile.value]} />
          ))}
        </div>
      </div>
    </div>;
};
export default Categories;
