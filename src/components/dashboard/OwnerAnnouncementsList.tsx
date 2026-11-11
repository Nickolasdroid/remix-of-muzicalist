import { ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Ban, CalendarDays, CheckCircle2, ChevronRight, MapPin, Megaphone, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AnnouncementManagementCard from "@/components/dashboard/AnnouncementManagementCard";
import PostActionsMenu, { type PostAction } from "@/components/PostActionsMenu";
import { isAdExpired } from "@/lib/adExpiration";
import { formatMoney } from "@/lib/bookingOffers";
import {
  opportunityDisplayTitle, formatOpportunityBudget,
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
  /** Opens the composer on this event / collaboration; lockCore when answers already came in */
  onEdit?: (row: any, lockCore: boolean) => void;
  /** Called after a collaborator was chosen (the list should reload) */
  onChosen?: () => void;
  empty?: ReactNode;
  /** Wrapper of the cards, to match the posts list width */
  listClassName?: string;
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
const OwnerAnnouncementsList = ({ announcements, isArtist, disabled, onClose, onDelete, onEdit, onChosen, empty, listClassName }: OwnerAnnouncementsListProps) => {
  const { toast } = useToast();
  // Choosing a collaborator: confirm first (it closes the collaboration and tells the others)
  const [chooseTarget, setChooseTarget] = useState<{ convId: string; name: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ convId: string; name: string } | null>(null);
  const [rejectedLocal, setRejectedLocal] = useState<Set<string>>(new Set());
  const confirmReject = async () => {
    if (!rejectTarget) return;
    setChoosing(true);
    const { error } = await (supabase as any).rpc("reject_collab_reply", { _conversation_id: rejectTarget.convId });
    setChoosing(false);
    if (error) {
      toast({ title: "Error", description: "Couldn't reject this artist. Please try again.", variant: "destructive" });
      return;
    }
    setRejectedLocal((prev) => new Set(prev).add(rejectTarget.convId));
    toast({ title: "Rejected", description: "The artist was told you chose someone else." });
    setRejectTarget(null);
  };
  const [choosing, setChoosing] = useState(false);
  const confirmChoose = async () => {
    if (!chooseTarget) return;
    setChoosing(true);
    const { error } = await (supabase as any).rpc("choose_collaborator", { _conversation_id: chooseTarget.convId });
    setChoosing(false);
    if (error) {
      toast({ title: "Error", description: "Couldn't choose this artist. Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Accepted", description: "A booking request was sent to this artist. They reply with an offer; when you accept it, the contract is generated." });
    setChooseTarget(null);
    onChosen?.();
  };
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || i18n.resolvedLanguage || "ro";
  const locale = lang.startsWith("ro") ? "ro-RO" : "en-GB";
  const [tab, setTab] = useState<Tab>("active");
  const [gigStats, setGigStats] = useState<Record<string, GigStats>>({});
  const [messages, setMessages] = useState<Record<string, number>>({});
  // People who replied to each collaboration (newest first), with their conversation
  const [repliers, setRepliers] = useState<Record<string, { convId: string; pid: string; name: string; avatar: string | null; rejected: boolean }[]>>({});

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
          .select("*")
          .in("announcement_id", collabIds)
          .order("updated_at", { ascending: false });
        const rows = (data || []) as any[];
        const counts: Record<string, number> = {};
        for (const r of rows) counts[r.announcement_id] = (counts[r.announcement_id] || 0) + 1;
        // The other person in each conversation (not the collaboration's owner)
        const ownerOf: Record<string, string> = {};
        for (const a of items) ownerOf[a.id] = a.profile_id;
        const otherOf = (r: any) => (r.artist_id === ownerOf[r.announcement_id] ? r.participant_id : r.artist_id);
        const otherIds = Array.from(new Set(rows.map(otherOf).filter(Boolean)));
        const people: Record<string, { name: string; avatar: string | null }> = {};
        if (otherIds.length) {
          const { data: profs } = await supabase.from("profiles").select("id, stage_name, first_name, avatar_url").in("id", otherIds);
          for (const p of (profs || []) as any[]) people[p.id] = { name: p.stage_name || p.first_name || "", avatar: p.avatar_url };
        }
        const byAd: Record<string, { convId: string; pid: string; name: string; avatar: string | null; rejected: boolean }[]> = {};
        for (const r of rows) {
          const who = people[otherOf(r)] || { name: "", avatar: null };
          (byAd[r.announcement_id] ||= []).push({ convId: r.id, pid: otherOf(r), name: who.name, avatar: who.avatar, rejected: !!r.collab_rejected_at });
        }
        if (!cancelled) {
          setMessages(counts);
          setRepliers(byAd);
        }
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

    const answered = isGig ? (stats?.offers || 0) > 0 || !!stats?.accepted : msgCount > 0;
    const actions: PostAction[] = [
      ...(open && onEdit ? [{ key: "edit", label: "Edit", icon: Pencil, onSelect: () => onEdit(a, answered) }] : []),
      ...(open ? [{ key: "close", label: "Close", icon: Ban, onSelect: () => onClose(a.id) }] : []),
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
      // Who replied is shown on the card (see below); with none, just say so
      summary =
        msgCount > 0 ? (
          <>
            <b className="text-foreground tabular-nums">{msgCount}</b>{" "}
            <span>{msgCount === 1 ? "reply" : "replies"}</span>
          </>
        ) : (
          <span>No messages yet</span>
        );
      link = msgCount > 3 ? { label: "See all", to: `/messages?forAd=${a.id}` } : null;
    }
    const allRepliers = !isGig ? repliers[a.id] || [] : [];
    const chosenPerson = a.chosen_profile_id ? allRepliers.find((p) => p.pid === a.chosen_profile_id) : null;
    // Once someone is chosen, only they are listed; otherwise the first 3
    const people = chosenPerson ? [chosenPerson] : a.chosen_profile_id ? [] : allRepliers.slice(0, 3);
    const canChoose = !isGig && open && !a.chosen_profile_id;

    return (
      <div
        key={a.id}
        className={cn(
          "rounded-lg bg-card p-3.5 space-y-2.5",
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
          {opportunityDisplayTitle(a, lang)}
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
          <p className="inline-flex w-fit items-center rounded-full bg-accent/15 px-3 py-1.5 text-[14px] font-bold leading-none text-accent notranslate tabular-nums" translate="no">{budget}</p>
        )}

        {people.length > 0 && (
          <div className="space-y-1 border-t border-border/60 pt-2">
            {chosenPerson && (
              <p className="px-1.5 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-500">Accepted</p>
            )}
            {people.map((p) => (
              <div key={p.convId} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigate(`/messages?c=${p.convId}`)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-foreground/[0.05]"
                >
                  <Avatar className="h-7 w-7">
                    {p.avatar && <AvatarImage src={p.avatar} alt="" />}
                    <AvatarFallback className="bg-accent/10 text-[11px] font-semibold text-accent">{(p.name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground notranslate" translate="no">{p.name || "Artist"}</span>
                  <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
                {canChoose && (p.rejected || rejectedLocal.has(p.convId)) ? (
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Rejected</span>
                ) : canChoose ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setRejectTarget({ convId: p.convId, name: p.name || "Artist" })}
                      className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setChooseTarget({ convId: p.convId, name: p.name || "Artist" })}
                      className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                    >
                      Accept
                    </button>
                  </>
                ) : null}
              </div>
            ))}
          </div>
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
      {/* Secondary switch: plain text, so it doesn't compete with the Posts · Collaborations chips above */}
      <div className="flex gap-4 border-b border-border/60">
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
              "-mb-px border-b-2 pb-2 text-[13px] transition-colors",
              tab === t.k
                ? "border-foreground font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="notranslate" translate="no">{t.label}</span>
            <span className="tabular-nums"> · {t.n}</span>
          </button>
        ))}
      </div>

      {shown.length > 0 ? (
        <div className={listClassName}>
          <div className="w-full max-w-[560px] mx-auto md:mx-0 space-y-2 md:space-y-3">{shown.map(renderCard)}</div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
          <Megaphone className="mx-auto mb-2 h-6 w-6 opacity-60" />
          {isArtist
            ? tab === "active" ? <span>No active collaborations</span> : <span>No ended collaborations</span>
            : tab === "active" ? <span>No active events</span> : <span>No ended events</span>}
        </div>
      )}

      <AlertDialog open={!!chooseTarget} onOpenChange={(o) => !o && !choosing && setChooseTarget(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Accept this artist?</AlertDialogTitle>
            <p className="text-sm font-semibold text-foreground notranslate" translate="no">{chooseTarget?.name}</p>
            <AlertDialogDescription>
              The collaboration closes and leaves the feed. The artist gets a booking request for its date: they send you an offer, you accept it and the contract is generated. The others are told it has been filled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={choosing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmChoose(); }}
              disabled={choosing}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!rejectTarget} onOpenChange={(o) => !o && !choosing && setRejectTarget(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this artist?</AlertDialogTitle>
            <p className="text-sm font-semibold text-foreground notranslate" translate="no">{rejectTarget?.name}</p>
            <AlertDialogDescription>
              The artist is told you chose someone else. The collaboration stays open for the others.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={choosing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmReject(); }}
              disabled={choosing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OwnerAnnouncementsList;
