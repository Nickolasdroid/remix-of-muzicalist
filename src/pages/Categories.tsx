import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import CategoryCard from "@/components/CategoryCard";
import { Mic, Guitar, Headphones, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Categories = () => {
  const [counts, setCounts] = useState({
    Singer: 0,
    Instrumentalist: 0,
    DJ: 0,
    Band: 0
  });
  useEffect(() => {
    const fetchCounts = async () => {
      const {
        data
      } = await supabase.from("profiles").select("specialization");
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
  }, []);
  const categories = [{
    icon: Mic,
    title: "Singer",
    description: "Professional vocalists for any event",
    count: counts.Singer,
    href: "/categories/Singers"
  }, {
    icon: Guitar,
    title: "Instrumentalist",
    description: "Skilled musicians with various instruments",
    count: counts.Instrumentalist,
    href: "/categories/Instrumentalists"
  }, {
    icon: Headphones,
    title: "DJ",
    description: "Expert DJs for parties and events",
    count: counts.DJ,
    href: "/categories/DJs"
  }, {
    icon: Users,
    title: "Band",
    description: "Complete musical groups for your events",
    count: counts.Band,
    href: "/categories/Bands"
  }];
  return <div className="min-h-screen ml-64 bg-gradient-to-b from-background via-background to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6">Categories</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse through our diverse collection of talented artists across different specializations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {categories.map(category => <CategoryCard key={category.title} {...category} />)}
        </div>
      </div>
    </div>;
};
export default Categories;