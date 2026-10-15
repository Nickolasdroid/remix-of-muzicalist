import { Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type AnnouncementKind = "announcement" | "promotion";

const badgeClass = "bg-accent/10 text-accent border-accent/30 text-xs";

interface AnnouncementTypeBadgeProps {
  /** "announcement" renders the compact icon, "promotion" the text label. */
  kind?: AnnouncementKind;
  /** An active promotion boost is always spelled out. */
  promoted?: boolean;
}

/**
 * Type marker shown in an announcement card's meta row, right after the
 * timestamp. A plain announcement uses a compact gold megaphone so it costs
 * almost no horizontal space on mobile; a promotion keeps its word, because
 * there the label itself is the information. The megaphone is labelled for
 * screen readers and tooltips, and the literal "Promotion" is picked up by the
 * auto-translator (roText.ts) like the rest of the platform's wording.
 */
const AnnouncementTypeBadge = ({
  kind = "announcement",
  promoted = false,
}: AnnouncementTypeBadgeProps) => {
  const { t } = useTranslation();

  if (promoted) {
    return (
      <Badge className={badgeClass}>
        {t("postPromotion.promotedAnnouncement", "Promoted")}
      </Badge>
    );
  }
  if (kind === "promotion") {
    return <Badge className={badgeClass}>Promotion</Badge>;
  }

  const label = t("announcementsPage.announcementLabel", "Announcement");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={label}
          className="inline-flex h-4 w-4 items-center justify-center text-accent"
        >
          <Megaphone className="h-4 w-4" aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
};

export default AnnouncementTypeBadge;
