import { ReactNode } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ExpandableText from "@/components/ExpandableText";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";
import { cn, formatSmartDate } from "@/lib/utils";
import {
  CollabType,
  MyAvailability,
  OpportunitySeeking,
  formatOpportunityBudget,
  formatPlace,
} from "@/lib/opportunities";

export interface OpportunityCardData {
  id: string;
  kind: "gig" | "collab";
  title: string;
  description?: string | null;
  seeking: OpportunitySeeking;
  role_detail?: string | null;
  collab_type?: CollabType | null;
  event_type?: string | null;
  county?: string | null;
  city?: string | null;
  event_on?: string | null;
  /** Last day when the event lasts several days */
  event_end_on?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  budget_mode?: string | null;
  budget_min?: number | string | null;
  budget_max?: number | string | null;
  budget_currency?: string | null;
  status?: string | null;
  expires_at?: string | null;
  created_at: string;
}

interface OpportunityCardProps {
  opportunity: OpportunityCardData;
  author: {
    id?: string;
    name: string;
    avatarUrl?: string | null;
    /** "Organizer" or "DJ · Cluj" */
    subtitle: string;
    /** Translate the subtitle (true for "Organizer") */
    subtitleTranslatable?: boolean;
    plan?: string | null;
    verified?: boolean;
  };
  /** Shown to artists for event announcements */
  availability?: MyAvailability | null;
  /** Number of offers sent so far (event announcements) */
  offersCount?: number | null;
  actions?: ReactNode;
  menu?: ReactNode;
  onAuthorClick?: () => void;
}


const COLLAB_PHRASE: Record<CollabType, [en: string, ro: string]> = {
  one_event: ["one event", "un singur eveniment"],
  replacement: ["stand-in", "înlocuire"],
  permanent: ["joins the band", "permanent în trupă"],
};
const collabPhrase = (c: CollabType, lang: string) => COLLAB_PHRASE[c][lang.startsWith("ro") ? 1 : 0];

const AVAILABILITY: Record<MyAvailability, { text: string; tone: string }> = {
  available: { text: "You're available on this date", tone: "text-emerald-500" },
  partial: { text: "You have other bookings that day. Check the hours.", tone: "text-amber-400" },
  clash: { text: "You already have a booking at this time", tone: "text-destructive" },
  busy: { text: "You're booked on this date", tone: "text-destructive" },
  blocked: { text: "You marked this date as unavailable", tone: "text-muted-foreground" },
};


/** An opportunity in the feed: who, what, when, where, for how much, and how to answer. */
const OpportunityCard = ({
  opportunity: o,
  author,
  availability,
  offersCount,
  actions,
  menu,
  onAuthorClick,
}: OpportunityCardProps) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || i18n.resolvedLanguage || "ro";
  const locale = lang.startsWith("ro") ? "ro-RO" : "en-GB";
  const isGig = o.kind === "gig";

  const fmtDay = (ymd: string, withYear: boolean) => {
    const [y, m, d] = ymd.split("-").map(Number);
    const s = new Date(y, m - 1, d).toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" as const } : {}),
    });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const multiDay = !!o.event_on && !!o.event_end_on && o.event_end_on > o.event_on;
  const dateText = !o.event_on
    ? null
    : multiDay
      ? `${fmtDay(o.event_on, false)} – ${fmtDay(o.event_end_on!, false)}`
      : fmtDay(o.event_on, true);
  const expiresText = o.expires_at
    ? new Date(new Date(o.expires_at).getTime() - 60_000).toLocaleDateString(locale, { day: "numeric", month: "short" })
    : null;
  const budget = formatOpportunityBudget(o, lang);
  const place = formatPlace(o.city, o.county);

  return (
    <article className="rounded-2xl border border-border/70 bg-card px-3.5 py-3 space-y-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-0.5 rounded-full shrink-0 ${getAvatarOutlineClasses(author.plan as any)}`}>
          <Avatar className="w-10 h-10 cursor-pointer border-2 border-background" onClick={onAuthorClick}>
            <AvatarImage src={author.avatarUrl || undefined} alt={author.name} />
            <AvatarFallback className="bg-accent/10 text-accent font-semibold">
              {(author.name || "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={onAuthorClick}
              className="font-semibold text-sm text-foreground truncate hover:underline notranslate"
              translate="no"
              data-user-content="true"
            >
              {author.name}
            </button>
            {author.verified && <VerifiedBadge size="sm" />}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <span
              className={cn("truncate", !author.subtitleTranslatable && "notranslate")}
              translate={author.subtitleTranslatable ? undefined : "no"}
            >
              {author.subtitle}
            </span>
            <span>·</span>
            <span className="shrink-0">{formatSmartDate(o.created_at)}</span>
          </div>
        </div>
        {menu}
      </div>

      <h3 className="text-base font-bold leading-snug text-foreground notranslate" translate="no" data-user-content="true">
        {o.title}
      </h3>

      {(dateText || place) && (
        <div className="space-y-1.5 text-[13.5px] text-foreground/85">
          {dateText && (
            <p className="flex items-center gap-2 min-w-0">
              <CalendarDays className="h-4 w-4 shrink-0 text-accent" />
              <span className="truncate notranslate tabular-nums" translate="no">
                {dateText}
                {o.start_time && o.end_time && ` · ${o.start_time} – ${o.end_time}`}
              </span>
            </p>
          )}
          {place && (
            <p className="flex items-center gap-2 min-w-0">
              <MapPin className="h-4 w-4 shrink-0 text-accent" />
              <span className="truncate notranslate" translate="no">
                {place}
                {!isGig && o.collab_type && (
                  <span className="text-muted-foreground"> · {collabPhrase(o.collab_type, lang)}</span>
                )}
              </span>
            </p>
          )}
        </div>
      )}

      {budget && (
        <p className="text-[15px] font-bold text-accent notranslate tabular-nums" translate="no">
          {budget}
        </p>
      )}

      {o.description && (
        <ExpandableText text={o.description} className="text-[13.5px] text-foreground/80" />
      )}

      {availability && (
        <p className={cn("flex items-center gap-1.5 text-xs font-medium", AVAILABILITY[availability].tone)}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {AVAILABILITY[availability].text}
        </p>
      )}

      {actions}

      {isGig && (offersCount != null || expiresText) && (
        <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
          <span>
            {offersCount ? (
              <>
                <span className="tabular-nums">{offersCount}</span>{" "}
                <span>{offersCount === 1 ? "offer sent" : "offers sent"}</span>
              </>
            ) : (
              <span>No offers yet</span>
            )}
          </span>
          {expiresText && (
            <span>
              <span>Open until</span>{" "}
              <span className="notranslate" translate="no">
                {expiresText}
              </span>
            </span>
          )}
        </div>
      )}
    </article>
  );
};

export default OpportunityCard;
