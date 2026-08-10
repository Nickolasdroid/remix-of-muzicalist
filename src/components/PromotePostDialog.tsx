import { Megaphone, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PromotePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Whether the targeted post is already promoted (manage mode) */
  isPromoted: boolean;
  /** Expiration of the active promotion, when known */
  promotedUntil?: string | null;
  /** Remaining monthly promotion entitlement */
  remaining: number;
  isSaving?: boolean;
  onConfirm: () => void;
}

/**
 * Confirmation / management modal for the monthly post-promotion entitlement.
 * Never asks for extra media or text — it only applies promotion to an existing post.
 */
const PromotePostDialog = ({
  open,
  onOpenChange,
  isPromoted,
  promotedUntil,
  remaining,
  isSaving = false,
  onConfirm,
}: PromotePostDialogProps) => {
  const { t } = useTranslation();
  const safeRemaining = Math.max(0, remaining);

  const untilLabel = promotedUntil
    ? new Date(promotedUntil).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            {isPromoted
              ? t("postPromotion.managePromotion", "Manage promotion")
              : t("postPromotion.promote", "Promote")}
          </DialogTitle>
          <DialogDescription>
            {isPromoted
              ? t("postPromotion.activeVisibility", "Additional visibility active")
              : t(
                  "postPromotion.description",
                  "Your post will receive additional visibility in the Muzicalist feed.",
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
          {isPromoted ? (
            <div className="space-y-1">
              <p className="font-medium text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                {t("postPromotion.promotedTitle", "Promoted post")}
              </p>
              {untilLabel && (
                <p className="text-muted-foreground">
                  {t("postPromotion.activeUntil", "Active until {{date}}", { date: untilLabel })}
                </p>
              )}
            </div>
          ) : (
            <p className={safeRemaining > 0 ? "text-foreground" : "text-destructive"}>
              {safeRemaining > 0
                ? t("postPromotion.available", {
                    count: safeRemaining,
                    defaultValue_one: "{{count}} promotion available this month",
                    defaultValue_other: "{{count}} promotions available this month",
                    defaultValue: "{{count}} promotions available this month",
                  })
                : t("postPromotion.none", "No promotions available this month.")}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="rounded-lg" onClick={() => onOpenChange(false)}>
            {isPromoted ? t("postPromotion.close", "Close") : t("postPromotion.cancel", "Cancel")}
          </Button>
          {!isPromoted && (
            <Button
              onClick={onConfirm}
              disabled={isSaving || safeRemaining <= 0}
              className="rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {t("postPromotion.confirm", "Promote post")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromotePostDialog;
