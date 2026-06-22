import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Search, GitCompare, MessageCircle, TrendingUp, Check, X, ArrowRight, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";
import heroConcert from "@/assets/about-hero-concert.jpg";
import storyLive from "@/assets/about-story-live.jpg";
import storyNetwork from "@/assets/about-story-network.jpg";
import worldNetwork from "@/assets/about-world-network.jpg";
import { PLATFORM_STATS } from "@/lib/platformStats";

const STEPS = [
  { icon: Search, title: "Discover", desc: "Search and discover talented artists." },
  { icon: GitCompare, title: "Compare", desc: "View profiles and compare ratings." },
  { icon: MessageCircle, title: "Connect", desc: "Contact artists directly." },
  { icon: TrendingUp, title: "Grow", desc: "Book, collaborate and create opportunities." },
];

const STATS = [
  { value: PLATFORM_STATS.artists, label: "Artists" },
  { value: PLATFORM_STATS.countries, label: "Countries" },
  { value: PLATFORM_STATS.eventsBooked, label: "Events" },
  { value: "10K+", label: "Profile Views" },
];

const AuthenticatedView = () => (
  <>
    {/* SECTION 1 — HERO */}
    <section className="relative overflow-hidden pt-24 md:pt-16 pb-20 md:pb-32 px-6 md:px-10">
      <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${heroConcert})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/85 to-[#050505]" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/10 blur-[120px]" />
      <div className="relative max-w-5xl mx-auto text-center">
        <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent/80 font-medium mb-6 md:mb-8">ABOUT MUZICALIST</p>
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
        <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-8 md:mb-12">OUR MISSION</p>
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
          <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-6 md:mb-8">OUR STORY</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-foreground tracking-tight mb-6 md:mb-8">
            Bridging artists and clients.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Muzicalist was created to solve a common problem: talented artists were difficult to discover, while clients struggled to find reliable musicians. We built a platform that brings both sides together in one trusted place.
          </p>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-accent/10 blur-[80px] rounded-full" />
          <img src={storyNetwork} alt="Muzicalist global music network" loading="lazy" width={1024} height={1024} className="relative w-full h-auto max-w-md mx-auto" />
        </div>
      </div>
    </section>

    {/* SECTION 4 — PLATFORM IMPACT */}
    <section className="py-20 md:py-32 px-6 md:px-10 border-t border-white/[0.04]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 md:mb-20">
          <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-6">PLATFORM IMPACT</p>
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
            <div key={stat.label} className="group relative bg-[#080808] py-12 md:py-16 px-8 text-center transition-all duration-500 hover:bg-[#0c0c0c]">
              <div className="absolute inset-0 bg-gradient-to-b from-accent/0 via-accent/0 to-accent/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="text-5xl md:text-6xl lg:text-7xl font-display font-semibold bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent mb-4 group-hover:from-accent group-hover:to-accent/70 transition-all duration-500">
                  {stat.value}
                </div>
                <p className="text-[11px] md:text-xs tracking-[0.25em] text-muted-foreground/80 uppercase">{stat.label}</p>
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
          <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-6 md:mb-8">LOOKING FORWARD</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-foreground tracking-tight mb-6 md:mb-8">
            A global music network.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            We are building a global network where artists and clients can discover opportunities, collaborate and grow together.
          </p>
        </div>
        <div className="order-1 md:order-2 relative">
          <div className="absolute inset-0 bg-accent/8 blur-[100px] rounded-full" />
          <img src={worldNetwork} alt="Global music network" loading="lazy" width={1024} height={1024} className="relative w-full h-auto" />
        </div>
      </div>
    </section>
  </>
);

const PublicAboutPage = () => {
  return (
    <div className="bg-[#050505] text-foreground">
      {/* SECTION 1 — HERO */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-24 pb-20 px-6 md:px-10">
        <div className="absolute inset-0">
          <img src={heroConcert} alt="Live concert performance" width={1920} height={1080} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/80 to-[#050505]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]/60" />
        </div>
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-accent/10 blur-[140px]" />

        <div className="relative max-w-6xl mx-auto w-full">
          <p className="text-[11px] md:text-xs tracking-[0.4em] text-accent/90 font-medium mb-6 md:mb-8">
            MUSICALIST
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-semibold tracking-tight leading-[1.05] max-w-4xl mb-6 md:mb-8">
            The Professional Platform For{" "}
            <span className="bg-gradient-to-r from-accent via-accent to-accent/50 bg-clip-text text-transparent">Musical Talent</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground/90 max-w-2xl leading-relaxed mb-8 md:mb-12">
            Connect with talented musicians, discover opportunities and build meaningful professional connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Link to="/categories">
              <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-base shadow-[0_0_40px_-8px_hsl(var(--accent)/0.6)]">
                Find Artists <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/[0.03] border-white/15 hover:bg-white/[0.08] hover:border-accent/40 px-8 py-6 text-base">
                Join Muzicalist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2 — HOW IT WORKS */}
      <section className="py-20 md:py-32 px-6 md:px-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-5">PROCESS</p>
            <h2 className="text-3xl md:text-5xl font-display font-semibold tracking-tight mb-4">How It Works</h2>
            <p className="text-base md:text-lg text-muted-foreground">Simple steps. Powerful connections.</p>
          </div>

          <div className="relative">
            {/* connecting line */}
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
              {STEPS.map((s, i) => (
                <div key={s.title} className="relative text-center">
                  <div className="relative mx-auto mb-5 md:mb-6 w-16 h-16 rounded-full bg-[#0a0a0a] border border-accent/30 flex items-center justify-center group hover:border-accent/70 transition-colors">
                    <div className="absolute inset-0 rounded-full bg-accent/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <s.icon className="relative h-6 w-6 text-accent" />
                    <span className="absolute -top-2 -right-2 text-[10px] tracking-widest text-accent/70 font-medium">0{i + 1}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-display font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px] mx-auto">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — WHY MUZICALIST */}
      <section className="py-20 md:py-32 px-6 md:px-10 border-t border-white/[0.04] relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-5">THE DIFFERENCE</p>
            <h2 className="text-3xl md:text-5xl font-display font-semibold tracking-tight">Why Muzicalist?</h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-stretch">
            {/* OLD WAY */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 md:p-10">
              <p className="text-[11px] tracking-[0.25em] text-muted-foreground/70 mb-3">BEFORE</p>
              <h3 className="text-2xl md:text-3xl font-display font-semibold text-muted-foreground mb-8">The Old Way</h3>
              <ul className="space-y-4">
                {[
                  "Finding reliable musicians is difficult",
                  "Time-consuming search process",
                  "Limited visibility for artists",
                  "No trusted verification system",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground/80">
                    <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center">
                      <X className="h-3 w-3 text-muted-foreground/60" />
                    </span>
                    <span className="text-sm md:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* center logo */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full bg-[#050505] border border-accent/40 items-center justify-center shadow-[0_0_40px_-8px_hsl(var(--accent)/0.5)]">
              <img src={logo} alt="Muzicalist" className="h-8 w-auto" />
            </div>

            {/* NEW WAY */}
            <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/[0.06] to-transparent p-8 md:p-10 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-accent/10 blur-[80px]" />
              <div className="relative">
                <p className="text-[11px] tracking-[0.25em] text-accent/80 mb-3 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" /> WITH MUZICALIST
                </p>
                <h3 className="text-2xl md:text-3xl font-display font-semibold mb-8">A Better Way</h3>
                <ul className="space-y-4">
                  {[
                    "Verified artist profiles",
                    "Smart search and filtering",
                    "Direct communication",
                    "Better visibility and opportunities",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center">
                        <Check className="h-3 w-3 text-accent" />
                      </span>
                      <span className="text-sm md:text-base text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — TRUST & IMPACT */}
      <section className="py-20 md:py-32 px-6 md:px-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-5">IMPACT</p>
            <h2 className="text-3xl md:text-5xl font-display font-semibold tracking-tight">Trusted By Music Professionals</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
            {STATS.map((stat) => (
              <div key={stat.label} className="group relative bg-[#080808] py-12 md:py-16 px-6 text-center transition-all duration-500 hover:bg-[#0c0c0c]">
                <div className="absolute inset-0 bg-gradient-to-b from-accent/0 to-accent/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="text-4xl md:text-6xl font-display font-semibold bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent mb-3 group-hover:from-accent group-hover:to-accent/70 transition-all duration-500">
                    {stat.value}
                  </div>
                  <p className="text-[11px] md:text-xs tracking-[0.25em] text-muted-foreground/80 uppercase">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — STORY & VISION */}
      <section className="py-20 md:py-32 px-6 md:px-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* Story */}
          <div>
            <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-5">OUR STORY</p>
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-6">Built to bridge artists and clients.</h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
              Muzicalist was created to solve a common problem: talented artists were difficult to discover, while clients struggled to find reliable musicians.
            </p>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8">
              We built a platform that brings both sides together in one trusted place.
            </p>
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.06]">
              <img src={storyLive} alt="Live music performance" loading="lazy" width={1024} height={1024} className="w-full h-72 md:h-80 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
            </div>
          </div>

          {/* Vision */}
          <div className="md:pt-12">
            <p className="text-[11px] md:text-xs tracking-[0.3em] text-accent font-medium mb-5">OUR VISION</p>
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-8">A global network for music.</h2>

            <div className="relative rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/[0.05] to-transparent p-8 md:p-10 mb-8 overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-accent/10 blur-[80px]" />
              <p className="relative text-xl md:text-2xl font-display font-light leading-snug">
                Building the world's most trusted network for{" "}
                <span className="text-accent">musicians and music opportunities</span>.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-accent/8 blur-[100px] rounded-full" />
              <img src={worldNetwork} alt="Global network" loading="lazy" width={1024} height={1024} className="relative w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — FINAL CTA */}
      <section className="py-20 md:py-32 px-6 md:px-10 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-accent/25 bg-gradient-to-br from-[#0d0a04] via-[#0a0a0a] to-[#0d0a04] p-10 md:p-20 text-center">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-accent/15 blur-[120px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--accent)/0.08),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-display font-semibold tracking-tight mb-5 max-w-3xl mx-auto leading-tight">
                Ready to join the future of{" "}
                <span className="bg-gradient-to-r from-accent to-accent/50 bg-clip-text text-transparent">music networking?</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 md:mb-10">
                Become part of a growing community of artists and clients worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-base shadow-[0_0_40px_-8px_hsl(var(--accent)/0.6)]">
                    Get Started <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/categories">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/[0.03] border-white/15 hover:bg-white/[0.08] hover:border-accent/40 px-8 py-6 text-base">
                    Find Artists
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

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

  if (isAuthenticated === null) return null;

  return (
    <div className={`min-h-screen bg-[#050505] ${isAuthenticated ? 'md:ml-64' : ''}`}>
      <Navigation />
      {isAuthenticated ? <AuthenticatedView /> : <PublicAboutPage />}
      {!isAuthenticated && <Footer />}
    </div>
  );
};

export default AboutUs;
