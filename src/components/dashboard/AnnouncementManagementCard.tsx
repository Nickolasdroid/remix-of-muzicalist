import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import PostActionsMenu, { type PostAction } from "@/components/PostActionsMenu";
import { isAdExpired, getDaysRemaining } from "@/lib/adExpiration";
import { formatSmartDate, cn } from "@/lib/utils";

export interface ManagedAnnouncement {
  id: string;
  description: string;
  created_at: string;
  date: string;
  is_premium: boolean;
}

interface AnnouncementManagementCardProps {
  announcement: ManagedAnnouncement;
  actions: PostAction[];
  disabled?: boolean;
  className?: string;
}

/**
 * Canonical compact management card for an announcement owned by the current
 * account. Used by both the Artist Dashboard and the User Dashboard.
 * Intentionally different from the public feed announcement presentation:
 * no author identity, no badges, no social engagement — only content,
 * timing and management actions.
 */
const AnnouncementManagementCard = ({
  announcement,
  actions,
  disabled,
  className,
}: AnnouncementManagementCardProps) => {
  const { t } = useTranslation();
  const expired = isAdExpired(announcement);
  const daysLeft = getDaysRemaining(announcement);

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 p-3 rounded-lg bg-background/30 border border-border/50",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p
          className="text-sm text-foreground line-clamp-2 notranslate"
          data-user-content="true"
          data-no-translate="true"
          translate="no"
        >
          {announcement.description}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatSmartDate(announcement.created_at)}</span>
          <span>·</span>
          {expired ? (
            <span className="text-destructive">{t("common.expired", "Expired")}</span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("common.daysLeft", { count: daysLeft, defaultValue: "{{count}}d left" })}
            </span>
          )}
        </div>
      </div>
      {actions.length > 0 && <PostActionsMenu actions={actions} disabled={disabled} />}
    </div>
  );
};

export default AnnouncementManagementCard;
