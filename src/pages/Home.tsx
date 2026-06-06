import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AISearchBar from "@/components/AISearchBar";
import { Button } from "@/components/ui/button";

import HeroSearchBar from "@/components/HeroSearchBar";


const Home = () => {

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-20 md:pt-32 pb-12 md:pb-20 px-4 md:px-8 overflow-hidden">
        {/* Background Image */}
        <img
          src="/hero-concert.webp"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-background/70" />
        
        <div className="container mx-auto text-center px-0 relative z-10">
          <h1 className="text-3xl md:text-6xl lg:text-7xl font-display font-bold mb-4 md:mb-6 text-foreground">
            The Global Stage for
            <span className="text-accent block mt-2">Musical Artists</span>
          </h1>
          
          <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 md:mb-10 leading-relaxed px-2">
            The premier platform connecting talented musicians with clients. 
            Search, discover, and book professional artists for your events.
          </p>

          <HeroSearchBar />
        </div>
      </section>

      {/* AI Search Section */}
      <section className="py-10 md:py-20 px-4 md:px-8 bg-muted/30">
        <div className="container mx-auto px-0">
          <div className="text-center mb-6 md:mb-12 px-2">
            <h2 className="text-xl md:text-4xl lg:text-5xl font-display font-bold mb-2 md:mb-4 text-foreground">
              AI-Powered Smart Search
            </h2>
            <p className="text-xs md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Ask anything about artists, opportunities, or events. Our AI will help you find exactly what you're looking for.
            </p>
          </div>
          <AISearchBar />
        </div>
      </section>


      {/* Search Artists Worldwide Section */}
      <section className="py-10 md:py-20 px-4 md:px-8 pb-24 md:pb-20 bg-muted/30">
        <div className="container mx-auto px-0">
          <div className="text-center px-2">
            <h2 className="text-xl md:text-4xl lg:text-5xl font-display font-bold mb-2 md:mb-4 text-foreground">
              Discover Artists Worldwide
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
              Browse talented musicians from countries around the globe
            </p>
            <Link to="/countries">
              <Button 
                size="lg"
                className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 text-base md:text-lg px-8 md:px-10 py-5 md:py-6 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300"
              >
                Explore All Countries
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-6 md:py-10 px-4 md:px-8">
        <div className="container mx-auto px-0">
          <div className="rounded-2xl md:rounded-3xl bg-gradient-to-br from-card to-secondary p-6 md:p-12 border-2 border-accent/30 shadow-[var(--shadow-elegant)] text-center mx-2 md:mx-0">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold mb-4 md:mb-6 text-foreground">
              Are You a Musical Artist?
            </h2>
            <p className="text-sm md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
              Join our platform and connect with clients looking for your talent. 
              Build your profile and grow your career.
            </p>
            <Link to="/register">
              <Button 
                size="lg"
                className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 text-base md:text-lg px-8 md:px-10 py-5 md:py-6 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300"
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
