import Navigation from "@/components/Navigation";
import { trackActivityEvent } from "@/lib/activityTracker";
import SEO from "@/components/SEO";
import { isAdExpired } from "@/lib/adExpiration";
import { getPlanPriority, getAnnouncementPromotionLimit, PROMOTION_SLOT_KIND } from "@/lib/planLimits";
import { rankFeedItems, isPromotionActive } from "@/lib/feedRanking";
import { getPeriodStart } from "@/lib/billingPeriod";
import PromotePostDialog from "@/components/PromotePostDialog";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Loader2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import InstagramZoomPreview from "@/components/InstagramZoomPreview";
import GuestContentGate from "@/components/GuestContentGate";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import AnnouncementList from "@/components/opportunities/AnnouncementList";
import { isOpportunity } from "@/lib/opportunities";
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
  
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [canCreate, setCanCreate] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
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
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAnnouncements(0);
  }, [fetchAnnouncements]);

  const loadMoreAnnouncements = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchAnnouncements(nextPage, true);
  }, [page, fetchAnnouncements]);

  const { loadMoreRef, isLoadingMore } = useInfiniteScroll(loadMoreAnnouncements, hasMore);

  return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-background`}>
      <SEO
        title="Announcements | Muzicalist"
        description="Latest artist promotions and announcements from musicians and event organizers worldwide on Muzicalist."
        path="/announcements"
      />
      <Navigation />
      
      <div className={`container mx-auto pt-16 ${currentUserId ? 'md:pt-2' : 'md:pt-20'} pb-0 px-0`}>
        <div ref={contentRef} className="max-w-[500px] mx-auto space-y-2 sm:space-y-3">
          <h1 className="sr-only">Announcements</h1>
          {currentUserId && (
            <div className="flex gap-1.5 overflow-x-auto px-3 sm:px-0 pt-2 scrollbar-none">
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
          ) : (
            <AnnouncementList
              announcements={filteredAnnouncements}
              legacyApply
              onMediaClick={setMediaPreview}
              onDeleted={(id) => setAnnouncements((items) => items.filter((x) => x.id !== id))}
              onUpdated={(id, patch) => setAnnouncements((items) => items.map((x) => (x.id === id ? { ...x, ...patch } : x)))}
              extraMenuItems={(a, isOwner) =>
                isOwner && promotionLimit > 0 && !isOpportunity(a) ? (
                  <DropdownMenuItem onClick={() => setPromoteTarget({ id: a.id, promotedUntil: a.promoted_until || null })}>
                    <Megaphone className="h-4 w-4 mr-2" />
                    {a.promoted ? "Manage promotion" : "Promote"}
                  </DropdownMenuItem>
                ) : null
              }
            />
          );
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

    </div>;
};
export default Announcements;