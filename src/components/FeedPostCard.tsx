import { ReactNode } from "react";
import { Heart, MessageCircle, Send, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ExpandableText from "@/components/ExpandableText";
import SmoothVideoPlayer from "@/components/SmoothVideoPlayer";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";
import { formatSmartDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAdminIds } from "@/hooks/useAdminIds";

export interface FeedPostAuthor {
  id?: string;
  stageName: string;
  avatarUrl?: string | null;
  specializationLabel?: string;
  plan?: string | null;
  verified?: boolean;
}

interface FeedPostCardProps {
  author: FeedPostAuthor;
  content: string;
  createdAt: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  likes?: number;
  commentsCount?: number;
  isLiked?: boolean;
  /** Subtle indicator shown when the post currently uses a promotion entitlement */
  promoted?: boolean;
  /** Extra metadata rendered in the meta row (e.g. status badges) */
  metaExtra?: ReactNode;
  /** Three-dot menu element rendered in the top-right corner */
  menu?: ReactNode;
  onAuthorClick?: () => void;
  onMediaClick?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  shares?: number;
}


const actionBtnClass =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-7 [&_svg]:shrink-0 h-10 w-10 rounded-full hover:bg-transparent hover:text-inherit active:bg-transparent text-muted-foreground mx-0 my-0 px-0 py-0";

const FeedPostCard = ({
  author,
  content,
  createdAt,
  mediaUrl,
  mediaType,
  likes = 0,
  commentsCount = 0,
  isLiked = false,
  promoted = false,
  metaExtra,
  menu,
  onAuthorClick,
  onMediaClick,
  onLike,
  onComment,
  onShare,
  shares,
}: FeedPostCardProps) => {
  const { t } = useTranslation();
  const adminIds = useAdminIds();
  const isVerified = author.verified || (!!author.id && adminIds.has(author.id));
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
              <div className="flex items-center gap-2">
                <h3
                  className="font-medium text-foreground cursor-pointer hover:underline notranslate truncate"
                  data-user-content="true"
                  data-no-translate="true"
                  translate="no"
                  onClick={onAuthorClick}
                >
                  {author.stageName}
                </h3>
                {isVerified && <VerifiedBadge size="sm" />}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                {author.specializationLabel && (
                  <>
                    <span>{author.specializationLabel}</span>
                    <span>·</span>
                  </>
                )}
                <span>{formatSmartDate(createdAt)}</span>
                <span>·</span>
                <Globe className="h-3 w-3" />
                {promoted && (
                  <>
                    <span>·</span>
                    <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                      {t("postPromotion.promoted", "Promoted")}
                    </Badge>
                  </>
                )}
                {metaExtra}
              </div>
            </div>
          </div>

          {menu}
        </div>

        {content && <ExpandableText text={content} className="mt-3 my-[5px]" />}
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
              alt="Post content"
              loading="lazy"
              className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity border-primary"
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-2 px-2 py-0 mt-1">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onLike}
            aria-label={isLiked ? "Unlike post" : "Like post"}
            aria-pressed={isLiked}
            className={`${actionBtnClass} ${isLiked ? "text-destructive" : "text-muted-foreground"}`}
          >
            <Heart className={`!h-7 !w-7 ${isLiked ? "fill-current" : ""}`} />
          </Button>
          {likes > 0 && <span className="text-lg font-semibold text-foreground -ml-1">{likes}</span>}
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onComment} aria-label="Comment" className={actionBtnClass}>
              <MessageCircle className="!w-7 !h-7" />
            </Button>
            {commentsCount > 0 && <span className="text-sm font-semibold text-foreground -ml-1">{commentsCount}</span>}
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onShare} aria-label="Share" className={actionBtnClass}>
              <Send className="!w-7 !h-7 rotate-[20deg]" />
            </Button>
            {!!shares && shares > 0 && <span className="text-sm font-semibold text-foreground -ml-1">{shares}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FeedPostCard;
