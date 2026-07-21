import { useState, useEffect } from "react";
import { formatDateNoYear, formatSmartDate, sanitizeFileName } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import SettingsTab, { SettingSection } from "@/components/SettingsTab";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Plus, Trash2, Upload, Clock, X, AlertCircle, Euro, MapPin, Pencil, Calendar as CalendarIcon, CheckCircle2, XCircle, Sparkles, ChevronRight, Image as ImageIcon } from "lucide-react";
import { isAdExpired, getDaysRemaining } from "@/lib/adExpiration";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import ExpandableText from "@/components/ExpandableText";
import InstagramZoomPreview from "@/components/InstagramZoomPreview";

interface MediaPreview {
  url: string;
  type: "image" | "video";
}

const UserDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'settings' ? 'settings' : 'profile';
  const [settingsSection, setSettingsSection] = useState<SettingSection>('main');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
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

  // Announcement limits
  const STANDARD_AD_LIMIT = 1;
  const AD_COOLDOWN_DAYS = 30;
  const standardAdsUsed = announcements.filter(a => !a.is_premium).length;
  const standardAdsRemaining = STANDARD_AD_LIMIT - standardAdsUsed;

  // Bookings
  const [bookings, setBookings] = useState<any[]>([]);

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
      .select('id, status, event_date, event_end_date, created_at, profile_id')
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
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const fileName = `${user.id}/avatar.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, croppedBlob, {
          contentType: "image/jpeg",
          cacheControl: "0",
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
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
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

  const handleAddAnnouncement = async () => {
    if (!user || !newAnnouncement.description) return;
    if (standardAdsRemaining <= 0) {
      toast({ title: t("common.error"), description: "You can only post 1 announcement.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('announcements').insert({
        profile_id: user.id,
        title: "Announcement",
        date: todayDate,
        description: newAnnouncement.description,
        is_premium: false,
        media_url: newAnnouncement.mediaUrl || null,
        media_type: newAnnouncement.mediaType || null,
        location: newAnnouncement.location || null,
        event_date: newAnnouncement.eventDate || null,
        budget: newAnnouncement.budget || null
      });
      if (error) throw error;
      
      await loadAnnouncements();
      setNewAnnouncement({ description: "", isPremium: false, mediaUrl: "", mediaType: "", location: "", eventDate: "", budget: "" });
      setShowAnnouncementDialog(false);
      toast({ title: t("common.success"), description: "Announcement posted successfully!" });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      await loadAnnouncements();
      toast({ title: t("common.success"), description: "Announcement deleted!" });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen md:ml-64 bg-card flex items-center justify-center">
        <Navigation />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen md:ml-64 ${activeTab === 'settings' ? 'bg-background' : 'bg-card'}`}>
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
        <div className="pt-16 md:pt-8 pb-20 md:pb-20 px-0 md:px-0 bg-background">
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
      <div className="container mx-auto pt-20 md:pt-8 pb-24 md:pb-8 max-w-4xl px-4">
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

          const pendingBookings = bookings.filter(b => b.status === 'pending').length;
          const acceptedActive = bookings.filter(b => {
            const d = parseYMD(b.event_end_date || b.event_date);
            return b.status === 'accepted' && d && d >= today;
          }).length;
          const completedBookings = bookings.filter(b => {
            const d = parseYMD(b.event_end_date || b.event_date);
            return b.status === 'accepted' && d && d < today;
          }).length;
          const cancelledBookings = bookings.filter(b => b.status === 'rejected').length;

          // Cooldown
          const oldestStandard = announcements
            .filter(a => !a.is_premium)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
          let cooldownDaysRemaining = 0;
          let cooldownDate: Date | null = null;
          if (oldestStandard && standardAdsRemaining <= 0) {
            const created = new Date(oldestStandard.created_at);
            cooldownDate = new Date(created);
            cooldownDate.setDate(cooldownDate.getDate() + AD_COOLDOWN_DAYS);
            cooldownDaysRemaining = Math.max(0, Math.ceil((cooldownDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          }
          const canPublish = standardAdsRemaining > 0;

          const goToBookings = (filter?: string) => {
            navigate(`/booking-requests${filter ? `?filter=${filter}` : ''}`);
          };
          const goToSettings = () => {
            setSearchParams({ tab: 'settings' });
          };

          const quickActions = [
            {
              label: 'Publish Announcement',
              desc: canPublish ? 'Share what you need' : `Available in ${cooldownDaysRemaining}d`,
              icon: Megaphone,
              onClick: () => canPublish && setShowAnnouncementDialog(true),
              disabled: !canPublish,
              accent: 'from-accent/25 to-accent/5',
            },
            {
              label: 'My Bookings',
              desc: 'Manage your requests',
              icon: CalendarIcon,
              onClick: () => goToBookings(),
              accent: 'from-blue-500/25 to-blue-500/5',
            },
          ];

          return (
            <>
              {/* ===== Header ===== */}
              <Card className="relative overflow-hidden rounded-lg border-border/60 bg-gradient-card shadow-elegant">
                <div className="absolute inset-0 bg-gradient-cinematic opacity-40 pointer-events-none" />
                <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
                  <div className="relative group mx-auto md:mx-0">
                    <Avatar className="h-24 w-24 md:h-28 md:w-28 border-2 border-accent/30 shadow-gold">
                      <AvatarImage src={profile?.avatar_url} alt={`${profile?.first_name || ''} ${profile?.last_name || ''}`} />
                      <AvatarFallback className="text-2xl bg-secondary">
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Upload className="h-6 w-6 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <h1
                      className="text-2xl md:text-3xl font-display font-bold text-foreground notranslate"
                      data-user-content="true"
                      data-no-translate="true"
                      translate="no"
                    >
                      {profile?.first_name} {profile?.last_name}
                    </h1>
                    {memberSince && (
                      <p className="mt-1.5 text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Member since {memberSince}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-center md:justify-end">
                    <Button
                      onClick={goToSettings}
                      className="rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                  </div>
                </div>
              </Card>

              {/* ===== Quick Actions ===== */}
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Quick actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickActions.map((a) => (
                    <button
                      key={a.label}
                      onClick={a.onClick}
                      disabled={a.disabled}
                      className={`relative overflow-hidden rounded-lg border border-border/60 bg-card p-5 text-left transition hover:border-accent/40 hover:shadow-gold disabled:opacity-60 disabled:cursor-not-allowed group`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${a.accent} opacity-40 group-hover:opacity-70 transition-opacity pointer-events-none`} />
                      <div className="relative flex items-start justify-between gap-3">
                        <div>
                          <div className="p-2 inline-flex rounded-lg bg-background/40 border border-border/60 mb-3">
                            <a.icon className="h-5 w-5 text-accent" />
                          </div>
                          <h3 className="font-semibold text-foreground">{a.label}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ===== My Announcements & My Bookings ===== */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* My Announcements */}
                <Card className="rounded-lg border-border/60 bg-card">
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-accent" />
                        <h3 className="font-semibold text-foreground">My Announcements</h3>
                      </div>
                      <Badge variant="outline" className="rounded-lg text-xs">
                        {standardAdsUsed}/{STANDARD_AD_LIMIT}
                      </Badge>
                    </div>

                    <div className="rounded-lg bg-background/40 border border-border/60 p-4 mb-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Standard</p>
                      <p className="text-2xl font-bold text-foreground">
                        {standardAdsUsed} <span className="text-base text-muted-foreground font-normal">/ {STANDARD_AD_LIMIT}</span>
                      </p>
                      {!canPublish && cooldownDate && (
                        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Next slot in <span className="font-medium text-foreground">{cooldownDaysRemaining}d</span>
                          <span>· {cooldownDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => setShowAnnouncementDialog(true)}
                      disabled={!canPublish}
                      className="w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {canPublish ? 'Publish Announcement' : `Available in ${cooldownDaysRemaining}d`}
                    </Button>

                    {announcements.length > 0 ? (
                      <div className="mt-5 space-y-2">
                        {announcements.slice(0, 3).map((ad) => (
                          <div key={ad.id} className="flex items-start justify-between gap-2 p-3 rounded-lg bg-background/30 border border-border/50">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-foreground line-clamp-2">{ad.description}</p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatSmartDate(ad.created_at)}</span>
                                <span>·</span>
                                {isAdExpired(ad) ? (
                                  <span className="text-destructive">Expired</span>
                                ) : (
                                  <span>{getDaysRemaining(ad)}d left</span>
                                )}
                              </div>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive shrink-0">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-lg">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t("userDashboard.deleteAdTitle")}</AlertDialogTitle>
                                  <AlertDialogDescription>{t("userDashboard.deleteAdDescription")}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteAnnouncement(ad.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {t("userDashboard.delete")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-lg border border-dashed border-border/60 bg-background/20 p-6 text-center">
                        <Megaphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                        <p className="text-sm text-muted-foreground">No announcements yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Publish your first one to reach artists.</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* My Bookings */}
                <Card className="rounded-lg border-border/60 bg-card">
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-accent" />
                        <h3 className="font-semibold text-foreground">My Bookings</h3>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => goToBookings()}>
                        View all
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>

                    {bookings.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 bg-background/20 p-8 text-center">
                        <CalendarIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                        <p className="text-sm font-medium text-foreground">No bookings yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Book your first artist to get started.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 rounded-lg"
                          onClick={() => navigate('/')}
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          Discover artists
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'pending', label: 'Pending', value: pendingBookings, icon: Clock, tone: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                          { key: 'accepted', label: 'Confirmed', value: acceptedActive, icon: CheckCircle2, tone: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                          { key: 'completed', label: 'Completed', value: completedBookings, icon: Sparkles, tone: 'text-blue-400', bg: 'bg-blue-500/10' },
                          { key: 'rejected', label: 'Cancelled', value: cancelledBookings, icon: XCircle, tone: 'text-destructive', bg: 'bg-destructive/10' },
                        ].map((b) => (
                          <button
                            key={b.key}
                            onClick={() => goToBookings(b.key)}
                            className="rounded-lg border border-border/60 bg-background/40 p-3 text-left hover:border-accent/40 hover:bg-background/60 transition"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`p-1.5 rounded-md ${b.bg}`}>
                                <b.icon className={`h-3.5 w-3.5 ${b.tone}`} />
                              </div>
                              <span className="text-xs text-muted-foreground">{b.label}</span>
                            </div>
                            <p className="text-xl font-bold text-foreground">{b.value}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* ===== Announcement Dialog ===== */}
              <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                <DialogContent className="max-w-md rounded-lg">
                  <DialogHeader>
                    <DialogTitle>{t("userDashboard.createAd")}</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border text-xs font-medium text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{t("userDashboard.adValidity", "Valid 15 days")}</span>
                    </div>
                  </div>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="announcement-text-user">{t("userDashboard.description", "Announcement Text")}</Label>
                      <Textarea
                        id="announcement-text-user"
                        value={newAnnouncement.description}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, description: e.target.value.slice(0, 200) })}
                        placeholder={t("userDashboard.descriptionPlaceholder", "Write your announcement here...")}
                        rows={4}
                        maxLength={200}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground text-right mt-1">{newAnnouncement.description.length}/200</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="announcement-location-user">Location (optional)</Label>
                        <Input id="announcement-location-user" value={newAnnouncement.location} onChange={e => setNewAnnouncement({ ...newAnnouncement, location: e.target.value })} placeholder="e.g. New York, NY" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="announcement-event-date-user">Event Date (optional)</Label>
                        <Input id="announcement-event-date-user" type="date" min={new Date().toISOString().split('T')[0]} value={newAnnouncement.eventDate} onChange={e => setNewAnnouncement({ ...newAnnouncement, eventDate: e.target.value })} className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="announcement-budget-user">Budget (optional)</Label>
                        <Input id="announcement-budget-user" value={newAnnouncement.budget} onChange={e => setNewAnnouncement({ ...newAnnouncement, budget: e.target.value })} placeholder="e.g. $500" className="mt-1" />
                      </div>
                    </div>
                    <Button
                      onClick={handleAddAnnouncement}
                      disabled={isSaving || !newAnnouncement.description}
                      className="w-full rounded-lg bg-accent text-accent-foreground"
                    >
                      {isSaving ? t("common.creating", "Adding...") : t("userDashboard.postAd", "Add Announcement")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          );
        })()}
      </div>
      )}

      {/* Media Preview Dialog */}
      <InstagramZoomPreview media={mediaPreview} onClose={() => setMediaPreview(null)} />
    </div>
  );
};

export default UserDashboard;
