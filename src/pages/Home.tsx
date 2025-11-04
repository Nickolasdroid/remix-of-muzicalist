import { Link } from "react-router-dom";
import { Mic2, Guitar, Music, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import CategoryCard from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";

const Home = () => {
  const categories = [
    {
      title: "Singers",
      description: "Professional vocalists for any event",
      icon: Mic2,
      href: "/categories/singers",
      count: 156
    },
    {
      title: "Instrumentalists",
      description: "Master musicians across all instruments",
      icon: Guitar,
      href: "/categories/instrumentalists",
      count: 89
    },
    {
      title: "DJs",
      description: "Create the perfect atmosphere",
      icon: Music,
      href: "/categories/djs",
      count: 67
    },
    {
      title: "Bands",
      description: "Complete musical ensembles",
      icon: Users,
      href: "/categories/bands",
      count: 43
    }
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
    </div>
  );
};

export default Home;
