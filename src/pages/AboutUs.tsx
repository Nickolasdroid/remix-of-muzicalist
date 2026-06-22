import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroConcert from "@/assets/hero-concert.png";
import storyNetwork from "@/assets/about-story-network.jpg";
import worldNetwork from "@/assets/about-world-network.jpg";
import { PLATFORM_STATS } from "@/lib/platformStats";

const AboutUs = () => {
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

  return (
    <div className={`min-h-screen bg-[#050505] ${isAuthenticated ? 'md:ml-64' : ''}`}>
      <Navigation />

      {/* SECTION 1 — HERO */}
      <section className={`relative overflow-hidden ${isAuthenticated ? 'pt-24 md:pt-16' : 'pt-24 md:pt-32'} pb-20 md:pb-32 px-6 md:px-10`}>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${heroConcert})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/85 to-[#050505]" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/10 blur-[120px]" />

        <div className="relative max-w-5xl mx-auto text-center">
          <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent/80 font-medium mb-6 md:mb-8">
            ABOUT MUZICALIST
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-semibold text-foreground tracking-tight mb-6 md:mb-8">
            About <span className="bg-gradient-to-r from-accent via-accent to-accent/60 bg-clip-text text-transparent">Muzicalist</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed">
            Connecting artists, opportunities and music communities worldwide.
          </p>
        </div>
      </section>

      {/* SECTION 2 — OUR MISSION */}
      <section className="py-20 md:py-32 px-6 md:px-10 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-8 md:mb-12">
            OUR MISSION
          </p>
          <p className="text-2xl md:text-4xl lg:text-5xl font-display font-light text-foreground/95 leading-[1.25] tracking-tight">
            Muzicalist exists to make discovering, connecting with and promoting{" "}
            <span className="text-accent">musical talent</span> simpler, faster and more professional.
          </p>
        </div>
      </section>

      {/* SECTION 3 — OUR STORY */}
      <section className="py-20 md:py-32 px-6 md:px-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-6 md:mb-8">
              OUR STORY
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-foreground tracking-tight mb-6 md:mb-8">
              Bridging artists and clients.
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Muzicalist was created to solve a common problem: talented artists were difficult to discover, while clients struggled to find reliable musicians. We built a platform that brings both sides together in one trusted place.
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-accent/10 blur-[80px] rounded-full" />
            <img
              src={storyNetwork}
              alt="Muzicalist global music network illustration"
              loading="lazy"
              width={1024}
              height={1024}
              className="relative w-full h-auto max-w-md mx-auto"
            />
          </div>
        </div>
      </section>

      {/* SECTION 4 — PLATFORM IMPACT */}
      <section className="py-20 md:py-32 px-6 md:px-10 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
            <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-6">
              PLATFORM IMPACT
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-foreground tracking-tight">
              Numbers that matter.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
            {[
              { label: "Artists", value: PLATFORM_STATS.artists },
              { label: "Countries", value: PLATFORM_STATS.countries },
              { label: "Events", value: PLATFORM_STATS.eventsBooked },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group relative bg-[#080808] py-12 md:py-16 px-8 text-center transition-all duration-500 hover:bg-[#0c0c0c]"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-accent/0 via-accent/0 to-accent/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="text-5xl md:text-6xl lg:text-7xl font-display font-semibold bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent mb-4 group-hover:from-accent group-hover:to-accent/70 transition-all duration-500">
                    {stat.value}
                  </div>
                  <p className="text-[11px] md:text-xs tracking-[0.25em] text-muted-foreground/80 uppercase">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — LOOKING FORWARD */}
      <section className="py-20 md:py-32 px-6 md:px-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="order-2 md:order-1">
            <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-6 md:mb-8">
              LOOKING FORWARD
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-foreground tracking-tight mb-6 md:mb-8">
              A global music network.
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              We are building a global network where artists and clients can discover opportunities, collaborate and grow together.
            </p>
          </div>
          <div className="order-1 md:order-2 relative">
            <div className="absolute inset-0 bg-accent/8 blur-[100px] rounded-full" />
            <img
              src={worldNetwork}
              alt="Global music network world map"
              loading="lazy"
              width={1024}
              height={1024}
              className="relative w-full h-auto"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
