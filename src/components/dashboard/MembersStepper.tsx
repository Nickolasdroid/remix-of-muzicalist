import { useEffect } from "react";
import { Minus, Plus } from "lucide-react";

const MIN = 2;
const MAX = 20;

/** How many people are in the band: − number +, big enough to tap on a phone. */
const MembersStepper = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const parsed = parseInt(value, 10);
  const n = Number.isNaN(parsed) ? 4 : Math.min(MAX, Math.max(MIN, parsed));

  // Empty or out of range: start from a valid number, so what is shown is what gets saved
  useEffect(() => {
    if (String(n) !== value) onChange(String(n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const btn =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground/[0.07] text-foreground transition-colors hover:bg-foreground/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-30 disabled:hover:bg-foreground/[0.07]";

  return (
    <div>
      <div className="flex items-center gap-4" role="group" aria-label="Members">
        <button type="button" className={btn} onClick={() => onChange(String(n - 1))} disabled={n <= MIN} aria-label="Fewer members">
          <Minus className="h-5 w-5" />
        </button>
        <span className="min-w-[2ch] text-center text-3xl font-bold tabular-nums text-foreground notranslate" translate="no" aria-live="polite">
          {n}
        </span>
        <button type="button" className={btn} onClick={() => onChange(String(n + 1))} disabled={n >= MAX} aria-label="More members">
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">How many people go on stage, you included.</p>
    </div>
  );
};

export default MembersStepper;
