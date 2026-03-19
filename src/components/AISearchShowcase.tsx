import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroConcert from "@/assets/hero-concert.png";

const mockResults = [
{ name: "DJ Alex Beat", location: "Cluj Napoca", rating: 5.0, avatar: "🎧" },
{ name: "DJ SoundWave", location: "Cluj Napoca", rating: 5.0, avatar: "🎵" },
{ name: "DJ ElectroNight", location: "Cluj Napoca", rating: 5.0, avatar: "🎶" }];


const AISearchShowcase = () => {
  return (
    <section className="relative py-10 md:py-24 px-0 md:px-8 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroConcert})` }} />
      
      <div className="absolute inset-0 bg-background/80" />

      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-4">
            Find the Perfect Artist with AI
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-xl mx-auto">
            Describe your event in a few words and our AI will match you with the best artists.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto items-center">
          {/* Left: Mock AI Search Card */}
          <div className="rounded-2xl border-2 border-accent/30 bg-card/80 backdrop-blur-sm p-5 md:p-6 shadow-[var(--shadow-gold)]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="text-base font-display font-bold text-accent">AI Search</span>
            </div>

            {/* Fake Input */}
            <div className="relative mb-5">
              <div className="w-full rounded-lg border border-border bg-input/60 px-4 py-3 pr-12 text-sm text-muted-foreground">
                I need a DJ in Cluj for a wedding on June 14, budget € 1200.
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>

            {/* Results Label */}
            <p className="text-sm font-bold text-accent mb-3">AI Results:</p>

            {/* Mock Results */}
            <div className="space-y-3">
              {mockResults.map((artist) =>
              <div
                key={artist.name}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/60 px-4 py-3">
                
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                    {artist.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">{artist.location}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) =>
                    <Star key={i} className="h-3 w-3 fill-accent text-accent" />
                    )}
                      <span className="text-xs font-semibold text-accent ml-1">{artist.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold border border-accent/50 text-accent rounded-full px-3 py-1 whitespace-nowrap">
                    View Profile
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: CTA */}
          <div className="text-center lg:text-left space-y-4 md:space-y-6">
            <h3 className="text-xl md:text-3xl font-display font-bold text-foreground">
              Try AI Search
            </h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
              Create a free account and let AI match you with the best artists for your event.
            </p>
            <p className="text-sm md:text-base text-muted-foreground font-semibold">
              Find talent in seconds.
            </p>
            <Link to="/search">
              <Button
                size="lg"
                className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90 text-base md:text-lg px-8 py-5 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300 gap-2">
                
                <Sparkles className="h-5 w-5" />
                Try AI Search
              </Button>
            </Link>
            
          </div>
        </div>
      </div>
    </section>);

};

export default AISearchShowcase;