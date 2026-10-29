import { forwardRef, type ButtonHTMLAttributes } from "react";
import { SlidersHorizontal } from "lucide-react";

/**
 * Filter icon for the mobile top bar, styled like the notifications bell next to it.
 * Shows how many filters are active so the user can tell the list is narrowed down.
 */
const HeaderFilterTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { activeCount?: number }
>(({ activeCount = 0, className = "", ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label="Filter"
    className={`relative p-2 text-foreground/80 transition-colors hover:text-accent ${activeCount > 0 ? "text-accent" : ""} ${className}`}
    {...props}
  >
    <SlidersHorizontal className="h-6 w-6" aria-hidden="true" />
    {activeCount > 0 && (
      <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
        {activeCount}
      </span>
    )}
  </button>
));
HeaderFilterTrigger.displayName = "HeaderFilterTrigger";

export default HeaderFilterTrigger;
