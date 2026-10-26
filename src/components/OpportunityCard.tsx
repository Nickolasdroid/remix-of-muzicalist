import { ReactNode } from "react";
import { CalendarDays, Clock, MapPin, Music2, Users, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ExpandableText from "@/components/ExpandableText";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";
import { cn, formatSmartDate } from "@/lib/utils";
import {
  COLLAB_TYPE_LABEL,
  CollabType,
  MyAvailability,
  OpportunitySeeking,
  formatOpportunityBudget,
  instrumentLabel,
  seekingLabel,
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

const SEEKING_TAG: Record<OpportunitySeeking, string> = {
  DJ: "Looking for a DJ",
  Band: "Looking for a band",
  Singer: "Looking for a singer",
  Instrumentalist: "Looking for an instrumentalist",
  MC: "Looking for an MC",
};

const AVAILABILITY: Record<MyAvailability, { text: string; tone: string }> = {
  available: { text: "You're available on this date", tone: "text-emerald-500" },
  partial: { text: "You have other bookings that day. Check the hours.", tone: "text-amber-400" },
  clash: { text: "You already have a booking at this time", tone: "text-destructive" },
  busy: { text: "You're booked on this date", tone: "text-destructive" },
  blocked: { text: "You marked this date as unavailable", tone: "text-muted-foreground" },
};

const Meta = ({ icon, children, user = true }: { icon: ReactNode; children: ReactNode; user?: boolean }) => (
  <div className="flex items-center gap-2 min-w-0 text-[13.5px] text-foreground/85">
    <span className="text-accent shrink-0">{icon}</span>
    <span className={cn("truncate", user && "notranslate")} translate={user ? "no" : undefined}>
      {children}
    </span>
  </div>
);

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
  const role = [seekingLabel(o.seeking, lang), o.role_detail ? instrumentLabel(o.role_detail, lang) : null].filter(Boolean);

  return (
    <article className="bg-background px-4 sm:px-2 py-3 space-y-3">
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
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap",
            isGig ? "bg-accent/15 text-accent" : "bg-sky-400/15 text-sky-300",
          )}
        >
          {isGig ? SEEKING_TAG[o.seeking] : "Looking for a collaborator"}
        </span>
        {menu}
      </div>

      <h3 className="text-base font-bold leading-snug text-foreground notranslate" translate="no" data-user-content="true">
        {o.title}
      </h3>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {(!isGig || o.role_detail) && (
          <Meta icon={<Music2 className="h-4 w-4" />}>{role.join(" · ")}</Meta>
        )}
        {!isGig && o.collab_type && (
          <Meta icon={<Users className="h-4 w-4" />} user={false}>
            {COLLAB_TYPE_LABEL[o.collab_type]}
          </Meta>
        )}
        {dateText && <Meta icon={<CalendarDays className="h-4 w-4" />}>{dateText}</Meta>}
        {o.start_time && o.end_time && (
          <Meta icon={<Clock className="h-4 w-4" />}>
            {o.start_time} – {o.end_time}
          </Meta>
        )}
        {place && <Meta icon={<MapPin className="h-4 w-4" />}>{place}</Meta>}
        {budget && <Meta icon={<Wallet className="h-4 w-4" />}>{budget}</Meta>}
      </div>

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
