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
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import heroConcert from "@/assets/hero-concert.png";
import { PLATFORM_STATS } from "@/lib/platformStats";
import ourStoryBand from "@/assets/69690e7b-dd42-42c0-91f9-f4ef4d0290a5.png";

const AboutUs = () => {
  const { t } = useTranslation();
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

  const values = [
    { icon: Music, title: t("aboutUs.values.excellence.title"), description: t("aboutUs.values.excellence.description") },
    { icon: Users, title: t("aboutUs.values.community.title"), description: t("aboutUs.values.community.description") },
    { icon: ShieldCheck, title: t("aboutUs.values.platform.title"), description: t("aboutUs.values.platform.description") },
    { icon: Briefcase, title: t("aboutUs.values.experience.title"), description: t("aboutUs.values.experience.description") },
  ];

  const aims = [
    t("aboutUs.aims.global"),
    t("aboutUs.aims.seamless"),
    t("aboutUs.aims.community"),
    t("aboutUs.aims.trusted"),
  ];

  const ProSearchContent = () => (
    <div className="p-4">
      <ArtistSearchBar />
    </div>
  );

  return (
    <div className={`min-h-screen ${isAuthenticated ? 'md:ml-64' : ''}`}>
      <Navigation />

      <section className={`pt-24 ${isAuthenticated ? 'md:pt-8' : 'md:pt-24'} pb-10 md:pb-20 px-4 md:px-8`}>
        <div className="container mx-auto px-0">
          <div className="max-w-5xl mx-auto mb-10 md:mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
              <div>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4 md:mb-6">
                  {t("aboutUs.ourStory")}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mb-4">{t("aboutUs.story1")}</p>
                <p className="text-sm md:text-base text-muted-foreground mb-4">{t("aboutUs.story2")}</p>
                <p className="text-sm md:text-base text-muted-foreground mb-4">{t("aboutUs.story3")}</p>
                <p className="text-sm md:text-base font-semibold text-foreground mb-2">{t("aboutUs.ourGoal")}</p>
                <p className="text-sm md:text-base text-muted-foreground">{t("aboutUs.ourGoalText")}</p>
              </div>
              <div className="rounded-xl overflow-hidden border border-border/50 shadow-lg">
                <img src={ourStoryBand} alt="Concert performance" className="w-full h-full aspect-[4/3] object-cover" />
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto mb-10 md:mb-20">
            <h2 className="text-xl md:text-4xl font-display font-bold text-center text-foreground mb-6 md:mb-10">
              {t("aboutUs.howItWorks")}
            </h2>

            <div className="flex justify-center gap-4 mb-6 md:mb-8">
              <button
                onClick={() => setActiveTab("clients")}
                className={`px-5 py-2 rounded-full text-sm md:text-base font-medium border transition-all ${
                  activeTab === "clients" ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
                }`}
              >
                {t("aboutUs.forClients")}
              </button>
              <button
                onClick={() => setActiveTab("artists")}
                className={`px-5 py-2 rounded-full text-sm md:text-base font-medium border transition-all ${
                  activeTab === "artists" ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
                }`}
              >
                {t("aboutUs.forArtists")}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {activeTab === "clients" ? (
                <>
                  <Card className="p-5 md:p-8 bg-card/50 backdrop-blur border-accent/20">
                    <div className="flex items-center gap-3 mb-4">
                      <Music className="h-6 w-6 text-accent" />
                      <h3 className="text-base md:text-lg font-bold text-foreground">{t("aboutUs.clients.discoverTitle")}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {[t("aboutUs.clients.discover1"), t("aboutUs.clients.discover2"), t("aboutUs.clients.discover3")].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                          <span className="text-sm md:text-base text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Card className="p-5 md:p-8 bg-card/50 backdrop-blur border-accent/20">
                    <div className="flex items-center gap-3 mb-4">
                      <UserRound className="h-6 w-6 text-accent" />
                      <h3 className="text-base md:text-lg font-bold text-foreground">{t("aboutUs.clients.everyEventTitle")}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {[t("aboutUs.clients.everyEvent1"), t("aboutUs.clients.everyEvent2"), t("aboutUs.clients.everyEvent3")].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                          <span className="text-sm md:text-base text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </>
              ) : (
                <>
                  <Card className="p-5 md:p-8 bg-card/50 backdrop-blur border-accent/20">
                    <div className="flex items-center gap-3 mb-4">
                      <UserRound className="h-6 w-6 text-accent" />
                      <h3 className="text-base md:text-lg font-bold text-foreground">{t("aboutUs.artists.profileTitle")}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {[t("aboutUs.artists.profile1"), t("aboutUs.artists.profile2"), t("aboutUs.artists.profile3")].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                          <span className="text-sm md:text-base text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Card className="p-5 md:p-8 bg-card/50 backdrop-blur border-accent/20">
                    <div className="flex items-center gap-3 mb-4">
                      <Star className="h-6 w-6 text-accent" />
                      <h3 className="text-base md:text-lg font-bold text-foreground">{t("aboutUs.artists.reputationTitle")}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {[t("aboutUs.artists.reputation1"), t("aboutUs.artists.reputation2"), t("aboutUs.artists.reputation3")].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                          <span className="text-sm md:text-base text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </>
              )}
            </div>
          </div>

          <div className="mb-10 md:mb-20">
            <h2 className="text-xl md:text-4xl font-display font-bold text-center text-foreground mb-6 md:mb-12">{t("aboutUs.ourValues")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto px-0">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <Card key={value.title} className="p-4 md:p-8 bg-card/50 backdrop-blur border-accent/20 hover:border-accent/40 transition-all hover:shadow-[var(--shadow-gold)]">
                    <Icon className="h-8 w-8 md:h-12 md:w-12 text-accent mb-3 md:mb-4" />
                    <h4 className="text-lg md:text-2xl font-display font-bold text-foreground mb-2 md:mb-3">{value.title}</h4>
                    <p className="text-sm md:text-base text-muted-foreground">{value.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="text-center mb-10 md:mb-20">
            {isMobile ? (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="border-accent/50 text-accent hover:bg-accent/10">
                    <Crown className="h-4 w-4 mr-2" />
                    {t("aboutUs.proSearch")}
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <ProSearchContent />
                </DrawerContent>
              </Drawer>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-accent/50 text-accent hover:bg-accent/10">
                    <Crown className="h-4 w-4 mr-2" />
                    {t("aboutUs.proSearch")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                  <ProSearchContent />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="max-w-5xl mx-auto mb-10 md:mb-20">
            <h2 className="text-xl md:text-4xl font-display font-bold text-center text-foreground mb-4 md:mb-6">{t("aboutUs.ourVision")}</h2>
            <p className="text-sm md:text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-2">{t("aboutUs.visionLine1")}</p>
            <p className="text-xs md:text-base text-muted-foreground text-center max-w-2xl mx-auto mb-8 md:mb-10">{t("aboutUs.visionLine2")}</p>

            <div className="relative rounded-xl overflow-hidden border border-border/50">
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroConcert})` }} />
              <div className="absolute inset-0 bg-background/80" />
              <div className="relative z-10 py-8 md:py-12 px-4 md:px-10 text-center">
                <h3 className="text-lg md:text-2xl font-display font-bold text-foreground mb-2">{t("aboutUs.trustedBy")}</h3>
                <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-6 text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
                  <span>{t("aboutUs.trustedDesc1")}</span>
                  <span>{t("aboutUs.trustedDesc2")}</span>
                </div>
                <div className="flex items-center justify-center gap-8 md:gap-16">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl md:text-3xl font-bold text-accent">{PLATFORM_STATS.artists}</span>
                    <span className="text-xs md:text-sm text-muted-foreground">{t("home.stats.artists")}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl md:text-3xl font-bold text-accent">{PLATFORM_STATS.countries}</span>
                    <span className="text-xs md:text-sm text-muted-foreground">{t("home.stats.countries")}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl md:text-3xl font-bold text-accent">{PLATFORM_STATS.eventsBooked}</span>
                    <span className="text-xs md:text-sm text-muted-foreground">{t("home.stats.eventsBooked")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto mb-10 md:mb-20">
            <div className="relative rounded-xl overflow-hidden border border-border/50">
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroConcert})` }} />
              <div className="absolute inset-0 bg-background/80" />
              <div className="relative z-10 py-8 md:py-12 px-6 md:px-10">
                <h3 className="text-lg md:text-2xl font-display font-bold text-foreground mb-6 md:mb-8 text-center">{t("aboutUs.whatWeAimFor")}</h3>
                <div className="flex flex-col gap-3 md:gap-4 max-w-md mx-auto">
                  {aims.map((item) => (
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

          <div className="max-w-5xl mx-auto mb-10 md:mb-0">
            <div className="relative rounded-xl overflow-hidden border border-border/50">
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroConcert})` }} />
              <div className="absolute inset-0 bg-background/75" />
              <div className="relative z-10 py-10 md:py-16 px-4 md:px-10 text-center">
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-4">{t("aboutUs.joinTitle")}</h2>
                <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">{t("aboutUs.joinSubtitle")}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                  <Link to="/register-user">
                    <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-5 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300">
                      {t("aboutUs.signUpClient")}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-accent/50 text-accent hover:bg-accent/10 px-8 py-5 hover:scale-105 transition-all duration-300">
                      {t("aboutUs.registerArtist")}
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
