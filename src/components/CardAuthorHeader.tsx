import { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import CountryFlagIcon from "@/components/CountryFlagIcon";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";
import { cn } from "@/lib/utils";

interface CardAuthorHeaderProps {
  name: string;
  avatarUrl?: string | null;
  plan?: string | null;
  verified?: boolean;
  /** Gold chip: Band, Singer, Organizer… */
  specialization?: string | null;
  /** Translate the chip text (true for fixed labels like "Organizer") */
  specializationTranslatable?: boolean;
  county?: string | null;
  /** Shown as a flag after the county */
  country?: string | null;
  /** "34m ago", "Aug 8" */
  time: string;
  /** Rendered after the time (globe, promotion badge…) */
  extra?: ReactNode;
  /** Rendered next to the name */
  nameExtra?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Who posted, the same in every card (posts, promotions, announcements):
 * avatar 40px, name 15px semibold, then specialization chip · county · time.
 */
const CardAuthorHeader = ({
  name,
  avatarUrl,
  plan,
  verified,
  specialization,
  specializationTranslatable,
  county,
  country,
  time,
  extra,
  nameExtra,
  onClick,
  className,
}: CardAuthorHeaderProps) => (
  <div className={cn("flex min-w-0 items-center gap-3", className)}>
    <div className={cn("shrink-0 rounded-full p-0.5", getAvatarOutlineClasses(plan as any))}>
      <Avatar className={cn("h-10 w-10", onClick && "cursor-pointer")} onClick={onClick}>
        <AvatarImage src={avatarUrl || undefined} alt={name} />
        <AvatarFallback className="bg-muted font-semibold text-muted-foreground">{(name || "A").charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
    </div>
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <h3
          className={cn(
            "truncate text-[15px] font-semibold leading-tight text-foreground notranslate",
            onClick && "cursor-pointer hover:underline",
          )}
          data-user-content="true"
          data-no-translate="true"
          translate="no"
          onClick={onClick}
        >
          {name}
        </h3>
        {verified && <VerifiedBadge size="sm" />}
        {nameExtra}
      </div>
      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
        {specialization && (
          <span
            className={cn(
              "rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold leading-none text-accent",
              !specializationTranslatable && "notranslate",
            )}
            translate={specializationTranslatable ? undefined : "no"}
          >
            {specialization}
          </span>
        )}
        {county && (
          <span className="inline-flex items-center gap-1 notranslate" translate="no">
            {county}
            {country && <CountryFlagIcon country={country} className="h-3 w-4 shrink-0 rounded-[2px]" />}
          </span>
        )}
        {(specialization || county) && <span>·</span>}
        <span className="shrink-0 notranslate" translate="no">{time}</span>
        {extra}
      </div>
    </div>
  </div>
);

export default CardAuthorHeader;
