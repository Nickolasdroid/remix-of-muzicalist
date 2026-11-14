import { prepareImageForUpload, resizeImage } from "@/lib/imageResize";
import { PROFILE_PANEL } from "@/lib/profileLayout";
import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatDateNoYear, formatSmartDate, sanitizeFileName } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import SettingsTab, { SettingSection } from "@/components/SettingsTab";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import PageLoading from "@/components/PageLoading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { knownUser } from "@/lib/knownUser";
import { Megaphone, Plus, Trash2, Upload, Clock, CalendarCheck, Send, Camera, User, X, AlertCircle, Euro, MapPin, Calendar as CalendarIcon, CheckCircle2, XCircle, Sparkles, ChevronRight, Image as ImageIcon, Users, Ban } from "lucide-react";
import { isAdExpired, getDaysRemaining } from "@/lib/adExpiration";
import { ORGANIZER_OPEN_LIMIT } from "@/lib/opportunities";
import OpportunityComposer from "@/components/OpportunityComposer";
import OwnerAnnouncementsList from "@/components/dashboard/OwnerAnnouncementsList";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import ExpandableText from "@/components/ExpandableText";
import InstagramZoomPreview from "@/components/InstagramZoomPreview";
import SocialStats from "@/components/SocialStats";
import { entitlementErrorMessage } from "@/lib/entitlements";
import AnnouncementManagementCard from "@/components/dashboard/AnnouncementManagementCard";
import { SectionHeaderWithUsage } from "@/components/dashboard/SectionLayout";
import BookingRequestCard from "@/components/BookingRequestCard";
import { sortBookingsForPreview } from "@/lib/bookingDisplay";
import { BOOKING_OFFER_COLUMNS } from "@/lib/bookingOffers";
import { useProfileBasics } from "@/hooks/useProfileAvatars";
import CountryFlagIcon from "@/components/CountryFlagIcon";

interface MediaPreview {
  url: string;
  type: "image" | "video";
}

const UserDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'settings' ? 'settings' : 'profile';
  usePageTitle(activeTab === "settings" ? "Settings" : "Profile");
  const [settingsSection, setSettingsSection] = useState<SettingSection>('main');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(knownUser);
  const [profile, setProfile] = useState<any>(null);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);

  // Avatar cropper state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    description: "",
    isPremium: false,
    mediaUrl: "",
    mediaType: "",
    location: "",
    eventDate: "",
    budget: ""
  });
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  // Event being edited (opened from its ⋯ menu)
  const [editOpp, setEditOpp] = useState<{ row: any; lockCore: boolean } | null>(null);

  // Announcement limits: organizers post event announcements for free, up to 5 open at a time
  const STANDARD_AD_LIMIT = ORGANIZER_OPEN_LIMIT;
  const standardAdsUsed = announcements.filter(a => a.kind === 'gig' && !isAdExpired(a)).length;
  const standardAdsRemaining = STANDARD_AD_LIMIT - standardAdsUsed;

  // Opened from the Opportunities page
  useEffect(() => {
    if (searchParams.get('new') === 'announcement') {
      setShowAnnouncementDialog(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Bookings
  const [bookings, setBookings] = useState<any[]>([]);
  // The artists I sent requests to (name + photo on the booking cards)
  const bookedArtists = useProfileBasics(bookings.map((b) => b.profile_id));

  // Following / Followers
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);

  const loadFollowingCount = async () => {
    if (!user) return;
    const [{ count: followingC }, { count: followersC }] = await Promise.all([
      supabase
        .from('followers')
        .select('artist_id', { count: 'exact', head: true })
        .eq('follower_id', user.id),
      supabase
        .from('followers')
        .select('follower_id', { count: 'exact', head: true })
        .eq('artist_id', user.id),
    ]);
    setFollowingCount(followingC || 0);
    setFollowersCount(followersC || 0);
  };

  const loadAnnouncements = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
  };

  const loadBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('booking_requests')
      .select('id, status, event_date, event_end_date, event_type, message, created_at, profile_id, ' + BOOKING_OFFER_COLUMNS)
      .eq('requester_user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setBookings(data);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadAnnouncements();
      loadBookings();
      loadFollowingCount();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      // Role guard: only regular users belong here. Artists/admins go to /dashboard.
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('user_type')
        .eq('user_id', session.user.id)
        .maybeSingle();
      const userType = (roleRow?.user_type as string) || null;
      if (userType && userType !== 'user') {
        navigate('/dashboard', { replace: true });
        return;
      }
      setUser(session.user);
      
      const { data: profileRows, error } = await (supabase as any)
        .rpc('get_my_full_profile');
      const profileData = Array.isArray(profileRows) ? profileRows[0] : profileRows;
      
      if (error) throw error;
      setProfile(profileData);
    } catch (error: any) {
      console.error('Auth check error:', error);
      toast({
        title: t("common.error"),
        description: "Failed to load profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setUser(null);
      setProfile(null);
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.log('Logout completed');
    }
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-my-account');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
      try { localStorage.clear(); } catch {}

      toast({ title: t("common.success"), description: "Your account has been permanently deleted." });
      navigate('/');
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message || "Failed to delete account.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar functions
  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise(resolve => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(
      image,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height
    );

    return new Promise(resolve => {
      canvas.toBlob(blob => { if (blob) resolve(blob); }, 'image/jpeg', 0.95);
    });
  };

  const handleSaveAvatar = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return;
    setIsSaving(true);
    try {
      const croppedBlob = await resizeImage(await getCroppedImg(imageSrc, croppedAreaPixels), 640);
      const fileName = `${user.id}/avatar.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, croppedBlob, {
          contentType: "image/jpeg",
          cacheControl: "300",
          upsert: true
        });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const freshUrl = `${publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: freshUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;

      setProfile((prev: any) => ({ ...(prev ?? {}), avatar_url: freshUrl }));
      setShowCropper(false);
      setImageSrc(null);
      toast({ title: t("common.success"), description: "Profile picture updated!" });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || "Failed to update profile picture.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Announcements functions
  const handleAnnouncementMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type.startsWith('video/') && file.size > 500 * 1024 * 1024) {
      toast({ title: t("common.error"), description: "Video file size must not exceed 500 MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setIsSaving(true);
    try {
      const fileName = `${user.id}/announcements/${Date.now()}_${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, await prepareImageForUpload(file), { cacheControl: '86400' });
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      setNewAnnouncement({ ...newAnnouncement, mediaUrl: publicUrl, mediaType });
      toast({ title: t("common.success"), description: "Media uploaded!" });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseAnnouncement = async (id: string) => {
    const { error } = await (supabase as any).from('announcements').update({ status: 'closed' }).eq('id', id);
    if (error) {
      toast({ title: "Error", description: "Failed to close the event.", variant: "destructive" });
      return;
    }
    await loadAnnouncements();
    toast({ title: "Event closed", description: "It no longer appears in the feed." });
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      await loadAnnouncements();
      toast({ title: "Event deleted" });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageLoading />
    );
  }

  return (
    <div className={`min-h-screen md:ml-[316px] lg:ml-[356px] bg-black md:py-2 md:pr-2`}>
      <Navigation
        onMobileBack={activeTab === 'settings' && settingsSection !== 'main' ? () => setSettingsSection('main') : undefined}
      />

      {/* Avatar Cropper Dialog */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md aspect-square">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="round"
            />
          </div>
          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={() => { setShowCropper(false); setImageSrc(null); }}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveAvatar} disabled={isSaving}>
              {isSaving ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'settings' ? (
        <div className={`${PROFILE_PANEL} pt-16 md:pt-8 pb-[calc(4rem+1.25rem+env(safe-area-inset-bottom))] md:pb-8 px-0`}>
          <div className="container mx-auto max-w-4xl px-0 md:px-0">
            <SettingsTab
              accountType="user"
              formData={{ email: profile?.email || user?.email || "" }}
              handleLogout={handleLogout}
              handleDeleteAccount={handleDeleteAccount}
              isSaving={isSaving}
              activeSection={settingsSection}
              onSectionChange={setSettingsSection}
            />
          </div>
        </div>
      ) : (
      <div className={`${PROFILE_PANEL} pt-16 md:pt-0 pb-6 md:pb-20 px-0`}>
        <div className="container mx-auto max-w-none px-4 md:px-8">

        {(() => {
          // Derived data
          const memberSince = profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
            : null;

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const parseYMD = (s?: string | null) => {
            if (!s) return null;
            const [y, m, d] = s.split('-').map(Number);
            return new Date(y, m - 1, d);
          };

          const confirmedBookings = bookings.filter(b => b.status === 'accepted' || b.status === 'completed').length;
          const sentRequests = bookings.length;
          const bookingPreview = sortBookingsForPreview(bookings).slice(0, 5);

          const canPublish = standardAdsRemaining > 0;

          const goToBookings = (filter?: string) => {
            navigate(`/booking-requests${filter ? `?filter=${filter}` : ''}`);
          };

          return (
            <>
              {/* Header: same layout as the artist dashboard (cover, avatar under it, name, subline, follows, stats) */}
              <div className="space-y-4 md:space-y-5">
                <div className="mb-4 md:mb-5 -mx-4 md:-mx-8">
                  <div className="relative w-full aspect-[16/7] md:aspect-auto md:h-[220px] xl:h-[260px] overflow-hidden bg-gradient-to-br from-accent/20 via-card to-secondary">
                    <div className="absolute inset-0 bg-gradient-cinematic opacity-70 pointer-events-none" />
                  </div>

                  <div className="px-4 md:px-8 -mt-10 md:-mt-12 lg:-mt-14 xl:-mt-16 flex items-center gap-3 md:gap-4 lg:gap-5 relative z-10">
                    <div className="relative p-1 rounded-full shadow-xl flex-shrink-0 group/avatar">
                      <Avatar className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32">
                        <AvatarImage src={profile?.avatar_url} alt="" />
                        <AvatarFallback className="bg-gradient-to-br from-accent/30 to-accent/10">
                          <User className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 text-accent" />
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute inset-1 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="h-6 w-6 md:h-8 md:w-8 text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold tracking-[-0.03em] text-foreground truncate notranslate" data-user-content="true" data-no-translate="true" translate="no">
                        {profile?.first_name} {profile?.last_name}
                      </h1>
                      <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground text-sm lg:text-base mt-0.5 md:mt-1 flex-wrap">
                        <span className="font-medium">Organizer</span>
                        {profile?.county && <span className="opacity-70">•</span>}
                        {profile?.county && <span className="truncate notranslate" translate="no">{profile.county}</span>}
                        {profile?.country && <CountryFlagIcon country={profile.country} className="h-3.5 w-5 md:h-4 md:w-6 lg:h-5 lg:w-7 rounded-sm shadow-sm flex-shrink-0" />}
                      </div>
                      <SocialStats
                        className="mt-1.5 md:mt-2 flex-nowrap"
                        followersCount={followersCount}
                        followingCount={followingCount}
                        onFollowersClick={() => user && navigate(`/connections/${user.id}?tab=followers`)}
                        onFollowingClick={() => user && navigate(`/connections/${user.id}?tab=following`)}
                      />
                    </div>
                  </div>

                  {/* Stats card row, same as the artist's */}
                  <dl className="mx-4 md:mx-8 mt-4 md:mt-6 flex gap-8 md:gap-12">
                    {[
                      { icon: Send, value: String(sentRequests), label: "Requests sent" },
                      { icon: CalendarCheck, value: String(confirmedBookings), label: "Artists booked" },
                      { icon: Clock, value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString(i18n.language || 'en', { month: 'short', year: 'numeric' }).replace('.', '') : '—', label: "Member since" },
                    ].map((st) => (
                      <div key={st.label} className="min-w-0">
                        <dd className="truncate text-lg md:text-xl font-bold text-foreground tabular-nums">{st.value}</dd>
                        <dt className="truncate text-xs md:text-sm text-muted-foreground">{st.label}</dt>
                      </div>
                    ))}
                  </dl>
                </div>

              {/* ===== Bookings, then my events (one column, like the artist dashboard) ===== */}
              <div className="flex flex-col gap-8">
                {/* My Announcements */}
                <div>
                  <SectionHeaderWithUsage
                    icon={<Megaphone className="h-4 w-4 md:h-5 md:w-5" />}
                    title="My events"
                    usage={`${standardAdsUsed}/${STANDARD_AD_LIMIT}`}
                    className="mb-2"
                    action={
                      <Button
                        size="sm"
                        onClick={() => setShowAnnouncementDialog(true)}
                        disabled={!canPublish}
                        className="h-8 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        {t("userDashboard.add")}
                      </Button>
                    }
                  />


                  <div>
                    {!canPublish && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>You have 5 open events. A slot frees up when an event passes or you close one.</span>
                      </p>
                    )}


                    <div className="mt-3">
                      <OwnerAnnouncementsList
                        announcements={announcements}
                        isArtist={false}
                        onClose={handleCloseAnnouncement}
                        onDelete={(id) => setDeleteAnnouncementId(id)}
                        onEdit={(row, lockCore) => setEditOpp({ row, lockCore })}
                        empty={
                          <div className="rounded-lg border border-dashed border-border/60 bg-background/20 p-4 text-center">
                          <Megaphone className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/60" />
                          <p className="text-sm text-muted-foreground">No events yet</p>
                          <p className="text-xs text-muted-foreground/70 mt-0.5">Add an event and available artists send you offers.</p>
                        </div>
                        }
                      />
                    </div>
                  </div>

                  <AlertDialog open={!!deleteAnnouncementId} onOpenChange={(open) => !open && setDeleteAnnouncementId(null)}>
                    <AlertDialogContent className="rounded-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => { if (deleteAnnouncementId) handleDeleteAnnouncement(deleteAnnouncementId); setDeleteAnnouncementId(null); }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t("userDashboard.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Bookings: the same cards as the artist's calendar */}
                <div className="order-first">
                  <SectionHeaderWithUsage
                    icon={<CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />}
                    title="Booking Requests"
                    className="mb-3"
                    action={bookings.length > 0 ? (
                      <Button variant="ghost" size="sm" className="rounded-lg text-accent hover:text-accent" onClick={() => navigate('/booking-requests')}>
                        See all
                      </Button>
                    ) : undefined}
                  />
                  {bookingPreview.length === 0 ? (
                    <Card className="rounded-lg border-dashed border-border/60 bg-card/60 p-6 text-center">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                      <p className="text-sm font-medium text-foreground">No bookings yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Book your first artist to get started.</p>
                      <Button variant="outline" size="sm" className="mt-3 rounded-lg" onClick={() => navigate('/search')}>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Discover artists
                      </Button>
                    </Card>
                  ) : (
                    <div className="space-y-2.5">
                      {bookingPreview.map((b: any) => (
                        <BookingRequestCard
                          key={b.id}
                          booking={b}
                          viewer="requester"
                          counterpartName={bookedArtists[b.profile_id]?.stage_name || "Artist"}
                          counterpartAvatarUrl={bookedArtists[b.profile_id]?.avatar_url}
                          onClick={() => navigate('/booking-requests')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>


              {/* ===== Announcement Dialog ===== */}
              <OpportunityComposer
                open={showAnnouncementDialog || !!editOpp}
                onOpenChange={(o) => {
                  if (o) return;
                  setShowAnnouncementDialog(false);
                  setEditOpp(null);
                }}
                isArtist={false}
                editing={editOpp}
                onUpdated={() => loadAnnouncements()}
                blockedReason={!canPublish ? "You already have 5 open events. Close one or wait for an event to pass." : null}
                meta={<span className="text-accent">Free for organizers</span>}
                onPublished={() => loadAnnouncements()}
              />

            </>
          );
        })()}
        </div>
      </div>
      )}


      {/* Media Preview Dialog */}
      <InstagramZoomPreview media={mediaPreview} onClose={() => setMediaPreview(null)} />
    </div>
  );
};

export default UserDashboard;
