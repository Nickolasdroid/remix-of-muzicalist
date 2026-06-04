import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { CreditCard, Settings, XCircle } from "lucide-react";
import { openCustomerPortal } from "@/lib/checkout";

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

  const endDateLabel = periodEnd
    ? new Date(periodEnd).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="h-4 w-4 text-accent" />
        <h2 className="text-base font-semibold text-foreground">Manage subscription</h2>
      </div>

      <div className="text-sm text-muted-foreground space-y-1 mb-4">
        <p>
          Current plan: <span className="text-foreground font-medium">{plan}</span>
          {status ? <span className="ml-2 text-xs">({status})</span> : null}
        </p>
        {cancelAtPeriodEnd && endDateLabel && (
          <p className="text-amber-500">
            Cancellation scheduled. Access remains until {endDateLabel}.
          </p>
        )}
        {!cancelAtPeriodEnd && endDateLabel && (
          <p>Next billing date: {endDateLabel}</p>
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
