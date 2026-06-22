import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface AdSlotInfoButtonProps {
  /** "ad" for standard announcements, "promotion" for premium promotions, "post" for posts */
  kind: "ad" | "promotion" | "post";
}

/**
 * Small info button shown next to ad/promotion/post counters.
 * Explains the per-billing-period quota model.
 */
export const AdSlotInfoButton = ({ kind }: AdSlotInfoButtonProps) => {
  const labelPlural =
    kind === "promotion" ? "promotions" : kind === "post" ? "posts" : "announcements";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          aria-label={`How ${labelPlural} work`}
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 text-sm"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-medium mb-2">How {labelPlural} work</p>
        <ul className="space-y-2 text-muted-foreground list-disc pl-4">
          <li>
            Your plan includes a fixed number of {labelPlural} per billing
            period.
          </li>
          <li>
            The counter{" "}
            <span className="font-medium text-foreground">resets automatically</span>{" "}
            at the start of every new billing cycle (monthly or yearly,
            matching your subscription).
          </li>
          <li>
            Upgrading mid-cycle increases your limit immediately; already-used
            count is preserved, no slots are lost.
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  );
};
