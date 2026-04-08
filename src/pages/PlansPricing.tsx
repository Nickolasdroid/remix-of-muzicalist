import Navigation from "@/components/Navigation";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type PlanFeature = {
  text: string;
  included: boolean;
};

const plans: {
  name: string;
  monthlyPrice: number;
  emoji: string;
  description: string;
  features: PlanFeature[];
  tagline: string;
  cta: string;
  highlighted: boolean;
}[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    emoji: "🟢",
    description: "Start your presence on Muzicalist",
    features: [
      { text: "Basic artist profile", included: true },
      { text: "Gallery: up to 5 images (no video support)", included: true },
      { text: "Select your music genres", included: true },
      { text: "Set your experience level", included: true },
      { text: "Messaging, direct contact & artist connections", included: true },
      { text: "Calendar: booking requests (by day)", included: true },
      { text: "1 visible social media link", included: true },
      { text: "Up to 3 visible reviews", included: true },
      { text: "Appear in Leaderboard rankings", included: true },
      { text: "Browse Feed (posts) & Ads (opportunities)", included: true },
      { text: "Cannot publish posts", included: false },
      { text: "Cannot publish ads", included: false },
      { text: "Periodic promotion on Muzicalist social media", included: false },
      { text: "Limited visibility in search results", included: false },
      { text: "Advanced analytics dashboard", included: false },
      { text: "Featured on homepage", included: false },
    ],
    tagline: "👉 Perfect for getting started and exploring the platform",
    cta: "Current Plan",
    highlighted: false,
  },
  {
    name: "Standard",
    monthlyPrice: 12,
    emoji: "🟡",
    description: "Get discovered. Attract more clients. Grow your bookings.",
    features: [
      { text: "Enhanced artist profile (more professional presence)", included: true },
      { text: "Gallery: up to 10 images & 2 videos", included: true },
      { text: "Select your music genres", included: true },
      { text: "Set your experience level", included: true },
      { text: "Unlimited messaging, direct contact & artist connections", included: true },
      { text: "Publish up to 15 posts/month", included: true },
      { text: "5 Ads + 2 Promotions/month", included: true },
      { text: "Calendar: booking requests (by day)", included: true },
      { text: "Display your estimated pricing → higher conversion rate", included: true },
      { text: "Unlimited reviews → build credibility", included: true },
      { text: "Visible social media links", included: true },
      { text: "Appear in Leaderboard rankings", included: true },
      { text: "Appear in Feed (posts) & Ads (opportunities)", included: true },
      { text: "Priority placement in search results → more visibility", included: true },
      { text: "Periodic promotion on Muzicalist social media", included: true },
      { text: "Advanced analytics dashboard", included: false },
      { text: "Featured on homepage", included: false },
    ],
    tagline: "👉 Designed to help you gain more exposure and consistent booking opportunities",
    cta: "Upgrade",
    highlighted: true,
  },
  {
    name: "Premium",
    monthlyPrice: 24,
    emoji: "🔶",
    description: "Maximize your visibility. Build authority. Get booked consistently.",
    features: [
      { text: "Premium gold badge → stand out instantly", included: true },
      { text: "Gallery: up to 15 images & 5 videos", included: true },
      { text: "Select your music genres", included: true },
      { text: "Set your experience level", included: true },
      { text: "Publish up to 30 posts/month", included: true },
      { text: "10 Ads + 5 Promotions/month", included: true },
      { text: "Unlimited messaging, direct contact & artist connections", included: true },
      { text: "Professional calendar: Unlimited booking requests by day & time intervals", included: true },
      { text: "Display your estimated pricing → higher conversion rate", included: true },
      { text: "Unlimited reviews → strong credibility", included: true },
      { text: "Visible social media links", included: true },
      { text: "Appear in Leaderboard rankings", included: true },
      { text: "Priority visibility in Feed (posts) & Ads (opportunities)", included: true },
      { text: "Top placement in search results → maximum exposure", included: true },
      { text: "Regular promotion on Muzicalist social media", included: true },
      { text: "Advanced analytics dashboard: booking requests, accepted / declined events, performance insights", included: true },
      { text: "Featured on homepage → premium exposure boost", included: true },
    ],
    tagline: "👉 Built for artists who want maximum exposure, strong credibility, and steady income from events",
    cta: "Upgrade",
    highlighted: false,
  },
];

const PlansPricing = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  const getPrice = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return "$0";
    if (isAnnual) return `$${Math.round(monthlyPrice * 10)}`;
    return `$${monthlyPrice}`;
  };

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
    <div className={`min-h-screen ${isAuthenticated ? 'md:ml-64' : ''}`}>
      <Navigation />

      <section className={`pt-24 ${isAuthenticated ? 'md:pt-8' : 'md:pt-24'} pb-10 md:pb-20 px-4 md:px-8`}>
        <div className="container mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-6">
              Plans & Pricing
            </h1>
            <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Choose the plan that best fits your needs
            </p>
            <div className="inline-flex items-center gap-0 rounded-full border border-border bg-card p-1">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!isAnnual ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isAnnual ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Annual <span className="text-xs opacity-75">Save ~17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative ${plan.highlighted || plan.name === 'Premium' ? 'mt-4' : ''}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-card border border-accent text-accent text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}
                {plan.name === 'Premium' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-card border border-amber-500 text-amber-500 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                      ⭐ Best for Professionals
                    </span>
                  </div>
                )}
                <Card
                  className={`flex flex-col ${plan.highlighted ? 'border-accent shadow-lg' : 'border-border'}`}
                >
                <CardHeader className="text-center">
                  <CardTitle className="text-xl md:text-2xl font-display">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl md:text-4xl font-bold text-foreground">{getPrice(plan.monthlyPrice)}</span>
                    <span className="text-muted-foreground">{isAnnual ? '/year' : '/month'}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className={`flex items-start gap-2 text-sm ${feature.included ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                        {feature.included ? (
                          <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 text-destructive/60 shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? '' : 'line-through'}>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-muted-foreground/80 italic">{plan.tagline}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`w-full ${plan.name === 'Premium' ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : ''}`}
                    variant={plan.name === 'Premium' ? 'default' : (plan.highlighted ? "default" : "outline")}
                  >
                    {!isAuthenticated ? (plan.name === 'Premium' ? 'Go Premium' : 'Get Started') : plan.cta}
                  </Button>
                </CardFooter>
              </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlansPricing;
