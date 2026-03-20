import Navigation from "@/components/Navigation";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    emoji: "🟢",
    description: "Start your presence on Muzicalist",
    features: [
      "Basic artist profile",
      "Gallery: up to 5 images (no video support)",
      "Limited visibility in search results",
      "Select your music genres",
      "Set your experience level",
      "Receive booking requests (by day)",
      "Unlimited messages & contact",
      "1 visible social media link",
      "Up to 3 visible reviews",
      "Appear in Leaderboard rankings",
      "Like & follow other artists",
      "Browse Feed (posts) & Ads (opportunities)",
      "Cannot publish posts or ads",
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
      "Enhanced artist profile (more professional presence)",
      "Gallery: up to 10 images & 2 videos",
      "Priority placement in search results → more visibility",
      "Publish up to 15 posts/month",
      "5 Ads + 2 Promotions/month",
      "Receive booking requests (by day)",
      "Display your estimated pricing → higher conversion rate",
      "Unlimited reviews → build credibility",
      "Visible social media links",
      "Appear in Feed (posts) & Ads (opportunities)",
      "Increased visibility in Feed & Ads vs Free",
      "Appear in Leaderboard rankings",
      "Unlimited messages & contact",
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
      "Premium gold badge → stand out instantly",
      "Gallery: up to 15 images & 5 videos",
      "Top placement in search results → maximum exposure",
      "Professional calendar: booking requests by day & time intervals",
      "Advanced analytics dashboard: booking requests, accepted/declined events, performance insights",
      "Publish up to 30 posts/month",
      "10 Ads + 5 Boosted Promotions / month",
      "Unlimited bookings & requests",
      "Display your estimated pricing",
      "Unlimited reviews → strong credibility",
      "Visible social media links",
      "Priority visibility in Feed (posts) & Ads (opportunities)",
      "Appear in Leaderboard rankings",
      "Unlimited messages & contact",
      "Promotion on Muzicalist social media",
      "Featured on homepage → premium exposure boost",
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
    if (monthlyPrice === 0) return "€0";
    if (isAnnual) return `€${Math.round(monthlyPrice * 10)}`;
    return `€${monthlyPrice}`;
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
              <Card
                key={plan.name}
                className={`flex flex-col ${plan.highlighted ? 'border-accent shadow-lg scale-[1.02]' : 'border-border'}`}
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
                      <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-muted-foreground/80 italic">{plan.tagline}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      
    </div>
  );
};

export default PlansPricing;
