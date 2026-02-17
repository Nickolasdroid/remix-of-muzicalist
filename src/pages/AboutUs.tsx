import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Music2, Users, Target, Heart, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import ArtistSearchBar from "@/components/ArtistSearchBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const values = [
  { icon: Music2, title: "Excellence in Music", description: "We connect clients with the most talented musical artists, ensuring every event becomes unforgettable." },
  { icon: Users, title: "Community First", description: "Building a vibrant community where artists can showcase their talents and clients can easily find the perfect match." },
  { icon: Target, title: "Professional Platform", description: "A dedicated space for serious musicians and event organizers to connect and collaborate professionally." },
  { icon: Heart, title: "Passion for Music", description: "We're driven by our love for music and our commitment to supporting artists in their careers." },
];

const AboutUs = () => {
  const isMobile = useIsMobile();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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

      <section className="pt-24 md:pt-32 pb-10 md:pb-20 px-4 md:px-8">
        <div className="container mx-auto px-0">
          <div className="text-center mb-10 md:mb-16 px-2">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-6">
              About Muzicalist
            </h1>
            <p className="text-sm md:text-xl text-muted-foreground max-w-3xl mx-auto">
              The premier platform connecting talented musical artists with clients seeking exceptional entertainment
            </p>

            {/* Pro Search Button */}
            <div className="mt-6">
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

      <Footer />
    </div>
  );
};

export default AboutUs;
