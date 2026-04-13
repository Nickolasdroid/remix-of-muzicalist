import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Crown, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

type PlanFeature = {
  text: string;
  included: boolean;
};

const subscriptionPlans: {
  id: string;
  name: string;
  price: string;
  emoji: string;
  description: string;
  features: PlanFeature[];
  tagline: string;
  highlighted: boolean;
}[] = [
  {
    id: "Free",
    name: "Free",
    price: "0",
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
    highlighted: false,
  },
  {
    id: "Standard",
    name: "Standard",
    price: "12",
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
    highlighted: true,
  },
  {
    id: "Premium",
    name: "Premium",
    price: "24",
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
    highlighted: false,
  },
];

const MyPlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("Free");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();
      if (profileData) {
        setCurrentPlan(profileData.plan || "Free");
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <>
        <Navigation mobileTitle="My Plan" mobileBackPath={-1} />
        <div className={`${isMobile ? 'pt-14 pb-20 px-4' : 'md:ml-64 pt-8 px-8'}`}>
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation mobileTitle="My Plan" mobileBackPath={-1} />
      <div className={`${isMobile ? 'pt-14 pb-20 px-4' : 'md:ml-64 pt-8 px-8'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="space-y-6">
            <div className={isMobile ? 'hidden' : ''}>
              <h1 className="text-xl font-semibold text-foreground">My Plan</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the plan that fits your needs
              </p>
            </div>

            <Separator className="hidden md:block" />

            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
              {subscriptionPlans.map((plan) => {
                const isCurrentPlan = currentPlan === plan.id;
                const isPremiumPlan = plan.id === "Premium";

                return (
                  <div key={plan.id} className={`relative ${plan.highlighted || isPremiumPlan ? 'mt-4' : ''}`}>
                    {!isCurrentPlan && plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <span className="bg-card border border-accent text-accent text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                          Most Popular
                        </span>
                      </div>
                    )}
                    {!isCurrentPlan && isPremiumPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <span className="bg-card border border-amber-500 text-amber-500 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                          ⭐ Best for Professionals
                        </span>
                      </div>
                    )}

                    <div
                      className={`flex flex-col h-full p-5 rounded-lg border-2 transition-all ${
                        isCurrentPlan
                          ? isPremiumPlan
                            ? "border-amber-500/50 bg-amber-500/10"
                            : "border-accent/50 bg-accent/10"
                          : plan.highlighted
                          ? "border-accent shadow-lg"
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                    >
                      <div className="text-center mb-4 mt-2">
                        <p className="text-xl font-semibold text-foreground">{plan.name}</p>
                        <div className="mt-2">
                          <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                          <span className="text-sm text-muted-foreground">/month</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                      </div>

                      <ul className="space-y-2.5 mb-4 flex-1">
                        {plan.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className={`flex items-start gap-2 text-sm ${feature.included ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}
                          >
                            {feature.included ? (
                              <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-4 w-4 text-destructive/60 flex-shrink-0 mt-0.5" />
                            )}
                            <span className={feature.included ? '' : 'line-through'}>{feature.text}</span>
                          </li>
                        ))}
                      </ul>

                      <p className="text-xs text-muted-foreground/80 italic mb-4">{plan.tagline}</p>

                      {!isCurrentPlan && (
                        <Button
                          className={`w-full ${
                            isPremiumPlan
                              ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                              : "bg-accent text-accent-foreground hover:bg-accent/90"
                          }`}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade to {plan.name}
                        </Button>
                      )}

                      {isCurrentPlan && (
                        <div className="w-full py-2 text-center text-sm font-medium text-muted-foreground">
                          Your current plan
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyPlan;
