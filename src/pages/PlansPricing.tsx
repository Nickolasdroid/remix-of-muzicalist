import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "/month",
    description: "Get started with basic features",
    features: ["Basic profile", "Limited visibility", "Community access"],
    cta: "Current Plan",
    highlighted: false,
  },
  {
    name: "Standard",
    price: "€29",
    period: "/month",
    description: "Grow your presence and reach",
    features: ["Enhanced profile", "Priority listing", "Analytics dashboard", "Booking requests"],
    cta: "Upgrade",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "€59",
    period: "/month",
    description: "Maximum exposure and tools",
    features: ["Premium profile badge", "Top search ranking", "Advanced analytics", "Unlimited bookings", "Priority support"],
    cta: "Upgrade",
    highlighted: false,
  },
];

const PlansPricing = () => {
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
    <div className={`min-h-screen ${isAuthenticated ? 'md:ml-64' : ''}`}>
      <Navigation />

      <section className="pt-24 md:pt-32 pb-10 md:pb-20 px-4 md:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-6">
              Plans & Pricing
            </h1>
            <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that best fits your needs
            </p>
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
                    <span className="text-3xl md:text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-accent shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
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

      <Footer />
    </div>
  );
};

export default PlansPricing;
