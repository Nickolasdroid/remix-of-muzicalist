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

  // Posts, availability posts and collaborations share one allowance, so both counters explain the same rule
  void kind;
  const message =
    "Posts, availability posts and collaborations share one monthly allowance. A slot frees up 30 days after publishing; deleting a post does not free it sooner.";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("quotaInfo.label", "Quota information")}
          className="shrink-0 inline-flex items-center justify-center text-muted-foreground/70 hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full"
          onClick={(e) => e.stopPropagation()}
          onPointerEnter={(e) => { if (e.pointerType === "mouse") setOpen(true); }}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") setOpen(false); }}
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
