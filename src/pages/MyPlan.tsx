import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Crown, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const subscriptionPlans = [
  {
    id: "Free",
    name: "Free",
    price: "0",
    description: "Get started with basic features",
    features: [
      "Basic profile",
      "5 standard ads",
      "5 gallery images",
      "3 gallery videos",
      "15 posts/month",
    ],
    highlighted: false,
  },
  {
    id: "Standard",
    name: "Standard",
    price: "29",
    description: "More visibility and features",
    features: [
      "Enhanced profile",
      "15 standard ads",
      "2 premium ads",
      "15 gallery images",
      "10 gallery videos",
      "50 posts/month",
      "Priority in search results",
    ],
    highlighted: false,
  },
  {
    id: "Premium",
    name: "Premium",
    price: "59",
    description: "Maximum exposure and all features",
    features: [
      "Premium profile badge",
      "Unlimited standard ads",
      "10 premium ads",
      "Unlimited gallery items",
      "Unlimited posts",
      "Top placement in search",
      "Featured on homepage",
      "Analytics dashboard",
    ],
    highlighted: true,
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
        <Navigation />
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
      <Navigation />
      <div className={`${isMobile ? 'pt-14 pb-20 px-4' : 'md:ml-64 pt-8 px-8'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">My Plan</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the plan that fits your needs
              </p>
            </div>

            <Separator />

            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
              {subscriptionPlans.map((plan) => {
                const isCurrentPlan = currentPlan === plan.id;
                const isPremiumPlan = plan.id === "Premium";

                return (
                  <div
                    key={plan.id}
                    className={`relative p-5 rounded-lg border-2 transition-all ${
                      isCurrentPlan
                        ? isPremiumPlan
                          ? "border-yellow-500/50 bg-yellow-500/10"
                          : "border-accent/50 bg-accent/10"
                        : plan.highlighted
                        ? "border-yellow-500/30 hover:border-yellow-500/50"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    {plan.highlighted && !isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-xs font-semibold px-3 py-1 rounded-full">
                          Recommended
                        </span>
                      </div>
                    )}

                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                          Current Plan
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4 mt-2">
                      <div
                        className={`p-2 rounded-full ${
                          isPremiumPlan
                            ? "bg-yellow-500/20"
                            : isCurrentPlan
                            ? "bg-accent/20"
                            : "bg-muted"
                        }`}
                      >
                        <Crown
                          className={`h-5 w-5 ${
                            isPremiumPlan
                              ? "text-yellow-500"
                              : isCurrentPlan
                              ? "text-accent"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div>
                        <p
                          className={`font-semibold ${
                            isPremiumPlan
                              ? "text-yellow-500"
                              : isCurrentPlan
                              ? "text-accent"
                              : "text-foreground"
                          }`}
                        >
                          {plan.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold text-foreground">
                        €{plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.description}
                    </p>

                    <ul className="space-y-2 mb-5">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {!isCurrentPlan && (
                      <Button
                        className={`w-full ${
                          isPremiumPlan
                            ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500"
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
