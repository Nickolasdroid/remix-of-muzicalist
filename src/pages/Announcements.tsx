import Navigation from "@/components/Navigation";
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
import { Calendar, User, MessageCircle, MoreHorizontal, Flag, Trash2, Loader2, Globe, MapPin, Euro, ArrowRight, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import InstagramZoomPreview from "@/components/InstagramZoomPreview";
import GuestContentGate from "@/components/GuestContentGate";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useMobileBottomNavSpacing } from "@/hooks/use-mobile-bottom-nav-spacing";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminIds } from "@/hooks/useAdminIds";
import VerifiedBadge from "@/components/VerifiedBadge";
import AdminDeleteContentDialog from "@/components/AdminDeleteContentDialog";
import ReportContentDialog from "@/components/ReportContentDialog";
import FeedAnnouncementCard from "@/components/FeedAnnouncementCard";

const ANNOUNCEMENTS_PER_PAGE = 10;

interface MediaPreview {
  url: string;
  type: "image" | "video";
}
const Announcements = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchAnnouncements = useCallback(async (pageNum: number, append: boolean = false) => {
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
  }, []);

  useEffect(() => {
    fetchAnnouncements(0);
  }, [fetchAnnouncements]);

  const loadMoreAnnouncements = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchAnnouncements(nextPage, true);
  }, [page, fetchAnnouncements]);

  const { loadMoreRef, isLoadingMore } = useInfiniteScroll(loadMoreAnnouncements, hasMore);
  const needsBottomSpacing = useMobileBottomNavSpacing(contentRef, [announcements.length, loading, canCreate, page, hasMore]);

  return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-background`}>
      <SEO
        title="Announcements & Promotions | Muzicalist"
        description="Latest artist promotions and announcements from musicians and event organizers worldwide on Muzicalist."
        path="/announcements"
      />
      <Navigation />
      
      <div className={`container mx-auto pt-16 ${currentUserId ? 'md:pt-2' : 'md:pt-20'} ${needsBottomSpacing ? 'pb-16' : 'pb-0'} md:pb-0 px-0`}>
        <div ref={contentRef} className="max-w-[500px] mx-auto space-y-1">
          <h1 className="sr-only">Announcements &amp; Promotions</h1>
          
          {loading ? <div className="text-center text-muted-foreground">Loading announcements...</div> : (() => {
          const isGuest = !currentUserId;
          const GUEST_PREVIEW_COUNT = 2;
          const filteredBase = announcements.filter(a => !isAdExpired(a));
          const filteredAnnouncements = isGuest ? filteredBase.slice(0, GUEST_PREVIEW_COUNT) : filteredBase;
          return filteredAnnouncements.length === 0 ? <div className="text-center text-muted-foreground border-0 rounded-none">No announcements yet.</div> : filteredAnnouncements.map(announcement => <FeedAnnouncementCard
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
                typeLabel="Announcement"
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
            announcements.length > 0 && (
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
          onClick={() => navigate('/dashboard?tab=profile&section=announcements&new=1')}
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

      <ReportContentDialog
        open={!!reportId}
        onOpenChange={(o) => !o && setReportId(null)}
        contentType="announcement"
        contentId={reportId}
      />
    </div>;
};
export default Announcements;