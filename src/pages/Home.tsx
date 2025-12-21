import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import CategoryCard from "@/components/CategoryCard";
import ArtistSearchBar from "@/components/ArtistSearchBar";
import AISearchBar from "@/components/AISearchBar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import singerIcon from "@/assets/singer-silhouette.png";
import instrumentalistIcon from "@/assets/instrumentalist-silhouette.png";
import djIcon from "@/assets/dj-silhouette.png";
import bandIcon from "@/assets/band-silhouette.png";

const Home = () => {
  const [counts, setCounts] = useState({
    Singer: 0,
    Instrumentalist: 0,
    DJ: 0,
    Band: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("specialization");

      if (data) {
        const newCounts = {
          Singer: 0,
          Instrumentalist: 0,
          DJ: 0,
          Band: 0,
        };
        data.forEach((profile) => {
          if (profile.specialization && newCounts[profile.specialization as keyof typeof newCounts] !== undefined) {
            newCounts[profile.specialization as keyof typeof newCounts]++;
          }
        });
        setCounts(newCounts);
      }
    };

    fetchCounts();
  }, []);

  const categories = [
    {
      iconImage: singerIcon,
      title: "Singer",
      description: "Professional vocalists for any event",
      count: counts.Singer,
      href: "/categories/Singers",
    },
    {
      iconImage: instrumentalistIcon,
      title: "Instrumentalist",
      description: "Skilled musicians with various instruments",
      count: counts.Instrumentalist,
      href: "/categories/Instrumentalists",
    },
    {
      iconImage: djIcon,
      title: "DJ",
      description: "Expert DJs for parties and events",
      count: counts.DJ,
      href: "/categories/DJs",
    },
    {
      iconImage: bandIcon,
      title: "Band",
      description: "Complete musical groups for your events",
      count: counts.Band,
      href: "/categories/Bands",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-display font-bold mb-6 text-foreground">
            Find Your Perfect
            <span className="text-accent block mt-2">Musical Artist</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Romania's premier platform connecting talented musicians with clients. 
            Search, discover, and book professional artists for your events.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300">
                Create Account
              </Button>
            </Link>
            <Link to="/categories">
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground text-lg px-8 py-6 hover:scale-105 transition-all duration-300"
              >
                Find Artists
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Search Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-foreground">
              AI-Powered Smart Search
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ask anything about artists, opportunities, or events. Our AI will help you find exactly what you're looking for.
            </p>
          </div>
          <AISearchBar />
        </div>
      </section>

      {/* Advanced Search Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-foreground">
              Advanced Search
            </h2>
            <p className="text-lg text-muted-foreground">
              Filter by category, location, price range, and more
            </p>
          </div>
          <ArtistSearchBar />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-4 text-foreground">
            Browse by Category
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Discover talented artists in every musical discipline
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.title} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-card to-secondary p-12 border-2 border-accent/30 shadow-[var(--shadow-elegant)] text-center">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">
              Are You a Musical Artist?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our platform and connect with clients looking for your talent. 
              Build your profile and grow your career.
            </p>
            <Link to="/register">
              <Button 
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-10 py-6 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300"
              >
                Register as Artist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
