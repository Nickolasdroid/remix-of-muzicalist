import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Plus, Trash2, Upload } from "lucide-react";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";

const UserDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

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
    mediaType: ""
  });
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);

  // Ad limits
  const STANDARD_AD_LIMIT = 5;
  const PREMIUM_AD_LIMIT = 2;

  // Calculate used ads
  const standardAdsUsed = announcements.filter(a => !a.is_premium).length;
  const premiumAdsUsed = announcements.filter(a => a.is_premium).length;
  const standardAdsRemaining = STANDARD_AD_LIMIT - standardAdsUsed;
  const premiumAdsRemaining = PREMIUM_AD_LIMIT - premiumAdsUsed;

  const loadAnnouncements = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('profile_id', user.id)
      .order('date', { ascending: false });
    if (data) setAnnouncements(data);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadAnnouncements();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
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
    setIsSaving(true);
    try {
      const fileName = `${user.id}/announcements/${Date.now()}_${file.name}`;
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
    setIsSaving(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('announcements').insert({
        profile_id: user.id,
        title: "Announcement",
        date: todayDate,
        description: newAnnouncement.description,
        is_premium: newAnnouncement.isPremium,
        media_url: newAnnouncement.mediaUrl || null,
        media_type: newAnnouncement.mediaType || null
      });
      if (error) throw error;
      
      await loadAnnouncements();
      setNewAnnouncement({ description: "", isPremium: false, mediaUrl: "", mediaType: "" });
      setShowAnnouncementDialog(false);
      toast({ title: t("common.success"), description: "Ad posted successfully!" });
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
      toast({ title: t("common.success"), description: "Ad deleted!" });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setDeleteAnnouncementId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen md:ml-64 bg-background flex items-center justify-center">
        <Navigation />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />

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

      <div className="container mx-auto px-4 pt-20 md:pt-8 pb-24 md:pb-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="relative group">
                <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-accent/20">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.stage_name} />
                  <AvatarFallback className="text-xl md:text-2xl">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Upload className="h-6 w-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-xl md:text-2xl font-display font-bold">
                  {profile?.first_name} {profile?.last_name}
                </h1>
                <p className="text-muted-foreground text-sm">{profile?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Ads Section */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">{t("userDashboard.myAds")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("userDashboard.adsRemaining", { standard: standardAdsRemaining, premium: premiumAdsRemaining })}
                </p>
              </div>
              <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("userDashboard.newAd")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-lg">
                  <DialogHeader>
                    <DialogTitle>{t("userDashboard.createAd")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium flex items-center justify-between">
                        {t("userDashboard.description")}
                        <span className="text-muted-foreground text-xs">
                          {newAnnouncement.description.length}/200
                        </span>
                      </label>
                      <Textarea
                        value={newAnnouncement.description}
                        onChange={(e) => setNewAnnouncement({ 
                          ...newAnnouncement, 
                          description: e.target.value.slice(0, 200) 
                        })}
                        placeholder={t("userDashboard.descriptionPlaceholder")}
                        className="mt-1"
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t("userDashboard.media")}</label>
                      <div className="mt-1">
                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-accent transition-colors">
                          <Upload className="h-5 w-5" />
                          <span className="text-sm">{t("userDashboard.uploadMedia")}</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleAnnouncementMediaUpload}
                          />
                        </label>
                        {newAnnouncement.mediaUrl && (
                          <p className="text-xs text-muted-foreground mt-2">
                            ✓ {t("userDashboard.mediaUploaded")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="premium"
                        checked={newAnnouncement.isPremium}
                        onCheckedChange={(checked) =>
                          setNewAnnouncement({ ...newAnnouncement, isPremium: !!checked })
                        }
                        disabled={premiumAdsRemaining <= 0}
                      />
                      <label htmlFor="premium" className="text-sm cursor-pointer">
                        {t("userDashboard.markAsPremium")}
                      </label>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleAddAnnouncement}
                      disabled={!newAnnouncement.description || isSaving}
                    >
                      {isSaving ? t("common.creating") : t("userDashboard.postAd")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Ads List */}
            {announcements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("userDashboard.noAds")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ad) => (
                  <div key={ad.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {ad.media_url && (
                          <div className="mb-3">
                            {ad.media_type === 'video' ? (
                              <video src={ad.media_url} className="rounded-lg max-h-48 w-full object-cover" controls />
                            ) : (
                              <img src={ad.media_url} alt="" className="rounded-lg max-h-48 w-full object-cover" />
                            )}
                          </div>
                        )}
                        <p className="text-sm">{ad.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{formatDate(ad.date)}</span>
                          {ad.is_premium && (
                            <span className="px-2 py-0.5 bg-accent/20 text-accent rounded-full">
                              {t("userDashboard.premium")}
                            </span>
                          )}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("userDashboard.deleteAdTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("userDashboard.deleteAdDescription")}
                            </AlertDialogDescription>
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
