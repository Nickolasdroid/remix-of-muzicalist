import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { subscriptionPlans as plans, formatPlanPrice } from "@/lib/subscriptionPlans";

const MyPlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("Free");
  const [isAnnual, setIsAnnual] = useState(false);

  const getPrice = (monthlyPrice: number) => formatPlanPrice(monthlyPrice, isAnnual);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('user_type')
        .eq('user_id', session.user.id)
        .single();
      if (roleData?.user_type === 'user') {
        navigate('/user-dashboard');
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
            <div className={`text-center ${isMobile ? 'hidden' : ''}`}>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 md:mb-6">
                My Plan
              </h1>
              <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
                Choose the plan that best fits your needs
              </p>
            </div>

            <div className="flex justify-center">
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

            <Separator className="hidden md:block" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => {
                const isCurrentPlan = currentPlan === plan.id;
                const isPremiumPlan = plan.id === 'Premium';
                const rank: Record<string, number> = { Free: 1, Standard: 2, Premium: 3 };
                const currentRank = rank[currentPlan] ?? 1;
                const planRank = rank[plan.id] ?? 1;
                const action = planRank < currentRank ? 'Downgrade' : 'Upgrade';

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
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <span className={`bg-card border text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${isPremiumPlan ? 'border-amber-500 text-amber-500' : 'border-accent text-accent'}`}>
                          ✓ Your current plan
                        </span>
                      </div>
                    )}
                    <Card
                      className={`flex flex-col h-full ${
                        isCurrentPlan
                          ? isPremiumPlan
                            ? 'border-amber-500/50 bg-amber-500/10 shadow-lg'
                            : 'border-accent/50 bg-accent/10 shadow-lg'
                          : plan.highlighted ? 'border-accent shadow-lg' : 'border-border'
                      }`}
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
                        {isCurrentPlan ? (
                          <div className="w-full py-2 text-center text-sm font-medium text-muted-foreground">
                            Your current plan
                          </div>
                        ) : (
                          <Button
                            className={`w-full ${isPremiumPlan ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : ''}`}
                            variant={isPremiumPlan ? 'default' : (plan.highlighted ? 'default' : 'outline')}
                          >
                            {action}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
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
