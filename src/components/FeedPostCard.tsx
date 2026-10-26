import { ReactNode } from "react";
import { Globe } from "lucide-react";
import PostActions from "@/components/PostActions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ExpandableText, { TextMention } from "@/components/ExpandableText";
import PostMediaFrame from "@/components/PostMediaFrame";
import CardAuthorHeader from "@/components/CardAuthorHeader";
import { formatSmartDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAdminIds } from "@/hooks/useAdminIds";

export interface FeedPostAuthor {
  id?: string;
  stageName: string;
  avatarUrl?: string | null;
  specializationLabel?: string;
  county?: string | null;
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
  /** Real profile mentions attached to this content (from `post_mentions`) */
  mentions?: TextMention[];
  /** Three-dot menu element rendered in the top-right corner */
  menu?: ReactNode;
  onAuthorClick?: () => void;
  onMediaClick?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  shares?: number;
  /** Enables the clickable "Liked by" list */
  postId?: string;
  /** Opens the dedicated post page when the post body is clicked */
  onOpen?: () => void;
}



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
  mentions,
  menu,
  onAuthorClick,
  onMediaClick,
  onLike,
  onComment,
  onShare,
  shares,
  postId,
  onOpen,
}: FeedPostCardProps) => {
  const { t } = useTranslation();
  const adminIds = useAdminIds();
  const isVerified = author.verified || (!!author.id && adminIds.has(author.id));
  return (
    <Card className="text-card-foreground overflow-hidden my-0 rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="px-3.5 pt-3 pb-0">
        <div className="flex items-start justify-between">
          <CardAuthorHeader
            name={author.stageName}
            avatarUrl={author.avatarUrl}
            plan={author.plan}
            verified={isVerified}
            specialization={author.specializationLabel}
            county={author.county}
            time={formatSmartDate(createdAt)}
            onClick={onAuthorClick}
            extra={
              <>
                <span>·</span>
                <Globe className="h-3 w-3" />
                {promoted && (
                  <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                    {t("postPromotion.promoted", "Promoted")}
                  </Badge>
                )}
                {metaExtra}
              </>
            }
          />

          {menu}
        </div>

        {content && (
          // Posts are capped at 200 characters at creation time, so the full
          // text always renders — no truncation and no "more" control.
          <div
            onClick={onOpen ? (e) => { if (!(e.target as HTMLElement).closest("a,button")) onOpen(); } : undefined}
            className={onOpen ? "cursor-pointer" : undefined}
          >
            <div
            onClick={onOpen ? (e) => { if (!(e.target as HTMLElement).closest("a,button")) onOpen(); } : undefined}
            className={onOpen ? "cursor-pointer" : undefined}
          >
            <ExpandableText text={content} maxLength={200} className="mt-2 text-[15px] leading-normal" mentions={mentions} />
          </div>
          </div>
        )}
      </div>

      {mediaUrl && (
        <PostMediaFrame url={mediaUrl} type={mediaType} alt="Post content" onClick={onMediaClick} />
      )}


      <PostActions isLiked={isLiked} onLike={onLike} onComment={onComment} onShare={onShare} likes={likes} likeTargetId={postId} commentsCount={commentsCount} shares={shares} />
    </Card>
  );
};

export default FeedPostCard;
