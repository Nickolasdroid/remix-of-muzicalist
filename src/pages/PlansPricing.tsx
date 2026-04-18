import Navigation from "@/components/Navigation";

import { Button } from "@/components/ui/button";
import { Check, X, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscriptionPlans as plans, formatPlanPrice } from "@/lib/subscriptionPlans";

const PlansPricing = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isArtist, setIsArtist] = useState(false);

  const getPrice = (monthlyPrice: number) => formatPlanPrice(monthlyPrice, isAnnual);

  const loadPlan = async (userId: string) => {
    const [{ data: roleData }, { data: profileData }] = await Promise.all([
      supabase.from('user_roles').select('user_type').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('plan').eq('id', userId).maybeSingle(),
    ]);
    setIsArtist(roleData?.user_type !== 'user');
    setCurrentPlan(profileData?.plan || 'Free');
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setIsAuthenticated(!!session?.user);
        if (session?.user) {
          loadPlan(session.user.id);
        } else {
          setCurrentPlan(null);
          setIsArtist(false);
        }
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user) loadPlan(session.user.id);
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
            {plans.map((plan) => {
              const isCurrentPlan = isAuthenticated && isArtist && currentPlan === plan.id;
              const isPremiumPlan = plan.id === 'Premium';
              return (
              <div key={plan.id} className="relative mt-4">
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
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : 'border-accent/50 bg-accent/10'
                      : plan.highlighted
                      ? 'border-accent shadow-lg'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="text-center mb-4 mt-2">
                    <p className="text-xl font-semibold text-foreground">{plan.name}</p>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-foreground">{getPrice(plan.monthlyPrice)}</span>
                      <span className="text-sm text-muted-foreground">{isAnnual ? '/year' : '/month'}</span>
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

                  {isCurrentPlan ? (
                    <div className="w-full py-2 text-center text-sm font-medium text-muted-foreground">
                      Your current plan
                    </div>
                  ) : (
                    <Button
                      className={`w-full ${
                        isPremiumPlan
                          ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                          : 'bg-accent text-accent-foreground hover:bg-accent/90'
                      }`}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {(() => {
                        if (!isAuthenticated || !isArtist) {
                          return isPremiumPlan ? 'Go Premium' : 'Get Started';
                        }
                        const rank: Record<string, number> = { Free: 1, Standard: 2, Premium: 3 };
                        const currentRank = rank[currentPlan || 'Free'] ?? 1;
                        const planRank = rank[plan.id] ?? 1;
                        const action = planRank < currentRank ? 'Downgrade' : 'Upgrade';
                        return `${action} to ${plan.name}`;
                      })()}
                    </Button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlansPricing;
