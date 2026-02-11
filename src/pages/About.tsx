import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Music2, Users, Target, Heart, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import heroConcert from "@/assets/hero-concert.png";
import HeroSearchBar from "@/components/HeroSearchBar";

const About = () => {
  const values = [{
    icon: Music2,
    title: "Excellence in Music",
    description: "We connect clients with the most talented musical artists, ensuring every event becomes unforgettable."
  }, {
    icon: Users,
    title: "Community First",
    description: "Building a vibrant community where artists can showcase their talents and clients can easily find the perfect match."
  }, {
    icon: Target,
    title: "Professional Platform",
    description: "A dedicated space for serious musicians and event organizers to connect and collaborate professionally."
  }, {
    icon: Heart,
    title: "Passion for Music",
    description: "We're driven by our love for music and our commitment to supporting artists in their careers."
  }];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-20 md:pt-32 pb-10 md:pb-20 px-4 md:px-8 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroConcert})` }}
        />
        <div className="absolute inset-0 bg-background/70" />
        
        <div className="container mx-auto text-center px-0 relative z-10">
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
      </section>

      {/* Stats Bar */}
      <section className="px-0 md:px-8 py-6 md:py-10 bg-muted/30">
        <div className="container mx-auto max-w-3xl px-0 md:px-4">
          <div className="flex items-center justify-between bg-card/80 backdrop-blur-sm rounded-none md:rounded-2xl border-y md:border border-border/50 px-4 py-4 md:px-10 md:py-5 shadow-lg">
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
      </section>

      {/* About Section */}
      <section className="py-10 md:py-20 px-4 md:px-8">
        <div className="container mx-auto px-0">
          <div className="text-center mb-10 md:mb-16 px-2">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-6">
              About Muzicalist
            </h2>
            <p className="text-sm md:text-xl text-muted-foreground max-w-3xl mx-auto">
              The premier platform connecting talented musical artists with clients seeking exceptional entertainment
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-10 md:mb-20 px-0">
            <Card className="p-4 md:p-8 lg:p-12 bg-card/50 backdrop-blur border-accent/20">
              <h3 className="text-xl md:text-3xl font-display font-bold text-foreground mb-4 md:mb-6">Our Mission</h3>
              <p className="text-sm md:text-lg text-muted-foreground mb-4 md:mb-6">
                Muzicalist was created to bridge the gap between talented musical artists and clients looking for the perfect entertainment for their events. Whether you're planning a wedding, corporate event, private party, or any special occasion, we make it easy to discover and connect with professional musicians.
              </p>
              <p className="text-sm md:text-lg text-muted-foreground mb-4 md:mb-6">
                For artists, we provide a professional platform to showcase your talents, build your reputation, and grow your career. Our ranking system highlights the most talented and reliable artists, helping you stand out in a competitive industry.
              </p>
              <p className="text-sm md:text-lg text-muted-foreground">
                We believe that great music transforms events into memories, and we're committed to making those connections happen seamlessly.
              </p>
            </Card>
          </div>

          <div className="mb-10 md:mb-16">
            <h3 className="text-xl md:text-4xl font-display font-bold text-center text-foreground mb-6 md:mb-12">Our Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto px-0">
              {values.map(value => {
                const Icon = value.icon;
                return (
                  <Card key={value.title} className="p-4 md:p-8 bg-card/50 backdrop-blur border-accent/20 hover:border-accent/40 transition-all hover:shadow-[var(--shadow-gold)]">
                    <Icon className="h-8 w-8 md:h-12 md:w-12 text-accent mb-3 md:mb-4" />
                    <h4 className="text-lg md:text-2xl font-display font-bold text-foreground mb-2 md:mb-3">
                      {value.title}
                    </h4>
                    <p className="text-sm md:text-base text-muted-foreground">
                      {value.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-20 px-4 md:px-8 pb-24 md:pb-20 bg-muted/30">
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
    </div>
  );
};

export default About;
