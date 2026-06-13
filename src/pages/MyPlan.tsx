import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Crown, Check, X, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { subscriptionPlans, formatPlanPrice } from "@/lib/subscriptionPlans";
import { startCheckout, openCustomerPortal } from "@/lib/checkout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MyPlan = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("Free");
  const [isAnnual, setIsAnnual] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [downgradeTarget, setDowngradeTarget] = useState<'Free' | 'Standard' | 'Premium' | null>(null);

  const performPlanAction = async (planId: 'Free' | 'Standard' | 'Premium', isDowngrade: boolean) => {
    if (planId === 'Free' || isDowngrade) {
      setActionLoading(planId);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profileRows } = await (supabase as any).rpc('get_my_full_profile');
        const profile = Array.isArray(profileRows) ? profileRows[0] : profileRows;
        if (!profile?.stripe_customer_id) {
          const { error: updErr } = await supabase
            .from('profiles')
            .update({ plan: planId })
            .eq('id', session.user.id);
          if (updErr) {
            toast({ title: t('common.error'), description: updErr.message, variant: 'destructive' });
            setActionLoading(null);
            return;
          }
          setCurrentPlan(planId);
          toast({ title: t('common.success'), description: t('myPlan.planUpdated', { plan: planId }) });
          setActionLoading(null);
          return;
        }
      }
      const ok = await openCustomerPortal(window.location.href);
      if (!ok) setActionLoading(null);
      return;
    }
    setActionLoading(planId);
    const origin = window.location.origin;
    const ok = await startCheckout({
      plan: planId,
      billing: isAnnual ? 'yearly' : 'monthly',
      successUrl: `${origin}/my-plan?checkout=success`,
      cancelUrl: `${origin}/my-plan?checkout=cancelled`,
    });
    if (!ok) setActionLoading(null);
  };

  const handlePlanAction = (planId: 'Free' | 'Standard' | 'Premium', isDowngrade: boolean) => {
    if (isDowngrade) {
      setDowngradeTarget(planId);
      return;
    }
    performPlanAction(planId, isDowngrade);
  };

  const downgradePlanDef = downgradeTarget ? subscriptionPlans.find(p => p.id === downgradeTarget) : null;
  const currentPlanDef = subscriptionPlans.find(p => p.id === currentPlan);
  const lostFeatures = downgradePlanDef && currentPlanDef
    ? currentPlanDef.features
        .filter(f => f.included)
        .filter(cf => !downgradePlanDef.features.some(df => df.included && df.text === cf.text))
    : [];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      // Check if user is an artist - only artists can access My Plan
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('user_type')
        .eq('user_id', session.user.id)
        .single();
      if (roleData?.user_type === 'user') {
        navigate('/user-dashboard');
        return;
      }
      if ((roleData?.user_type as string) === 'admin') {
        navigate('/admin/dashboard');
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
        <Navigation mobileTitle={t('myPlan.title')} mobileBackPath={-1} />
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
      <Navigation mobileTitle={t('myPlan.title')} mobileBackPath={-1} />
      <div className={`${isMobile ? 'pt-14 pb-20 px-4' : 'md:ml-64 pt-8 px-8'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="space-y-6">
            <div className={isMobile ? 'hidden' : ''}>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">{t('myPlan.title')}</h1>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      aria-label={t('myPlan.howPlanChangesWork')}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 text-sm" align="start">
                    <p className="font-medium mb-2 text-foreground">{t('myPlan.howPlanChangesWork')}</p>
                    <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                      <li><span className="text-foreground">{t('common.upgrades')}</span> {t('myPlan.upgradesImmediate')}</li>
                      <li><span className="text-foreground">{t('common.downgrades')}</span> {t('myPlan.downgradesKeepContent')}</li>
                      <li>{t('myPlan.exceedsLimit')}</li>
                    </ul>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('myPlan.choosePlan')}
              </p>
            </div>


            <div className="flex justify-center items-center gap-2">
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
              {isMobile && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      aria-label="How plan changes work"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 text-sm" align="end">
                    <p className="font-medium mb-2 text-foreground">How plan changes work</p>
                    <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                      <li><span className="text-foreground">Upgrades</span> take effect immediately — your new slot allowance is available right away.</li>
                      <li><span className="text-foreground">Downgrades never delete or hide existing content.</span> All your announcements, posts and promotions stay live.</li>
                      <li>If your current usage exceeds the new plan limits, you simply can't create new items in that category until occupied slots are automatically released (30 days after creation).</li>
                    </ul>
                  </PopoverContent>
                </Popover>
              )}
            </div>



            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
              {subscriptionPlans.map((plan) => {
                const isCurrentPlan = currentPlan === plan.id;
                const isPremiumPlan = plan.id === "Premium";

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
                          <span className="text-3xl font-bold text-foreground">{formatPlanPrice(plan.monthlyPrice, isAnnual)}</span>
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

                      {!isCurrentPlan && (() => {
                        const rank: Record<string, number> = { Free: 1, Standard: 2, Premium: 3 };
                        const currentRank = rank[currentPlan] ?? 1;
                        const planRank = rank[plan.id] ?? 1;
                        const isDowngrade = planRank < currentRank;
                        const action = isDowngrade ? 'Downgrade' : 'Upgrade';
                        return (
                          <Button
                            variant={isDowngrade ? "outline" : "default"}
                            disabled={actionLoading !== null}
                            onClick={() => handlePlanAction(plan.id, isDowngrade)}
                            className={`w-full ${
                              isDowngrade
                                ? "bg-transparent border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                : isPremiumPlan
                                ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                                : "bg-accent text-accent-foreground hover:bg-accent/90"
                            }`}
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            {actionLoading === plan.id ? 'Redirecting…' : `${action} to ${plan.name}`}
                          </Button>
                        );
                      })()}

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

      <AlertDialog open={downgradeTarget !== null} onOpenChange={(open) => !open && setDowngradeTarget(null)}>
        <AlertDialogContent className="rounded-lg max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {downgradeTarget === 'Free'
                ? `Sigur vrei să faci downgrade la planul Free?`
                : `Sigur vrei să faci downgrade la planul ${downgradeTarget}?`}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Vei trece de la planul <span className="font-medium text-foreground">{currentPlan}</span> la{" "}
                  <span className="font-medium text-foreground">{downgradeTarget}</span>. 
                  Vei pierde modificările și funcționalitățile active din planul curent.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (downgradeTarget) {
                  const target = downgradeTarget;
                  setDowngradeTarget(null);
                  performPlanAction(target, true);
                }
              }}
              disabled={actionLoading !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Da, fă downgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyPlan;
