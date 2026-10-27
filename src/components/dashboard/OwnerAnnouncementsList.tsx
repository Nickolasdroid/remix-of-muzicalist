import { ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Ban, CalendarDays, CheckCircle2, ChevronRight, MapPin, Megaphone, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AnnouncementManagementCard from "@/components/dashboard/AnnouncementManagementCard";
import PostActionsMenu, { type PostAction } from "@/components/PostActionsMenu";
import { isAdExpired } from "@/lib/adExpiration";
import { formatMoney } from "@/lib/bookingOffers";
import {
  formatOpportunityBudget,
  formatPlace,
} from "@/lib/opportunities";
import { cn } from "@/lib/utils";

interface OwnerAnnouncementsListProps {
  announcements: any[];
  /** Artists see their sent offers under the "Sent" tab of booking requests */
  isArtist: boolean;
  disabled?: boolean;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
  empty?: ReactNode;
}

interface GigStats {
  offers: number;
  lowest: { price: number; currency: string } | null;
  accepted: { artist: string; price: number; currency: string } | null;
}


type Tab = "active" | "ended";

/**
 * The owner's announcements in the dashboards: what each one asks for, its status,
 * what came in (offers or messages) and where to go next. Active and ended are split.
 */
const OwnerAnnouncementsList = ({ announcements, isArtist, disabled, onClose, onDelete, empty }: OwnerAnnouncementsListProps) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || i18n.resolvedLanguage || "ro";
  const locale = lang.startsWith("ro") ? "ro-RO" : "en-GB";
  const [tab, setTab] = useState<Tab>("active");
  const [gigStats, setGigStats] = useState<Record<string, GigStats>>({});
  const [messages, setMessages] = useState<Record<string, number>>({});

  const items = useMemo(() => announcements.filter((a) => !a.is_premium), [announcements]);
  const active = items.filter((a) => !isAdExpired(a));
  const ended = items.filter((a) => isAdExpired(a));
  const shown = tab === "active" ? active : ended;

  const idsKey = items.map((a) => a.id).join(",");
  useEffect(() => {
    const gigIds = items.filter((a) => a.kind === "gig").map((a) => a.id);
    const collabIds = items.filter((a) => a.kind === "collab").map((a) => a.id);
    let cancelled = false;
    (async () => {
      if (gigIds.length) {
        const { data } = await (supabase as any)
          .from("booking_requests")
          .select("announcement_id, status, offer_price, offer_currency, offer_sent_at, profile_id")
          .in("announcement_id", gigIds);
        const rows = (data || []) as any[];
        const acceptedIds = rows.filter((r) => r.status === "accepted").map((r) => r.profile_id);
        const names: Record<string, string> = {};
        if (acceptedIds.length) {
          const { data: profs } = await supabase.from("profiles").select("id, stage_name").in("id", acceptedIds);
          for (const p of profs || []) names[p.id] = p.stage_name || "";
        }
        const stats: Record<string, GigStats> = {};
        for (const id of gigIds) stats[id] = { offers: 0, lowest: null, accepted: null };
        for (const r of rows) {
          const s = stats[r.announcement_id];
          if (!s || !r.offer_sent_at || r.offer_price == null) continue;
          const price = Number(r.offer_price);
          s.offers += 1;
          if (r.status === "offered" && (!s.lowest || price < s.lowest.price)) {
            s.lowest = { price, currency: r.offer_currency || "RON" };
          }
          if (r.status === "accepted") {
            s.accepted = { artist: names[r.profile_id] || "", price, currency: r.offer_currency || "RON" };
          }
        }
        if (!cancelled) setGigStats(stats);
      }
      if (collabIds.length) {
        const { data } = await (supabase as any)
          .from("conversations")
          .select("announcement_id")
          .in("announcement_id", collabIds);
        const counts: Record<string, number> = {};
        for (const r of (data || []) as any[]) counts[r.announcement_id] = (counts[r.announcement_id] || 0) + 1;
        if (!cancelled) setMessages(counts);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const fmtDay = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    const s = new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const offersPath = isArtist ? "/booking-requests?tab=sent" : "/booking-requests";

  const renderCard = (a: any) => {
    // Announcements from before Opportunities keep their simple card
    if (!a.kind) {
      return (
        <AnnouncementManagementCard
          key={a.id}
          announcement={a}
          disabled={disabled}
          actions={[
            { key: "delete", label: "Delete", icon: Trash2, destructive: true, onSelect: () => onDelete(a.id) },
          ]}
        />
      );
    }

    const isGig = a.kind === "gig";
    const open = !isAdExpired(a);
    const status: "open" | "filled" | "closed" | "expired" =
      a.status === "filled" ? "filled" : a.status === "closed" ? "closed" : open ? "open" : "expired";
    const stats = gigStats[a.id];
    const msgCount = messages[a.id] || 0;
    // Last day it takes answers (expires_at is midnight after the event day)
    const untilText = a.expires_at
      ? new Date(new Date(a.expires_at).getTime() - 60_000).toLocaleDateString(locale, { day: "numeric", month: "short" })
      : null;
    const dateText = a.event_on
      ? a.event_end_on && a.event_end_on > a.event_on
        ? `${fmtDay(a.event_on)} – ${fmtDay(a.event_end_on)}`
        : fmtDay(a.event_on)
      : null;
    const place = formatPlace(a.city, a.county);
    const budget = formatOpportunityBudget(a, lang);

    const actions: PostAction[] = [
      ...(open ? [{ key: "close", label: "Close announcement", icon: Ban, onSelect: () => onClose(a.id) }] : []),
      { key: "delete", label: "Delete", icon: Trash2, destructive: true, onSelect: () => onDelete(a.id) },
    ];

    // What came in and where to go next
    let summary: ReactNode = null;
    let link: { label: string; to: string } | null = null;
    if (isGig) {
      if (stats?.accepted) {
        summary = (
          <>
            <span>You accepted the offer from</span>{" "}
            <b className="text-foreground notranslate" translate="no">{stats.accepted.artist}</b>
            <span className="notranslate" translate="no"> · {formatMoney(stats.accepted.price, stats.accepted.currency, lang)}</span>
          </>
        );
        link = { label: "See the contract", to: offersPath };
      } else if (stats && stats.offers > 0) {
        summary = (
          <>
            <b className="text-foreground tabular-nums">{stats.offers}</b>{" "}
            <span>{stats.offers === 1 ? "offer received" : "offers received"}</span>
            {stats.lowest && (
              <>
                <span> · </span>
                <span>lowest</span>{" "}
                <span className="notranslate" translate="no">{formatMoney(stats.lowest.price, stats.lowest.currency, lang)}</span>
              </>
            )}
          </>
        );
        link = { label: "See the offers", to: offersPath };
      } else {
        summary = <span>No offers yet</span>;
      }
    } else {
      summary =
        msgCount > 0 ? (
          <>
            <b className="text-foreground tabular-nums">{msgCount}</b>{" "}
            <span>{msgCount === 1 ? "message received" : "messages received"}</span>
          </>
        ) : (
          <span>No messages yet</span>
        );
      // Replies to a collaboration live in Messages → Announcements → Requests, filtered to this one
      link = { label: "See replies", to: `/messages?tab=announcements&sub=requests&forAd=${a.id}` };
    }

    return (
      <div
        key={a.id}
        className={cn(
          "rounded-2xl border border-border/70 bg-card p-3.5 space-y-2.5",
          status !== "open" && status !== "filled" && "opacity-70",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {status === "open" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11.5px] font-semibold text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Active
            </span>
          )}
          {status === "open" && untilText && (
            <span className="truncate text-xs text-muted-foreground notranslate" translate="no">
              {lang.startsWith("ro") ? "până pe" : "until"} {untilText}
            </span>
          )}
          {status === "filled" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11.5px] font-semibold text-accent">
              <CheckCircle2 className="h-3 w-3" />
              Artist booked
            </span>
          )}
          {status === "closed" && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11.5px] font-semibold text-muted-foreground">Closed</span>
          )}
          {status === "expired" && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11.5px] font-semibold text-muted-foreground">Expired</span>
          )}
          <div className="ml-auto shrink-0">
            <PostActionsMenu actions={actions} disabled={disabled} />
          </div>
        </div>

        <p className="text-[15px] font-bold leading-snug text-foreground notranslate" translate="no" data-user-content="true">
          {a.title}
        </p>

        {(dateText || place) && (
          <div className="space-y-1 text-[13px] text-foreground/85">
            {dateText && (
              <p className="flex min-w-0 items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="truncate notranslate tabular-nums" translate="no">
                  {dateText}
                  {a.start_time && a.end_time && ` · ${a.start_time} – ${a.end_time}`}
                </span>
              </p>
            )}
            {place && (
              <p className="flex min-w-0 items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="truncate notranslate" translate="no">{place}</span>
              </p>
            )}
          </div>
        )}
        {budget && (
          <p className="text-[14px] font-bold text-accent notranslate tabular-nums" translate="no">{budget}</p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-2.5 text-[12.5px] text-muted-foreground whitespace-nowrap">
          <span className="min-w-0">
            {summary}
          </span>
          {link && (
            <button
              type="button"
              onClick={() => navigate(link!.to)}
              className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-accent hover:underline"
            >
              {link.label}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (items.length === 0) return <>{empty}</>;

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {([
          { k: "active" as Tab, label: lang.startsWith("ro") ? "Active" : "Active", n: active.length },
          { k: "ended" as Tab, label: lang.startsWith("ro") ? "Încheiate" : "Ended", n: ended.length },
        ]).map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k)}
            aria-pressed={tab === t.k}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
              tab === t.k
                ? "border-accent bg-accent/15 font-semibold text-accent"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="notranslate" translate="no">{t.label}</span>
            <span className="tabular-nums"> · {t.n}</span>
          </button>
        ))}
      </div>

      {shown.length > 0 ? (
        <div className="space-y-3">{shown.map(renderCard)}</div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
          <Megaphone className="mx-auto mb-2 h-6 w-6 opacity-60" />
          {tab === "active" ? <span>No active announcements</span> : <span>No ended announcements</span>}
        </div>
      )}
    </div>
  );
};

export default OwnerAnnouncementsList;
