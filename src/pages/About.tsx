import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Star, Mic, Guitar, Headphones, Users } from "lucide-react";
import DiscoverArtistsSection from "@/components/DiscoverArtistsSection";
import AISearchShowcase from "@/components/AISearchShowcase";
import CommunitySections from "@/components/CommunitySections";
import TrendingArtistsSection from "@/components/TrendingArtistsSection";
import CategoryCard from "@/components/CategoryCard";
import heroConcert from "@/assets/hero-concert.png";
import HeroSearchBar from "@/components/HeroSearchBar";

const About = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section + Stats Bar */}
      <section className="relative pt-20 md:pt-32 pb-0 md:pb-10 px-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroConcert})` }} />

        <div className="absolute inset-0 bg-background/70" />
        
        <div className="container mx-auto text-center px-4 md:px-8 relative z-10 pb-10 md:pb-20">
          <h1 className="text-3xl md:text-6xl lg:text-7xl font-display font-bold mb-3 md:mb-6 text-foreground">
            The Global Stage for
            <span className="text-accent block mt-1 md:mt-2">Musical Artists</span>
          </h1>
          
          <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 md:mb-10 leading-relaxed px-2">
            The premier platform connecting talented musicians with clients. 
            Search, discover, and book professional artists for your events.
          </p>

          <HeroSearchBar />
        </div>

        {/* Stats Bar */}
        <div className="relative z-10 px-0 md:px-8 py-0 md:py-10">
          <div className="container mx-auto max-w-5xl px-0 md:px-4">
            <div className="flex items-center justify-between bg-background backdrop-blur-sm rounded-none md:rounded-2xl border-y md:border border-border/50 px-4 py-6 md:px-10 md:py-5 shadow-lg h-full">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg md:text-2xl font-bold text-accent">25+</span>
                <span className="text-[10px] md:text-sm text-muted-foreground">Countries</span>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg md:text-2xl font-bold text-accent">12,000+</span>
                <span className="text-[10px] md:text-sm text-muted-foreground">Artists</span>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg md:text-2xl font-bold text-accent flex items-center gap-1">4.9 <Star className="h-3.5 w-3.5 md:h-5 md:w-5 fill-accent text-accent" /></span>
                <span className="text-[10px] md:text-sm text-muted-foreground">Average Rating</span>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg md:text-2xl font-bold text-accent">30,000+</span>
                <span className="text-[10px] md:text-sm text-muted-foreground">Events Booked</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Discover Artists Section */}
      <DiscoverArtistsSection />

      {/* AI Search Showcase */}
      <AISearchShowcase />

      {/* Community Sections */}
      <CommunitySections />

      {/* Trending Artists Section */}
      <TrendingArtistsSection />

      {/* How Muzicalist Works Section */}
      <section className="py-10 md:py-20 px-4 md:px-8">
        <div className="container mx-auto px-0">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground text-center mb-6 md:mb-12">
            How Muzicalist Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {[
            { step: 1, title: "Search", description: "Find artists by location, genre and availability." },
            { step: 2, title: "Connect", description: "Chat and finalize event details directly." },
            { step: 3, title: "Book", description: "Secure payment. Professional experience guaranteed." }].
            map(({ step, title, description }) =>
            <div
              key={step}
              className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 md:p-6">

                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-accent text-accent text-sm font-bold">
                    {step}
                  </span>
                  <h3 className="text-lg md:text-xl font-bold text-foreground">{title}</h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{description}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Browse by Category Section */}
      <section className="py-10 md:py-20 px-4 md:px-8">
        <div className="container mx-auto px-0">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground text-center mb-6 md:mb-12">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
            <CategoryCard title="Singer" description="Professional vocalists" icon={Mic} href="/categories/Singers" />
            <CategoryCard title="DJ" description="Expert DJs" icon={Headphones} href="/categories/DJs" />
            <CategoryCard title="Band" description="Musical groups" icon={Users} href="/categories/Bands" />
            <CategoryCard title="Instrumentalist" description="Skilled musicians" icon={Guitar} href="/categories/Instrumentalists" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="md:py-20 md:px-8 pb-24 md:pb-20 px-0 py-0 bg-background">
        <div className="container mx-auto px-0">
          <div className="rounded-2xl md:rounded-3xl bg-gradient-to-br from-card to-secondary p-6 md:p-12 border-2 border-accent/30 shadow-[var(--shadow-elegant)] text-center mx-0">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold mb-4 md:mb-6 text-foreground">
              Are You a Musical Artist?
            </h2>
            <p className="text-sm md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
              Join our platform and connect with clients looking for your talent. 
              Build your profile and grow your career.
            </p>
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 text-base md:text-lg px-8 md:px-10 py-5 md:py-6 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300">
                Register as Artist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>);

};

export default About;