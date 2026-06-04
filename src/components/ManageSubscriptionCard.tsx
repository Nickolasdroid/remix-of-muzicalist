import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import { CreditCard, Settings, XCircle, Calendar, Tag } from "lucide-react";
import { openCustomerPortal } from "@/lib/checkout";
import { subscriptionPlans } from "@/lib/subscriptionPlans";

const ManageSubscriptionCard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string>("Free");
  const [status, setStatus] = useState<string | null>(null);
  const [hasCustomer, setHasCustomer] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"manage" | "cancel" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("profiles")
        .select("plan, subscription_status, stripe_customer_id, subscription_current_period_end")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data) {
        setPlan(data.plan || "Free");
        setStatus(data.subscription_status ?? null);
        setHasCustomer(!!data.stripe_customer_id);
        setPeriodEnd(data.subscription_current_period_end ?? null);
      }
      setLoading(false);
    })();
  }, []);

  const handleManage = async () => {
    setActionLoading("manage");
    const ok = await openCustomerPortal(window.location.href);
    if (!ok) setActionLoading(null);
  };

  const handleCancel = async () => {
    setActionLoading("cancel");
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: {},
      });
      if (error || (data as any)?.error) {
        toast({
          title: "Could not cancel subscription",
          description: (data as any)?.error || error?.message || "Please try again.",
          variant: "destructive",
        });
      } else {
        setCancelAtPeriodEnd(true);
        if ((data as any)?.current_period_end) {
          setPeriodEnd((data as any).current_period_end);
        }
        toast({
          title: "Subscription cancelled",
          description: "Your plan stays active until the end of the current billing period.",
        });
      }
    } finally {
      setActionLoading(null);
      setConfirmOpen(false);
    }
  };

  if (loading) return null;
  if (plan === "Free" || !hasCustomer) return null;

  const planDef = subscriptionPlans.find((p) => p.id === plan);
  const priceLabel = planDef && planDef.monthlyPrice > 0
    ? `$${planDef.monthlyPrice} / month`
    : null;

  const endDateLabel = periodEnd
    ? new Date(periodEnd).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const normalizedStatus = (status || "").toLowerCase();
  const statusMeta: { label: string; tone: "success" | "warning" | "danger" | "neutral" } =
    cancelAtPeriodEnd
      ? { label: "Cancelled", tone: "warning" }
      : normalizedStatus === "active" || normalizedStatus === "trialing"
        ? { label: "Active", tone: "success" }
        : normalizedStatus === "past_due" || normalizedStatus === "unpaid"
          ? { label: "Past due", tone: "danger" }
          : normalizedStatus === "canceled" || normalizedStatus === "cancelled"
            ? { label: "Cancelled", tone: "warning" }
            : { label: status || "Unknown", tone: "neutral" };

  const toneClasses: Record<typeof statusMeta.tone, string> = {
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    danger: "bg-destructive/15 text-destructive border border-destructive/30",
    neutral: "bg-muted text-muted-foreground border border-border",
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-accent" />
          <h2 className="text-base font-semibold text-foreground">Current plan</h2>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${toneClasses[statusMeta.tone]}`}>
          {statusMeta.label}
        </span>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 mb-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xl font-semibold text-foreground">{planDef?.name ?? plan} Plan</p>
            {priceLabel && (
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                {priceLabel}
              </p>
            )}
          </div>
          {endDateLabel && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 justify-end">
                <Calendar className="h-3.5 w-3.5" />
                {cancelAtPeriodEnd ? "Access until" : "Next billing"}
              </p>
              <p className="text-sm font-medium text-foreground mt-0.5">{endDateLabel}</p>
            </div>
          )}
        </div>
        {cancelAtPeriodEnd && endDateLabel && (
          <p className="text-xs text-amber-400 mt-3">
            Cancellation scheduled. Your account moves to Free after {endDateLabel}.
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={handleManage}
          disabled={actionLoading !== null}
          className="rounded-lg"
        >
          <Settings className="h-4 w-4 mr-2" />
          {actionLoading === "manage" ? "Opening…" : "Manage billing"}
        </Button>
        {!cancelAtPeriodEnd && (
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={actionLoading !== null}
            className="rounded-lg"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel subscription
          </Button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your {plan} plan will stay active until the end of the current billing period
              {endDateLabel ? ` (${endDateLabel})` : ""}. After that, your account will be moved
              to the Free plan. You will not be charged again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading === "cancel"}>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={actionLoading === "cancel"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading === "cancel" ? "Cancelling…" : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageSubscriptionCard;
