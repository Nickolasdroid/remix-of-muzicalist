import { ReactNode, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Ban, CheckCircle2, Flag, Inbox, MessageCircle, MoreHorizontal, Pencil, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminDeleteContentDialog from "@/components/AdminDeleteContentDialog";
import BookingOfferDialog from "@/components/BookingOfferDialog";
import FeedAnnouncementCard from "@/components/FeedAnnouncementCard";
import OpportunityCard from "@/components/OpportunityCard";
import ReportContentDialog from "@/components/ReportContentDialog";
import { toast } from "@/hooks/use-toast";
import { useAdminIds } from "@/hooks/useAdminIds";
import { useUserRole } from "@/hooks/useUserRole";
import { formatMoney } from "@/lib/bookingOffers";
import { isDayFullyBooked, parseSlotsFromNotes } from "@/lib/calendarSlots";
import { isOpportunity, myAvailabilityFor, type MyAvailability } from "@/lib/opportunities";
import { translateSpecialization } from "@/lib/specializationLabel";
import { formatDateNoYear } from "@/lib/utils";

/** Author fields used by the cards (the feed joins them as `profiles`) */
export interface AnnouncementAuthorProfile {
  id?: string;
  stage_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  specialization?: string | null;
  county?: string | null;
  plan?: string | null;
}

interface Viewer {
  id: string | null;
  isArtist: boolean;
  specialization: string | null;
  calendar: Map<string, { status: string; notes: string | null }>;
}

// One lookup per session: who is viewing, and (for artists) their own calendar
let viewerPromise: Promise<Viewer> | null = null;
const loadViewer = (): Promise<Viewer> => {
  if (!viewerPromise) {
    viewerPromise = (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return { id: null, isArtist: false, specialization: null, calendar: new Map() };
      const { data: prof } = await supabase.from("profiles").select("specialization").eq("id", session.user.id).maybeSingle();
      const specialization = prof?.specialization || null;
      let calendar = new Map<string, { status: string; notes: string | null }>();
      if (specialization) {
        const { data: cal } = await (supabase as any).rpc("get_my_calendar_events");
        calendar = new Map((cal || []).map((e: any) => [e.event_date, { status: e.status, notes: e.notes }]));
      }
      return { id: session.user.id, isArtist: !!specialization, specialization, calendar };
    })();
    supabase.auth.onAuthStateChange(() => {
      viewerPromise = null;
    });
  }
  return viewerPromise;
};

export const useAnnouncementViewer = () => {
  const [viewer, setViewer] = useState<Viewer>({ id: null, isArtist: false, specialization: null, calendar: new Map() });
  useEffect(() => {
    let alive = true;
    loadViewer().then((v) => alive && setViewer(v));
    return () => {
      alive = false;
    };
  }, []);
  return viewer;
};

interface AnnouncementListProps {
  announcements: any[];
  /** Author for rows without a joined `profiles` (profile pages) */
  profile?: AnnouncementAuthorProfile | null;
  /** Called after the owner deleted or closed an announcement */
  onDeleted?: (id: string) => void;
  onUpdated?: (id: string, patch: Record<string, unknown>) => void;
  /** Extra menu entries (e.g. Promote on the Opportunities page) */
  extraMenuItems?: (a: any, isOwner: boolean) => ReactNode;
  /** Old free-text announcements: show "Apply now" */
  legacyApply?: boolean;
  onMediaClick?: (media: { url: string; type: "image" | "video" }) => void;
  empty?: ReactNode;
  className?: string;
}

/**
 * Every announcement in the product renders through this list (Opportunities, artist and
 * organizer profiles, the official account), so a change to announcements shows everywhere.
 */
const AnnouncementList = ({
  announcements,
  profile,
  onDeleted,
  onUpdated,
  extraMenuItems,
  legacyApply = false,
  onMediaClick,
  empty,
  className,
}: AnnouncementListProps) => {
  const navigate = useNavigate();
  const viewer = useAnnouncementViewer();
  const adminIds = useAdminIds();
  const { isAdmin } = useUserRole();
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>({});
  const [myOffers, setMyOffers] = useState<Record<string, any>>({});
  const [offerTarget, setOfferTarget] = useState<any | null>(null);
  const [closeTargetId, setCloseTargetId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [adminDeleteId, setAdminDeleteId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  // Offer counts for event announcements, and the viewer's own offers
  const loadOfferData = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0 || !viewer.id) return;
      const [countsRes, mineRes] = await Promise.all([
        (supabase as any).rpc("get_announcement_offer_counts", { _ids: ids }),
        (supabase as any)
          .from("booking_requests")
          .select("id, status, announcement_id, offer_price, offer_currency, offer_note, declined_by")
          .eq("profile_id", viewer.id)
          .in("announcement_id", ids),
      ]);
      if (countsRes.data) {
        setOfferCounts((prev) => {
          const next = { ...prev };
          ids.forEach((id) => {
            next[id] = 0;
          });
          (countsRes.data as any[]).forEach((r) => {
            next[r.announcement_id] = r.offers;
          });
          return next;
        });
      }
      if (mineRes.data) {
        setMyOffers((prev) => {
          const next = { ...prev };
          (mineRes.data as any[]).forEach((r) => {
            next[r.announcement_id] = r;
          });
          return next;
        });
      }
    },
    [viewer.id],
  );

  const gigKey = announcements
    .filter((a) => a.kind === "gig")
    .map((a) => a.id)
    .join(",");
  useEffect(() => {
    if (gigKey) void loadOfferData(gigKey.split(","));
  }, [gigKey, loadOfferData]);

  const availabilityFor = (a: any): MyAvailability | null => {
    if (!viewer.isArtist || a.kind !== "gig" || !a.event_on) return null;
    const check = (ymd: string, start?: string | null, end?: string | null) => {
      const day = viewer.calendar.get(ymd);
      const slots = parseSlotsFromNotes(day?.notes);
      return myAvailabilityFor(day, slots, isDayFullyBooked(slots), start, end);
    };
    if (!a.event_end_on || a.event_end_on <= a.event_on) return check(a.event_on, a.start_time, a.end_time);
    // Several days: first day from the start time, middle days whole, last day until the end time
    const rank: MyAvailability[] = ["available", "partial", "clash", "busy", "blocked"];
    let worst: MyAvailability = "available";
    const [y, m, d] = a.event_on.split("-").map(Number);
    const cursor = new Date(y, m - 1, d);
    for (let i = 0; i < 32; i++) {
      const ymd = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      if (ymd > a.event_end_on) break;
      const start = a.start_time ? (i === 0 ? a.start_time : "00:00") : null;
      const end = a.end_time ? (ymd === a.event_end_on ? a.end_time : "23:59") : null;
      const r = check(ymd, start, end);
      if (rank.indexOf(r) > rank.indexOf(worst)) worst = r;
      cursor.setDate(cursor.getDate() + 1);
    }
    return worst;
  };

  const authorFor = (a: any) => {
    const p: AnnouncementAuthorProfile = a.profiles || profile || {};
    const isAdminAuthor = adminIds.has(a.profile_id);
    if (p.specialization || isAdminAuthor) {
      const spec = isAdminAuthor ? "Admin" : translateSpecialization(p.specialization);
      return {
        id: a.profile_id,
        name: p.stage_name || "Artist",
        avatarUrl: p.avatar_url,
        specialization: spec,
        county: p.county,
        plan: p.plan,
        verified: isAdminAuthor,
      };
    }
    // Organizer: first name and last initial
    const first = (p.first_name || "").trim();
    const lastInitial = (p.last_name || "").trim().charAt(0);
    return {
      id: a.profile_id,
      name: first ? `${first}${lastInitial ? ` ${lastInitial}.` : ""}` : p.stage_name || "Organizer",
      avatarUrl: p.avatar_url,
      specialization: "Organizer",
      subtitleTranslatable: true,
      plan: p.plan,
    };
  };

  const closeAnnouncement = async (id: string) => {
    setCloseTargetId(null);
    const { error } = await (supabase as any).from("announcements").update({ status: "closed" }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to close the announcement.", variant: "destructive" });
      return;
    }
    onUpdated?.(id, { status: "closed" });
    toast({ title: "Announcement closed", description: "It no longer appears in Announcements." });
  };

  const deleteAnnouncement = async (id: string) => {
    setDeleteTargetId(null);
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete announcement.", variant: "destructive" });
      return;
    }
    onDeleted?.(id);
    toast({ title: "Announcement deleted", description: "Your announcement has been deleted." });
  };

  const menuFor = (a: any) => {
    const isOwner = viewer.id === a.profile_id;
    const extra = extraMenuItems?.(a, isOwner);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0" aria-label="More">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isOwner && (
            <DropdownMenuItem onClick={() => (viewer.id ? setReportId(a.id) : navigate("/login"))}>
              <Flag className="h-4 w-4 mr-2" />
              Report
            </DropdownMenuItem>
          )}
          {extra}
          {isOwner && isOpportunity(a) && a.status === "open" && (
            <DropdownMenuItem onClick={() => setCloseTargetId(a.id)}>
              <Ban className="h-4 w-4 mr-2" />
              Close announcement
            </DropdownMenuItem>
          )}
          {isOwner && (
            <DropdownMenuItem onClick={() => setDeleteTargetId(a.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
          {isAdmin && !isOwner && (
            <DropdownMenuItem onClick={() => setAdminDeleteId(a.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete (admin)
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderOpportunity = (a: any) => {
    const author = authorFor(a);
    const isOwner = viewer.id === a.profile_id;
    const isGig = a.kind === "gig";
    const availability = availabilityFor(a);
    const mine = myOffers[a.id];
    const goMessage = () => navigate(`/messages?artistId=${a.profile_id}&adId=${a.id}`);
    const unavailable = availability === "busy" || availability === "blocked" || availability === "clash";

    let actions: ReactNode = null;
    if (!viewer.id) {
      actions = (
        <Button variant="outline" className="w-full rounded-lg" onClick={() => navigate("/login")}>
          Sign in to answer
        </Button>
      );
    } else if (isOwner) {
      actions = isGig ? (
        <Button
          variant="outline"
          className="w-full rounded-lg"
          onClick={() => navigate(viewer.isArtist ? "/booking-requests?tab=sent" : "/booking-requests")}
        >
          <Inbox className="h-4 w-4 mr-2" />
          See the offers
        </Button>
      ) : null;
    } else if (viewer.isArtist && isGig) {
      if (mine && (mine.status === "accepted" || mine.status === "rejected")) {
        actions = (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
              mine.status === "accepted" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
            }`}
          >
            {mine.status === "accepted" ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            <span>
              {mine.status === "accepted"
                ? "Your offer was accepted"
                : mine.declined_by === "artist"
                  ? "You withdrew your offer"
                  : "The organizer chose another offer"}
            </span>
          </div>
        );
      } else {
        const sent = mine?.status === "offered";
        actions = (
          <div className="space-y-2">
            {sent && (
              <p className="flex items-center gap-1.5 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>Offer sent:</span>
                <span className="font-semibold notranslate" translate="no">
                  {formatMoney(mine.offer_price, mine.offer_currency)}
                </span>
              </p>
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                disabled={!sent && unavailable}
                onClick={() =>
                  setOfferTarget({
                    announcementId: a.id,
                    booking: {
                      id: mine?.id || "",
                      profile_id: viewer.id,
                      requester_name: author.name,
                      event_date: a.event_on,
                      event_end_date: a.event_end_on || a.event_on,
                      event_type: a.event_type,
                      status: mine?.status || "pending",
                      offer_price: mine?.offer_price ?? null,
                      offer_currency: mine?.offer_currency ?? null,
                      offer_note: mine?.offer_note ?? null,
                    },
                  })
                }
              >
                {sent ? <Pencil className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {sent ? "Edit offer" : unavailable ? "Not available" : "Send offer"}
              </Button>
              <Button variant="outline" className="rounded-lg px-4" onClick={goMessage}>
                Message
              </Button>
            </div>
          </div>
        );
      }
    } else if (viewer.isArtist && !isGig) {
      actions = (
        <Button variant="outline" className="w-full rounded-lg" onClick={goMessage}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Send a message
        </Button>
      );
    }

    return (
      <OpportunityCard
        key={a.id}
        opportunity={a}
        author={author}
        availability={!isOwner ? availability : null}
        offersCount={isGig ? (offerCounts[a.id] ?? null) : null}
        actions={actions}
        onAuthorClick={() => navigate(`/artist/${a.profile_id}`)}
        menu={menuFor(a)}
      />
    );
  };

  const renderLegacy = (a: any) => {
    const author = authorFor(a);
    const isOwner = viewer.id === a.profile_id;
    return (
      <FeedAnnouncementCard
        key={a.id}
        author={{
          id: a.profile_id,
          stageName: author.name,
          avatarUrl: author.avatarUrl,
          specializationLabel: author.specialization || undefined,
          plan: author.plan,
          verified: author.verified,
        }}
        createdAt={a.created_at}
        description={a.description}
        location={a.location}
        eventDate={a.event_date}
        budget={a.budget}
        formatEventDate={formatDateNoYear}
        kind={a.is_premium ? "promotion" : "announcement"}
        promoted={!!a.promoted}
        mediaUrl={a.media_url}
        mediaType={a.media_type}
        onAuthorClick={() => navigate(`/artist/${a.profile_id}`)}
        onMediaClick={() =>
          a.media_url && onMediaClick?.({ url: a.media_url, type: a.media_type === "video" ? "video" : "image" })
        }
        menu={menuFor(a)}
        footer={
          legacyApply && !isOwner ? (
            <div className="flex items-center justify-around pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!viewer.id) {
                    navigate("/login");
                    return;
                  }
                  navigate(`/messages?artistId=${a.profile_id}&adId=${a.id}`);
                }}
                className="flex-1 gap-2 rounded-md text-accent hover:bg-transparent hover:text-accent border"
              >
                <ArrowRight className="w-5 h-5" />
                <span className="font-medium">Apply Now</span>
              </Button>
            </div>
          ) : undefined
        }
      />
    );
  };

  return (
    <>
      {announcements.length === 0 ? (
        empty ?? null
      ) : (
        <div className={className ?? "space-y-2 sm:space-y-3"}>
          {announcements.map((a) => (isOpportunity(a) ? renderOpportunity(a) : renderLegacy(a)))}
        </div>
      )}

      <BookingOfferDialog
        open={!!offerTarget}
        onOpenChange={(o) => !o && setOfferTarget(null)}
        booking={offerTarget?.booking ?? null}
        announcementId={offerTarget?.announcementId ?? null}
        onSent={() => offerTarget && loadOfferData([offerTarget.announcementId])}
      />

      <AlertDialog open={!!closeTargetId} onOpenChange={(o) => !o && setCloseTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              It no longer appears in Announcements and artists can't send new offers. Offers you already received stay in
              your bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => closeTargetId && closeAnnouncement(closeTargetId)}>
              Close announcement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTargetId} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && deleteAnnouncement(deleteTargetId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminDeleteContentDialog
        open={!!adminDeleteId}
        onOpenChange={(o) => !o && setAdminDeleteId(null)}
        contentType="announcement"
        onConfirm={async (reason) => {
          if (!adminDeleteId) return;
          const id = adminDeleteId;
          setAdminDeleteId(null);
          const { error } = await supabase.from("announcements").delete().eq("id", id);
          if (error) {
            toast({ title: "Error", description: "Failed to delete announcement.", variant: "destructive" });
            return;
          }
          onDeleted?.(id);
          toast({ title: "Announcement removed", description: `Reason: ${reason}` });
        }}
      />

      <ReportContentDialog
        open={!!reportId}
        onOpenChange={(o) => !o && setReportId(null)}
        contentType="announcement"
        contentId={reportId}
      />
    </>
  );
};

export default AnnouncementList;
