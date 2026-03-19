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

      <div className="container mx-auto relative z-10 px-2 md:px-0">
        {/* Section Header */}
        <div className="text-center mb-6 md:mb-14 px-2">
          <h2 className="text-xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-2 md:mb-4">
            Find the Perfect Artist with AI
          </h2>
          <p className="text-xs md:text-lg text-muted-foreground max-w-xl mx-auto">
            Describe your event in a few words and our AI will match you with the best artists.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 max-w-5xl mx-auto items-center">
          {/* Left: Mock AI Search Card */}
          <div className="rounded-none md:rounded-2xl border-y md:border-2 border-accent/30 bg-card/80 backdrop-blur-sm p-4 md:p-6 shadow-[var(--shadow-gold)] relative">
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

            {/* Mock Results - top clear, bottom blurred on mobile */}
            <div className="relative">
              <div className="space-y-3">
                {mockResults.map((artist, index) =>
                <div
                  key={artist.name}
                  className={`flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/60 px-4 py-3 ${index >= 1 ? 'blur-[2px] md:blur-none' : 'md:blur-none'}`}>
                
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

              {/* Gradient shadow overlay on mobile - grows from bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-xl pointer-events-none lg:hidden" />

              {/* Mobile CTA overlay - positioned at bottom */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center px-4 pb-3 pt-6 lg:hidden">
                <h3 className="text-lg font-display font-bold text-white mb-1.5">
                  Try AI Search
                </h3>
                <p className="text-xs text-white/80 leading-relaxed mb-1">
                  Create a free account and let AI match you with the best artists for your event.
                </p>
                <p className="text-xs text-white/90 font-semibold mb-3">
                  Find talent in seconds.
                </p>
                <Link to="/search">
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm px-6 py-2 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300 gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Try AI Search
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right: CTA - hidden on mobile since it's overlaid */}
          <div className="hidden lg:block text-left space-y-6">
            <h3 className="text-3xl font-display font-bold text-foreground">
              Try AI Search
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md">
              Create a free account and let AI match you with the best artists for your event.
            </p>
            <p className="text-base text-muted-foreground font-semibold">
              Find talent in seconds.
            </p>
            <Link to="/search">
              <Button
                size="lg"
                className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-5 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300 gap-2">
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