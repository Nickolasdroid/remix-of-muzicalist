import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Music2, Users, Target, Heart, Crown, Star, Music, UserRound, ShieldCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import ArtistSearchBar from "@/components/ArtistSearchBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import heroConcert from "@/assets/hero-concert.png";
import ourStoryBand from "@/assets/our-story-band.png";

const values = [
  { icon: Music, title: "Excellence in Music", description: "We connect only the best talented musical artists, ensuring clients receive outstanding performances." },
  { icon: Users, title: "Community First", description: "Building a vibrant community where artists can thrive and clients can find the best voices." },
  { icon: ShieldCheck, title: "Professional Platform", description: "A specialized platform designed for professional artists and event organizers to connect and collaborate." },
  { icon: Briefcase, title: "Professional Experience", description: "Designed for skilled musicians and clients seeking reliable, high-quality entertainment." },
];

const AboutUs = () => {
  const isMobile = useIsMobile();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"clients" | "artists">("clients");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setIsAuthenticated(!!session?.user)
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const ProSearchContent = () => (
    <div className="p-4">
      <ArtistSearchBar />
    </div>
  );

  return (
    <div className={`min-h-screen ${isAuthenticated ? 'md:ml-64' : ''}`}>
      <Navigation />

      {/* Our Story Section */}
      <section className={`pt-24 ${isAuthenticated ? 'md:pt-8' : 'md:pt-24'} pb-10 md:pb-20 px-4 md:px-8`}>
        <div className="container mx-auto px-0">
          <div className="max-w-5xl mx-auto mb-10 md:mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
              <div>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4 md:mb-6">
                  Our Story
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  Muzicalist was created to solve a simple problem: finding talented and reliable musicians for events was difficult, time-consuming, and often uncertain.
                </p>
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  At the same time, many talented artists struggled to promote themselves professionally and connect with the right opportunities.
                </p>
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  Muzicalist bridges this gap — bringing artists and clients together in one trusted, professional platform.
                </p>
                <p className="text-sm md:text-base font-semibold text-foreground mb-2">
                  Our goal is simple:
                </p>
                <p className="text-sm md:text-base text-muted-foreground">
                  To make discovering musical talent easier, faster, and more reliable.
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border border-border/50 shadow-lg">
                <img
                  src={ourStoryBand}
                  alt="Concert performance"
                  className="w-full h-full object-cover aspect-[4/3]"
                />
              </div>
            </div>
          </div>

          {/* How Muzicalist Works Section */}
          <div className="max-w-5xl mx-auto mb-10 md:mb-20">
            <h2 className="text-xl md:text-4xl font-display font-bold text-center text-foreground mb-6 md:mb-10">
              How Muzicalist Works
            </h2>
            
            {/* Tabs */}
            <div className="flex justify-center gap-4 mb-6 md:mb-8">
              <button
                onClick={() => setActiveTab("clients")}
                className={`px-5 py-2 rounded-full text-sm md:text-base font-medium border transition-all ${
                  activeTab === "clients"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
                }`}
              >
                For Clients
              </button>
              <button
                onClick={() => setActiveTab("artists")}
                className={`px-5 py-2 rounded-full text-sm md:text-base font-medium border transition-all ${
                  activeTab === "artists"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
                }`}
              >
                For Artists
              </button>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {activeTab === "clients" ? (
                <>
                  <Card className="p-5 md:p-8 bg-card/50 backdrop-blur border-accent/20">
                    <div className="flex items-center gap-3 mb-4">
                      <Music className="h-6 w-6 text-accent" />
                      <h3 className="text-base md:text-lg font-bold text-foreground">Discover talented artists</h3>
                    </div>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground">Filter by category, location, and experience</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground">Compare profiles and ratings</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground">Contact and book artists easily</span>
                      </li>
                    </ul>
                  </Card>
                  <Card className="p-5 md:p-8 bg-card/50 backdrop-blur border-accent/20">
                    <div className="flex items-center gap-3 mb-4">
                      <UserRound className="h-6 w-6 text-accent" />
                      <h3 className="text-base md:text-lg font-bold text-foreground">Artists for Every Event</h3>
                    </div>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground">Wedding, private parties, and corporate events</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground">Explore multiple music styles and artist types </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground">Local and international artists available </span>
                      </li>
                    </ul>
                  </Card>
                </>
              ) : (
                <>
                  <Card className="p-5 md:p-8 bg-card/50 backdrop-blur border-accent/20">
                    <div className="flex items-center gap-3 mb-4">
                      <UserRound className="h-6 w-6 text-accent" />
                      <h3 className="text-base md:text-lg font-bold text-foreground">Create a professional profile</h3>
                    </div>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground">Showcase your talent</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground">Get discovered by clients</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground">Grow your music career</span>
                      </li>
                    </ul>
                  </Card>
                  <Card className="p-5 md:p-8 bg-card/50 backdrop-blur border-accent/20">
                    <div className="flex items-center gap-3 mb-4">
                      <Star className="h-6 w-6 text-accent" />
                      <h3 className="text-base md:text-lg font-bold text-foreground">Build your reputation</h3>
                    </div>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground">Collect reviews from clients</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground">Climb the leaderboard rankings</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                        <span className="text-sm md:text-base text-muted-foreground">Unlock premium features</span>
                      </li>
                    </ul>
                  </Card>
                </>
              )}
            </div>
          </div>

          {/* Our Values Section */}
          <div className="mb-10 md:mb-20">
            <h2 className="text-xl md:text-4xl font-display font-bold text-center text-foreground mb-6 md:mb-12">Our Values</h2>
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

          {/* Pro Search Button */}
          <div className="text-center mb-10 md:mb-20">
            {isMobile ? (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-accent/50 text-accent hover:bg-accent/10"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Pro Search
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <ProSearchContent />
                </DrawerContent>
              </Drawer>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-accent/50 text-accent hover:bg-accent/10"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Pro Search
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                  <ProSearchContent />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Our Vision Section */}
          <div className="max-w-5xl mx-auto mb-10 md:mb-20">
            <h2 className="text-xl md:text-4xl font-display font-bold text-center text-foreground mb-4 md:mb-6">
              Our Vision
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-2">
              Our vision is to become the world's leading platform for musical talent.
            </p>
            <p className="text-xs md:text-base text-muted-foreground text-center max-w-2xl mx-auto mb-8 md:mb-10">
              We aim to connect musical talent with artists and create new opportunities for musicians and their clients.
            </p>

            {/* Trusted by Artists Banner */}
            <div className="relative rounded-xl overflow-hidden border border-border/50">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroConcert})` }}
              />
              <div className="absolute inset-0 bg-background/80" />
              <div className="relative z-10 py-8 md:py-12 px-4 md:px-10 text-center">
                <h3 className="text-lg md:text-2xl font-display font-bold text-foreground mb-2">
                  – Trusted by Artists Worldwide –
                </h3>
                <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-6 text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
                  <span>Professional artists and verified profiles.</span>
                  <span>Time-recognized moves.</span>
                </div>
                <div className="flex items-center justify-center gap-8 md:gap-16">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl md:text-3xl font-bold text-accent">{PLATFORM_STATS.artists}</span>
                    <span className="text-xs md:text-sm text-muted-foreground">Artists</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl md:text-3xl font-bold text-accent">{PLATFORM_STATS.countries}</span>
                    <span className="text-xs md:text-sm text-muted-foreground">Countries</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl md:text-3xl font-bold text-accent">{PLATFORM_STATS.eventsBooked}</span>
                    <span className="text-xs md:text-sm text-muted-foreground">Events Booked</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What We Aim For Section */}
          <div className="max-w-5xl mx-auto mb-10 md:mb-20">
            <div className="relative rounded-xl overflow-hidden border border-border/50">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroConcert})` }}
              />
              <div className="absolute inset-0 bg-background/80" />
              <div className="relative z-10 py-8 md:py-12 px-6 md:px-10">
                <h3 className="text-lg md:text-2xl font-display font-bold text-foreground mb-6 md:mb-8 text-center">
                  What We Aim For
                </h3>
                <div className="flex flex-col gap-3 md:gap-4 max-w-md mx-auto">
                  {[
                    "Global artist discovery",
                    "Seamless booking experience",
                    "Professional music community",
                    "Trusted event entertainment platform",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span className="text-sm md:text-base font-semibold text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Join Muzicalist Today CTA */}
          <div className="max-w-5xl mx-auto mb-10 md:mb-0">
            <div className="relative rounded-xl overflow-hidden border border-border/50">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroConcert})` }}
              />
              <div className="absolute inset-0 bg-background/75" />
              <div className="relative z-10 py-10 md:py-16 px-4 md:px-10 text-center">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-4">
                  Join Muzicalist Today
                </h2>
                <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
                  Find the perfect artist or grow your music career.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                  <Link to="/register-user">
                    <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-5 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300">
                      Sign Up as Client
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-accent/50 text-accent hover:bg-accent/10 px-8 py-5 hover:scale-105 transition-all duration-300">
                      Register as Artist
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
