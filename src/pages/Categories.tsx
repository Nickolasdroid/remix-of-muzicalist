import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import CategoryCard from "@/components/CategoryCard";
import { Mic, Guitar, Headphones, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
import CountryPickerButton from "@/components/CountryPickerButton";
import { getCountryNameVariants } from "@/lib/countryFlags";


const Categories = () => {
  const navigate = useNavigate();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
  const categories = [{
    icon: Mic,
    title: "Singer",
    description: "Professional vocalists for any event",
    count: counts.Singer,
    href: `/categories/Singers${countryParam}`
  }, {
    icon: Guitar,
    title: "Instrumentalist",
    description: "Skilled musicians with various instruments",
    count: counts.Instrumentalist,
    href: `/categories/Instrumentalists${countryParam}`
  }, {
    icon: Headphones,
    title: "DJ",
    description: "Expert DJs for parties and events",
    count: counts.DJ,
    href: `/categories/DJs${countryParam}`
  }, {
    icon: Users,
    title: "Band",
    description: "Complete musical groups for your events",
    count: counts.Band,
    href: `/categories/Bands${countryParam}`
  }];

  if (!isAuthChecked) {
    return null;
  }

  return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-gradient-to-br from-background to-secondary relative`}>
      <Navigation />
      
      <div className={`relative z-10 container mx-auto px-4 pt-20 ${currentUserId ? 'md:pt-8' : 'md:pt-24'} pb-24 md:pb-20`}>
        <div className="text-center mb-8 md:mb-16">
          <h1 className="hidden md:block text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-4 md:mb-6">Categories</h1>
          
          <div className="flex justify-center mb-4">
            <CountryPickerButton
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto">
          {categories.map(category => <CategoryCard key={category.title} {...category} />)}
        </div>
      </div>
    </div>;
};
export default Categories;
