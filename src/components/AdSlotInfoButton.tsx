import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface AdSlotInfoButtonProps {
  /** "ad" for standard announcements, "promotion" for premium promotions, "post" for posts */
  kind: "ad" | "promotion" | "post";
}

/**
 * Small info button shown next to ad/promotion/post counters.
 * Explains the 30-day slot cooldown rule when an item is deleted.
 */
export const AdSlotInfoButton = ({ kind }: AdSlotInfoButtonProps) => {
  const label =
    kind === "promotion" ? "promotion" : kind === "post" ? "post" : "announcement";
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
          aria-label={`How ${labelPlural} slots work`}
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
        <p className="font-medium mb-2">How {labelPlural} slots work</p>
        <ul className="space-y-2 text-muted-foreground list-disc pl-4">
          <li>
            Each {label} you create consumes one slot from your monthly plan
            allowance.
          </li>
          <li>
            Once a slot is consumed, it stays occupied for{" "}
            <span className="font-medium text-foreground">30 days</span>, even
            if you delete the {label} earlier.
          </li>
          <li>
            After 30 days from creation, the slot is automatically released and
            you can publish a new {label} in its place.
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  );
};
