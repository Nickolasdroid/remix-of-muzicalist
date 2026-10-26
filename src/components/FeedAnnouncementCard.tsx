import { ReactNode } from "react";
import { MapPin, Calendar, Euro } from "lucide-react";
import { Card } from "@/components/ui/card";
import AnnouncementTypeBadge, { type AnnouncementKind } from "@/components/AnnouncementTypeBadge";
import ExpandableText from "@/components/ExpandableText";
import PostMediaFrame from "@/components/PostMediaFrame";
import CardAuthorHeader from "@/components/CardAuthorHeader";
import { formatSmartDate } from "@/lib/utils";
import { useAdminIds } from "@/hooks/useAdminIds";

export interface FeedAnnouncementAuthor {
  id?: string;
  stageName: string;
  avatarUrl?: string | null;
  specializationLabel?: string;
  plan?: string | null;
  verified?: boolean;
}

interface FeedAnnouncementCardProps {
  author: FeedAnnouncementAuthor;
  createdAt: string;
  description: string;
  location?: string | null;
  eventDate?: string | null;
  budget?: string | number | null;
  /** Formats the event date the same way in every context */
  formatEventDate?: (date: string) => string;
  /** "announcement" renders the compact icon, "promotion" the text label */
  kind?: AnnouncementKind;
  /** Discreet indicator shown when an active promotion boost is applied */
  promoted?: boolean;
  mediaUrl?: string | null;
  mediaType?: string | null;
  /** Extra chips rendered next to the author name (e.g. expiration) */
  titleExtra?: ReactNode;
  /** Extra metadata rendered in the meta row */
  metaExtra?: ReactNode;
  /** Three-dot menu element rendered in the top-right corner */
  menu?: ReactNode;
  /** Action row rendered at the bottom (e.g. Apply Now) */
  footer?: ReactNode;
  onAuthorClick?: () => void;
  onMediaClick?: () => void;
}

/**
 * Canonical announcement presentation. Used by the Announcements feed,
 * the artist dashboard and public profiles so an announcement always looks
 * identical regardless of where it is rendered.
 */
const FeedAnnouncementCard = ({
  author,
  createdAt,
  description,
  location,
  eventDate,
  budget,
  formatEventDate,
  kind = "announcement",
  promoted = false,
  mediaUrl,
  mediaType,
  titleExtra,
  metaExtra,
  menu,
  footer,
  onAuthorClick,
  onMediaClick,
}: FeedAnnouncementCardProps) => {
  const adminIds = useAdminIds();
  const isVerified = author.verified || (!!author.id && adminIds.has(author.id));
  const hasMeta = !!(location || eventDate || budget);

  return (
    <Card className="text-card-foreground overflow-hidden my-0 rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="px-3.5 pt-3 pb-1">
        <div className="flex items-start justify-between">
          <CardAuthorHeader
            name={author.stageName}
            avatarUrl={author.avatarUrl}
            plan={author.plan}
            verified={isVerified}
            specialization={author.specializationLabel || "User"}
            time={formatSmartDate(createdAt)}
            onClick={onAuthorClick}
            nameExtra={titleExtra}
            extra={
              <>
                <span>·</span>
                <AnnouncementTypeBadge kind={kind} promoted={promoted} />
                {metaExtra}
              </>
            }
          />

          {menu}
        </div>

        {description && <ExpandableText text={description} className="mt-3 my-[5px]" />}

        {hasMeta && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 mb-1 text-xs text-muted-foreground">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="notranslate" data-user-content="true" data-no-translate="true" translate="no">
                  {location}
                </span>
              </span>
            )}
            {eventDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatEventDate ? formatEventDate(eventDate) : eventDate}
              </span>
            )}
            {budget && (
              <span className="flex items-center gap-1">
                <Euro className="h-3 w-3" />
                <span className="notranslate" data-user-content="true" data-no-translate="true" translate="no">
                  {budget}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {mediaUrl && (
        <PostMediaFrame url={mediaUrl} type={mediaType} alt="Announcement media" onClick={onMediaClick} />
      )}


      {footer && <div className="px-4 sm:px-2 py-1">{footer}</div>}
    </Card>
  );
};

export default FeedAnnouncementCard;
