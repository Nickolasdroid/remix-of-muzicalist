import { useState, useEffect } from "react";
import { formatSmartDate, formatDateNoYear, cn, sanitizeFileName } from "@/lib/utils";
import SettingsTab, { type SettingSection } from "@/components/SettingsTab";
import ExpandableText from "@/components/ExpandableText";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import CountryFlagIcon from "@/components/CountryFlagIcon";
import { AdSlotInfoButton } from "@/components/AdSlotInfoButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Camera, Save, User, MapPin, Star, Music, Calendar as CalendarIcon, Award, Phone, Mail, Edit2, X, Megaphone, Plus, Trash2, Images, Play, Upload, MessageSquare, MessageCircle, FileText, Settings as SettingsIcon, DollarSign, Euro, Facebook, Instagram, Youtube, Link as LinkIcon, Music2, Heart, Clock, AlertCircle, Users, BarChart3, EyeOff, Eye, Lock, MoreHorizontal, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CommentsDialog from "@/components/CommentsDialog";

import { Switch } from "@/components/ui/switch";
import { isAdExpired, getDaysRemaining } from "@/lib/adExpiration";
import { getCurrencyForCountry } from "@/lib/countryCurrencies";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import InstrumentSelector from "@/components/InstrumentSelector";
import { getInstrumentIcon } from "@/lib/instrumentIcons";
import EditableField from "@/components/EditableField";
import { Calendar } from "@/components/ui/calendar";
import BookedEventsList, { parseBookedEvents, type BookedEvent } from "@/components/BookedEventsList";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import GenrePickerDialog from "@/components/GenrePickerDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import { parseYMDToLocalDate } from "@/lib/utils";
import { getAvatarOutlineClasses, getAvatarOutlineClassesLarge } from "@/lib/subscriptionStyles";
import { isFree, isPremium, canPost, canSetEstimatedPrice, getImageLimit, getVideoLimit, getPostLimit, getAdLimit, getPromotionLimit, getSocialLinkLimit, countFilledSocialLinks, getEstimatedPriceLimit } from "@/lib/planLimits";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { Progress } from "@/components/ui/progress";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import InstagramZoomPreview from "@/components/InstagramZoomPreview";
import SmoothVideoPlayer from "@/components/SmoothVideoPlayer";
import PricingEntriesEditor from "@/components/PricingEntriesEditor";
import { useUserRole } from "@/hooks/useUserRole";
const Dashboard = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useUserRole();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [commentsTarget, setCommentsTarget] = useState<{ id: string; type: "post" | "announcement" } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isAddingPrice, setIsAddingPrice] = useState(false);
  const [pricingCount, setPricingCount] = useState(0);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "profile");
  const [profileSection, setProfileSection] = useState(searchParams.get('section') || "details");

  // Force admins to allowed sections only
  useEffect(() => {
    if (isAdmin && profileSection !== "posts" && profileSection !== "announcements") {
      setProfileSection("posts");
    }
  }, [isAdmin, profileSection]);
  const [settingsSection, setSettingsSection] = useState<SettingSection>("main");

  const settingsSectionTitles: Record<SettingSection, string> = {
    main: "Settings",
    account: "Account",
    system: "System",
    email: "Email Address",
    password: "Change Password",
    language: "Language",
    promotion: "Promotion",
    report: "Report an Issue",
    logout: "Sign Out",
    delete: "Delete Account",
  };

  const getMobileTitle = () => {
    if (activeTab === "settings") {
      return settingsSectionTitles[settingsSection] || "Settings";
    }
    return undefined;
  };

  const getMobileBackPath = (): string | number | undefined => {
    if (activeTab === "settings") {
      if (settingsSection !== "main") {
        return undefined; // will be handled by onBack
      }
      return -1;
    }
    return undefined;
  };

  // Update active tab when URL params change
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
    const section = searchParams.get('section');
    if (section) {
      setProfileSection(section);
    }
    if (searchParams.get('new') === '1') {
      if (section === 'posts') setShowPostDialog(true);
      if (section === 'announcements') setShowAnnouncementDialog(true);
    }
  }, [searchParams]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({
    x: 0,
    y: 0
  });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    stageName: "",
    email: "",
    phone: "",
    county: "",
    country: "",
    specialization: "",
    musicGenres: "",
    experienceLevel: "",
    numberOfEvents: "",
    careerStartYear: "",
    bio: "",
    estimatedPrice: "",
    facebookUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    tiktokUrl: "",
    spotifyUrl: "",
    instruments: "",
    hidePhone: false,
    hideEmail: false
  });

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
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);

  // Announcement limits (plan-based)
  const currentPlan = profile?.plan;
  const STANDARD_AD_LIMIT = isAdmin ? Number.POSITIVE_INFINITY : getAdLimit(currentPlan);
  const PREMIUM_AD_LIMIT = isAdmin ? Number.POSITIVE_INFINITY : getPromotionLimit(currentPlan);

  // Consumed ad/promotion/post slots (rolling 30-day window).
  // A slot stays occupied for 30 days from creation, even if the item is deleted.
  const [consumedSlots, setConsumedSlots] = useState<{ is_premium: boolean; consumed_at: string; kind?: string }[]>([]);
  const SLOT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
  const activeConsumedSlots = consumedSlots.filter(
    (s) => Date.now() - new Date(s.consumed_at).getTime() < SLOT_COOLDOWN_MS,
  );
  const standardAdsUsed = activeConsumedSlots.filter((s) => (s.kind ?? 'ad') === 'ad' && !s.is_premium).length;
  const premiumAdsUsed = activeConsumedSlots.filter((s) => (s.kind ?? 'ad') === 'ad' && s.is_premium).length;
  const postsUsed = activeConsumedSlots.filter((s) => s.kind === 'post').length;
  const standardAdsRemaining = STANDARD_AD_LIMIT - standardAdsUsed;
  const premiumAdsRemaining = PREMIUM_AD_LIMIT - premiumAdsUsed;

  // Promotion dialog state (in Posts section)
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    description: "",
    mediaUrl: "",
    mediaType: ""
  });

  // Posts state
  const [posts, setPosts] = useState<any[]>([]);
  const [monthlyPostsCount, setMonthlyPostsCount] = useState(0);
  const [newPost, setNewPost] = useState({
    content: "",
    mediaUrl: "",
    mediaType: ""
  });
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postMediaType, setPostMediaType] = useState<'image' | 'video' | 'promotion'>('image');
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [postUploadProgress, setPostUploadProgress] = useState<number | null>(null);
  const [promotionUploadProgress, setPromotionUploadProgress] = useState<number | null>(null);
  const [announcementUploadProgress, setAnnouncementUploadProgress] = useState<number | null>(null);
  
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);

  // Post limits (plan-based) — slot-based with 30-day cooldown (same as ads)
  const STANDARD_POST_LIMIT = isAdmin ? Number.POSITIVE_INFINITY : getPostLimit(currentPlan);
  const postsRemaining = STANDARD_POST_LIMIT - postsUsed;

  // Gallery state
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [galleryUploadType, setGalleryUploadType] = useState<'image' | 'video'>('image');
  const [videoUrl, setVideoUrl] = useState("");
  const [deleteGalleryItem, setDeleteGalleryItem] = useState<{
    id: string;
    url: string;
    type: string;
  } | null>(null);

  // Gallery limits (plan-based)
  const STANDARD_IMAGE_LIMIT = getImageLimit(currentPlan);
  const STANDARD_VIDEO_LIMIT = getVideoLimit(currentPlan);

  // Calculate used gallery items
  const imagesUsed = galleryItems.filter((item) => item.type === 'image').length;
  const videosUsed = galleryItems.filter((item) => item.type === 'video').length;
  const imagesRemaining = STANDARD_IMAGE_LIMIT - imagesUsed;
  const videosRemaining = STANDARD_VIDEO_LIMIT - videosUsed;

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [eventStatus, setEventStatus] = useState<'blocked' | 'available'>('available');
  const [userChangedStatus, setUserChangedStatus] = useState(false);
  const [eventNotes, setEventNotes] = useState("");

  // Booking requests state
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [selectedBookingRequest, setSelectedBookingRequest] = useState<any | null>(null);
  const [showBookingDetailDialog, setShowBookingDetailDialog] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);

  // Following state
  const [followingCount, setFollowingCount] = useState(0);
  const [followingArtists, setFollowingArtists] = useState<any[]>([]);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [unfollowTargetId, setUnfollowTargetId] = useState<string | null>(null);

  // Followers state
  const [followersCount, setFollowersCount] = useState(0);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [removeFollowerTargetId, setRemoveFollowerTargetId] = useState<string | null>(null);

  const romanianCounties = ["Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brașov", "Brăila", "București", "Buzău", "Caraș-Severin", "Călărași", "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova", "Satu Mare", "Sălaj", "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vaslui", "Vâlcea", "Vrancea"];

  // Data loading functions (defined early to avoid hoisting issues)
  const loadAnnouncements = async () => {
    if (!user) return;
    const cutoffIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [{ data }, slotsRes] = await Promise.all([
      supabase.from('announcements').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }),
      (supabase as any)
        .from('consumed_ad_slots')
        .select('is_premium, consumed_at, kind')
        .eq('profile_id', user.id)
        .gte('consumed_at', cutoffIso),
    ]);
    if (slotsRes?.data) setConsumedSlots(slotsRes.data);
    if (data) {
      const announcementsWithLikes = await Promise.all(data.map(async (announcement) => {
        const { count } = await (supabase as any).from('announcement_likes').select('id', { count: 'exact', head: true }).eq('announcement_id', announcement.id);
        const { data: likeData } = await (supabase as any).from('announcement_likes').select('id').eq('announcement_id', announcement.id).eq('user_id', user.id).maybeSingle();
        return { ...announcement, likes: count || 0, isLiked: !!likeData };
      }));
      setAnnouncements(announcementsWithLikes);
    }
  };
  const loadGalleryItems = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from('gallery_items').select('*').eq('profile_id', user.id).order('created_at', {
      ascending: false
    });
    if (data) setGalleryItems(data);
  };
  const loadCalendarEvents = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from('calendar_events').select('*').eq('profile_id', user.id);
    if (data) setCalendarEvents(data);
  };
  const loadBookingRequests = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from('booking_requests').select('*').eq('profile_id', user.id).order('created_at', {
      ascending: false
    });
    if (data) setBookingRequests(data);
  };
  const loadPosts = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from('posts').select('*').eq('profile_id', user.id).order('created_at', {
      ascending: false
    });
    if (data) {
      // Fetch likes count and isLiked for each post
      const postsWithLikes = await Promise.all(data.map(async (post) => {
        const {
          count
        } = await supabase.from('post_likes').select('id', {
          count: 'exact',
          head: true
        }).eq('post_id', post.id);
        const { data: likeData } = await supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle();
        return {
          ...post,
          likes: count || 0,
          isLiked: !!likeData
        };
      }));
      setPosts(postsWithLikes);

      // Calculate posts created this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const postsThisMonth = data.filter((post) => new Date(post.created_at) >= startOfMonth);
      setMonthlyPostsCount(postsThisMonth.length);
    }
  };
  const handlePostLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    setPosts((items) => items.map((p) => p.id === postId ? {
      ...p,
      isLiked: !p.isLiked,
      likes: p.isLiked ? Math.max(0, (p.likes || 0) - 1) : (p.likes || 0) + 1
    } : p));
    try {
      if (post.isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      }
    } catch (error) {
      setPosts((items) => items.map((p) => p.id === postId ? post : p));
      console.error('Error toggling post like:', error);
    }
  };
  const handleAnnouncementLike = async (announcementId: string) => {
    if (!user) return;
    const announcement = announcements.find((a) => a.id === announcementId);
    if (!announcement) return;
    setAnnouncements((items) => items.map((a) => a.id === announcementId ? {
      ...a,
      isLiked: !a.isLiked,
      likes: a.isLiked ? Math.max(0, (a.likes || 0) - 1) : (a.likes || 0) + 1
    } : a));
    try {
      if (announcement.isLiked) {
        await (supabase as any).from('announcement_likes').delete().eq('announcement_id', announcementId).eq('user_id', user.id);
      } else {
        await (supabase as any).from('announcement_likes').insert({ announcement_id: announcementId, user_id: user.id });
      }
    } catch (error) {
      setAnnouncements((items) => items.map((a) => a.id === announcementId ? announcement : a));
      console.error('Error toggling announcement like:', error);
    }
  };
  const loadReviews = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from('reviews').select('id, reviewer_name, rating, comment, created_at, reviewer_user_id').eq('profile_id', user.id).order('created_at', {
      ascending: false
    });
    if (data) setReviews(data);
  };
  const loadFollowing = async () => {
    if (!user) return;
    const { data, count } = await supabase.
    from('followers').
    select('artist_id, profiles!followers_artist_id_fkey(id, stage_name, avatar_url, specialization, county)', { count: 'exact' }).
    eq('follower_id', user.id);
    setFollowingCount(count || 0);
    if (data) {
      setFollowingArtists(data.map((f: any) => f.profiles).filter(Boolean));
    }
  };
  const loadFollowers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('artist_id', user.id);
    if (data && data.length > 0) {
      const followerIds = data.map((f: any) => f.follower_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, specialization, county')
        .in('id', followerIds);
      setFollowersList(profiles || []);
      setFollowersCount(profiles?.length || 0);
    } else {
      setFollowersList([]);
      setFollowersCount(0);
    }
  };
  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
      setReviews(reviews.filter((r) => r.id !== reviewId));
      toast({
        title: "Review Deleted",
        description: "The review has been successfully deleted."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setDeleteReviewId(null);
    }
  };
  const getAverageRating = () => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };
  useEffect(() => {
    checkAuth();
  }, []);
  useEffect(() => {
    if (user) {
      loadAnnouncements();
      loadGalleryItems();
      loadCalendarEvents();
      loadBookingRequests();
      loadPosts();
      loadReviews();
      loadFollowing();
      loadFollowers();
    }
  }, [user]);
  const checkAuth = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      const {
        data: profileData,
        error
      } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (error) throw error;
      setProfile(profileData);
      setFormData({
        firstName: profileData.first_name || "",
        lastName: profileData.last_name || "",
        stageName: profileData.stage_name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        county: profileData.county || "",
        country: profileData.country || "",
        specialization: profileData.specialization || "",
        musicGenres: profileData.music_genres || "",
        experienceLevel: profileData.experience_level || "",
        numberOfEvents: profileData.number_of_events?.toString() || "",
        careerStartYear: profileData.career_start_year?.toString() || "",
        bio: profileData.bio || "",
        estimatedPrice: profileData.estimated_price || "",
        facebookUrl: profileData.facebook_url || "",
        instagramUrl: profileData.instagram_url || "",
        youtubeUrl: profileData.youtube_url || "",
        tiktokUrl: profileData.tiktok_url || "",
        spotifyUrl: profileData.spotify_url || "",
        instruments: profileData.instruments || "",
        hidePhone: profileData.hide_phone || false,
        hideEmail: profileData.hide_email || false
      });
    } catch (error: any) {
      console.error('Auth check error:', error);
      toast({
        title: "Error",
        description: "Failed to load profile.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleLogout = async () => {
    try {
      // Clear local state first
      setUser(null);
      setProfile(null);
      // Sign out from Supabase (ignore errors if session already invalid)
      await supabase.auth.signOut({
        scope: 'local'
      });
    } catch (error) {
      // Ignore errors - session might already be invalid
      console.log('Logout completed');
    }
    navigate('/');
  };
  const formatPostDate = formatSmartDate;
  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Allow picking the same file again
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
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };
  const handleSaveAvatar = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return;
    setIsSaving(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const fileName = `${user.id}/avatar.jpg`;
      const {
        error: uploadError
      } = await supabase.storage.from("avatars").upload(fileName, croppedBlob, {
        contentType: "image/jpeg",
        cacheControl: "0",
        upsert: true
      });
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      // Bust browser cache so the new image appears instantly
      const freshUrl = `${publicUrl}?v=${Date.now()}`;
      const {
        error: updateError
      } = await supabase.from("profiles").update({
        avatar_url: freshUrl
      }).eq("id", user.id);
      if (updateError) throw updateError;
      setProfile((prev: any) => ({
        ...(prev ?? {}),
        avatar_url: freshUrl
      }));
      setShowCropper(false);
      setImageSrc(null);
      toast({
        title: "Success",
        description: "Profile picture updated successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile picture.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleRemoveAvatar = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`]);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);
      if (updateError) throw updateError;
      setProfile((prev: any) => ({ ...(prev ?? {}), avatar_url: null }));
      toast({
        title: "Success",
        description: "Profile picture removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  const startEditing = (field: string) => {
    setEditingField(field);
  };
  const cancelEditing = () => {
    setEditingField(null);
    checkAuth();
  };
  const saveField = async (field: string) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updateData: any = {};
      switch (field) {
        case 'names':
          updateData.stage_name = formData.stageName;
          break;
        case 'contact':
          updateData.phone = formData.phone;
          break;
        case 'location':
          updateData.county = formData.county;
          break;
        case 'genres':
          updateData.music_genres = formData.musicGenres;
          break;
        case 'experience':
          updateData.experience_level = formData.experienceLevel as any;
          updateData.number_of_events = parseInt(formData.numberOfEvents);
          break;
        case 'bio':
          updateData.bio = formData.bio;
          break;
        case 'price':
          updateData.estimated_price = formData.estimatedPrice;
          break;
        case 'social':
          updateData.facebook_url = formData.facebookUrl;
          updateData.instagram_url = formData.instagramUrl;
          updateData.youtube_url = formData.youtubeUrl;
          updateData.tiktok_url = formData.tiktokUrl;
          updateData.spotify_url = formData.spotifyUrl;
          break;
        case 'instruments':
          updateData.instruments = formData.instruments;
          break;
      }
      const {
        error
      } = await supabase.from('profiles').update(updateData).eq('id', user.id);
      if (error) throw error;
      await checkAuth();
      setEditingField(null);
      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
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
      toast({ title: "Error", description: "Video file size must not exceed 500 MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setIsSaving(true);
    setAnnouncementUploadProgress(0);
    try {
      const fileName = `${user.id}/announcements/${Date.now()}_${sanitizeFileName(file.name)}`;
      const publicUrl = await uploadFileWithProgress('avatars', fileName, file, (p) => setAnnouncementUploadProgress(p));
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      setNewAnnouncement({
        ...newAnnouncement,
        mediaUrl: publicUrl,
        mediaType
      });
      toast({
        title: "Success",
        description: "Media uploaded!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setAnnouncementUploadProgress(null);
      e.target.value = "";
    }
  };
  const handleAddAnnouncement = async () => {
    if (!user || !newAnnouncement.description) return;
    if (standardAdsUsed >= STANDARD_AD_LIMIT) {
      toast({ title: "Limit reached", description: `You can only create ${STANDARD_AD_LIMIT} announcements per 30-day period.`, variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const { data: inserted, error } = await supabase.from('announcements').insert({
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
      }).select('id').single();
      if (error) throw error;
      // Record consumed slot (locks it for 30 days even if the ad is deleted).
      await (supabase as any).from('consumed_ad_slots').insert({
        profile_id: user.id,
        is_premium: false,
        announcement_id: inserted?.id ?? null,
      });
      await loadAnnouncements();
      setNewAnnouncement({
        description: "",
        isPremium: false,
        mediaUrl: "",
        mediaType: "",
        location: "",
        eventDate: "",
        budget: ""
      });
      setShowAnnouncementDialog(false);
      toast({
        title: "Success",
        description: "Announcement added!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeleteAnnouncement = async (id: string) => {
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      await loadAnnouncements();
      toast({
        title: "Success",
        description: "Announcement deleted!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setDeleteAnnouncementId(null);
    }
  };

  // Promotion functions (in Posts section)
  const handlePromotionMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type.startsWith('video/') && file.size > 500 * 1024 * 1024) {
      toast({ title: "Error", description: "Video file size must not exceed 500 MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setIsSaving(true);
    setPromotionUploadProgress(0);
    try {
      const fileName = `${user.id}/announcements/${Date.now()}_${sanitizeFileName(file.name)}`;
      const publicUrl = await uploadFileWithProgress('avatars', fileName, file, (p) => setPromotionUploadProgress(p));
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      setNewPromotion({ ...newPromotion, mediaUrl: publicUrl, mediaType });
      toast({ title: "Success", description: "Media uploaded!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setPromotionUploadProgress(null);
      e.target.value = "";
    }
  };

  const handleAddPromotion = async () => {
    if (!user || !newPromotion.description) return;
    if (premiumAdsUsed >= PREMIUM_AD_LIMIT) {
      toast({ title: "Limit reached", description: `You can only create ${PREMIUM_AD_LIMIT} promotions per 30-day period.`, variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const { data: inserted, error } = await supabase.from('announcements').insert({
        profile_id: user.id,
        title: "Announcement",
        date: todayDate,
        description: newPromotion.description,
        is_premium: true,
        media_url: newPromotion.mediaUrl || null,
        media_type: newPromotion.mediaType || null
      }).select('id').single();
      if (error) throw error;
      // Record consumed slot (locks it for 30 days even if the promotion is deleted).
      await (supabase as any).from('consumed_ad_slots').insert({
        profile_id: user.id,
        is_premium: true,
        announcement_id: inserted?.id ?? null,
      });
      await loadAnnouncements();
      setNewPromotion({ description: "", mediaUrl: "", mediaType: "" });
      setShowPromotionDialog(false);
      toast({ title: "Success", description: "Promotion created!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Posts functions
  const handleAddPost = async () => {
    if (!user || !newPost.content || !newPost.mediaUrl) return;

    // Check post slot limit (rolling 30-day window)
    if (postsUsed >= STANDARD_POST_LIMIT) {
      toast({
        title: "Limit reached",
        description: `You can only create ${STANDARD_POST_LIMIT} posts per 30-day window with your subscription.`,
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      const { data: insertedPost, error } = await supabase.from('posts').insert({
        profile_id: user.id,
        content: newPost.content,
        media_url: newPost.mediaUrl || null,
        media_type: newPost.mediaType || null
      }).select('id').single();
      if (error) throw error;
      // Record consumed slot (locks it for 30 days even if the post is deleted).
      await (supabase as any).from('consumed_ad_slots').insert({
        profile_id: user.id,
        is_premium: false,
        announcement_id: insertedPost?.id ?? null,
        kind: 'post',
      });
      await loadPosts();
      await loadAnnouncements();
      setNewPost({
        content: "",
        mediaUrl: "",
        mediaType: ""
      });
      setShowPostDialog(false);
      setPostMediaType('image');
      toast({
        title: "Success",
        description: "Post created!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeletePost = async (id: string) => {
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      await loadPosts();
      toast({
        title: "Success",
        description: "Post deleted!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setDeletePostId(null);
    }
  };
  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsSaving(true);
    setPostUploadProgress(0);
    try {
      const fileName = `${user.id}/posts/${Date.now()}_${sanitizeFileName(file.name)}`;
      const publicUrl = await uploadFileWithProgress('avatars', fileName, file, (p) => setPostUploadProgress(p));
      setNewPost({
        ...newPost,
        mediaUrl: publicUrl,
        mediaType: 'image'
      });
      toast({
        title: "Success",
        description: "Image uploaded!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setPostUploadProgress(null);
      e.target.value = "";
    }
  };

  const handlePostVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 500 * 1024 * 1024) {
      toast({ title: "Error", description: "Video file size must not exceed 500 MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setIsSaving(true);
    setPostUploadProgress(0);
    try {
      const fileName = `${user.id}/posts/${Date.now()}_${sanitizeFileName(file.name)}`;
      const publicUrl = await uploadFileWithProgress('avatars', fileName, file, (p) => setPostUploadProgress(p));
      setNewPost({
        ...newPost,
        mediaUrl: publicUrl,
        mediaType: 'video'
      });
      toast({ title: "Success", description: "Video uploaded!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setPostUploadProgress(null);
      e.target.value = "";
    }
  };

  // Gallery functions
  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check image limit
    if (imagesUsed >= STANDARD_IMAGE_LIMIT) {
      toast({
        title: "Limit reached",
        description: `You can only add up to ${STANDARD_IMAGE_LIMIT} images with your subscription.`,
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      const sanitizedName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${user.id}/gallery/${Date.now()}_${sanitizedName}`;
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const {
        error: insertError
      } = await supabase.from('gallery_items').insert({
        profile_id: user.id,
        type: 'image',
        url: publicUrl
      });
      if (insertError) throw insertError;
      await loadGalleryItems();
      setShowGalleryDialog(false);
      toast({
        title: "Success",
        description: "Image uploaded!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleGalleryVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check video limit
    if (videosUsed >= STANDARD_VIDEO_LIMIT) {
      toast({
        title: "Limit reached",
        description: `You can only add up to ${STANDARD_VIDEO_LIMIT} videos with your subscription.`,
        variant: "destructive"
      });
      return;
    }

    // Check file size (500 MB limit)
    const maxSize = 500 * 1024 * 1024; // 500 MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "Video file size must not exceed 500 MB.",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      const sanitizedName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${user.id}/gallery/videos/${Date.now()}_${sanitizedName}`;
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const {
        error: insertError
      } = await supabase.from('gallery_items').insert({
        profile_id: user.id,
        type: 'video',
        url: publicUrl
      });
      if (insertError) throw insertError;
      await loadGalleryItems();
      setShowGalleryDialog(false);
      toast({
        title: "Success",
        description: "Video uploaded!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleAddVideo = async () => {
    if (!user || !videoUrl) return;
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from('gallery_items').insert({
        profile_id: user.id,
        type: 'video',
        url: videoUrl
      });
      if (error) throw error;
      await loadGalleryItems();
      setVideoUrl("");
      setShowGalleryDialog(false);
      toast({
        title: "Success",
        description: "Video added!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeleteGalleryItem = async (id: string, url: string, type: string) => {
    setIsSaving(true);
    try {
      // Check if it's an uploaded file (stored in our storage bucket)
      if (url.includes('supabase.co/storage')) {
        const filePath = url.split('/').slice(-4).join('/');
        await supabase.storage.from('avatars').remove([filePath]);
      }
      const {
        error
      } = await supabase.from('gallery_items').delete().eq('id', id);
      if (error) throw error;
      await loadGalleryItems();
      toast({
        title: "Success",
        description: "Item deleted!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
      setDeleteGalleryItem(null);
    }
  };

  // Calendar functions
  const getBookingRequestForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return bookingRequests.find((req) => req.event_date === dateStr && req.status === 'accepted');
  };
  const getBookedEventKey = (event: BookedEvent) => {
    return [event.timeSlot?.trim() ?? "", event.bookedBy?.trim() ?? "", event.contact?.trim() ?? "", event.phone?.trim() ?? "", event.eventType?.trim() ?? ""].join("|");
  };
  const extractTimeFromTimeSlotText = (timeSlot?: string) => {
    if (!timeSlot) return null;
    const match = timeSlot.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (!match) return null;
    return {
      startTime: match[1],
      endTime: match[2]
    };
  };
  const extractTimesFromRequestMessage = (message?: string | null) => {
    if (!message) return null;
    const match = message.match(/Time:\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2})\s*-\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2})/i);
    if (!match) return null;
    return {
      startTime: match[1],
      endTime: match[2]
    };
  };
  const doesRequestCoverDate = (request: any, dateStr: string) => {
    const start = request.event_date as string | undefined;
    const end = request.event_end_date as string | null | undefined || start;
    if (!start || !end) return false;
    // ISO date strings are safe for lexicographic comparison
    return dateStr >= start && dateStr <= end;
  };
  const rejectAcceptedBookingRequestsForBookedEvents = async (dateStr: string, removedEvents: BookedEvent[]) => {
    if (!user || removedEvents.length === 0) return 0;
    const normalize = (v?: string | null) => (v ?? "").trim().toLowerCase();
    const acceptedCandidates = bookingRequests.filter((req) => {
      return req.profile_id === user.id && req.status === 'accepted' && doesRequestCoverDate(req, dateStr);
    });
    const idsToReject = new Set<string>();
    for (const removedEvent of removedEvents) {
      const wantedEmail = normalize(removedEvent.contact);
      const wantedName = (removedEvent.bookedBy ?? "").trim();
      const wantedTimes = extractTimeFromTimeSlotText(removedEvent.timeSlot);
      const match = acceptedCandidates.find((req) => {
        if (wantedEmail && normalize(req.requester_email) !== wantedEmail) return false;
        if (wantedName && (req.requester_name ?? "").trim() !== wantedName) return false;
        if (wantedTimes) {
          const reqTimes = extractTimesFromRequestMessage(req.message);
          if (!reqTimes) return false;
          return reqTimes.startTime === wantedTimes.startTime && reqTimes.endTime === wantedTimes.endTime;
        }
        return true;
      });
      if (match?.id) idsToReject.add(match.id);
    }
    if (idsToReject.size === 0) return 0;
    const {
      error
    } = await supabase.from('booking_requests').update({
      status: 'rejected'
    }).in('id', Array.from(idsToReject));
    if (error) throw error;
    return idsToReject.size;
  };
  const [showBookingWarningDialog, setShowBookingWarningDialog] = useState(false);
  const [showDeleteWarningDialog, setShowDeleteWarningDialog] = useState(false);
  const [pendingCalendarSave, setPendingCalendarSave] = useState<{
    dateStr: string;
    status: string;
    notes: string;
  } | null>(null);
  const handleSaveCalendarEvent = async () => {
    if (!user || !selectedDate) return;

    // Use local date to avoid timezone issues
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    // Check if there's an accepted booking for this date
    const existingBooking = getBookingRequestForDate(selectedDate);
    const currentEvent = getEventForDate(selectedDate);

    // If there's an accepted booking and we're changing the status, warn the user
    const isBookedStatus = currentEvent?.status === 'busy' || currentEvent?.status === 'booked';
    if (existingBooking && isBookedStatus) {
      setPendingCalendarSave({
        dateStr,
        status: eventStatus,
        notes: eventNotes
      });
      setShowBookingWarningDialog(true);
      return;
    }
    await saveCalendarEventDirect(dateStr, eventStatus, eventNotes);
  };
  const saveCalendarEventDirect = async (dateStr: string, status: string, notes: string) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from('calendar_events').upsert({
        profile_id: user.id,
        event_date: dateStr,
        status: status,
        notes: notes
      }, {
        onConflict: 'profile_id,event_date'
      });
      if (error) throw error;
      await loadCalendarEvents();
      setEventNotes("");
      toast({
        title: "Success",
        description: "Calendar updated!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleConfirmBookingOverwrite = async () => {
    if (!user || !pendingCalendarSave || !selectedDate) return;
    setIsSaving(true);
    try {
      // Update the accepted booking request to rejected status
      const existingBooking = getBookingRequestForDate(selectedDate);
      if (existingBooking) {
        const {
          error: updateError
        } = await supabase.from('booking_requests').update({
          status: 'rejected'
        }).eq('id', existingBooking.id);
        if (updateError) throw updateError;
      }

      // Save the calendar event
      await saveCalendarEventDirect(pendingCalendarSave.dateStr, pendingCalendarSave.status, pendingCalendarSave.notes);

      // Reload booking requests
      await loadBookingRequests();
      setShowBookingWarningDialog(false);
      setPendingCalendarSave(null);
      toast({
        title: "Updated",
        description: "Calendar updated and booking request marked as rejected."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setIsSaving(false);
    }
  };
  const handleDeleteCalendarEvent = async () => {
    if (!user || !selectedDate) return;

    // Check if there's an accepted booking for this date
    const existingBooking = getBookingRequestForDate(selectedDate);
    if (existingBooking) {
      setShowDeleteWarningDialog(true);
      return;
    }
    await deleteCalendarEventDirect();
  };
  const deleteCalendarEventDirect = async () => {
    if (!user || !selectedDate) return;
    setIsSaving(true);
    try {
      // Use local date to avoid timezone issues
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const {
        error
      } = await supabase.from('calendar_events').delete().eq('profile_id', user.id).eq('event_date', dateStr);
      if (error) throw error;
      await loadCalendarEvents();
      setSelectedDate(undefined);
      toast({
        title: "Success",
        description: "Event deleted!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleConfirmDeleteWithBooking = async () => {
    if (!user || !selectedDate) return;
    setIsSaving(true);
    try {
      // Update the booking request to rejected
      const existingBooking = getBookingRequestForDate(selectedDate);
      if (existingBooking) {
        const {
          error: updateError
        } = await supabase.from('booking_requests').update({
          status: 'rejected'
        }).eq('id', existingBooking.id);
        if (updateError) throw updateError;
      }

      // Delete the calendar event
      await deleteCalendarEventDirect();

      // Reload booking requests
      await loadBookingRequests();
      setShowDeleteWarningDialog(false);
      toast({
        title: "Deleted",
        description: "Calendar event deleted and booking request marked as rejected."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const getEventForDate = (date: Date) => {
    // Use local date to avoid timezone issues
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return calendarEvents.find((event) => event.event_date === dateStr);
  };

  // Booking request functions
  const handleAcceptBooking = async (request: any) => {
    setIsSaving(true);
    try {
      // Update the booking request status to accepted
      const {
        error: updateError
      } = await supabase.from('booking_requests').update({
        status: 'accepted'
      }).eq('id', request.id);
      if (updateError) throw updateError;

      // Calculate all dates between start and end date - parse as local time
      const [startYear, startMonth, startDay] = request.event_date.split('-').map(Number);
      const startDate = new Date(startYear, startMonth - 1, startDay);
      let endDate = startDate;
      if (request.event_end_date) {
        const [endYear, endMonth, endDay] = request.event_end_date.split('-').map(Number);
        endDate = new Date(endYear, endMonth - 1, endDay);
      }
      const datesToBook: string[] = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Format as YYYY-MM-DD using local date components
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        datesToBook.push(`${year}-${month}-${day}`);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Extract time info from the request message
      const timeMatch = request.message?.match(/Time:\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2})\s*-\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2})/i);
      const timeInfo = timeMatch ? `Time: ${timeMatch[1]} - ${timeMatch[2]}` : '';

      // Extract additional details from the message (remove the time line)
      let additionalDetails = '';
      if (request.message) {
        additionalDetails = request.message.replace(/Time:\s*(?:[\w\s,]+\s+)?\d{1,2}:\d{2}\s*-\s*(?:[\w\s,]+\s+)?\d{1,2}:\d{2}/i, '').trim();
      }

      // Build the new booking entry text
      const newBookingEntry = `${timeInfo ? timeInfo + '\n' : ''}Booked by: ${request.requester_name}\nEvent: ${request.event_type || 'Event'}${request.requester_email ? '\nContact: ' + request.requester_email : ''}${request.requester_phone ? '\nPhone: ' + request.requester_phone : ''}${additionalDetails ? '\nDetails: ' + additionalDetails : ''}`;

      // Add all dates to the calendar, appending to existing entries if present
      for (const date of datesToBook) {
        // Check if there's an existing calendar event for this date
        const {
          data: existingEvent
        } = await supabase.from('calendar_events').select('*').eq('profile_id', user!.id).eq('event_date', date).maybeSingle();
        let updatedNotes = newBookingEntry;
        if (datesToBook.length > 1) {
          updatedNotes += `\n(Day ${datesToBook.indexOf(date) + 1} of ${datesToBook.length})`;
        }
        if (existingEvent && existingEvent.status === 'busy' && existingEvent.notes) {
          // Append to existing notes with a separator
          updatedNotes = existingEvent.notes + '\n\n---\n\n' + updatedNotes;
        }
        const {
          error: calendarError
        } = await supabase.from('calendar_events').upsert({
          profile_id: user!.id,
          event_date: date,
          status: 'busy',
          notes: updatedNotes
        }, {
          onConflict: 'profile_id,event_date'
        });
        if (calendarError) throw calendarError;
      }
      await loadBookingRequests();
      await loadCalendarEvents();
      toast({
        title: "Success",
        description: `Booking accepted and ${datesToBook.length > 1 ? datesToBook.length + ' days' : '1 day'} added to calendar!`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeclineBooking = async (requestId: string) => {
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from('booking_requests').update({
        status: 'rejected'
      }).eq('id', requestId);
      if (error) throw error;
      await loadBookingRequests();
      toast({
        title: "Success",
        description: "Booking request rejected."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeleteBookingRequest = async (requestId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('booking_requests').delete().eq('id', requestId);
      if (error) throw error;
      await loadBookingRequests();
      setShowBookingDetailDialog(false);
      toast({
        title: "Deleted",
        description: "Booking request deleted successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Delete user's data from tables
      const {
        error: profileError
      } = await supabase.from('profiles').delete().eq('id', user.id);
      if (profileError) throw profileError;

      // Sign out and delete auth user
      const {
        error: authError
      } = await supabase.auth.signOut();
      if (authError) throw authError;
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted."
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return <div className="min-h-screen md:ml-64 bg-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen md:ml-64 bg-card">
      <Navigation 
        mobileTitle={getMobileTitle()} 
        mobileBackPath={getMobileBackPath()}
        onMobileBack={activeTab === "settings" && settingsSection !== "main" ? () => {
          setSettingsSection("main");
        } : undefined}
      />
      
      <div className="pt-16 md:pt-8 pb-24 md:pb-20 px-0 md:px-4">
        <div className="container mx-auto max-w-6xl px-4 md:px-0">
          {activeTab !== "profile"}
              {/* Profile Tab */}
              {activeTab === "profile" && <div className="space-y-6 md:space-y-8">
                    {/* Header Section */}
                    
                    {/* Mobile Header Layout */}
                    <div className="flex md:hidden flex-col items-center gap-4 mb-6 relative">
                      {/* Top row: Rating (left) - matching public artist profile */}
                      {!isAdmin && (
                        <div className="absolute top-0 left-0 z-10">
                          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground shadow-lg">
                            <Star className="h-4 w-4 fill-current" />
                            {getAverageRating() && <span className="text-sm font-bold">{getAverageRating()}</span>}
                            {reviews.length > 0 && <span className="text-xs opacity-80">({reviews.length})</span>}
                          </div>
                        </div>
                      )}

                      {/* Centered Avatar - with top padding to account for absolute positioned elements */}
                      <div className="relative group cursor-pointer mt-10">
                        <div className={`p-1 rounded-full ${getAvatarOutlineClassesLarge(profile?.plan)}`}>
                          <Avatar className="w-24 h-24 border-3 border-background shadow-lg">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-accent/30 to-accent/10">
                              <User className="h-12 w-12 text-accent" />
                            </AvatarFallback>
                          </Avatar>
                          <label htmlFor="avatar-upload-mobile" className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                            <Camera className="h-6 w-6 text-white" />
                          </label>
                        </div>
                        <input id="avatar-upload-mobile" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        {profile?.avatar_url && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-lg z-20"
                                disabled={isSaving}
                                aria-label="Remove profile picture"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-lg">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove profile picture?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Your profile picture will be deleted. You can upload a new one anytime.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={handleRemoveAvatar}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

                      {/* Centered Name */}
                      <h1 className="text-2xl font-display font-bold text-foreground text-center -mb-2">
                        {formData.stageName}
                      </h1>

                      {/* Centered Category + Location */}
                      <div className="flex flex-wrap items-center justify-center gap-3 -mb-2">
                        {formData.specialization && <Badge className="bg-muted text-muted-foreground border border-border px-3 py-1 text-sm font-semibold">
                            {formData.specialization}
                          </Badge>}
                        {!isAdmin && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">{formData.county}</span>
                            {formData.country && <CountryFlagIcon country={formData.country} className="h-4 w-6 rounded-sm shadow-sm" />}
                          </div>
                        )}
                      </div>

                       {/* Followers + Following count */}
                      {!isAdmin && (
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => setShowFollowersDialog(true)}>
                            
                            <span className="text-sm font-medium">{followersCount} followers</span>
                          </div>
                          <span className="text-muted-foreground/50">·</span>
                          <div className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => setShowFollowingDialog(true)}>
                            <span className="text-sm font-medium">{followingCount} following</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Desktop Header Layout */}
                    <div className="hidden md:flex flex-row gap-8 mb-8">
                      <div className="flex-shrink-0 relative group cursor-pointer">
                        <div className={`p-1 rounded-full ${getAvatarOutlineClassesLarge(profile?.plan)}`}>
                          <Avatar className="w-40 h-40 border-4 border-background shadow-lg">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-accent/30 to-accent/10">
                              <User className="h-20 w-20 text-accent" />
                            </AvatarFallback>
                          </Avatar>
                          <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                            <Camera className="h-8 w-8 text-white" />
                          </label>
                        </div>
                        <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        {profile?.avatar_url && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute bottom-1 right-1 h-9 w-9 rounded-full shadow-lg z-20"
                                disabled={isSaving}
                                aria-label="Remove profile picture"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-lg">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove profile picture?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Your profile picture will be deleted. You can upload a new one anytime.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={handleRemoveAvatar}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-center h-40">
                        <div className="flex flex-row items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h1 className="text-4xl font-display font-bold text-foreground">
                                {formData.stageName}
                              </h1>
                            </div>
                            
                            {/* Category + Location on same line */}
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              {formData.specialization && <Badge className="bg-muted text-muted-foreground border border-border px-4 py-1.5 text-base font-semibold">
                                {formData.specialization}
                              </Badge>}
                              {!isAdmin && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-5 w-5" />
                                  <span className="text-base">{formData.county}</span>
                                  {formData.country && <CountryFlagIcon country={formData.country} className="h-5 w-7 rounded-sm shadow-sm" />}
                                </div>
                              )}
                            </div>

                            {/* Followers + Following count */}
                            {!isAdmin && (
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => setShowFollowersDialog(true)}>
                                  
                                  <span className="text-sm font-medium">{followersCount} followers</span>
                                </div>
                                <span className="text-muted-foreground/50">·</span>
                                <div className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => setShowFollowingDialog(true)}>
                                  <span className="text-sm font-medium">{followingCount} following</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {!isAdmin && (
                            <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground shadow-lg">
                              <Star className="h-6 w-6 fill-current" />
                              {getAverageRating() && <span className="text-2xl font-bold">{getAverageRating()}</span>}
                              {reviews.length > 0 && <span className="text-sm opacity-80">({reviews.length})</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tabs Section */}
                    <Tabs value={profileSection} onValueChange={setProfileSection} className="w-full">
                      <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-5'} mb-3 md:mb-8 rounded-none md:rounded-lg -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full`}>
                        {!isAdmin && (
                          <TabsTrigger value="details" className="flex items-center justify-center gap-2 px-2 md:px-4">
                            <User className="h-5 w-5 md:h-4 md:w-4" />
                            <span className="hidden md:inline">Details</span>
                          </TabsTrigger>
                        )}
                        <TabsTrigger value="posts" className="flex items-center justify-center gap-2 px-2 md:px-4">
                          <FileText className="h-5 w-5 md:h-4 md:w-4" />
                          <span className="hidden md:inline">Posts</span>
                        </TabsTrigger>
                        <TabsTrigger value="announcements" className="flex items-center justify-center gap-2 px-2 md:px-4">
                          <Megaphone className="h-5 w-5 md:h-4 md:w-4" />
                          <span className="hidden md:inline">Announcements</span>
                        </TabsTrigger>
                        {!isAdmin && (
                          <TabsTrigger value="gallery" className="flex items-center justify-center gap-2 px-2 md:px-4">
                            <Images className="h-5 w-5 md:h-4 md:w-4" />
                            <span className="hidden md:inline">Gallery</span>
                          </TabsTrigger>
                        )}
                        {!isAdmin && (
                          <TabsTrigger value="calendar" className="flex items-center justify-center gap-2 px-2 md:px-4">
                            <CalendarIcon className="h-5 w-5 md:h-4 md:w-4" />
                            <span className="hidden md:inline">Calendar</span>
                          </TabsTrigger>
                        )}
                      </TabsList>

                      {/* Details Tab */}
                      {!isAdmin && <TabsContent value="details" className="space-y-4 md:space-y-8">
                        {/* Bio/Description */}
                        <div className="group">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-display font-bold flex items-center gap-2">
                              <User className="h-5 w-5 text-accent" />
                              About Me
                            </h2>
                            {editingField !== 'bio' && <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-accent" onClick={() => startEditing('bio')}>
                                <Edit2 className="h-4 w-4" />
                              </Button>}
                          </div>
                          {editingField === 'bio' ? <div className="space-y-2">
                              <Textarea value={formData.bio} onChange={(e) => {
                    if (e.target.value.length <= 200) {
                      setFormData({
                        ...formData,
                        bio: e.target.value
                      });
                    }
                  }} placeholder="Tell us about yourself, your musical journey, your style..." className="min-h-[120px]" maxLength={200} />
                              <div className="flex items-center justify-between">
                                <span className={`text-xs ${formData.bio.length >= 200 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  {formData.bio.length}/200 characters
                                </span>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveField('bio')} disabled={isSaving}>
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div> : <div>
                              {formData.bio ? <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                                  {formData.bio}
                                </p> : <p className="text-muted-foreground italic text-sm">No description added yet</p>}
                              {profile?.created_at &&
                  <p className="text-muted-foreground text-sm mt-3 flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-accent" />
                                  Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                  }
                            </div>}
                        </div>

                        {/* Instrument Section for Instrumentalists */}
                        {formData.specialization?.toLowerCase() === 'instrumentalist' &&
              <>
                            <Separator />
                            <div className="group">
                              {(() => {
                    const instrumentName = formData.instruments ? formData.instruments.split(',')[0].trim() : "";
                    const InstrumentIcon = instrumentName ? getInstrumentIcon(instrumentName) : Music2;
                    const handleInstrumentsChange = (instruments: string) => {
                      setFormData({ ...formData, instruments });
                      supabase.from('profiles').update({ instruments }).eq('id', user?.id).then(({ error }) => {
                        if (!error) {
                          toast({ title: "Saved", description: "Instrument updated!" });
                        }
                      });
                    };
                    return instrumentName ?
                    <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-display font-bold flex items-center gap-2">
                                      <Music2 className="h-5 w-5 text-accent" />
                                      My Instrument:
                                    </h2>
                                    <Badge className="bg-muted/50 text-muted-foreground border border-accent/30 px-4 py-1.5 text-base font-medium cursor-pointer hover:border-accent/50 transition-colors group" onClick={() => handleInstrumentsChange("")}>
                                      <InstrumentIcon className="h-4 w-4 mr-1.5" />
                                      {instrumentName}
                                      <X className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Badge>
                                  </div> :

                    <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-display font-bold flex items-center gap-2">
                                      <Music2 className="h-5 w-5 text-accent" />
                                      My Instrument:
                                    </h2>
                                    <InstrumentSelector
                        instruments={formData.instruments}
                        onInstrumentsChange={handleInstrumentsChange} />

                                  </div>;

                  })()}
                            </div>
                          </>
              }

                        <Separator />

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-8">
                          {/* Music Genres */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-display font-bold flex items-center gap-2">
                                <Music className="h-5 w-5 text-accent" />
                                Music Genres
                              </h3>
                              {editingField !== 'genres' && <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-accent" onClick={() => startEditing('genres')}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>}
                            </div>
                            {editingField === 'genres' ? <div className="space-y-3">
                                {/* Selected genres */}
                                <div className="flex flex-wrap gap-2 min-h-[32px]">
                                  {formData.musicGenres?.split(',').filter((g) => g.trim()).map((genre: string) => <Badge key={genre.trim()} variant="default" className="bg-accent text-accent-foreground px-3 py-1 cursor-pointer hover:bg-accent/80" onClick={() => {
                        const genres = formData.musicGenres.split(',').map((g) => g.trim()).filter((g) => g);
                        const newGenres = genres.filter((g) => g !== genre.trim());
                        setFormData({
                          ...formData,
                          musicGenres: newGenres.join(', ')
                        });
                      }}>
                                      {genre.trim()}
                                      <X className="h-3 w-3 ml-1" />
                                    </Badge>)}
                                </div>
                                
                                {/* Available genres to add */}
                                {(() => {
                      const PRIORITY_GENRES = ['Pop', 'Rock', 'Jazz', 'Manele', 'Traditional', 'Blues', 'Disco', 'Hip-Hop', 'Electronic', 'House', 'R&B', 'Latin', 'Trap', 'Reggaeton', 'Folk', 'Country'];
                      const OTHER_GENRES = ['Afrobeat', 'Amapiano', 'Bachata', 'Baile Funk', 'Bhangra', 'Bolero', 'Bossa Nova', 'Cajun', 'Calypso', 'Celtic', 'Chanson', 'Classical', 'Cumbia', 'Dance', 'Dancehall', 'Drill', 'Drum and Bass', 'Dub', 'Dubstep', 'Easy Listening', 'EDM', 'Ethno', 'Fado', 'Flamenco', 'Funk', 'Garage', 'Gospel', 'Grime', 'Grunge', 'Highlife', 'Indie', 'J-Pop', 'K-Pop', 'Kizomba', 'Klezmer', 'Kompa', 'Lo-fi', 'Mariachi', 'Merengue', 'Metal', 'Motown', 'New Wave', 'Opera', 'Party Music', 'Polka', 'Progressive Rock', 'Punk', 'Qawwali', 'R&B', 'Ranchera', 'Reggae', 'Rumba', 'Salsa', 'Samba', 'Schlager', 'Semba', 'Ska', 'Soca', 'Soul', 'Synthwave', 'Tango', 'Techno', 'Trance', 'Turbo-Folk', 'Vallenato', 'Zouk'];
                      const ALL_GENRES = [...PRIORITY_GENRES, ...OTHER_GENRES.filter((g) => !PRIORITY_GENRES.includes(g))];
                      const selectedSet = new Set(formData.musicGenres?.split(',').map((g) => g.trim()).filter((g) => g) || []);
                      const isAtLimit = selectedSet.size >= 5;
                      const availableGenres = ALL_GENRES.filter((genre) => !selectedSet.has(genre));
                      const VISIBLE_COUNT = 12;
                      const visibleGenres = availableGenres.slice(0, VISIBLE_COUNT);
                      const hasMore = availableGenres.length > VISIBLE_COUNT;

                      const genreBadge = (genre: string) =>
                      <Badge key={genre} variant="outline" className={cn("border-muted-foreground/30 text-muted-foreground px-3 py-1 transition-colors", isAtLimit ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:border-accent hover:text-accent")} onClick={() => {
                        if (isAtLimit) return;
                        const currentGenres = formData.musicGenres?.split(',').map((g) => g.trim()).filter((g) => g) || [];
                        if (!currentGenres.includes(genre)) {
                          setFormData({ ...formData, musicGenres: [...currentGenres, genre].join(', ') });
                        }
                      }}>
                                      <Plus className="h-3 w-3 mr-1" />
                                      {genre}
                                    </Badge>;


                      return (
                        <div className="space-y-2">
                                      <Label className="text-sm text-muted-foreground">Click to add genres:</Label>
                                      <div className="flex flex-wrap gap-2">
                                        {visibleGenres.map((genre) => genreBadge(genre))}
                                        {hasMore &&
                            <GenrePickerDialog
                              availableGenres={availableGenres}
                              isAtLimit={isAtLimit}
                              onSelect={(genre) => {
                                if (isAtLimit) return;
                                const currentGenres = formData.musicGenres?.split(',').map((g) => g.trim()).filter((g) => g) || [];
                                if (!currentGenres.includes(genre)) {
                                  setFormData({ ...formData, musicGenres: [...currentGenres, genre].join(', ') });
                                }
                              }} />

                            }
                                      </div>
                                    </div>);

                    })()}
                                
                                <div className="flex gap-2 pt-2">
                                  <Button size="sm" onClick={() => saveField('genres')} disabled={isSaving}>
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div> : <div>
                                <div className="flex flex-wrap gap-2">
                                  {formData.musicGenres?.split(',').filter((g) => g.trim()).map((genre: string) => <Badge key={genre.trim()} variant="outline" className="border-accent/50 text-accent px-2 md:px-3 py-1 text-xs md:text-sm">
                                      {genre.trim()}
                                    </Badge>)}
                                  {(!formData.musicGenres || !formData.musicGenres.trim()) && <span className="text-muted-foreground text-sm">No genres added</span>}
                                </div>
                              </div>}
                          </div>

                          {/* Experience */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-display font-bold flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-accent" />
                                Experience
                              </h3>
                              {editingField !== 'experience' && <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-accent" onClick={() => startEditing('experience')}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>}
                            </div>
                            {editingField === 'experience' ? <div className="space-y-3">
                                <Select value={formData.experienceLevel} onValueChange={(value) => setFormData({
                      ...formData,
                      experienceLevel: value
                    })}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Experience Level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                    <SelectItem value="Professional">Professional</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input type="number" value={formData.numberOfEvents} onChange={(e) => setFormData({
                      ...formData,
                      numberOfEvents: e.target.value
                    })} placeholder="Number of Events" />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveField('experience')} disabled={isSaving}>
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div> : <div>
                                <div className="space-y-2 text-sm md:text-base">
                                  <p className="text-muted-foreground">
                                    Experience Level: <span className="font-semibold text-foreground">{formData.experienceLevel}</span>
                                  </p>
                                  <p className="text-muted-foreground flex items-center gap-2">
                                    <Award className="h-4 w-4 text-accent" />
                                    <span className="font-semibold text-foreground">{formData.numberOfEvents}+</span> events performed
                                  </p>
                                  <p className="text-muted-foreground">
                                    Career started in <span className="font-semibold text-foreground">{formData.careerStartYear}</span>
                                  </p>
                                </div>
                              </div>}
                          </div>

                          {/* Estimated Prices */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-display font-bold flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-accent" />
                                Estimated Prices
                              </h3>
                              {canSetEstimatedPrice(currentPlan) && !isAddingPrice && pricingCount < getEstimatedPriceLimit(currentPlan) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setIsAddingPrice(true)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              )}
                            </div>
                            {!canSetEstimatedPrice(currentPlan) ? (
                              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Lock className="h-4 w-4" />
                                <span>Upgrade to Standard or Premium to display pricing</span>
                              </div>
                            ) : (
                              <>
                                <PricingEntriesEditor
                                  profileId={user?.id}
                                  country={profile?.country}
                                  editable={true}
                                  isAdding={isAddingPrice}
                                  onAddingChange={setIsAddingPrice}
                                  maxEntries={getEstimatedPriceLimit(currentPlan)}
                                  onCountChange={setPricingCount}
                                />
                                {pricingCount >= getEstimatedPriceLimit(currentPlan) && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    You reached the limit of {getEstimatedPriceLimit(currentPlan)} prices for your plan.
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <Separator />

                        {/* Contact Information */}
                        <div>
                          <h3 className="text-xl font-display font-bold mb-4 text-left">Contact Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-secondary/50">
                              <Mail className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                              <div className="flex-1 text-left">
                                <p className="text-xs md:text-sm text-muted-foreground">Email</p>
                                <span className="text-foreground text-sm md:text-base">{formData.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {formData.hideEmail ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                                <Switch
                                  checked={!formData.hideEmail}
                                  onCheckedChange={async (checked) => {
                                    const newVal = !checked;
                                    setFormData(prev => ({ ...prev, hideEmail: newVal }));
                                    await supabase.from('profiles').update({ hide_email: newVal } as any).eq('id', user.id);
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-secondary/50">
                                <Phone className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                                <div className="flex-1 text-left">
                                  <p className="text-xs md:text-sm text-muted-foreground">Phone</p>
                                  <span className="text-foreground text-sm md:text-base">{formData.phone || 'Not set'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {formData.hidePhone ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                                  <Switch
                                    checked={!formData.hidePhone}
                                    onCheckedChange={async (checked) => {
                                      const newVal = !checked;
                                      setFormData(prev => ({ ...prev, hidePhone: newVal }));
                                      await supabase.from('profiles').update({ hide_phone: newVal } as any).eq('id', user.id);
                                    }}
                                  />
                                </div>
                              </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Social Networks */}
                        <div className="group">
                          <div className="flex items-center justify-between mb-3 md:mb-4">
                            <h3 className="text-xl font-display font-bold flex items-center gap-2 text-left">
                              <LinkIcon className="h-5 w-5 text-accent" />
                              Social Networks
                            </h3>
                            {editingField !== 'social' && <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-accent" onClick={() => startEditing('social')}>
                                <Edit2 className="h-4 w-4" />
                              </Button>}
                          </div>
                          {editingField === 'social' ? <div className="space-y-3">
                              {isFree(currentPlan) && <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Free plan: only 1 social media link visible. Upgrade for more.
                              </p>}
                              {(() => {
                                const socialLimit = getSocialLinkLimit(currentPlan);
                                const filledCount = countFilledSocialLinks(formData);
                                const canAddMore = (fieldValue: string) => fieldValue || filledCount < socialLimit;
                                return <>
                              <div className="flex items-center gap-2">
                                <Facebook className="h-5 w-5 text-accent flex-shrink-0" />
                                <Input value={formData.facebookUrl} onChange={(e) => setFormData({
                      ...formData,
                      facebookUrl: e.target.value
                    })} placeholder="Facebook profile URL" disabled={!canAddMore(formData.facebookUrl)} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Instagram className="h-5 w-5 text-accent flex-shrink-0" />
                                <Input value={formData.instagramUrl} onChange={(e) => setFormData({
                      ...formData,
                      instagramUrl: e.target.value
                    })} placeholder="Instagram profile URL" disabled={!canAddMore(formData.instagramUrl)} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Youtube className="h-5 w-5 text-accent flex-shrink-0" />
                                <Input value={formData.youtubeUrl} onChange={(e) => setFormData({
                      ...formData,
                      youtubeUrl: e.target.value
                    })} placeholder="YouTube channel URL" disabled={!canAddMore(formData.youtubeUrl)} />
                              </div>
                              <div className="flex items-center gap-2">
                                <Music className="h-5 w-5 text-accent flex-shrink-0" />
                                <Input value={formData.tiktokUrl} onChange={(e) => setFormData({
                      ...formData,
                      tiktokUrl: e.target.value
                    })} placeholder="TikTok profile URL" disabled={!canAddMore(formData.tiktokUrl)} />
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                </svg>
                                <Input value={formData.spotifyUrl} onChange={(e) => setFormData({
                      ...formData,
                      spotifyUrl: e.target.value
                    })} placeholder="Spotify artist URL" disabled={!canAddMore(formData.spotifyUrl)} />
                              </div>
                              </>;
                              })()}
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveField('social')} disabled={isSaving}>
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditing}>
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div> : <div>
                              <div className="flex flex-wrap gap-2 md:gap-3">
                                {formData.facebookUrl && <a href={formData.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors" title="Facebook">
                                    <Facebook className="h-5 w-5 text-accent" />
                                  </a>}
                                {formData.instagramUrl && <a href={formData.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors" title="Instagram">
                                    <Instagram className="h-5 w-5 text-accent" />
                                  </a>}
                                {formData.youtubeUrl && <a href={formData.youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors" title="YouTube">
                                    <Youtube className="h-5 w-5 text-accent" />
                                  </a>}
                                {formData.tiktokUrl && <a href={formData.tiktokUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors" title="TikTok">
                                    <Music className="h-5 w-5 text-accent" />
                                  </a>}
                                {formData.spotifyUrl && <a href={formData.spotifyUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors" title="Spotify">
                                    <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                    </svg>
                                  </a>}
                                {!formData.facebookUrl && !formData.instagramUrl && !formData.youtubeUrl && !formData.tiktokUrl && !formData.spotifyUrl && <p className="text-muted-foreground italic text-sm">No social networks added yet</p>}
                              </div>
                            </div>}
                         </div>

                        <Separator className="my-8" />

                        {/* Reviews Section */}
                        <div>
                          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2 text-left">
                            <Star className="h-5 w-5 text-accent" />
                            My Reviews
                            {getAverageRating() && <span className="text-base md:text-lg font-display font-bold text-foreground">
                                ({getAverageRating()} • {reviews.length})
                              </span>}
                          </h2>
                          
                          {reviews.length > 0 ? <Carousel className="w-full">
                              <CarouselContent className="-ml-2 md:-ml-4">
                                {reviews.map((review) => <CarouselItem key={review.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                                    <div className="flex flex-col gap-3 p-4 rounded-lg border border-accent/20 hover:border-accent/40 transition-colors bg-card/50 h-full relative">
                                      <button onClick={() => setDeleteReviewId(review.id)} className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete review" disabled={isSaving}>
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-accent/30 flex-shrink-0">
                                          <AvatarFallback className="bg-accent/10 text-accent text-sm">
                                            {review.reviewer_name.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <span className="font-medium text-sm text-foreground block">{review.reviewer_name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(review.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />)}
                                      </div>
                                      {review.comment && <p className="text-sm text-muted-foreground flex-1">{review.comment}</p>}
                                    </div>
                                  </CarouselItem>)}
                              </CarouselContent>
                              <CarouselPrevious className="hidden md:flex left-0 -translate-x-1/2" />
                              <CarouselNext className="hidden md:flex right-0 translate-x-1/2" />
                            </Carousel> : <div className="text-center py-12 border border-dashed border-accent/30 rounded-lg">
                              <Star className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                              <p className="text-muted-foreground">No reviews yet</p>
                              <p className="text-sm text-muted-foreground mt-1">Reviews from your clients will appear here</p>
                            </div>}
                        </div>
                      </TabsContent>}

                      {/* Posts Tab */}
                      <TabsContent value="posts" className="space-y-4">
                        <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-accent" />
                          My Posts
                        </h2>
                        {!isAdmin && !canPost(currentPlan) ? <div className="text-center py-12 border border-dashed border-border rounded-lg">
                            <Lock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-muted-foreground font-medium">Posts are not available on the Free plan</p>
                            <p className="text-sm text-muted-foreground mt-1">Upgrade to Standard or Premium to create posts and promotions</p>
                            <Button onClick={() => navigate('/my-plan')} className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                              Upgrade
                            </Button>
                          </div> :
                        <div className="-mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
                          <div className="max-w-[500px] mx-auto space-y-4">
                          <div className="flex flex-row items-center justify-between gap-4 p-4 bg-card/50 rounded-lg border border-border/50 min-h-[72px]">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-accent" />
                                <span className="text-sm text-muted-foreground">Posts: <span className="font-medium text-foreground">{postsUsed}/{STANDARD_POST_LIMIT}</span></span>
                                <AdSlotInfoButton kind="post" />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-accent" />
                                <span className="text-sm text-muted-foreground">Promotions: <span className="font-medium text-foreground">{premiumAdsUsed}/{PREMIUM_AD_LIMIT}</span></span>
                                <AdSlotInfoButton kind="promotion" />
                              </div>
                            </div>
                            <Dialog open={showPostDialog} onOpenChange={(open) => {
                    setShowPostDialog(open);
                    if (!open) setPostMediaType('image');
                  }}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Add New</DialogTitle>
                                </DialogHeader>
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-destructive">
                                    {postMediaType === 'promotion' ? <Megaphone className="h-3 w-3" /> : <Images className="h-3 w-3" />}
                                    <span>
                                      {postMediaType === 'promotion'
                                        ? `${Math.max(premiumAdsRemaining, 0)}/${PREMIUM_AD_LIMIT} left`
                                        : `${Math.max(postsRemaining, 0)}/${STANDARD_POST_LIMIT} left`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border text-xs font-medium text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{postMediaType === 'promotion' ? 'Valid 15 days' : 'Slot held 30 days'}</span>
                                  </div>
                                </div>
                                <div className="space-y-4 mt-4">
                                  <Tabs value={postMediaType} onValueChange={(v) => setPostMediaType(v as 'image' | 'video' | 'promotion')}>
                                    <TabsList className="grid w-full grid-cols-3">
                                      <TabsTrigger value="image">Photo</TabsTrigger>
                                      <TabsTrigger value="video">Video</TabsTrigger>
                                      <TabsTrigger value="promotion" disabled={premiumAdsRemaining <= 0}>Promotion</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="image" className="space-y-4">
                                      <div>
                                        <Label>Post Content</Label>
                                        <Textarea value={newPost.content} onChange={(e) => setNewPost({
                                ...newPost,
                                content: e.target.value.slice(0, 200)
                              })} placeholder="What's on your mind?" rows={4} maxLength={200} className="mt-2" />
                                        <p className="text-xs text-muted-foreground text-right mt-1">{newPost.content.length}/200</p>
                                      </div>
                                      {newPost.mediaUrl && newPost.mediaType === 'image' && <div className="relative">
                                          <img src={newPost.mediaUrl} alt="Upload preview" className="w-full h-48 object-cover rounded-lg" />
                                          <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => setNewPost({
                                ...newPost,
                                mediaUrl: "",
                                mediaType: ""
                              })}>
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>}
                                      {!newPost.mediaUrl && postUploadProgress === null && <>
                                          <Label htmlFor="post-image-inner" className="cursor-pointer">
                                            <div className="border-2 border-dashed border-accent/50 rounded-lg p-8 text-center hover:border-accent transition-colors">
                                              <Upload className="h-12 w-12 mx-auto mb-2 text-accent" />
                                              <p className="text-sm text-muted-foreground">Click to upload image</p>
                                            </div>
                                          </Label>
                                          <Input id="post-image-inner" type="file" accept="image/*" onChange={handlePostImageUpload} className="hidden" />
                                        </>}
                                      {postUploadProgress !== null && <div className="border-2 border-dashed border-accent/50 rounded-lg p-6 space-y-3">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">Uploading image…</p>
                                            <p className="text-sm text-muted-foreground">{postUploadProgress}%</p>
                                          </div>
                                          <Progress value={postUploadProgress} />
                                        </div>}
                                      <Button onClick={handleAddPost} disabled={isSaving || !newPost.content || !newPost.mediaUrl} className="w-full bg-accent text-accent-foreground">
                                        {isSaving ? "Creating..." : "Create"}
                                      </Button>
                                    </TabsContent>
                                    
                                    <TabsContent value="video" className="space-y-4">
                                      <div>
                                        <Label>Post Content</Label>
                                        <Textarea value={newPost.content} onChange={(e) => setNewPost({
                                ...newPost,
                                content: e.target.value.slice(0, 200)
                              })} placeholder="What's on your mind?" rows={4} maxLength={200} className="mt-2" />
                                        <p className="text-xs text-muted-foreground text-right mt-1">{newPost.content.length}/200</p>
                                      </div>
                                      {newPost.mediaUrl && newPost.mediaType === 'video' && <div className="relative">
                                          <SmoothVideoPlayer src={newPost.mediaUrl} className="w-full rounded-lg max-h-48 aspect-video" />
                                          <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => setNewPost({
                                ...newPost,
                                mediaUrl: "",
                                mediaType: ""
                              })}>
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>}
                                      {!newPost.mediaUrl && postUploadProgress === null && <>
                                          <Label htmlFor="post-video-inner" className="cursor-pointer">
                                            <div className="border-2 border-dashed border-accent/50 rounded-lg p-8 text-center hover:border-accent transition-colors">
                                              <Upload className="h-12 w-12 mx-auto mb-2 text-accent" />
                                              <p className="text-sm text-muted-foreground">Click to upload video</p>
                                            </div>
                                          </Label>
                                          <Input id="post-video-inner" type="file" accept="video/*" onChange={handlePostVideoUpload} className="hidden" />
                                        </>}
                                      {postUploadProgress !== null && <div className="border-2 border-dashed border-accent/50 rounded-lg p-6 space-y-3">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">Uploading video…</p>
                                            <p className="text-sm text-muted-foreground">{postUploadProgress}%</p>
                                          </div>
                                          <Progress value={postUploadProgress} />
                                        </div>}
                                      <Button onClick={handleAddPost} disabled={isSaving || !newPost.content || !newPost.mediaUrl} className="w-full bg-accent text-accent-foreground">
                                        {isSaving ? "Creating..." : "Create"}
                                      </Button>
                                    </TabsContent>

                                    <TabsContent value="promotion" className="space-y-4">
                                      <div>
                                        <Label>Promotion Text</Label>
                                        <Textarea value={newPromotion.description} onChange={(e) => setNewPromotion({
                                ...newPromotion,
                                description: e.target.value.slice(0, 200)
                              })} placeholder="Write your promotion here..." rows={4} maxLength={200} className="mt-2" />
                                        <p className="text-xs text-muted-foreground text-right mt-1">{newPromotion.description.length}/200</p>
                                      </div>
                                      
                                      {newPromotion.mediaUrl && <div className="relative">
                                          {newPromotion.mediaType === 'video' ? <SmoothVideoPlayer src={newPromotion.mediaUrl} className="w-full rounded-lg max-h-48 aspect-video" /> : <img src={newPromotion.mediaUrl} alt="Preview" className="w-full rounded-lg max-h-48 object-cover" />}
                                          <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => setNewPromotion({
                                  ...newPromotion,
                                  mediaUrl: "",
                                  mediaType: ""
                                })}>
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>}
                                      {!newPromotion.mediaUrl && promotionUploadProgress === null && <>
                                          <Label htmlFor="promotion-media-input" className="cursor-pointer">
                                            <div className="border-2 border-dashed border-accent/50 rounded-lg p-8 text-center hover:border-accent transition-colors">
                                              <Upload className="h-12 w-12 mx-auto mb-2 text-accent" />
                                              <p className="text-sm text-muted-foreground">Click to upload photo or video</p>
                                            </div>
                                          </Label>
                                          <Input id="promotion-media-input" type="file" accept="image/*,video/*" onChange={handlePromotionMediaUpload} className="hidden" />
                                        </>}
                                      {promotionUploadProgress !== null && <div className="border-2 border-dashed border-accent/50 rounded-lg p-6 space-y-3">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">Uploading media…</p>
                                            <p className="text-sm text-muted-foreground">{promotionUploadProgress}%</p>
                                          </div>
                                          <Progress value={promotionUploadProgress} />
                                        </div>}
                                      
                                      <Button onClick={handleAddPromotion} disabled={isSaving || !newPromotion.description} className="w-full bg-accent text-accent-foreground">
                                        {isSaving ? "Creating..." : "Create Promotion"}
                                      </Button>
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          {posts.map((post) => <Card key={post.id} className="overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary border-0">
                              <div className="p-4 pb-0 px-[6px] py-[3px]">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(profile?.plan)}`}>
                                      <Avatar className="w-10 h-10 border-2 border-background">
                                        <AvatarImage src={profile?.avatar_url || undefined} alt={formData.stageName} />
                                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                          {formData.stageName.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-foreground">
                                          {formData.stageName}
                                        </h3>
                                        {profile?.plan === 'Premium' && <span className="text-accent text-xs">✓</span>}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{formData.specialization || 'Artist'}</span>
                                        <span>·</span>
                                        <span>{formatPostDate(post.created_at)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={isSaving}>
                                        <MoreHorizontal className="h-5 w-5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setDeletePostId(post.id)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <ExpandableText text={post.content} className="mt-3" />
                              </div>
                              
                              {post.media_url && <div className="mt-3 cursor-pointer bg-muted/30" onClick={() => setMediaPreview({
                                url: post.media_url!,
                                type: post.media_type === "video" ? "video" : "image"
                              })}>
                                  {post.media_type === "video" ? <div className="relative w-full aspect-video pointer-events-none">
                                      <video src={post.media_url} className="absolute inset-0 w-full h-full object-contain bg-black" />
                                    </div> : <img src={post.media_url} alt="Post content" className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity" />}
                                </div>}
                              
                              <div className="px-2 py-1 flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => post.id && handlePostLike(post.id)}
                                  aria-label={post.isLiked ? "Unlike post" : "Like post"}
                                  aria-pressed={post.isLiked}
                                  className={`gap-2 rounded-md hover:bg-transparent hover:text-inherit ${post.isLiked ? "text-destructive" : "text-muted-foreground"}`}
                                >
                                  <Heart className={`w-7 h-7 ${post.isLiked ? "fill-current" : ""}`} />
                                  {post.likes > 0 && <span className="text-base font-semibold tabular-nums">{post.likes}</span>}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => post.id && setCommentsTarget({ id: post.id, type: "post" })}
                                  aria-label="Comment"
                                  className="gap-2 rounded-md hover:bg-transparent hover:text-inherit text-muted-foreground"
                                >
                                  <MessageCircle className="w-7 h-7" />
                                  {(post.commentsCount || 0) > 0 && <span className="text-base font-semibold tabular-nums">{post.commentsCount}</span>}
                                </Button>
                              </div>
                            </Card>)}

                          {/* Promotions in Posts section */}
                          {announcements.filter((a) => a.is_premium).map((promotion) => <Card key={`promo-${promotion.id}`} className="bg-card text-card-foreground overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary border-0">
                              <div className="p-4 pb-0 px-[6px] py-[3px]">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(profile?.plan)}`}>
                                      <Avatar className="w-10 h-10 border-2 border-background">
                                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.stage_name || "Artist"} />
                                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                          {(profile?.stage_name || "A").charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-foreground">
                                          {profile?.stage_name || "Artist"}
                                        </h3>
                                        {profile?.plan === 'Premium' && <span className="text-accent text-xs">✓</span>}
                                        {isAdExpired(promotion) ? <Badge variant="outline" className="text-xs text-destructive border-destructive">
                                            Expired
                                          </Badge> : <Badge variant="outline" className="text-xs">{getDaysRemaining(promotion)}d left</Badge>}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{profile?.specialization || "User"}</span>
                                        <span>·</span>
                                        <span>{formatSmartDate(promotion.created_at)}</span>
                                        <span>·</span>
                                        <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                                          Promotion
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={isSaving}>
                                        <MoreHorizontal className="h-5 w-5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setDeleteAnnouncementId(promotion.id)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <ExpandableText text={promotion.description} className="mt-3" />
                              </div>
                              
                              {promotion.media_url && <div className="mt-3 bg-muted/30">
                                  {promotion.media_type === "video" ? <div className="relative w-full aspect-video">
                                      <SmoothVideoPlayer src={promotion.media_url} className="absolute inset-0 w-full h-full" />
                                    </div> : <img src={promotion.media_url} alt="Promotion media" className="w-full h-auto max-h-[400px] object-contain" />}
                                </div>}
                              
                              <div className="px-2 py-1 flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAnnouncementLike(promotion.id)}
                                  aria-label={promotion.isLiked ? "Unlike promotion" : "Like promotion"}
                                  aria-pressed={promotion.isLiked}
                                  className={`gap-2 rounded-md hover:bg-transparent hover:text-inherit ${promotion.isLiked ? "text-destructive" : "text-muted-foreground"}`}
                                >
                                  <Heart className={`w-7 h-7 ${promotion.isLiked ? "fill-current" : ""}`} />
                                  {(promotion.likes || 0) > 0 && <span className="text-base font-semibold tabular-nums">{promotion.likes}</span>}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCommentsTarget({ id: promotion.id, type: "announcement" })}
                                  aria-label="Comment"
                                  className="gap-2 rounded-md hover:bg-transparent hover:text-inherit text-muted-foreground"
                                >
                                  <MessageCircle className="w-7 h-7" />
                                  {(promotion.commentsCount || 0) > 0 && <span className="text-base font-semibold tabular-nums">{promotion.commentsCount}</span>}
                                </Button>
                              </div>
                            </Card>)}
                          
                          {posts.length === 0 && announcements.filter((a) => a.is_premium).length === 0 && <Card className="border-2 border-dashed border-accent/30">
                              <CardContent className="p-12 text-center">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                              <p className="text-muted-foreground">No posts yet. Create your first post!</p>
                              </CardContent>
                            </Card>}
                          </div>
                        </div>}
                      </TabsContent>

                      {/* Announcements Tab */}
                      <TabsContent value="announcements" className="space-y-4">
                        <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                          <Megaphone className="h-5 w-5 text-accent" />
                          My Announcements
                        </h2>
                        {!isAdmin && !canPost(currentPlan) ? <div className="text-center py-12 border border-dashed border-border rounded-lg">
                            <Lock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-muted-foreground font-medium">Announcements are not available on the Free plan</p>
                            <p className="text-sm text-muted-foreground mt-1">Upgrade to Standard or Premium to create announcements</p>
                            <Button onClick={() => navigate('/my-plan')} className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                              Upgrade
                            </Button>
                          </div> :
                        <div className="-mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
                          <div className="max-w-[500px] mx-auto space-y-4">
                          <div className="flex flex-row items-center justify-between gap-4 p-4 bg-card/50 rounded-lg border border-border/50 min-h-[72px]">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Announcements: <span className="font-medium text-foreground">{standardAdsUsed}/{STANDARD_AD_LIMIT}</span></span>
                              <AdSlotInfoButton kind="ad" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                                <DialogTrigger asChild>
                                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Add New</DialogTitle>
                                  </DialogHeader>
                                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-destructive">
                                      <Megaphone className="h-3 w-3" />
                                      <span>{Math.max(STANDARD_AD_LIMIT - standardAdsUsed, 0)}/{STANDARD_AD_LIMIT} left</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border text-xs font-medium text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span>Valid 7 days</span>
                                    </div>
                                  </div>
                                  <div className="space-y-4 mt-4">
                                    <div>
                                      <Label htmlFor="announcement-text-inner">Announcement Text</Label>
                                      <Textarea id="announcement-text-inner" value={newAnnouncement.description} onChange={(e) => setNewAnnouncement({
                              ...newAnnouncement,
                              description: e.target.value.slice(0, 200)
                            })} placeholder="Write your announcement here..." rows={4} maxLength={200} className="mt-2" />
                                      <p className="text-xs text-muted-foreground text-right mt-1">{newAnnouncement.description.length}/200</p>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <Label htmlFor="announcement-location-inner">Location (optional)</Label>
                                        <LocationAutocomplete
                                          id="announcement-location-inner"
                                          value={newAnnouncement.location}
                                          onChange={(val) => setNewAnnouncement({ ...newAnnouncement, location: val })}
                                          country={null}
                                          placeholder="Search any location worldwide..."
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="announcement-event-date-inner">Event Date (optional)</Label>
                                        <Input id="announcement-event-date-inner" type="date" min={new Date().toISOString().split('T')[0]} value={newAnnouncement.eventDate} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, eventDate: e.target.value })} className="mt-1" />
                                      </div>
                                      <div>
                                        <Label htmlFor="announcement-budget-inner" className="flex items-center gap-1">
                                          Budget <Euro className="h-3.5 w-3.5" /> (optional)
                                        </Label>
                                        <Input id="announcement-budget-inner" type="number" min="0" max="999999999" value={newAnnouncement.budget} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); if (Number(val) <= 999999999 || val === '') setNewAnnouncement({ ...newAnnouncement, budget: val }); }} placeholder="e.g. 500" className="mt-1" />
                                      </div>
                                    </div>
                                    
                                    <Button onClick={handleAddAnnouncement} disabled={isSaving || !newAnnouncement.description} className="w-full bg-accent text-accent-foreground">
                                      {isSaving ? "Adding..." : "Add Announcement"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          {announcements.filter((a) => !a.is_premium).map((announcement) => <Card key={announcement.id} className="bg-card text-card-foreground overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary border-0">
                              <div className="p-4 pb-0 px-[6px] py-[3px]">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(profile?.plan)}`}>
                                      <Avatar className="w-10 h-10 border-2 border-background">
                                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.stage_name || "Artist"} />
                                        <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                          {(profile?.stage_name || "A").charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-foreground">
                                          {profile?.stage_name || "Artist"}
                                        </h3>
                                        {profile?.plan === 'Premium' && <span className="text-accent text-xs">✓</span>}
                                        {isAdExpired(announcement) ? <Badge variant="outline" className="text-xs text-destructive border-destructive">
                                            Expired
                                          </Badge> : <Badge variant="outline" className="text-xs">{getDaysRemaining(announcement)}d left</Badge>}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{profile?.specialization || "User"}</span>
                                        <span>·</span>
                                        <span>{formatSmartDate(announcement.created_at)}</span>
                                        <span>·</span>
                                        {announcement.is_premium ? <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                                            Promotion
                                          </Badge> : <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                                            Announcement
                                          </Badge>}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={isSaving}>
                                        <MoreHorizontal className="h-5 w-5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setDeleteAnnouncementId(announcement.id)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <ExpandableText text={announcement.description} className="mt-3" />
                                {!announcement.is_premium && (announcement.location || announcement.event_date || announcement.budget) &&
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                                    {announcement.location &&
                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {announcement.location}
                                      </span>
                      }
                                    {announcement.event_date &&
                      <span className="flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {formatDateNoYear(announcement.event_date)}
                                      </span>
                      }
                                    {announcement.budget &&
                                      <span className="flex items-center gap-1">
                                        <Euro className="h-3 w-3" />
                                        {announcement.budget}
                                      </span>
                                    }
                                  </div>
                    }
                              </div>
                              
                              {announcement.is_premium && announcement.media_url && <div className="mt-3 bg-muted/30">
                                  {announcement.media_type === "video" ? <div className="relative w-full aspect-video">
                                      <SmoothVideoPlayer src={announcement.media_url} className="absolute inset-0 w-full h-full" />
                                    </div> : <img src={announcement.media_url} alt="Announcement media" className="w-full h-auto max-h-[400px] object-contain" />}
                                </div>}
                              
                              <div className="px-2 py-1 flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAnnouncementLike(announcement.id)}
                                  aria-label={announcement.isLiked ? "Unlike announcement" : "Like announcement"}
                                  aria-pressed={announcement.isLiked}
                                  className={`gap-2 rounded-md hover:bg-transparent hover:text-inherit ${announcement.isLiked ? "text-destructive" : "text-muted-foreground"}`}
                                >
                                  <Heart className={`w-7 h-7 ${announcement.isLiked ? "fill-current" : ""}`} />
                                  {(announcement.likes || 0) > 0 && <span className="text-base font-semibold tabular-nums">{announcement.likes}</span>}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCommentsTarget({ id: announcement.id, type: "announcement" })}
                                  aria-label="Comment"
                                  className="gap-2 rounded-md hover:bg-transparent hover:text-inherit text-muted-foreground"
                                >
                                  <MessageCircle className="w-7 h-7" />
                                  {(announcement.commentsCount || 0) > 0 && <span className="text-base font-semibold tabular-nums">{announcement.commentsCount}</span>}
                                </Button>
                              </div>
                            </Card>)}
                          {announcements.filter((a) => !a.is_premium).length === 0 && <div className="text-center py-12 text-muted-foreground">
                              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-50" />
                              <p className="text-sm">No announcements yet</p>
                            </div>}
                          </div>
                        </div>}
                      </TabsContent>

                      {/* Gallery Tab */}
                      {!isAdmin && <TabsContent value="gallery">
                        <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                          <Images className="h-5 w-5 text-accent" />
                          My Gallery
                        </h2>
                        <div className="mb-4 items-center justify-between flex flex-col">
                          
                          <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
                            <DialogTrigger asChild>
                              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 text-center">
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <Tabs value={galleryUploadType} onValueChange={(v) => setGalleryUploadType(v as 'image' | 'video')}>
                                  {STANDARD_VIDEO_LIMIT > 0 ? <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="image">Image</TabsTrigger>
                                    <TabsTrigger value="video">Video</TabsTrigger>
                                  </TabsList> : <TabsList className="grid w-full grid-cols-1">
                                    <TabsTrigger value="image">Image</TabsTrigger>
                                  </TabsList>}
                                  <TabsContent value="image" className="space-y-4">
                                    <Label htmlFor="gallery-upload" className="cursor-pointer">
                                      <div className="border-2 border-dashed border-accent/50 rounded-lg p-8 text-center hover:border-accent transition-colors">
                                        <Upload className="h-12 w-12 mx-auto mb-2 text-accent" />
                                        <p className="text-sm text-muted-foreground">Click to upload image</p>
                                      </div>
                                    </Label>
                                    <Input id="gallery-upload" type="file" accept="image/*" onChange={handleGalleryImageUpload} className="hidden" />
                                  </TabsContent>
                                  <TabsContent value="video" className="space-y-4">
                                    <div>
                                      <Label htmlFor="gallery-video-upload" className="cursor-pointer">
                                        <div className="border-2 border-dashed border-accent/50 rounded-lg p-6 text-center hover:border-accent transition-colors">
                                          <Upload className="h-10 w-10 mx-auto mb-2 text-accent" />
                                          <p className="text-sm text-muted-foreground">Click to upload video</p>
                                          <p className="text-xs text-muted-foreground mt-1">Max 500 MB</p>
                                        </div>
                                      </Label>
                                      <Input id="gallery-video-upload" type="file" accept="video/*" onChange={handleGalleryVideoUpload} className="hidden" />
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="space-y-8">
                          {/* Photos Section */}
                          <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                              <Images className="h-5 w-5 text-accent" />
                              Photos
                              <span className="text-muted-foreground">({imagesUsed}/{STANDARD_IMAGE_LIMIT})</span>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                              {galleryItems.filter((item) => item.type === 'image').map((item) => <div key={item.id} className="relative group">
                                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-accent/20">
                                    <img src={item.url} alt="Gallery item" className="w-full h-full object-cover" />
                                  </div>
                                  <Button size="sm" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteGalleryItem({
                        id: item.id,
                        url: item.url,
                        type: item.type
                      })} disabled={isSaving}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>)}
                              {galleryItems.filter((item) => item.type === 'image').length === 0 && <div className="col-span-full text-center text-muted-foreground py-8">
                                  No photos yet. Add your first image!
                                </div>}
                            </div>
                          </div>

                          {/* Videos Section - hidden for Free plan */}
                          {STANDARD_VIDEO_LIMIT > 0 && <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                              <Play className="h-5 w-5 text-accent" />
                              Videos
                              <span className="text-muted-foreground">({videosUsed}/{STANDARD_VIDEO_LIMIT})</span>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                              {galleryItems.filter((item) => item.type === 'video').map((item) => <div key={item.id} className="relative group">
                                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-accent/20 bg-black/80 flex items-center justify-center">
                                    <Play className="h-12 w-12 text-accent" />
                                  </div>
                                  <Button size="sm" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteGalleryItem({
                        id: item.id,
                        url: item.url,
                        type: item.type
                      })} disabled={isSaving}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>)}
                              {galleryItems.filter((item) => item.type === 'video').length === 0 && <div className="col-span-full text-center text-muted-foreground py-8">
                                  No videos yet. Add your first video!
                                </div>}
                            </div>
                          </div>}
                        </div>
                      </TabsContent>}

                      {/* Calendar Tab */}
                      {!isAdmin && <TabsContent value="calendar">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-display font-bold flex items-center gap-2">
                              <CalendarIcon className="h-5 w-5 text-accent" />
                              My Calendar
                            </h2>
                            {isPremium(currentPlan) && (
                              <Button variant="outline" size="sm" onClick={() => navigate('/analytics')} className="gap-1.5">
                                <BarChart3 className="h-4 w-4" />
                                Statistics
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-col lg:grid lg:grid-cols-[auto_1fr_auto] gap-4 items-start">
                            {/* Legend - above calendar on mobile */}
                            <div className="w-full lg:hidden">
                              <div className="p-3 rounded-lg bg-secondary/50">
                                
                                <div className="flex justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-destructive/70"></div>
                                    <span className="text-xs text-muted-foreground">Booked</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-muted/80"></div>
                                    <span className="text-xs text-muted-foreground">Unavailable</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-emerald-500"></div>
                                    <span className="text-xs text-muted-foreground">Available</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Calendar */}
                            <div className="flex-shrink-0 w-full flex justify-center lg:justify-start lg:w-auto">
                              <Calendar mode="single" selected={selectedDate} onSelect={(date) => {
                      if (!date) {
                        setSelectedDate(undefined);
                        setUserChangedStatus(false);
                        setEventStatus('available');
                        setEventNotes("");
                        return;
                      }
                      if (selectedDate) {
                        const currentDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                        const nextDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        if (currentDateStr === nextDateStr) return;
                      }
                      setSelectedDate(date);
                      setUserChangedStatus(false);
                      const event = getEventForDate(date);
                      if (event) {
                        const status = event.status;
                        if (status === 'busy' || status === 'booked') {
                          setEventStatus('available');
                        } else {
                          setEventStatus(status);
                        }
                        setEventNotes(event.notes || "");
                      } else {
                        setEventStatus('available');
                        setEventNotes("");
                      }
                    }} className="rounded-lg border border-border shadow-sm pointer-events-auto" classNames={{
                      day_selected: "bg-emerald-500 text-white hover:bg-emerald-500 hover:text-white focus:bg-emerald-500 focus:text-white",
                      day_today: "bg-emerald-500/30 text-foreground"
                    }} modifiers={{
                      busy: calendarEvents.filter((e) => e.status === 'busy').map((e) => parseYMDToLocalDate(e.event_date)),
                      blocked: calendarEvents.filter((e) => e.status === 'blocked').map((e) => parseYMDToLocalDate(e.event_date))
                    }} modifiersClassNames={{
                      busy: "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground opacity-70",
                      blocked: "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground opacity-80"
                    }} />
                            </div>
                            
                            {/* Date Details Form */}
                            <div className="w-full lg:min-w-0 lg:w-auto">
                              {selectedDate ? (() => {
                                const isPastDate = selectedDate < new Date(new Date().setHours(0, 0, 0, 0));
                                const pastEvent = isPastDate ? getEventForDate(selectedDate) : null;
                                
                                if (isPastDate) {
                                  // Read-only view for past dates
                                  return <Card className="p-4 h-full">
                                    <h4 className="font-semibold text-foreground mb-3">
                                      {selectedDate.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </h4>
                                    {pastEvent ? (
                                      <div className="space-y-3">
                                        <div>
                                          <Label>Status</Label>
                                          <div className={`mt-1 px-3 py-2 rounded-md border text-sm ${
                                            pastEvent.status === 'busy' || pastEvent.status === 'booked'
                                              ? 'bg-destructive/10 text-destructive border-destructive/30'
                                              : pastEvent.status === 'blocked'
                                              ? 'bg-muted text-muted-foreground border-border'
                                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                          }`}>
                                            {pastEvent.status === 'busy' || pastEvent.status === 'booked' ? 'Booked' : pastEvent.status === 'blocked' ? 'Unavailable' : 'Available'}
                                          </div>
                                        </div>
                                        {pastEvent.notes && (
                                          <div>
                                            <Label>Details</Label>
                                            <div className="mt-1 px-3 py-2 rounded-md border bg-secondary/50 text-sm text-muted-foreground whitespace-pre-wrap">
                                              {pastEvent.notes}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No events recorded for this date.</p>
                                    )}
                                  </Card>;
                                }
                                
                                // Editable view for today and future dates
                                return <Card className="p-4 h-full">
                                  <h4 className="font-semibold text-foreground mb-3">
                                    {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                                  </h4>
                                  <div className="space-y-3">
                                    <div>
                                      <Label>Status</Label>
                                      {(() => {
                            const currentEvent = getEventForDate(selectedDate);
                            const isBooked = currentEvent?.status === 'busy' || currentEvent?.status === 'booked';
                            const showAsBooked = isBooked && !userChangedStatus;
                            return <Select value={showAsBooked ? 'busy' : eventStatus} onValueChange={(v) => {
                              if (v !== 'busy') {
                                setEventStatus(v as 'available' | 'blocked');
                                setUserChangedStatus(true);
                                if (isBooked) {
                                  setEventNotes("");
                                }
                              }
                            }}>
                                            <SelectTrigger className={showAsBooked ? "text-destructive" : eventStatus === 'available' ? "text-emerald-500" : ""}>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {isBooked && !userChangedStatus && <SelectItem value="busy" disabled className="opacity-50 cursor-not-allowed text-destructive">
                                                  Booked
                                                </SelectItem>}
                                              <SelectItem value="available">Available</SelectItem>
                                              <SelectItem value="blocked">Unavailable</SelectItem>
                                            </SelectContent>
                                          </Select>;
                          })()}
                                    </div>
                                    
                                    {/* Show booked events list if date has bookings */}
                                    {(() => {
                          const currentEvent = getEventForDate(selectedDate);
                          const isBooked = currentEvent?.status === 'busy' || currentEvent?.status === 'booked';
                          if (isBooked && currentEvent?.notes && !userChangedStatus) {
                            return <BookedEventsList notes={currentEvent.notes} isSaving={isSaving} onUpdateNotes={async (newNotes: string) => {
                              setIsSaving(true);
                              try {
                                const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                                const oldNotes = currentEvent.notes ?? "";
                                const oldEvents = parseBookedEvents(oldNotes);
                                const newEvents = parseBookedEvents(newNotes);
                                const newKeys = new Set(newEvents.map(getBookedEventKey));
                                const removedEvents = oldEvents.filter((e) => !newKeys.has(getBookedEventKey(e)));

                                // First, update the calendar notes
                                const {
                                  error
                                } = await supabase.from('calendar_events').update({
                                  notes: newNotes
                                }).eq('profile_id', user!.id).eq('event_date', dateStr);
                                if (error) throw error;

                                // If a booked time slot was deleted, mark the matching accepted request as rejected
                                const rejectedCount = await rejectAcceptedBookingRequestsForBookedEvents(dateStr, removedEvents);
                                await loadCalendarEvents();
                                if (rejectedCount > 0) {
                                  await loadBookingRequests();
                                }
                                setEventNotes(newNotes);
                                toast({
                                  title: "Success",
                                  description: rejectedCount > 0 ? "Event updated and the related request was marked as rejected." : "Event details updated."
                                });
                              } catch (error: any) {
                                toast({
                                  title: "Error",
                                  description: error.message,
                                  variant: "destructive"
                                });
                              } finally {
                                setIsSaving(false);
                              }
                            }} />;
                          }
                          return <div>
                                          <Label>Notes (optional)</Label>
                                          <Textarea value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} placeholder="Event details..." rows={3} />
                                        </div>;
                        })()}
                                    <div className="flex gap-2">
                                      <Button onClick={handleSaveCalendarEvent} disabled={isSaving} className="flex-1 bg-accent text-accent-foreground">
                                        {isSaving ? "Saving..." : "Save"}
                                      </Button>
                                      {getEventForDate(selectedDate) && <Button variant="outline" onClick={handleDeleteCalendarEvent} disabled={isSaving}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>}
                                    </div>
                                  </div>
                                </Card>;
                              })() : <div className="h-full flex items-center justify-center p-8 rounded-lg border-2 border-dashed border-border/50 text-muted-foreground">
                                  <p className="text-sm text-center">Select a date to set availability</p>
                                </div>}
                            </div>
                            
                            {/* Legend - desktop only */}
                            <div className="hidden lg:block p-3 md:p-4 rounded-lg bg-secondary/50 flex-shrink-0 w-48">
                              <h4 className="font-semibold text-foreground mb-2 md:mb-3">Legend</h4>
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded bg-destructive/70"></div>
                                  <span className="text-sm text-muted-foreground">Booked</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded bg-muted/80"></div>
                                  <span className="text-sm text-muted-foreground">Unavailable</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded bg-emerald-500"></div>
                                  <span className="text-sm text-muted-foreground">Available</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Booking Requests Section */}
                          <div className="mt-8 pt-8 border-t border-border">
                            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                              <CalendarIcon className="h-5 w-5 text-accent" />
                              Booking Requests
                              {(() => {
                                const todayStr = new Date().toISOString().split("T")[0];
                                const newCount = bookingRequests.filter(
                                  (r) => r.status === "pending" && r.event_date >= todayStr
                                ).length;
                                return newCount > 0 ? (
                                  <Badge variant="secondary" className="ml-2 bg-accent/10 text-accent">
                                    {newCount}
                                  </Badge>
                                ) : null;
                              })()}
                            </h3>
                            
                            {bookingRequests.length === 0 ? <Card className="border-2 border-dashed border-border/50">
                                <CardContent className="p-8 text-center">
                                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                                  <p className="text-muted-foreground">No booking requests yet</p>
                                </CardContent>
                              </Card> : <div className="space-y-3">
                                {bookingRequests.map((request) => <Card key={request.id} className="border-border/50 hover:border-accent/50 transition-colors cursor-pointer" onClick={() => {
                      setSelectedBookingRequest(request);
                      setShowBookingDetailDialog(true);
                    }}>
                                    <CardContent className="p-4">
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                              <p className="font-semibold text-foreground truncate">{request.requester_name}</p>
                                              <Badge className={request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' : request.status === 'accepted' ? 'bg-green-500/20 text-green-600 border-green-500/30' : 'bg-destructive/20 text-destructive border-destructive/30'}>
                                                {request.status === 'pending' ? 'Pending' : request.status === 'accepted' ? 'Accepted' : 'Declined'}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                              <span>{(() => {
                                    const [year, month, day] = request.event_date.split('-').map(Number);
                                    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    });
                                  })()}</span>
                                              {request.event_type && <>
                                                  <span>·</span>
                                                  <span>{request.event_type}</span>
                                                </>}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {request.status === 'pending' && <div className="flex gap-2 w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
                                            <Button size="sm" onClick={() => handleAcceptBooking(request)} disabled={isSaving} className="flex-1 md:flex-none bg-accent text-accent-foreground hover:bg-accent/90">
                                              Accept
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleDeclineBooking(request.id)} disabled={isSaving} className="flex-1 md:flex-none">
                                              Decline
                                            </Button>
                                          </div>}
                                      </div>
                                    </CardContent>
                                  </Card>)}
                              </div>}
                          </div>

                          {/* Booking Request Detail Dialog */}
                          <Dialog open={showBookingDetailDialog} onOpenChange={setShowBookingDetailDialog}>
                            <DialogContent className="max-w-md rounded-lg">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <CalendarIcon className="h-5 w-5 text-accent" />
                                  Booking Request Details
                                </DialogTitle>
                              </DialogHeader>
                              {selectedBookingRequest && <div className="space-y-4 mt-2">
                                  <div className="flex items-center justify-between">
                                    <Badge className={selectedBookingRequest.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' : selectedBookingRequest.status === 'accepted' ? 'bg-green-500/20 text-green-600 border-green-500/30' : 'bg-destructive/20 text-destructive border-destructive/30'}>
                                      {selectedBookingRequest.status === 'pending' ? 'Pending' : selectedBookingRequest.status === 'accepted' ? 'Accepted' : 'Declined'}
                                    </Badge>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isSaving}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Booking Request</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to permanently delete this booking request? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteBookingRequest(selectedBookingRequest.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>

                                  <Separator />

                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Requester</Label>
                                      <p className="font-semibold text-foreground mt-1">{selectedBookingRequest.requester_name}</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
                                        <p className="text-sm text-foreground mt-1 flex items-center gap-1 break-all">
                                          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                          {selectedBookingRequest.requester_email}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone</Label>
                                        <p className="text-sm text-foreground mt-1 flex items-center gap-1">
                                          <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                          {selectedBookingRequest.requester_phone}
                                        </p>
                                      </div>
                                    </div>

                                    <div>
                                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Event Date</Label>
                                      <p className="text-foreground mt-1 flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-accent" />
                                        {(() => {
                              const [year, month, day] = selectedBookingRequest.event_date.split('-').map(Number);
                              return new Date(year, month - 1, day).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              });
                            })()}
                                      </p>
                                    </div>

                                    {/* Parse and display time interval separately */}
                                    {selectedBookingRequest.message && selectedBookingRequest.message.startsWith('Time:') && <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Time Interval</Label>
                                        <p className="text-foreground mt-1 flex items-center gap-2">
                                          <CalendarIcon className="h-4 w-4 text-accent" />
                                          {selectedBookingRequest.message.split('\n')[0].replace('Time: ', '')}
                                        </p>
                                      </div>}

                                    {selectedBookingRequest.event_type && <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Event Type</Label>
                                        <p className="text-foreground mt-1">{selectedBookingRequest.event_type}</p>
                                      </div>}

                                    {selectedBookingRequest.message && <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Message</Label>
                                        <p className="text-foreground mt-1 p-3 bg-muted/50 rounded-lg italic">
                                          "{selectedBookingRequest.message.startsWith('Time:') ? selectedBookingRequest.message.split('\n').slice(1).join('\n').trim() || 'No additional message' : selectedBookingRequest.message}"
                                        </p>
                                      </div>}

                                    <div>
                                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Received</Label>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {new Date(selectedBookingRequest.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                                      </p>
                                    </div>
                                  </div>



                                  <div className="flex gap-2">
                                    {selectedBookingRequest.status === 'pending' && <>
                                      <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => {
                            handleAcceptBooking(selectedBookingRequest);
                            setShowBookingDetailDialog(false);
                          }} disabled={isSaving}>
                                          Accept
                                        </Button>
                                      <Button variant="outline" className="flex-1" onClick={() => {
                            handleDeclineBooking(selectedBookingRequest.id);
                            setShowBookingDetailDialog(false);
                          }} disabled={isSaving}>
                                          Decline
                                        </Button>
                                    </>}
                                  </div>
                                </div>}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TabsContent>}
                    </Tabs>
                </div>}

              {/* Messages Tab */}
              {activeTab === "messages" && <Card className="border-2 border-accent/30 shadow-[var(--shadow-gold)]">
                  <CardContent className="p-8">
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h2 className="text-2xl font-display font-bold mb-2">Messages</h2>
                      <p className="text-muted-foreground">Coming soon - message system for booking inquiries</p>
                    </div>
                  </CardContent>
                </Card>}


              {/* Settings Tab */}
              {activeTab === "settings" && <SettingsTab formData={{ email: formData.email }} handleLogout={handleLogout} handleDeleteAccount={handleDeleteAccount} isSaving={isSaving} activeSection={settingsSection} onSectionChange={setSettingsSection} />}
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && imageSrc && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-foreground mb-4">Crop Profile Picture</h3>
            
            <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden mb-4">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} cropShape="rect" showGrid={true} />
            </div>
            
            <div className="space-y-2 mb-4">
              <Label>Zoom: {zoom.toFixed(1)}x</Label>
              <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent" />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
            setShowCropper(false);
            setImageSrc(null);
          }}>
                Cancel
              </Button>
              <Button onClick={handleSaveAvatar} disabled={isSaving} className="bg-accent text-accent-foreground">
                {isSaving ? "Saving..." : "Save Picture"}
              </Button>
            </div>
          </div>
        </div>}

      {/* Booking Overwrite Warning Dialog */}
      <AlertDialog open={showBookingWarningDialog} onOpenChange={setShowBookingWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingCalendarSave?.status === 'available' ? 'Mark as Available?' : 'Mark as Unavailable?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCalendarSave?.status === 'available' ? 'This date has an accepted booking. Marking it as available will reject the booking request. The requester may need to be notified separately.' : 'This date has an accepted booking. Marking it as unavailable will reject the booking request. The requester may need to be notified separately.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
            setShowBookingWarningDialog(false);
            setPendingCalendarSave(null);
          }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBookingOverwrite} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSaving}>
              {isSaving ? "Updating..." : pendingCalendarSave?.status === 'available' ? "Yes, Mark Available" : "Yes, Mark Unavailable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete with Booking Warning Dialog */}
      <AlertDialog open={showDeleteWarningDialog} onOpenChange={setShowDeleteWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Date with Accepted Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This date has an accepted booking request. Deleting this calendar entry will mark the booking as rejected. The requester may need to be notified separately. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteWarningDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteWithBooking} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSaving}>
              {isSaving ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Review Confirmation Dialog */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={(open) => !open && setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteReviewId && handleDeleteReview(deleteReviewId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Post Confirmation Dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePostId && handleDeletePost(deletePostId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Announcement Confirmation Dialog */}
      <AlertDialog open={!!deleteAnnouncementId} onOpenChange={(open) => !open && setDeleteAnnouncementId(null)}>
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


      {/* Delete Gallery Item Confirmation Dialog */}
      <AlertDialog open={!!deleteGalleryItem} onOpenChange={(open) => !open && setDeleteGalleryItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteGalleryItem?.type === 'video' ? 'Video' : 'Photo'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteGalleryItem?.type === 'video' ? 'video' : 'photo'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteGalleryItem && handleDeleteGalleryItem(deleteGalleryItem.id, deleteGalleryItem.url, deleteGalleryItem.type)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Following Dialog */}
      <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Following ({followingCount})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {followingArtists.length === 0 ?
          <p className="text-muted-foreground text-sm text-center py-4">You're not following any artists yet.</p> :
          followingArtists.map((artist) =>
          <div key={artist.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => {setShowFollowingDialog(false);navigate(`/artist/${artist.id}`);}}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={artist.avatar_url} />
                      <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{artist.stage_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{artist.specialization} · {artist.county}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 text-xs" onClick={(e) => { e.stopPropagation(); setUnfollowTargetId(artist.id); }}>
                    Following
                  </Button>
                </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Unfollow Confirmation */}
      <AlertDialog open={!!unfollowTargetId} onOpenChange={(open) => { if (!open) setUnfollowTargetId(null); }}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Unfollow Artist</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to unfollow this artist? You can follow them again later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
              if (!user || !unfollowTargetId) return;
              await supabase.from('followers').delete().eq('follower_id', user.id).eq('artist_id', unfollowTargetId);
              setFollowingArtists((prev) => prev.filter((a) => a.id !== unfollowTargetId));
              setFollowingCount((prev) => prev - 1);
              setUnfollowTargetId(null);
            }}>Unfollow</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Followers Dialog */}
      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Followers ({followersCount})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {followersList.length === 0 ?
          <p className="text-muted-foreground text-sm text-center py-4">You don't have any followers yet.</p> :
          followersList.map((follower) =>
          <div key={follower.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => {setShowFollowersDialog(false);navigate(`/artist/${follower.id}`);}}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={follower.avatar_url} />
                      <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{follower.stage_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{follower.specialization} · {follower.county}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 text-xs text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setRemoveFollowerTargetId(follower.id); }}>
                    Remove
                  </Button>
                </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Follower Confirmation */}
      <AlertDialog open={!!removeFollowerTargetId} onOpenChange={(open) => { if (!open) setRemoveFollowerTargetId(null); }}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Follower</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove this follower? They will no longer follow you but can follow you again later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
              if (!user || !removeFollowerTargetId) return;
              await supabase.from('followers').delete().eq('artist_id', user.id).eq('follower_id', removeFollowerTargetId);
              setFollowersList((prev) => prev.filter((f) => f.id !== removeFollowerTargetId));
              setFollowersCount((prev) => prev - 1);
              setRemoveFollowerTargetId(null);
            }}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <InstagramZoomPreview media={mediaPreview} onClose={() => setMediaPreview(null)} />
    </div>;
};
export default Dashboard;