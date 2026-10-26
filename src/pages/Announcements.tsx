import Navigation from "@/components/Navigation";
import { trackActivityEvent } from "@/lib/activityTracker";
import SEO from "@/components/SEO";
import { formatDateNoYear, formatSmartDate } from "@/lib/utils";
import { isAdExpired } from "@/lib/adExpiration";
import { getPlanPriority, getAnnouncementPromotionLimit, PROMOTION_SLOT_KIND } from "@/lib/planLimits";
import { rankFeedItems, isPromotionActive } from "@/lib/feedRanking";
import { getPeriodStart } from "@/lib/billingPeriod";
import PromotePostDialog from "@/components/PromotePostDialog";
import { Megaphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ExpandableText from "@/components/ExpandableText";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, User, MessageCircle, MoreHorizontal, Flag, Trash2, Loader2, Globe, MapPin, Euro, ArrowRight, Plus, Send, CheckCircle2, Pencil, Ban, Inbox } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import InstagramZoomPreview from "@/components/InstagramZoomPreview";
import GuestContentGate from "@/components/GuestContentGate";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminIds } from "@/hooks/useAdminIds";
import VerifiedBadge from "@/components/VerifiedBadge";
import AdminDeleteContentDialog from "@/components/AdminDeleteContentDialog";
import ReportContentDialog from "@/components/ReportContentDialog";
import FeedAnnouncementCard from "@/components/FeedAnnouncementCard";
import OpportunityCard from "@/components/OpportunityCard";
import BookingOfferDialog from "@/components/BookingOfferDialog";
import { translateSpecialization } from "@/lib/specializationLabel";
import { parseSlotsFromNotes, isDayFullyBooked } from "@/lib/calendarSlots";
import { formatMoney } from "@/lib/bookingOffers";
import { isOpportunity, myAvailabilityFor, type MyAvailability } from "@/lib/opportunities";
import { EmptyState } from "@/components/admin/platform/EmptyState";
import { ErrorState } from "@/components/admin/platform/ErrorState";
import { LoadingState } from "@/components/admin/platform/LoadingState";
import { useTranslation } from "react-i18next";

const ANNOUNCEMENTS_PER_PAGE = 10;

interface MediaPreview {
  url: string;
  type: "image" | "video";
}
const Announcements = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [canCreate, setCanCreate] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useUserRole();
  const adminIds = useAdminIds();
  const [adminDeleteId, setAdminDeleteId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  // Announcement promotion entitlement (tracked separately from post promotions)
  const [promotionLimit, setPromotionLimit] = useState(0);
  const [promotionsUsed, setPromotionsUsed] = useState(0);
  const [promoteTarget, setPromoteTarget] = useState<{ id: string; promotedUntil: string | null } | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const promotionsRemaining = promotionLimit - promotionsUsed;
  // Opportunities
  type FeedFilter = "all" | "forMe" | "gig" | "collab";
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const [mySpecialization, setMySpecialization] = useState<string | null>(null);
  const [isArtistViewer, setIsArtistViewer] = useState(false);
  const [myCalendar, setMyCalendar] = useState<Map<string, { status: string; notes: string | null }>>(new Map());
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>({});
  const [myOffers, setMyOffers] = useState<Record<string, any>>({});
  const [offerTarget, setOfferTarget] = useState<any | null>(null);
  const [closeTargetId, setCloseTargetId] = useState<string | null>(null);

  useEffect(() => { trackActivityEvent("announcements_view"); }, []);

  useEffect(() => {
    // Run auth check in background; do NOT block the announcements fetch on it
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        const { data: prof } = await supabase
          .from('profiles')
          .select('plan, specialization, billing, subscription_current_period_end')
          .eq('id', session.user.id)
          .maybeSingle();
        if (prof?.specialization && (prof.plan === 'Standard' || prof.plan === 'Premium')) {
          setCanCreate(true);
        }
        // Organizers post event announcements for free
        if (!prof?.specialization) setCanCreate(true);
        setMySpecialization(prof?.specialization || null);
        setIsArtistViewer(!!prof?.specialization);
        if (prof?.specialization) {
          const { data: cal } = await (supabase as any).rpc('get_my_calendar_events');
          setMyCalendar(new Map((cal || []).map((e: any) => [e.event_date, { status: e.status, notes: e.notes }])));
        }
        if (prof?.specialization) {
          setPromotionLimit(getAnnouncementPromotionLimit(prof.plan));
          const { data: slots } = await supabase
            .from('consumed_ad_slots')
            .select('consumed_at, kind')
            .eq('profile_id', session.user.id)
            .gte('consumed_at', getPeriodStart(prof as any).toISOString());
          setPromotionsUsed((slots || []).filter((sl: any) => sl.kind === PROMOTION_SLOT_KIND.announcement).length);
        }
      }
    });
  }, []);

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', announcementId);
      if (error) throw error;
      setAnnouncements(items => items.filter(item => item.id !== announcementId));
      toast({
        title: "Announcement deleted",
        description: "Your announcement has been deleted."
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: "Failed to delete announcement.",
        variant: "destructive"
      });
    } finally {
      setDeleteAnnouncementId(null);
    }
  };

  // Offer counts for event announcements, and the viewer's own offers
  const loadOfferData = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const [countsRes, mineRes] = await Promise.all([
      (supabase as any).rpc('get_announcement_offer_counts', { _ids: ids }),
      (supabase as any)
        .from('booking_requests')
        .select('id, status, announcement_id, offer_price, offer_currency, offer_note, declined_by')
        .eq('profile_id', session.user.id)
        .in('announcement_id', ids),
    ]);
    if (countsRes.data) {
      setOfferCounts((prev) => {
        const next = { ...prev };
        ids.forEach((id) => { next[id] = 0; });
        (countsRes.data as any[]).forEach((r) => { next[r.announcement_id] = r.offers; });
        return next;
      });
    }
    if (mineRes.data) {
      setMyOffers((prev) => {
        const next = { ...prev };
        (mineRes.data as any[]).forEach((r) => { next[r.announcement_id] = r; });
        return next;
      });
    }
  }, []);

  const availabilityFor = (a: any): MyAvailability | null => {
    if (!isArtistViewer || a.kind !== 'gig' || !a.event_on) return null;
    const day = myCalendar.get(a.event_on);
    const slots = parseSlotsFromNotes(day?.notes);
    return myAvailabilityFor(day, slots, isDayFullyBooked(slots), a.start_time, a.end_time);
  };

  const authorFor = (a: any) => {
    const p = a.profiles || {};
    const isAdminAuthor = adminIds.has(a.profile_id);
    if (p.specialization || isAdminAuthor) {
      const spec = isAdminAuthor ? 'Admin' : translateSpecialization(p.specialization);
      return {
        id: a.profile_id,
        name: p.stage_name || 'Artist',
        avatarUrl: p.avatar_url,
        subtitle: [spec, p.county].filter(Boolean).join(' · '),
        plan: p.plan,
        verified: isAdminAuthor,
      };
    }
    // Organizer: first name and last initial
    const first = (p.first_name || '').trim();
    const lastInitial = (p.last_name || '').trim().charAt(0);
    return {
      id: a.profile_id,
      name: first ? `${first}${lastInitial ? ` ${lastInitial}.` : ''}` : (p.stage_name || 'Organizer'),
      avatarUrl: p.avatar_url,
      subtitle: 'Organizer',
      subtitleTranslatable: true,
      plan: p.plan,
    };
  };

  const handleCloseAnnouncement = async (id: string) => {
    const { error } = await (supabase as any).from('announcements').update({ status: 'closed' }).eq('id', id);
    setCloseTargetId(null);
    if (error) {
      toast({ title: "Error", description: "Failed to close the announcement.", variant: "destructive" });
      return;
    }
    setAnnouncements((items) => items.map((a) => (a.id === id ? { ...a, status: 'closed' } : a)));
    toast({ title: "Announcement closed", description: "It no longer appears in Opportunities." });
  };

  const fetchAnnouncements = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!append) setLoading(true);
    setRequestError(null);
    try {
      const from = pageNum * ANNOUNCEMENTS_PER_PAGE;
      const to = from + ANNOUNCEMENTS_PER_PAGE - 1;

      let query = supabase
        .from("announcements")
        .select(`
          *,
          profiles!inner (
            avatar_url,
            stage_name,
            first_name,
            last_name,
            county,
            specialization,
            plan,
            country
          )
        `);

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching announcements:", error);
        setRequestError(t("announcementsPage.errorMessage"));
        return;
      }

      if (!data || data.length < ANNOUNCEMENTS_PER_PAGE) {
        setHasMore(false);
      }

      // ONE unified announcements feed: normal + promoted ranked together.
      // Promotion is only one of several ranking signals (see lib/feedRanking).
      const sorted = rankFeedItems(
        (data || []).map((a: any) => ({
          ...a,
          type: 'announcement',
          relevance: getPlanPriority(a.profiles?.plan),
          promoted: isPromotionActive(a),
        })),
      );

      if (append) {
        setAnnouncements(prev => [...prev, ...sorted]);
      } else {
        setAnnouncements(sorted);
      }
      void loadOfferData((data || []).filter((a: any) => a.kind === 'gig').map((a: any) => a.id));
    } finally {
      setLoading(false);
    }
  }, [t, loadOfferData]);

  useEffect(() => {
    fetchAnnouncements(0);
  }, [fetchAnnouncements]);

  const loadMoreAnnouncements = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchAnnouncements(nextPage, true);
  }, [page, fetchAnnouncements]);

  const { loadMoreRef, isLoadingMore } = useInfiniteScroll(loadMoreAnnouncements, hasMore);

  const renderOpportunity = (a: any) => {
    const author = authorFor(a);
    const isOwner = currentUserId === a.profile_id;
    const isGig = a.kind === "gig";
    const availability = availabilityFor(a);
    const mine = myOffers[a.id];
    const goMessage = () => navigate(`/messages?artistId=${a.profile_id}&adId=${a.id}`);
    const unavailable = availability === "busy" || availability === "blocked" || availability === "clash";

    let actions: ReactNode = null;
    if (!currentUserId) {
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
          onClick={() => navigate(isArtistViewer ? "/booking-requests?tab=sent" : "/booking-requests")}
        >
          <Inbox className="h-4 w-4 mr-2" />
          See the offers
        </Button>
      ) : null;
    } else if (isArtistViewer && isGig) {
      if (mine && (mine.status === "accepted" || mine.status === "rejected")) {
        actions = (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${mine.status === "accepted" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
            {mine.status === "accepted" ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            <span>{mine.status === "accepted" ? "Your offer was accepted" : mine.declined_by === "artist" ? "You withdrew your offer" : "The organizer chose another offer"}</span>
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
                <span className="font-semibold notranslate" translate="no">{formatMoney(mine.offer_price, mine.offer_currency)}</span>
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
                      profile_id: currentUserId,
                      requester_name: author.name,
                      event_date: a.event_on,
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
    } else if (isArtistViewer && !isGig) {
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
        menu={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0" aria-label="More">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isOwner && (
                <DropdownMenuItem onClick={() => (currentUserId ? setReportId(a.id) : navigate("/login"))}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem onClick={() => setCloseTargetId(a.id)}>
                  <Ban className="h-4 w-4 mr-2" />
                  Close announcement
                </DropdownMenuItem>
              )}
              {isOwner && (
                <DropdownMenuItem onClick={() => setDeleteAnnouncementId(a.id)} className="text-destructive focus:text-destructive">
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
        }
      />
    );
  };

  return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-background`}>
      <SEO
        title="Opportunities | Muzicalist"
        description="Latest artist promotions and announcements from musicians and event organizers worldwide on Muzicalist."
        path="/announcements"
      />
      <Navigation />
      
      <div className={`container mx-auto pt-16 ${currentUserId ? 'md:pt-2' : 'md:pt-20'} pb-0 px-0`}>
        <div ref={contentRef} className="max-w-[500px] mx-auto space-y-1">
          <h1 className="sr-only">Opportunities</h1>
          {currentUserId && (
            <div className="flex gap-1.5 overflow-x-auto px-4 sm:px-2 pt-2 pb-2 scrollbar-none">
              {([
                { k: "all", label: "All" },
                ...(isArtistViewer ? [{ k: "forMe", label: "For me" }] : []),
                { k: "gig", label: "Events" },
                { k: "collab", label: "Collaborations" },
              ] as { k: FeedFilter; label: string }[]).map((f) => (
                <button
                  key={f.k}
                  type="button"
                  onClick={() => setFeedFilter(f.k)}
                  aria-pressed={feedFilter === f.k}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    feedFilter === f.k
                      ? "border-accent bg-accent/15 text-accent font-medium"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
          
          {loading ? (
            <LoadingState
              label={t("announcementsPage.loading")}
              className="border-0 bg-transparent py-16"
            />
          ) : requestError ? (
            <ErrorState
              title={t("announcementsPage.errorTitle")}
              message={requestError}
              retryLabel={t("announcementsPage.retry")}
              onRetry={() => {
                setPage(0);
                setHasMore(true);
                void fetchAnnouncements(0);
              }}
              className="border-border/60 bg-card/40 py-16"
            />
          ) : (() => {
          const isGuest = !currentUserId;
          const GUEST_PREVIEW_COUNT = 2;
          const filteredBase = announcements.filter(a => !isAdExpired(a)).filter((a) => {
            if (feedFilter === "all") return true;
            if (feedFilter === "gig") return a.kind === "gig";
            if (feedFilter === "collab") return a.kind === "collab";
            // For me: events looking for my specialization, and collaborations (artists only)
            return a.profile_id !== currentUserId && (
              (a.kind === "gig" && !!mySpecialization && a.seeking === mySpecialization) || a.kind === "collab"
            );
          });
          const filteredAnnouncements = isGuest ? filteredBase.slice(0, GUEST_PREVIEW_COUNT) : filteredBase;
          return filteredAnnouncements.length === 0 ? (
            <EmptyState
              icon={<Megaphone className="h-5 w-5 text-accent" />}
              title={t("announcementsPage.emptyTitle")}
              description={t("announcementsPage.emptyDescription")}
              className="border-border/60 bg-card/40 py-16"
            />
          ) : filteredAnnouncements.map(announcement => isOpportunity(announcement) ? renderOpportunity(announcement) : <FeedAnnouncementCard
                key={announcement.id}
                author={{
                  id: announcement.profile_id,
                  stageName: announcement.profiles?.stage_name || "Artist",
                  avatarUrl: announcement.profiles?.avatar_url,
                  specializationLabel: adminIds.has(announcement.profile_id) ? "Admin" : (announcement.profiles?.specialization || "User"),
                  plan: announcement.profiles?.plan,
                  verified: adminIds.has(announcement.profile_id),
                }}
                createdAt={announcement.created_at}
                description={announcement.description}
                location={announcement.location}
                eventDate={announcement.event_date}
                budget={announcement.budget}
                formatEventDate={formatDateNoYear}
                promoted={!!announcement.promoted}
                onAuthorClick={() => navigate(`/artist/${announcement.profile_id}`)}
                menu={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        if (!currentUserId) {
                          navigate("/login");
                          return;
                        }
                        setReportId(announcement.id);
                      }}>
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                      {currentUserId === announcement.profile_id && promotionLimit > 0 && (
                        <DropdownMenuItem onClick={() => setPromoteTarget({ id: announcement.id, promotedUntil: announcement.promoted_until || null })}>
                          <Megaphone className="h-4 w-4 mr-2" />
                          {announcement.promoted ? "Manage promotion" : "Promote"}
                        </DropdownMenuItem>
                      )}
                      {currentUserId === announcement.profile_id && (
                        <DropdownMenuItem onClick={() => setDeleteAnnouncementId(announcement.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                      {isAdmin && currentUserId !== announcement.profile_id && (
                        <DropdownMenuItem onClick={() => setAdminDeleteId(announcement.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete (admin)
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
                footer={
                  <div className="flex items-center justify-around">
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (!currentUserId) {
                        navigate("/login");
                        return;
                      }
                      if (currentUserId === announcement.profile_id) {
                        toast({ title: "Cannot apply", description: "You cannot apply to your own announcement." });
                        return;
                      }
                      navigate(`/messages?artistId=${announcement.profile_id}&adId=${announcement.id}`);
                    }} className="flex-1 gap-2 rounded-md text-accent hover:bg-transparent hover:text-accent border">
                      <ArrowRight className="w-5 h-5" />
                      <span className="font-medium">Apply Now</span>
                    </Button>
                  </div>
                }
              />);
        })()}
          
          {currentUserId ? (
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more announcements...</span>
                </div>
              )}
              {!hasMore && announcements.length > 0 && (
                <p className="text-muted-foreground text-sm">No more announcements to load</p>
              )}
            </div>
          ) : (
            announcements.some((announcement) => !isAdExpired(announcement)) && (
              <GuestContentGate
                title="Sign in to see all announcements"
                description="Create a free account or log in to browse every opportunity and apply to gigs."
              />
            )
          )}
        </div>
      </div>

      {canCreate && (
        <Button
          onClick={() => navigate(isArtistViewer ? '/dashboard?tab=profile&section=announcements&new=1' : '/user-dashboard?new=announcement')}
          size="icon"
          aria-label="Create announcement"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Media Preview Dialog */}
      <InstagramZoomPreview media={mediaPreview} onClose={() => setMediaPreview(null)} />


      {/* Delete Announcement Confirmation Dialog */}
      <AlertDialog open={!!deleteAnnouncementId} onOpenChange={open => !open && setDeleteAnnouncementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAnnouncementId && handleDeleteAnnouncement(deleteAnnouncementId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
          const { error } = await supabase.from("announcements").delete().eq("id", adminDeleteId);
          if (error) {
            toast({ title: "Error", description: "Failed to delete announcement.", variant: "destructive" });
          } else {
            setAnnouncements((items) => items.filter((a) => a.id !== adminDeleteId));
            toast({ title: "Announcement removed", description: `Reason: ${reason}` });
          }
          setAdminDeleteId(null);
        }}
      />

      <PromotePostDialog
        open={!!promoteTarget}
        onOpenChange={(open) => { if (!open) setPromoteTarget(null); }}
        kind="announcement"
        isPromoted={!!promoteTarget?.promotedUntil && new Date(promoteTarget.promotedUntil).getTime() > Date.now()}
        promotedUntil={promoteTarget?.promotedUntil}
        remaining={promotionsRemaining}
        isSaving={isPromoting}
        onConfirm={async () => {
          if (!promoteTarget) return;
          setIsPromoting(true);
          try {
            const { error } = await (supabase as any).rpc('promote_announcement', { p_announcement_id: promoteTarget.id });
            if (error) throw error;
            setPromotionsUsed((u) => u + 1);
            setPromoteTarget(null);
            toast({ title: "Success", description: "Announcement promoted!" });
            fetchAnnouncements(0);
          } catch (e: any) {
            toast({ title: "Error", description: e.message || "Failed to promote announcement.", variant: "destructive" });
          } finally {
            setIsPromoting(false);
          }
        }}
      />

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
              It no longer appears in Opportunities and artists can't send new offers. Offers you already received stay in your bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => closeTargetId && handleCloseAnnouncement(closeTargetId)}>
              Close announcement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReportContentDialog
        open={!!reportId}
        onOpenChange={(o) => !o && setReportId(null)}
        contentType="announcement"
        contentId={reportId}
      />
    </div>;
};
export default Announcements;