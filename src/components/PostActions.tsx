import { Heart, MessageCircle, Send } from "lucide-react";
import { LikeCountButton } from "@/components/LikesDialog";
import { cn } from "@/lib/utils";

interface PostActionsProps {
  isLiked?: boolean;
  likes?: number;
  /** Enables the clickable "Liked by" list */
  likeTargetId?: string;
  likeTargetType?: "post" | "announcement";
  commentsCount?: number;
  shares?: number;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  className?: string;
}

/** 40px tap area around a 22px icon */
const iconBtn =
  "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const count = "text-[13.5px] font-medium tabular-nums";

/**
 * Like · comment · share row shared by every post and promotion card.
 * Icons 22px, 6px between an icon and its count, 18px between groups.
 */
const PostActions = ({
  isLiked = false,
  likes = 0,
  likeTargetId,
  likeTargetType = "post",
  commentsCount = 0,
  shares,
  onLike,
  onComment,
  onShare,
  className,
}: PostActionsProps) => (
  <div className={cn("flex items-center gap-2 px-1.5 pb-1", className)}>
    <div className="flex items-center">
      <button
        type="button"
        onClick={onLike}
        aria-label={isLiked ? "Unlike" : "Like"}
        aria-pressed={isLiked}
        className={cn(iconBtn, "-mr-2", isLiked ? "text-destructive" : "text-foreground/80 hover:text-foreground")}
      >
        <Heart className={cn("h-[22px] w-[22px]", isLiked && "fill-current")} strokeWidth={1.75} />
      </button>
      {likes > 0 &&
        (likeTargetId ? (
          <LikeCountButton
            count={likes}
            targetId={likeTargetId}
            targetType={likeTargetType}
            className={cn("!ml-0 !text-[13.5px] !font-medium tabular-nums", isLiked ? "!text-destructive" : "!text-foreground/80")}
          />
        ) : (
          <span className={cn(count, "pl-1", isLiked ? "text-destructive" : "text-foreground/80")}>{likes}</span>
        ))}
    </div>

    <div className="flex items-center">
      <button
        type="button"
        onClick={onComment}
        aria-label="Comment"
        className={cn(iconBtn, "-mr-2 text-foreground/80 hover:text-foreground")}
      >
        <MessageCircle className="h-[22px] w-[22px]" strokeWidth={1.75} />
      </button>
      {commentsCount > 0 && <span className={cn(count, "pl-1 text-foreground/80")}>{commentsCount}</span>}
    </div>

    <div className="flex items-center">
      <button
        type="button"
        onClick={onShare}
        aria-label="Share"
        className={cn(iconBtn, "-mr-2 text-foreground/80 hover:text-foreground")}
      >
        <Send className="h-[22px] w-[22px] rotate-[20deg]" strokeWidth={1.75} />
      </button>
      {!!shares && shares > 0 && <span className={cn(count, "pl-1 text-foreground/80")}>{shares}</span>}
    </div>
  </div>
);

export default PostActions;
