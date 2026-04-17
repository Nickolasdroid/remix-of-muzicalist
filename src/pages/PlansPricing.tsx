import Navigation from "@/components/Navigation";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscriptionPlans as plans, formatPlanPrice } from "@/lib/subscriptionPlans";

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
              <div key={plan.name} className="relative mt-4">
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
                  className={`flex flex-col h-full ${plan.highlighted ? 'border-accent shadow-lg' : 'border-border'}`}
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
