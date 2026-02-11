import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Megaphone, Plus, Trash2, Upload, Clock, X, AlertCircle, DollarSign } from "lucide-react";
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
    mediaType: ""
  });
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);

  // Ad limits
  const STANDARD_AD_LIMIT = 5;
  const PREMIUM_AD_LIMIT = 2;
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
    <div className="min-h-screen md:ml-64 bg-card">
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

      <div className="container mx-auto pt-20 md:pt-8 pb-24 md:pb-8 max-w-lg px-[4px] py-[24px]">
        {/* Profile Header - matching public user profile format */}
        <div className="border border-border rounded-lg p-6 flex flex-col items-center gap-4 my-[33px]">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-accent/20">
              <AvatarImage src={profile?.avatar_url} alt={profile?.stage_name} />
              <AvatarFallback className="text-2xl">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Upload className="h-6 w-6 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">
            {profile?.first_name} {profile?.last_name}
          </h1>
          <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
            <span>{t("userDashboard.adsPublished", { count: announcements.length })}</span>
            {profile?.created_at && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {t("userDashboard.memberSince", { 
                  date: new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) 
                })}
              </span>
            )}
          </div>
        </div>

        {/* My Ads Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-accent" />
              {t("userDashboard.myAds")}
            </h2>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <DollarSign className="h-4 w-4 mr-1" />
                Buy Ads
              </Button>
              <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("userDashboard.newAd")}
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("userDashboard.createAd")}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mt-2">
                  {newAnnouncement.isPremium 
                    ? t("userDashboard.promotionValidity", "Promotions are valid for 30 days.")
                    : t("userDashboard.adValidity", "Ads are valid for 15 days.")}
                </p>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center space-x-2 p-3 border border-accent/20 rounded-lg bg-accent/5">
                    <Checkbox
                      id="premium-ad-user"
                      checked={newAnnouncement.isPremium}
                      onCheckedChange={(checked) =>
                        setNewAnnouncement({ ...newAnnouncement, isPremium: checked as boolean })
                      }
                      disabled={premiumAdsRemaining <= 0}
                    />
                    <Label htmlFor="premium-ad-user" className="cursor-pointer font-medium">
                      {t("userDashboard.markAsPremium", "Promotion Ad (with photo/video)")}
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="announcement-text-user">{t("userDashboard.description", "Announcement Text")}</Label>
                    <Textarea
                      id="announcement-text-user"
                      value={newAnnouncement.description}
                      onChange={(e) => setNewAnnouncement({ 
                        ...newAnnouncement, 
                        description: e.target.value.slice(0, 200) 
                      })}
                      placeholder={t("userDashboard.descriptionPlaceholder", "Write your announcement here...")}
                      rows={4}
                      maxLength={200}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">{newAnnouncement.description.length}/200</p>
                  </div>

                  {newAnnouncement.isPremium && (
                    <div>
                      <Label htmlFor="announcement-media-user">{t("userDashboard.media", "Photo/Video")}</Label>
                      {newAnnouncement.mediaUrl ? (
                        <div className="mt-2 relative">
                          {newAnnouncement.mediaType === 'video' 
                            ? <video src={newAnnouncement.mediaUrl} controls className="w-full rounded-lg max-h-48" /> 
                            : <img src={newAnnouncement.mediaUrl} alt="Preview" className="w-full rounded-lg max-h-48 object-cover" />}
                          <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => setNewAnnouncement({
                            ...newAnnouncement,
                            mediaUrl: "",
                            mediaType: ""
                          })}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Label htmlFor="announcement-media-input-user" className="cursor-pointer">
                            <div className="border-2 border-dashed border-accent/50 rounded-lg p-6 text-center hover:border-accent transition-colors mt-2">
                              <Upload className="h-10 w-10 mx-auto mb-2 text-accent" />
                              <p className="text-sm text-muted-foreground">{t("userDashboard.uploadMedia", "Click to upload photo or video")}</p>
                            </div>
                          </Label>
                          <Input id="announcement-media-input-user" type="file" accept="image/*,video/*" onChange={handleAnnouncementMediaUpload} className="hidden" />
                        </>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleAddAnnouncement}
                    disabled={isSaving || !newAnnouncement.description}
                    className="w-full bg-accent text-accent-foreground"
                  >
                    {isSaving ? t("common.creating", "Adding...") : t("userDashboard.postAd", "Add Announcement")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Ads List - matching public profile card format */}
          {announcements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("userDashboard.noAds")}</p>
            </div>
          ) : (
            <div className="w-full max-w-[500px] mx-auto space-y-1">
              {announcements.map((ad) => (
                <Card key={ad.id} className="overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary">
                  <div className="p-4 pb-0 px-[6px] py-[3px]">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-background">
                          <AvatarImage src={profile?.avatar_url} alt={profile?.first_name} />
                          <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                            {profile?.first_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">
                              {profile?.first_name} {profile?.last_name}
                            </h3>
                            {isAdExpired(ad) ? <Badge variant="outline" className="text-xs text-destructive border-destructive">
                                Expired
                              </Badge> : <Badge variant="outline" className="text-xs">{getDaysRemaining(ad)}d left</Badge>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>User</span>
                            <span>·</span>
                            <span>{new Date(ad.date).toLocaleDateString()}</span>
                            <span>·</span>
                            {ad.is_premium 
                              ? <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Promotion</Badge> 
                              : <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Ad</Badge>}
                          </div>
                        </div>
                      </div>
                      {/* Delete button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
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
                    <ExpandableText text={ad.description} className="mt-3" />
                  </div>
                  
                  {ad.is_premium && ad.media_url && (
                    <div className="mt-3 cursor-pointer bg-muted/30" onClick={() => setMediaPreview({
                      url: ad.media_url!,
                      type: ad.media_type === "video" ? "video" : "image"
                    })}>
                      {ad.media_type === "video" ? (
                        <div className="relative w-full aspect-video">
                          <video src={ad.media_url} className="absolute inset-0 w-full h-full object-contain bg-black" onClick={e => e.stopPropagation()} />
                        </div>
                      ) : (
                        <img src={ad.media_url} alt="Announcement media" className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity" />
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Media Preview Dialog */}
      <InstagramZoomPreview media={mediaPreview} onClose={() => setMediaPreview(null)} />
    </div>
  );
};

export default UserDashboard;
