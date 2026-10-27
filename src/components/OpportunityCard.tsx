import { ReactNode } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import CardAuthorHeader from "@/components/CardAuthorHeader";
import ExpandableText from "@/components/ExpandableText";
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
    /** Chip text: "Organizer", "DJ" */
    specialization?: string | null;
    county?: string | null;
    country?: string | null;
    /** Legacy: "DJ · Cluj" (split into chip and county) */
    subtitle?: string;
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
      <div className="flex items-start justify-between gap-2">
        <CardAuthorHeader
          name={author.name}
          avatarUrl={author.avatarUrl}
          plan={author.plan}
          verified={author.verified}
          specialization={author.specialization ?? author.subtitle?.split(" · ")[0]}
          specializationTranslatable={author.subtitleTranslatable}
          county={author.county ?? author.subtitle?.split(" · ")[1]}
          country={author.country}
          time={formatSmartDate(o.created_at)}
          onClick={onAuthorClick}
        />
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
                {!isGig && o.collab_type && o.collab_type !== "one_event" && (
                  <span className="text-muted-foreground"> · {collabPhrase(o.collab_type, lang)}</span>
                )}
              </span>
            </p>
          )}
        </div>
      )}

      {budget && (
        <p className="inline-flex w-fit items-center rounded-full bg-accent/15 px-3 py-1.5 text-[14px] font-bold leading-none text-accent notranslate tabular-nums" translate="no">
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
