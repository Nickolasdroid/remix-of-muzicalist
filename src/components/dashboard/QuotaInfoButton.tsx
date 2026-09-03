import * as React from "react";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface QuotaInfoButtonProps {
  /** Which quota the tooltip explains */
  kind: "posts" | "announcements";
}

/**
 * Subtle info icon shown next to the Posts / Announcements quota counters.
 * Explains that a creation slot stays consumed for 30 days, even after the
 * content is deleted. Works with hover/focus on desktop and tap on mobile.
 */
export const QuotaInfoButton = ({ kind }: QuotaInfoButtonProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const message =
    kind === "posts"
      ? t(
          "quotaInfo.posts",
          "Post slots regenerate 30 days after publishing. Deleting a post does not free up the slot immediately.",
        )
      : t(
          "quotaInfo.announcements",
          "Announcement slots regenerate 30 days after publishing. Deleting an announcement does not free up the slot immediately.",
        );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("quotaInfo.label", "Quota information")}
          className="shrink-0 inline-flex items-center justify-center text-muted-foreground/70 hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className="w-[min(18rem,calc(100vw-2rem))] rounded-lg text-xs leading-relaxed text-muted-foreground"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {message}
      </PopoverContent>
    </Popover>
  );
};
