import { BadgeCheck, Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ReviewCardData {
  id: string;
  reviewer_name: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  reviewer_avatar_url?: string | null;
  is_verified_booking?: boolean | null;
}

/** One review: reviewer, date, verified-booking mark, stars and text. Optional delete. */
const ReviewCard = ({ review, onDelete }: { review: ReviewCardData; onDelete?: () => void }) => {
  const { i18n } = useTranslation();
  const locale = (i18n.language || "ro").startsWith("ro") ? "ro-RO" : "en-GB";
  return (
    <div className="relative flex h-full flex-col gap-3 rounded-lg bg-foreground/[0.05] p-4">
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Delete review"
          aria-label="Delete review"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          {review.reviewer_avatar_url && <AvatarImage src={review.reviewer_avatar_url} alt={review.reviewer_name} />}
          <AvatarFallback className="bg-foreground/10 text-sm text-foreground">{(review.reviewer_name || "?").charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-foreground notranslate" data-user-content="true" translate="no">{review.reviewer_name}</span>
          <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}</span>
          {review.is_verified_booking && (
            <span className="mt-1 flex w-fit items-center gap-1 text-xs font-medium text-emerald-500">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified booking
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-0.5" aria-label={`${review.rating} / 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`h-4 w-4 ${star <= review.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`} />
        ))}
      </div>
      {review.comment && (
        <p className="flex-1 text-sm text-muted-foreground notranslate" data-user-content="true" translate="no">{review.comment}</p>
      )}
    </div>
  );
};

export default ReviewCard;
