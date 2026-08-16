import { ReactNode } from "react";
import { MapPin, Calendar, Euro } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ExpandableText from "@/components/ExpandableText";
import SmoothVideoPlayer from "@/components/SmoothVideoPlayer";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";
import { formatSmartDate } from "@/lib/utils";

export interface FeedAnnouncementAuthor {
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
  /** "Announcement" / "Promotion" badge label */
  typeLabel?: string;
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
  typeLabel = "Announcement",
  mediaUrl,
  mediaType,
  titleExtra,
  metaExtra,
  menu,
  footer,
  onAuthorClick,
  onMediaClick,
}: FeedAnnouncementCardProps) => {
  const hasMeta = !!(location || eventDate || budget);

  return (
    <Card className="text-card-foreground overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary bg-background border-0">
      <div className="p-4 pb-0 border-black border-none shadow-none rounded-none px-[6px] py-[3px]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(author.plan as any)}`}>
              <Avatar className="w-10 h-10 cursor-pointer border-2 border-background" onClick={onAuthorClick}>
                <AvatarImage src={author.avatarUrl || undefined} alt={author.stageName} />
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                  {(author.stageName || "A").charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="font-medium text-foreground cursor-pointer hover:underline notranslate truncate"
                  data-user-content="true"
                  data-no-translate="true"
                  translate="no"
                  onClick={onAuthorClick}
                >
                  {author.stageName}
                </h3>
                {author.verified && <VerifiedBadge size="sm" />}
                {titleExtra}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span>{author.specializationLabel || "User"}</span>
                <span>·</span>
                <span>{formatSmartDate(createdAt)}</span>
                <span>·</span>
                <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">{typeLabel}</Badge>
                {metaExtra}
              </div>
            </div>
          </div>

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
        <div className="mt-3 cursor-pointer bg-muted/30" onClick={onMediaClick}>
          {mediaType === "video" ? (
            <div className="relative w-full aspect-video">
              <SmoothVideoPlayer src={mediaUrl} className="absolute inset-0 w-full h-full" onClick={(e) => e.stopPropagation()} />
            </div>
          ) : (
            <img
              src={mediaUrl}
              alt="Announcement media"
              loading="lazy"
              className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity"
            />
          )}
        </div>
      )}

      {footer && <div className="px-2 py-1">{footer}</div>}
    </Card>
  );
};

export default FeedAnnouncementCard;
