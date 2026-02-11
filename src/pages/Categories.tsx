import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import CategoryCard from "@/components/CategoryCard";
import { Mic, Guitar, Headphones, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
import CountryPickerButton from "@/components/CountryPickerButton";

const Categories = () => {
  const navigate = useNavigate();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    Singer: 0,
    Instrumentalist: 0,
    DJ: 0,
    Band: 0
  });

  // Check authentication and get user's country
  useEffect(() => {
    const checkAuthAndGetCountry = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .maybeSingle();
      
      setSelectedCountry(profile?.country || null);
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

      const { data } = await supabase
        .from("profiles")
        .select("id, specialization")
        .eq("country", selectedCountry)
        .in("id", artistIds);
      
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

  return <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 md:pt-32 pb-24 md:pb-20">
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
