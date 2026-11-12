import PlanCard, { BillingToggle, planButtonClass } from "@/components/plans/PlanCard";
import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";

import { Button } from "@/components/ui/button";
import { Check, X, Crown, Info, Star } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { knownUserId } from "@/lib/knownUser";
import { subscriptionPlans as plans, formatPlanPrice } from "@/lib/subscriptionPlans";
import { startCheckout, openCustomerPortal } from "@/lib/checkout";
import { setPlanIntent, clearPlanIntent } from "@/lib/planIntent";

const PlansPricing = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => (knownUserId() ? true : null));
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isArtist, setIsArtist] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleClick = async (planId: 'Free' | 'Standard' | 'Premium', isDowngrade: boolean) => {
    // Not authenticated -> send to register artist
    if (!isAuthenticated) {
      // Remember a paid choice: after sign-up and the artist profile, payment opens directly
      if (planId === 'Free') clearPlanIntent();
      else setPlanIntent(planId, isAnnual ? 'yearly' : 'monthly');
      navigate('/register?type=artist');
      return;
    }
    // Not an artist account -> can't subscribe to artist plans
    if (!isArtist) {
      navigate('/register-artist');
      return;
    }
    // Free plan or downgrade -> manage via billing portal
    if (planId === 'Free' || isDowngrade) {
      setLoadingPlan(planId);
      const ok = await openCustomerPortal(window.location.href);
      if (!ok) setLoadingPlan(null);
      return;
    }
    // Paid plan upgrade
    setLoadingPlan(planId);
    const origin = window.location.origin;
    const ok = await startCheckout({
      plan: planId,
      billing: isAnnual ? 'yearly' : 'monthly',
      successUrl: `${origin}/dashboard?checkout=success`,
      cancelUrl: `${origin}/plans?checkout=cancelled`,
    });
    if (!ok) setLoadingPlan(null);
  };


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
    <div className={`min-h-screen bg-black ${isAuthenticated ? 'md:ml-[316px] lg:ml-[356px] md:py-2 md:pr-2' : 'md:px-2 md:pb-2 md:pt-[72px]'}`}>
      <SEO title="Plans & Pricing — Free, Standard & Premium | Muzicalist" description="Compare Muzicalist subscription plans for artists: Free, Standard and Premium. More visibility, more bookings, more features — choose what fits you." path="/plans" />
      <Navigation />

      <section
        className={`min-h-screen px-4 pb-24 pt-20 md:rounded-lg md:px-8 md:pb-12 md:pt-10 ${isAuthenticated ? 'md:min-h-[calc(100vh-80px)]' : 'md:min-h-[calc(100vh-80px)]'}`}
        style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.16) 0px, #121212 320px)" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-1">
            <h1 className="text-[2rem] font-bold leading-tight tracking-[-0.02em] text-foreground md:text-5xl">Plans & Pricing</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="How plan changes work">
                  <Info className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-lg text-sm space-y-2" align="start">
                <p className="font-medium text-foreground">How plan changes work</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li><span className="text-foreground">Upgrades</span> take effect immediately — your new monthly allowance of posts is available right away.</li>
                  <li><span className="text-foreground">Downgrades never delete or hide existing content.</span> Everything you've already published stays live.</li>
                  <li>Limits reset automatically at the start of every new billing cycle. If your current usage exceeds the new plan limits, new content creation in that category is paused until your next renewal.</li>
                </ul>
              </PopoverContent>
            </Popover>
          </div>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">Choose the plan that best fits your needs</p>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">New artists get Premium free for 30 days, without a card. At the end they go back to Free automatically; nothing is deleted.</p>

          <div className="mt-6">
            <BillingToggle annual={isAnnual} onChange={setIsAnnual} monthlyLabel="Monthly" annualLabel="Annual" saveLabel="Save ~17%" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
            {plans.map((plan) => {
              const isAuthArtist = isAuthenticated && isArtist;
              const isCurrentPlan = isAuthArtist && currentPlan === plan.id;
              const isPremiumPlan = plan.id === 'Premium';
              const rank: Record<string, number> = { Free: 1, Standard: 2, Premium: 3 };
              const isDowngrade = isAuthArtist && (rank[plan.id] ?? 1) < (rank[currentPlan || 'Free'] ?? 1);
              // Visitors: every button leads to sign-up. Artists: switch between plans.
              const label = !isAuthArtist
                ? (plan.id === 'Free' ? 'Start for free' : `Choose ${plan.name}`)
                : `Switch to ${plan.name}`;
              // Signed-in accounts that aren't artists can't take an artist plan
              const showAction = !isCurrentPlan && (!isAuthenticated || isArtist);
              return (
                <PlanCard
                  key={plan.id}
                  name={plan.name}
                  price={getPrice(plan.monthlyPrice)}
                  period={isAnnual ? '/year' : '/month'}
                  description={plan.description}
                  features={plan.features}
                  tagline={plan.tagline}
                  badge={
                    isCurrentPlan
                      ? { text: 'Your current plan', tone: 'current' }
                      : plan.highlighted
                      ? { text: 'Most Popular', tone: 'popular' }
                      : isPremiumPlan
                      ? { text: 'Best for Professionals', tone: 'neutral' }
                      : null
                  }
                  action={
                    !showAction ? null : (
                      <Button
                        disabled={loadingPlan !== null}
                        onClick={() => handleClick(plan.id, isDowngrade)}
                        className={isDowngrade ? planButtonClass.downgrade : planButtonClass.upgrade}
                      >
                        <span key={label}>{loadingPlan === plan.id ? 'Redirecting…' : label}</span>
                      </Button>
                    )
                  }
                />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlansPricing;
