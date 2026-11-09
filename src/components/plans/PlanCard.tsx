import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Feature = { text: string; included: boolean };

export type PlanCardProps = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: Feature[];
  tagline?: string;
  /** Small label at the top: current plan, most popular, ... */
  badge?: { text: string; tone: "current" | "popular" | "neutral" } | null;
  /** The button (or nothing) at the bottom */
  action?: ReactNode;
};

const BADGE_TONE = {
  current: "bg-foreground text-background",
  popular: "bg-accent text-accent-foreground",
  neutral: "bg-foreground/[0.12] text-foreground",
};

/** One plan, Spotify Premium style: a flat dark card, name and price on the left, features below. */
const PlanCard = ({ name, price, period, description, features, tagline, badge, action }: PlanCardProps) => (
  <div className="flex h-full flex-col rounded-lg bg-foreground/[0.06] p-6">
    <div className="mb-4 h-6">
      {badge && (
        <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold", BADGE_TONE[badge.tone])}>
          {badge.text}
        </span>
      )}
    </div>
    <h2 className="text-2xl font-bold tracking-[-0.01em] text-foreground">{name}</h2>
    <p className="mt-1">
      <span className="text-3xl font-bold tabular-nums text-foreground">{price}</span>
      <span className="text-sm text-muted-foreground">{period}</span>
    </p>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>

    <hr className="my-5 border-foreground/10" />

    <ul className="flex-1 space-y-3">
      {features.map((f, i) => (
        <li key={i} className={cn("flex items-start gap-3 text-sm", f.included ? "text-foreground/90" : "text-muted-foreground/60")}>
          {f.included ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
          ) : (
            <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
          )}
          <span>{f.text}</span>
        </li>
      ))}
    </ul>

    {tagline && <p className="mt-6 text-xs text-muted-foreground">{tagline}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/** Monthly / yearly switch, grey chips like the other filters. */
export const BillingToggle = ({
  annual,
  onChange,
  monthlyLabel,
  annualLabel,
  saveLabel,
}: {
  annual: boolean;
  onChange: (annual: boolean) => void;
  monthlyLabel: string;
  annualLabel: string;
  saveLabel: string;
}) => (
  <div className="flex gap-2" role="tablist" aria-label="Billing">
    {[
      { v: false, label: <span>{monthlyLabel}</span> },
      { v: true, label: <><span>{annualLabel}</span> <span className="text-muted-foreground">{saveLabel}</span></> },
    ].map((o) => (
      <button
        key={String(o.v)}
        type="button"
        role="tab"
        aria-selected={annual === o.v}
        onClick={() => onChange(o.v)}
        className={cn(
          "h-8 rounded-full px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
          annual === o.v ? "bg-foreground/[0.24] font-medium text-foreground" : "bg-foreground/[0.07] text-foreground hover:bg-foreground/[0.12]",
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const planButtonClass = {
  upgrade: "h-11 w-full rounded-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent hover:scale-[1.02] transition-transform",
  downgrade: "h-11 w-full rounded-full border border-foreground/25 bg-transparent text-base font-bold text-foreground hover:border-foreground hover:bg-transparent",
};

export default PlanCard;
