import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { subscriptionPlans } from "@/lib/subscriptionPlans";
import { getMyTrial, markTrialEndSeen, startTrialIfEligible, type PremiumTrial } from "@/lib/premiumTrial";

const premium = subscriptionPlans.find((p) => p.id === "Premium")!;
const free = subscriptionPlans.find((p) => p.id === "Free")!;
/** What Premium has that Free doesn't (the same lines as on the plan cards) */
const premiumExtras = premium.features
  .filter((f) => f.included)
  .filter((f) => !free.features.some((ff) => ff.included && ff.text === f.text))
  .map((f) => f.text);

/** "What it brought you": only the numbers that aren't zero */
const TrialSummary = ({ trial }: { trial: PremiumTrial }) => {
  const stats = [
    { n: trial.views, label: "profile views" },
    { n: trial.bookingRequests, label: "booking requests" },
    { n: trial.newFollowers, label: "new followers" },
  ].filter((s) => s.n > 0);
  if (stats.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg bg-foreground/[0.06] px-3 py-3">
          <p className="text-2xl font-bold tabular-nums text-foreground notranslate" translate="no">{s.n}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * On the artist's dashboard: starts the free Premium month the first time they qualify
 * and welcomes them; once it has ended, shows once what it brought them and what they lose.
 */
const PremiumTrialDialogs = ({ plan, onPlanChange }: { plan: string | null | undefined; onPlanChange: (plan: string) => void }) => {
  const navigate = useNavigate();
  const [welcome, setWelcome] = useState(false);
  const [ended, setEnded] = useState<PremiumTrial | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || plan === undefined) return;
    ran.current = true;
    (async () => {
      if ((plan || "Free") === "Free") {
        const endsAt = await startTrialIfEligible();
        if (endsAt) {
          onPlanChange("Premium");
          setWelcome(true);
          return;
        }
      }
      const trial = await getMyTrial();
      if (trial?.status === "ended" && !trial.endSeen) setEnded(trial);
    })();
  }, [plan, onPlanChange]);

  const closeEnded = () => {
    setEnded(null);
    markTrialEndSeen();
  };

  return (
    <>
      <Dialog open={welcome} onOpenChange={setWelcome}>
        <DialogContent className="max-w-md rounded-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogTitle className="text-2xl font-bold tracking-[-0.02em]">
            You have Premium free for 30 days
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            So you can see what Muzicalist can do for you: everything in Premium, no card and no commitment.
          </DialogDescription>
          <ul className="space-y-2">
            {premiumExtras.slice(0, 5).map((text) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">At the end you go back to Free automatically. Nothing is deleted.</p>
          <Button className="h-12 w-full rounded-full bg-foreground text-[15px] font-bold text-background hover:bg-foreground/90" onClick={() => setWelcome(false)}>
            Great, thanks
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!ended} onOpenChange={(o) => !o && closeEnded()}>
        <DialogContent className="max-w-md rounded-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogTitle className="text-2xl font-bold tracking-[-0.02em]">Your free Premium has ended</DialogTitle>
          {ended && (
            <>
              <DialogDescription className="text-sm text-muted-foreground">
                {ended.views + ended.bookingRequests + ended.newFollowers > 0 ? "What it brought you:" : "You're on Free now. Nothing was deleted."}
              </DialogDescription>
              <TrialSummary trial={ended} />
              <div>
                <p className="text-sm font-bold text-foreground">What you no longer have on Free</p>
                <ul className="mt-2 space-y-1.5">
                  {premiumExtras.map((text) => (
                    <li key={text} className="text-sm text-muted-foreground">{text}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  className="h-12 w-full rounded-full text-[15px] font-bold"
                  onClick={() => {
                    closeEnded();
                    navigate("/my-plan");
                  }}
                >
                  Keep Premium
                </Button>
                <Button variant="ghost" className="h-11 w-full rounded-full font-bold text-muted-foreground hover:text-foreground" onClick={closeEnded}>
                  Stay on Free
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export { TrialSummary };
export default PremiumTrialDialogs;
