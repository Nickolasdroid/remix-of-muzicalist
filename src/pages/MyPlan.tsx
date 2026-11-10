import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PlanCard, { BillingToggle, planButtonClass } from "@/components/plans/PlanCard";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Crown, Check, X, Info, Star } from "lucide-react";
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
  usePageTitle("My Plan");
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
          const { error: updErr } = await (supabase as any).rpc('self_downgrade_to_free');

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
        <div className={`${isMobile ? 'pt-14 pb-4 px-4' : 'md:ml-[316px] lg:ml-[356px] pt-8 px-8'}`}>
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
      <div className="min-h-screen bg-black md:ml-[316px] lg:ml-[356px] md:py-2 md:pr-2">
        <div
          className="min-h-screen px-4 pb-24 pt-16 md:min-h-[calc(100vh-80px)] md:rounded-lg md:px-8 md:pb-12 md:pt-10"
          style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.16) 0px, #121212 320px)" }}
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-1">
              <h1 className="text-[2rem] font-bold leading-tight tracking-[-0.02em] text-foreground md:text-5xl">{t('myPlan.title')}</h1>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label={t('myPlan.howPlanChangesWork')}
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 text-sm md:w-96" align="start">
                  <p className="font-medium mb-2 text-foreground">{t('myPlan.howPlanChangesWork')}</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                    <li><span className="text-foreground">{t('myPlan.upgradesLabel', 'Upgrades')}</span> {t('myPlan.upgradesImmediate')}</li>
                    <li><span className="text-foreground">{t('myPlan.downgradesLabel', 'Downgrades')}</span> {t('myPlan.downgradesKeepContent')}</li>
                    <li>{t('myPlan.exceedsLimit')}</li>
                  </ul>
                </PopoverContent>
              </Popover>
            </div>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">{t('myPlan.choosePlan')}</p>

            <div className="mt-6">
              <BillingToggle
                annual={isAnnual}
                onChange={setIsAnnual}
                monthlyLabel={t('myPlan.monthly')}
                annualLabel={t('myPlan.annual')}
                saveLabel={t('myPlan.annualSave')}
              />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
              {subscriptionPlans.map((plan) => {
                const isCurrentPlan = currentPlan === plan.id;
                const rank: Record<string, number> = { Free: 1, Standard: 2, Premium: 3 };
                const isDowngrade = (rank[plan.id] ?? 1) < (rank[currentPlan] ?? 1);
                return (
                  <PlanCard
                    key={plan.id}
                    name={plan.name}
                    price={formatPlanPrice(plan.monthlyPrice, isAnnual)}
                    period={isAnnual ? '/year' : '/month'}
                    description={plan.description}
                    features={plan.features}
                    tagline={plan.tagline}
                    badge={
                      isCurrentPlan
                        ? { text: t('myPlan.currentPlan'), tone: "current" }
                        : plan.highlighted
                        ? { text: t('myPlan.mostPopular', 'Most Popular'), tone: "popular" }
                        : plan.id === "Premium"
                        ? { text: t('myPlan.bestForProfessionals', 'Best for Professionals'), tone: "neutral" }
                        : null
                    }
                    action={
                      isCurrentPlan ? null : (
                        <Button
                          disabled={actionLoading !== null}
                          onClick={() => handlePlanAction(plan.id, isDowngrade)}
                          className={isDowngrade ? planButtonClass.downgrade : planButtonClass.upgrade}
                        >
                          {actionLoading === plan.id
                            ? t('myPlan.redirecting')
                            : t(isDowngrade ? 'myPlan.downgradeTo' : 'myPlan.upgradeTo', { plan: plan.name })}
                        </Button>
                      )
                    }
                  />
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
                ? t('myPlan.downgradeConfirmTitle_free')
                : t('myPlan.downgradeConfirmTitle_plan', { plan: downgradeTarget })}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {t('myPlan.downgradeConfirmDescription', { current: currentPlan, target: downgradeTarget })}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>{t('myPlan.cancel')}</AlertDialogCancel>
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
              {t('myPlan.confirmDowngrade')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyPlan;
