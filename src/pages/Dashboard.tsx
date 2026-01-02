import { useState, useEffect } from "react";
import SettingsTab from "@/components/SettingsTab";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
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
import { LogOut, Camera, Save, User, MapPin, Star, Music, Calendar as CalendarIcon, Award, Phone, Mail, Edit2, X, Megaphone, Plus, Trash2, Images, Play, Upload, MessageSquare, FileText, Settings as SettingsIcon, DollarSign, Facebook, Instagram, Youtube, Link as LinkIcon, Music2 } from "lucide-react";
import InstrumentSelector from "@/components/InstrumentSelector";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
const Dashboard = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "profile");

  // Update active tab when URL params change
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
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
    instruments: ""
  });

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

  // Calculate used ads
  const standardAdsUsed = announcements.filter(a => !a.is_premium).length;
  const premiumAdsUsed = announcements.filter(a => a.is_premium).length;
  const standardAdsRemaining = STANDARD_AD_LIMIT - standardAdsUsed;
  const premiumAdsRemaining = PREMIUM_AD_LIMIT - premiumAdsUsed;

  // Posts state
  const [posts, setPosts] = useState<any[]>([]);
  const [monthlyPostsCount, setMonthlyPostsCount] = useState(0);
  const [newPost, setNewPost] = useState({
    content: "",
    mediaUrl: "",
    mediaType: ""
  });
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postMediaType, setPostMediaType] = useState<'text' | 'image' | 'video'>('text');

  // Post limits for standard subscription
  const STANDARD_POST_LIMIT = 15;
  const postsRemaining = STANDARD_POST_LIMIT - monthlyPostsCount;

  // Gallery state
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [galleryUploadType, setGalleryUploadType] = useState<'image' | 'video'>('image');
  const [videoUrl, setVideoUrl] = useState("");

  // Gallery limits for standard subscription
  const STANDARD_IMAGE_LIMIT = 5;
  const STANDARD_VIDEO_LIMIT = 3;

  // Calculate used gallery items
  const imagesUsed = galleryItems.filter(item => item.type === 'image').length;
  const videosUsed = galleryItems.filter(item => item.type === 'video').length;
  const imagesRemaining = STANDARD_IMAGE_LIMIT - imagesUsed;
  const videosRemaining = STANDARD_VIDEO_LIMIT - videosUsed;

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [eventStatus, setEventStatus] = useState<'busy' | 'blocked' | 'available'>('available');
  const [eventNotes, setEventNotes] = useState("");

  // Booking requests state
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [selectedBookingRequest, setSelectedBookingRequest] = useState<any | null>(null);
  const [showBookingDetailDialog, setShowBookingDetailDialog] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const romanianCounties = ["București", "Cluj", "Timiș", "Iași", "Constanța", "Brașov", "Prahova", "Dolj", "Galați", "Argeș", "Sibiu", "Bacău"];

  // Data loading functions (defined early to avoid hoisting issues)
  const loadAnnouncements = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from('announcements').select('*').eq('profile_id', user.id).order('date', {
      ascending: false
    });
    if (data) setAnnouncements(data);
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
      setPosts(data);

      // Calculate posts created this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const postsThisMonth = data.filter(post => new Date(post.created_at) >= startOfMonth);
      setMonthlyPostsCount(postsThisMonth.length);
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
  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
      setReviews(reviews.filter(r => r.id !== reviewId));
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
        instruments: profileData.instruments || ""
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
    await supabase.auth.signOut();
    navigate('/');
  };
  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
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
    await new Promise(resolve => {
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
    return new Promise(resolve => {
      canvas.toBlob(blob => {
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
    setIsSaving(true);
    try {
      const fileName = `${user.id}/announcements/${Date.now()}_${file.name}`;
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('avatars').getPublicUrl(fileName);
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
    }
  };
  const handleAddAnnouncement = async () => {
    if (!user || !newAnnouncement.description) return;
    setIsSaving(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const {
        error
      } = await supabase.from('announcements').insert({
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
      setNewAnnouncement({
        description: "",
        isPremium: false,
        mediaUrl: "",
        mediaType: ""
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
    }
  };

  // Posts functions
  const handleAddPost = async () => {
    if (!user || !newPost.content) return;

    // Check monthly post limit
    if (monthlyPostsCount >= STANDARD_POST_LIMIT) {
      toast({
        title: "Monthly limit reached",
        description: `You can only create ${STANDARD_POST_LIMIT} posts per month with your subscription.`,
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from('posts').insert({
        profile_id: user.id,
        content: newPost.content,
        media_url: newPost.mediaUrl || null,
        media_type: newPost.mediaType || null
      });
      if (error) throw error;
      await loadPosts();
      setNewPost({
        content: "",
        mediaUrl: "",
        mediaType: ""
      });
      setShowPostDialog(false);
      setPostMediaType('text');
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
    }
  };
  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsSaving(true);
    try {
      const fileName = `${user.id}/posts/${Date.now()}_${file.name}`;
      const {
        error: uploadError
      } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('avatars').getPublicUrl(fileName);
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
      const fileName = `${user.id}/gallery/${Date.now()}_${file.name}`;
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
      const fileName = `${user.id}/gallery/videos/${Date.now()}_${file.name}`;
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
    }
  };

  // Calendar functions
  const getBookingRequestForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return bookingRequests.find(req => req.event_date === dateStr && req.status === 'accepted');
  };

  const [showBookingWarningDialog, setShowBookingWarningDialog] = useState(false);
  const [showDeleteWarningDialog, setShowDeleteWarningDialog] = useState(false);
  const [pendingCalendarSave, setPendingCalendarSave] = useState<{ dateStr: string; status: string; notes: string } | null>(null);

  const handleSaveCalendarEvent = async () => {
    if (!user || !selectedDate) return;
    
    // Use local date to avoid timezone issues
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    
    // Check if there's an accepted booking for this date
    const existingBooking = getBookingRequestForDate(selectedDate);
    const currentEvent = getEventForDate(selectedDate);
    
    // If there's an accepted booking and we're changing from busy to something else, warn the user
    if (existingBooking && currentEvent?.status === 'busy' && eventStatus !== 'busy') {
      setPendingCalendarSave({ dateStr, status: eventStatus, notes: eventNotes });
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
        const { error: updateError } = await supabase
          .from('booking_requests')
          .update({ status: 'rejected' })
          .eq('id', existingBooking.id);
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
        const { error: updateError } = await supabase
          .from('booking_requests')
          .update({ status: 'rejected' })
          .eq('id', existingBooking.id);
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
    return calendarEvents.find(event => event.event_date === dateStr);
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

      // Add the event to the calendar
      const {
        error: calendarError
      } = await supabase.from('calendar_events').upsert({
        profile_id: user!.id,
        event_date: request.event_date,
        status: 'busy',
        notes: `Booking: ${request.requester_name} - ${request.event_type || 'Event'}`
      }, {
        onConflict: 'profile_id,event_date'
      });
      if (calendarError) throw calendarError;
      await loadBookingRequests();
      await loadCalendarEvents();
      toast({
        title: "Success",
        description: "Booking accepted and added to calendar!"
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
      } = await supabase.from('booking_requests').update({ status: 'rejected' }).eq('id', requestId);
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
    return <div className="min-h-screen ml-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen ml-64">
      <Navigation />
      
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {activeTab !== "profile"}
              {/* Profile Tab */}
              {activeTab === "profile" && <div className="space-y-8">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                      <div className="flex-shrink-0 relative group cursor-pointer">
                        <div className={`p-1 rounded-full bg-gradient-to-br ${profile?.plan === 'Premium' ? 'from-yellow-400 via-amber-500 to-yellow-600' : 'from-red-500 via-red-600 to-red-500'}`}>
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
                      </div>

                      <div className="flex-1 flex flex-col justify-center h-40">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h1 className="text-4xl font-display font-bold text-foreground">
                                {formData.stageName}
                              </h1>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <Badge className="bg-muted text-muted-foreground border border-border px-4 py-1.5 text-base font-semibold">
                                {formData.specialization}
                              </Badge>
                              
                              {/* Instrument Selector for Instrumentalists */}
                              {formData.specialization?.toLowerCase() === 'instrumentalist' && (
                                <InstrumentSelector
                                  instruments={formData.instruments}
                                  onInstrumentsChange={(instruments) => {
                                    setFormData({ ...formData, instruments });
                                    // Auto-save instruments
                                    supabase.from('profiles').update({ instruments }).eq('id', user?.id).then(({ error }) => {
                                      if (!error) {
                                        toast({ title: "Saved", description: "Instruments updated!" });
                                      }
                                    });
                                  }}
                                />
                              )}
                            </div>

                            {/* Location row */}
                            <div className="flex flex-wrap items-center gap-3">
                              {editingField === 'location' ? (
                                <div className="flex items-center gap-2">
                                  <Select value={formData.county} onValueChange={value => setFormData({
                                    ...formData,
                                    county: value
                                  })}>
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {romanianCounties.map(county => <SelectItem key={county} value={county}>{county}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" onClick={() => saveField('location')} disabled={isSaving}>
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="group flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-5 w-5" />
                                  <span className="text-base">{formData.county}{formData.country ? `, ${formData.country}` : ''}</span>
                                  <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0" onClick={() => startEditing('location')}>
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground shadow-lg">
                            <Star className="h-6 w-6 fill-current" />
                            <span className="text-2xl font-bold">New</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-8" />

                    {/* Tabs Section */}
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-5 mb-8">
                        <TabsTrigger value="details" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Details
                        </TabsTrigger>
                        <TabsTrigger value="posts" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Posts
                        </TabsTrigger>
                        <TabsTrigger value="announcements" className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4" />
                          Announcements
                        </TabsTrigger>
                        <TabsTrigger value="gallery" className="flex items-center gap-2">
                          <Images className="h-4 w-4" />
                          Gallery
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          Calendar
                        </TabsTrigger>
                      </TabsList>

                      {/* Details Tab */}
                      <TabsContent value="details" className="space-y-8">
                        {/* Bio/Description */}
                        <div>
                          <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                            <User className="h-6 w-6 text-accent" />
                            About Me
                          </h2>
                          {editingField === 'bio' ? <div className="space-y-2">
                              <Textarea value={formData.bio} onChange={e => {
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
                            </div> : <div className="group">
                              {formData.bio ? <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg">
                                  {formData.bio}
                                </p> : <p className="text-muted-foreground italic">No description added yet</p>}
                              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity mt-2" onClick={() => startEditing('bio')}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                {formData.bio ? 'Edit Description' : 'Add Description'}
                              </Button>
                            </div>}
                        </div>

                        <Separator />

                        {/* Details Grid */}
                        <div className="grid md:grid-cols-3 gap-8">
                          {/* Music Genres */}
                          <div>
                            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                              <Music className="h-5 w-5 text-accent" />
                              Music Genres
                            </h3>
                            {editingField === 'genres' ? <div className="space-y-3">
                                {/* Selected genres */}
                                <div className="flex flex-wrap gap-2 min-h-[32px]">
                                  {formData.musicGenres?.split(',').filter(g => g.trim()).map((genre: string) => <Badge key={genre.trim()} variant="default" className="bg-accent text-accent-foreground px-3 py-1 cursor-pointer hover:bg-accent/80" onClick={() => {
                        const genres = formData.musicGenres.split(',').map(g => g.trim()).filter(g => g);
                        const newGenres = genres.filter(g => g !== genre.trim());
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
                                <div className="space-y-2">
                                  <Label className="text-sm text-muted-foreground">Click to add genres:</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {['Pop', 'Rock', 'Jazz', 'Hip Hop', 'R&B', 'Electronic', 'Classical', 'Country', 'Folk', 'Reggae', 'Blues', 'Soul', 'Funk', 'Metal', 'Punk', 'Latin', 'Manele', 'House', 'Disco', 'Trap', 'Indie', 'Alternative'].filter(genre => !formData.musicGenres?.split(',').map(g => g.trim()).includes(genre)).map(genre => <Badge key={genre} variant="outline" className="border-muted-foreground/30 text-muted-foreground px-3 py-1 cursor-pointer hover:border-accent hover:text-accent transition-colors" onClick={() => {
                          const currentGenres = formData.musicGenres?.split(',').map(g => g.trim()).filter(g => g) || [];
                          if (!currentGenres.includes(genre)) {
                            setFormData({
                              ...formData,
                              musicGenres: [...currentGenres, genre].join(', ')
                            });
                          }
                        }}>
                                          <Plus className="h-3 w-3 mr-1" />
                                          {genre}
                                        </Badge>)}
                                  </div>
                                </div>
                                
                                {/* Custom genre input */}
                                <div className="flex gap-2">
                                  <Input placeholder="Add custom genre..." className="flex-1" onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          const newGenre = input.value.trim();
                          if (newGenre) {
                            const currentGenres = formData.musicGenres?.split(',').map(g => g.trim()).filter(g => g) || [];
                            if (!currentGenres.includes(newGenre)) {
                              setFormData({
                                ...formData,
                                musicGenres: [...currentGenres, newGenre].join(', ')
                              });
                            }
                            input.value = '';
                          }
                        }
                      }} />
                                  <Button size="sm" variant="outline" onClick={e => {
                        const input = e.currentTarget.previousSibling as HTMLInputElement;
                        const newGenre = input.value.trim();
                        if (newGenre) {
                          const currentGenres = formData.musicGenres?.split(',').map(g => g.trim()).filter(g => g) || [];
                          if (!currentGenres.includes(newGenre)) {
                            setFormData({
                              ...formData,
                              musicGenres: [...currentGenres, newGenre].join(', ')
                            });
                          }
                          input.value = '';
                        }
                      }}>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                
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
                              </div> : <div className="group">
                                <div className="flex flex-wrap gap-2">
                                  {formData.musicGenres?.split(',').filter(g => g.trim()).map((genre: string) => <Badge key={genre.trim()} variant="outline" className="border-accent/50 text-accent px-3 py-1">
                                      {genre.trim()}
                                    </Badge>)}
                                  {(!formData.musicGenres || !formData.musicGenres.trim()) && <span className="text-muted-foreground text-sm">No genres added</span>}
                                </div>
                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity mt-2" onClick={() => startEditing('genres')}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit Genres
                                </Button>
                              </div>}
                          </div>

                          {/* Experience */}
                          <div>
                            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                              <CalendarIcon className="h-5 w-5 text-accent" />
                              Experience
                            </h3>
                            {editingField === 'experience' ? <div className="space-y-3">
                                <Select value={formData.experienceLevel} onValueChange={value => setFormData({
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
                                <Input type="number" value={formData.numberOfEvents} onChange={e => setFormData({
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
                              </div> : <div className="group">
                                <div className="space-y-2">
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
                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity mt-2" onClick={() => startEditing('experience')}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit Experience
                                </Button>
                              </div>}
                          </div>

                          {/* Estimated Price */}
                          <div>
                            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-accent" />
                              Estimated Price
                            </h3>
                            {editingField === 'price' ? <div className="space-y-2">
                                <Input value={formData.estimatedPrice} onChange={e => setFormData({
                      ...formData,
                      estimatedPrice: e.target.value
                    })} placeholder="e.g., 500-1000 RON per event" />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveField('price')} disabled={isSaving}>
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div> : <div className="group">
                                {formData.estimatedPrice ? <p className="text-muted-foreground">
                                    <span className="font-semibold text-foreground text-lg">{formData.estimatedPrice}</span>
                                  </p> : <p className="text-muted-foreground italic">No price range added yet</p>}
                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity mt-2" onClick={() => startEditing('price')}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  {formData.estimatedPrice ? 'Edit Price' : 'Add Price'}
                                </Button>
                              </div>}
                          </div>
                        </div>

                        <Separator />

                        {/* Contact Information */}
                        <div>
                          <h3 className="text-xl font-display font-bold mb-4">Contact Information</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
                              <Mail className="h-5 w-5 text-accent" />
                              <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <span className="text-foreground">{formData.email}</span>
                              </div>
                            </div>
                            {editingField === 'contact' ? (
                              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
                                <Phone className="h-5 w-5 text-accent" />
                                <div className="flex-1">
                                  <p className="text-sm text-muted-foreground">Phone</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Input 
                                      value={formData.phone} 
                                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                                      placeholder="Phone Number" 
                                      className="h-8" 
                                    />
                                    <Button size="sm" onClick={() => saveField('contact')} disabled={isSaving}>
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelEditing}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="group flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
                                <Phone className="h-5 w-5 text-accent" />
                                <div className="flex-1">
                                  <p className="text-sm text-muted-foreground">Phone</p>
                                  <span className="text-foreground">{formData.phone || 'Not set'}</span>
                                </div>
                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0" onClick={() => startEditing('contact')}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <Separator />

                        {/* Social Networks */}
                        <div>
                          <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-accent" />
                            Social Networks
                          </h3>
                          {editingField === 'social' ? <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Facebook className="h-5 w-5 text-accent flex-shrink-0" />
                                <Input value={formData.facebookUrl} onChange={e => setFormData({
                      ...formData,
                      facebookUrl: e.target.value
                    })} placeholder="Facebook profile URL" />
                              </div>
                              <div className="flex items-center gap-2">
                                <Instagram className="h-5 w-5 text-accent flex-shrink-0" />
                                <Input value={formData.instagramUrl} onChange={e => setFormData({
                      ...formData,
                      instagramUrl: e.target.value
                    })} placeholder="Instagram profile URL" />
                              </div>
                              <div className="flex items-center gap-2">
                                <Youtube className="h-5 w-5 text-accent flex-shrink-0" />
                                <Input value={formData.youtubeUrl} onChange={e => setFormData({
                      ...formData,
                      youtubeUrl: e.target.value
                    })} placeholder="YouTube channel URL" />
                              </div>
                              <div className="flex items-center gap-2">
                                <Music className="h-5 w-5 text-accent flex-shrink-0" />
                                <Input value={formData.tiktokUrl} onChange={e => setFormData({
                      ...formData,
                      tiktokUrl: e.target.value
                    })} placeholder="TikTok profile URL" />
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-accent flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                </svg>
                                <Input value={formData.spotifyUrl} onChange={e => setFormData({
                      ...formData,
                      spotifyUrl: e.target.value
                    })} placeholder="Spotify artist URL" />
                              </div>
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
                            </div> : <div className="group">
                              <div className="flex flex-wrap gap-3">
                                {formData.facebookUrl && <a href={formData.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors">
                                    <Facebook className="h-5 w-5 text-accent" />
                                    <span className="text-sm">Facebook</span>
                                  </a>}
                                {formData.instagramUrl && <a href={formData.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors">
                                    <Instagram className="h-5 w-5 text-accent" />
                                    <span className="text-sm">Instagram</span>
                                  </a>}
                                {formData.youtubeUrl && <a href={formData.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors">
                                    <Youtube className="h-5 w-5 text-accent" />
                                    <span className="text-sm">YouTube</span>
                                  </a>}
                                {formData.tiktokUrl && <a href={formData.tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors">
                                    <Music className="h-5 w-5 text-accent" />
                                    <span className="text-sm">TikTok</span>
                                  </a>}
                                {formData.spotifyUrl && <a href={formData.spotifyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors">
                                    <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                    </svg>
                                    <span className="text-sm">Spotify</span>
                                  </a>}
                                {!formData.facebookUrl && !formData.instagramUrl && !formData.youtubeUrl && !formData.tiktokUrl && !formData.spotifyUrl && <p className="text-muted-foreground italic">No social networks added yet</p>}
                              </div>
                              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity mt-2" onClick={() => startEditing('social')}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                {formData.facebookUrl || formData.instagramUrl || formData.youtubeUrl || formData.tiktokUrl || formData.spotifyUrl ? 'Edit Social Networks' : 'Add Social Networks'}
                              </Button>
                            </div>}
                         </div>

                        <Separator className="my-8" />

                        {/* Reviews Section */}
                        <div>
                          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                            <Star className="h-6 w-6 text-accent" />
                            My Reviews
                            {getAverageRating() && <span className="text-lg font-display font-bold text-foreground">
                                ({getAverageRating()} • {reviews.length})
                              </span>}
                          </h2>
                          
                          {reviews.length > 0 ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {reviews.map(review => <div key={review.id} className="flex flex-col gap-3 p-4 rounded-lg border border-accent/20 hover:border-accent/40 transition-colors bg-card/50 relative">
                                  <button onClick={() => handleDeleteReview(review.id)} className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete review" disabled={isSaving}>
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
                                    {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />)}
                                  </div>
                                  {review.comment && <p className="text-sm text-muted-foreground flex-1">{review.comment}</p>}
                                </div>)}
                            </div> : <div className="text-center py-12 border border-dashed border-accent/30 rounded-lg">
                              <Star className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                              <p className="text-muted-foreground">No reviews yet</p>
                              <p className="text-sm text-muted-foreground mt-1">Reviews from your clients will appear here</p>
                            </div>}
                        </div>
                      </TabsContent>

                      {/* Posts Tab */}
                      <TabsContent value="posts" className="space-y-6">
                        <div className="max-w-[500px] mx-auto space-y-1">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card/50 rounded-lg border border-border/50">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-accent" />
                              <span className="text-sm text-muted-foreground">Monthly Posts: <span className="font-medium text-foreground">{monthlyPostsCount}/{STANDARD_POST_LIMIT}</span></span>
                            </div>
                            <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={postsRemaining <= 0}>
                                  <Plus className="h-4 w-4 mr-1" />
                                  New Post
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Create New Post</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  <Tabs value={postMediaType} onValueChange={v => setPostMediaType(v as 'text' | 'image' | 'video')}>
                                    <TabsList className="grid w-full grid-cols-3">
                                      <TabsTrigger value="text">Text Only</TabsTrigger>
                                      <TabsTrigger value="image">Photo</TabsTrigger>
                                      <TabsTrigger value="video">Video</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="text" className="space-y-4">
                                      <div>
                                        <Label>Post Content</Label>
                                        <Textarea value={newPost.content} onChange={e => setNewPost({
                                          ...newPost,
                                          content: e.target.value
                                        })} placeholder="What's on your mind?" rows={6} className="mt-2" />
                                      </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="image" className="space-y-4">
                                      <div>
                                        <Label>Post Content</Label>
                                        <Textarea value={newPost.content} onChange={e => setNewPost({
                                          ...newPost,
                                          content: e.target.value
                                        })} placeholder="What's on your mind?" rows={4} className="mt-2" />
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
                                      {!newPost.mediaUrl && <>
                                          <Label htmlFor="post-image-inner" className="cursor-pointer">
                                            <div className="border-2 border-dashed border-accent/50 rounded-lg p-8 text-center hover:border-accent transition-colors">
                                              <Upload className="h-12 w-12 mx-auto mb-2 text-accent" />
                                              <p className="text-sm text-muted-foreground">Click to upload image</p>
                                            </div>
                                          </Label>
                                          <Input id="post-image-inner" type="file" accept="image/*" onChange={handlePostImageUpload} className="hidden" />
                                        </>}
                                    </TabsContent>
                                    
                                    <TabsContent value="video" className="space-y-4">
                                      <div>
                                        <Label>Post Content</Label>
                                        <Textarea value={newPost.content} onChange={e => setNewPost({
                                          ...newPost,
                                          content: e.target.value
                                        })} placeholder="What's on your mind?" rows={4} className="mt-2" />
                                      </div>
                                      <div>
                                        <Label>Video URL (YouTube/Embed)</Label>
                                        <Input value={newPost.mediaUrl} onChange={e => {
                                          setNewPost({
                                            ...newPost,
                                            mediaUrl: e.target.value,
                                            mediaType: 'video'
                                          });
                                        }} placeholder="https://www.youtube.com/embed/..." className="mt-2" />
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                  
                                  <Button onClick={handleAddPost} disabled={isSaving || !newPost.content} className="w-full bg-accent text-accent-foreground">
                                    {isSaving ? "Creating..." : "Create Post"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          {posts.map(post => <Card key={post.id} className="overflow-hidden border-border/40 shadow-sm rounded-lg">
                              <div className="p-4 pb-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                      <AvatarImage src={profile?.avatar_url || undefined} alt={formData.stageName} />
                                      <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                        {formData.stageName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
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
                                  
                                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => handleDeletePost(post.id)} disabled={isSaving}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                                <p className="text-foreground mt-3 whitespace-pre-wrap">{post.content}</p>
                              </div>
                              
                              {post.media_url && <div className="mt-3 bg-muted/30">
                                  {post.media_type === "video" ? <div className="relative w-full aspect-video">
                                      <video src={post.media_url} controls className="absolute inset-0 w-full h-full object-contain bg-black" />
                                    </div> : <img src={post.media_url} alt="Post content" className="w-full h-auto max-h-[400px] object-contain" />}
                                </div>}
                              <div className="p-4" />
                            </Card>)}
                          
                          {posts.length === 0 && <Card className="border-2 border-dashed border-accent/30">
                              <CardContent className="p-12 text-center">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                                <p className="text-muted-foreground">No posts yet. Create your first post!</p>
                              </CardContent>
                            </Card>}
                        </div>
                      </TabsContent>

                      {/* Announcements Tab */}
                      <TabsContent value="announcements" className="space-y-4">
                        <div className="max-w-[500px] mx-auto space-y-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card/50 rounded-lg border border-border/50">
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Standard: <span className="font-medium text-foreground">{standardAdsUsed}/{STANDARD_AD_LIMIT}</span></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-accent" />
                                <span className="text-sm text-muted-foreground">Promotion: <span className="font-medium text-foreground">{premiumAdsUsed}/{PREMIUM_AD_LIMIT}</span></span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                                <DollarSign className="h-4 w-4 mr-1" />
                                Buy Ads
                              </Button>
                              <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                                <DialogTrigger asChild>
                                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                    <Plus className="h-4 w-4 mr-1" />
                                    New Ad
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Add New Announcement</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 mt-4">
                                    <div className="flex items-center space-x-2 p-3 border border-accent/20 rounded-lg bg-accent/5">
                                      <Checkbox id="premium-ad-inner" checked={newAnnouncement.isPremium} onCheckedChange={checked => setNewAnnouncement({
                                        ...newAnnouncement,
                                        isPremium: checked as boolean
                                      })} />
                                      <Label htmlFor="premium-ad-inner" className="cursor-pointer font-medium">
                                        Promotion Ad (with photo/video)
                                      </Label>
                                    </div>
                                    
                                    <div>
                                      <Label htmlFor="announcement-text-inner">Announcement Text</Label>
                                      <Textarea id="announcement-text-inner" value={newAnnouncement.description} onChange={e => setNewAnnouncement({
                                        ...newAnnouncement,
                                        description: e.target.value
                                      })} placeholder="Write your announcement here..." rows={4} className="mt-2" />
                                    </div>
                                    
                                    {newAnnouncement.isPremium && <div>
                                        <Label htmlFor="announcement-media-inner">Photo/Video</Label>
                                        {newAnnouncement.mediaUrl ? <div className="mt-2 relative">
                                            {newAnnouncement.mediaType === 'video' ? <video src={newAnnouncement.mediaUrl} controls className="w-full rounded-lg max-h-48" /> : <img src={newAnnouncement.mediaUrl} alt="Preview" className="w-full rounded-lg max-h-48 object-cover" />}
                                            <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => setNewAnnouncement({
                                              ...newAnnouncement,
                                              mediaUrl: "",
                                              mediaType: ""
                                            })}>
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div> : <>
                                            <Label htmlFor="announcement-media-input-inner" className="cursor-pointer">
                                              <div className="border-2 border-dashed border-accent/50 rounded-lg p-6 text-center hover:border-accent transition-colors mt-2">
                                                <Upload className="h-10 w-10 mx-auto mb-2 text-accent" />
                                                <p className="text-sm text-muted-foreground">Click to upload photo or video</p>
                                              </div>
                                            </Label>
                                            <Input id="announcement-media-input-inner" type="file" accept="image/*,video/*" onChange={handleAnnouncementMediaUpload} className="hidden" />
                                          </>}
                                      </div>}
                                    
                                    <Button onClick={handleAddAnnouncement} disabled={isSaving || !newAnnouncement.description} className="w-full bg-accent text-accent-foreground">
                                      {isSaving ? "Adding..." : "Add Announcement"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                          {announcements.map(announcement => <Card key={announcement.id} className="overflow-hidden border-border/40 shadow-sm rounded-lg">
                              <div className="p-4 pb-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-0.5 rounded-full ${profile?.plan === 'Premium' ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600' : 'bg-gradient-to-r from-red-500 via-red-600 to-red-500'}`}>
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
                                        {announcement.is_premium && <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                                            Promotion
                                          </Badge>}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{profile?.specialization || "Artist"}</span>
                                        <span>·</span>
                                        <span>{new Date(announcement.date).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleDeleteAnnouncement(announcement.id)} disabled={isSaving}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </div>
                                <p className="text-foreground mt-3 whitespace-pre-wrap">{announcement.description}</p>
                              </div>
                              
                              {announcement.is_premium && announcement.media_url && <div className="mt-3 bg-muted/30">
                                  {announcement.media_type === "video" ? <div className="relative w-full aspect-video">
                                      <video src={announcement.media_url} controls className="absolute inset-0 w-full h-full object-contain bg-black" />
                                    </div> : <img src={announcement.media_url} alt="Announcement media" className="w-full h-auto max-h-[400px] object-contain" />}
                                </div>}
                              
                              <div className="h-2" />
                            </Card>)}
                          {announcements.length === 0 && <div className="text-center py-12 text-muted-foreground">
                              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-50" />
                              <p className="text-sm">No announcements yet</p>
                            </div>}
                        </div>
                      </TabsContent>

                      {/* Gallery Tab */}
                      <TabsContent value="gallery">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                            <Images className="h-6 w-6 text-accent" />
                            My Gallery
                          </h2>
                          <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
                            <DialogTrigger asChild>
                              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Media
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Media</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <Tabs value={galleryUploadType} onValueChange={v => setGalleryUploadType(v as 'image' | 'video')}>
                                  <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="image">Image</TabsTrigger>
                                    <TabsTrigger value="video">Video</TabsTrigger>
                                  </TabsList>
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
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {galleryItems.filter(item => item.type === 'image').map(item => <div key={item.id} className="relative group">
                                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-accent/20">
                                    <img src={item.url} alt="Gallery item" className="w-full h-full object-cover" />
                                  </div>
                                  <Button size="sm" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteGalleryItem(item.id, item.url, item.type)} disabled={isSaving}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>)}
                              {galleryItems.filter(item => item.type === 'image').length === 0 && <div className="col-span-full text-center text-muted-foreground py-8">
                                  No photos yet. Add your first image!
                                </div>}
                            </div>
                          </div>

                          {/* Videos Section */}
                          <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                              <Play className="h-5 w-5 text-accent" />
                              Videos
                              <span className="text-muted-foreground">({videosUsed}/{STANDARD_VIDEO_LIMIT})</span>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {galleryItems.filter(item => item.type === 'video').map(item => <div key={item.id} className="relative group">
                                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-accent/20 bg-black/80 flex items-center justify-center">
                                    <Play className="h-12 w-12 text-accent" />
                                  </div>
                                  <Button size="sm" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteGalleryItem(item.id, item.url, item.type)} disabled={isSaving}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>)}
                              {galleryItems.filter(item => item.type === 'video').length === 0 && <div className="col-span-full text-center text-muted-foreground py-8">
                                  No videos yet. Add your first video!
                                </div>}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Calendar Tab */}
                      <TabsContent value="calendar">
                        <div>
                          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                            <CalendarIcon className="h-6 w-6 text-accent" />
                            My Calendar
                          </h2>
                          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-4 items-start">
                            {/* Calendar */}
                            <div className="flex-shrink-0">
                              <Calendar mode="single" selected={selectedDate} onSelect={date => {
                                setSelectedDate(date);
                                if (date) {
                                  const event = getEventForDate(date);
                                  if (event) {
                                    setEventStatus(event.status);
                                    setEventNotes(event.notes || "");
                                  } else {
                                    setEventStatus('available');
                                    setEventNotes("");
                                  }
                                }
                              }} className="rounded-lg border border-border shadow-sm pointer-events-auto" disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))} modifiers={{
                                busy: calendarEvents.filter(e => e.status === 'busy').map(e => new Date(e.event_date)),
                                blocked: calendarEvents.filter(e => e.status === 'blocked').map(e => new Date(e.event_date))
                              }} modifiersClassNames={{
                                busy: "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground opacity-70",
                                blocked: "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground opacity-80"
                              }} />
                            </div>
                            
                            {/* Date Details Form */}
                            <div className="min-w-0">
                              {selectedDate ? (
                                <Card className="p-4 h-full">
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
                                      <Select value={eventStatus} onValueChange={v => setEventStatus(v as any)}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="available">Available</SelectItem>
                                          <SelectItem value="busy">Busy / Booked</SelectItem>
                                          <SelectItem value="blocked">Unavailable</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Notes (optional)</Label>
                                      <Textarea value={eventNotes} onChange={e => setEventNotes(e.target.value)} placeholder="Event details..." rows={3} />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button onClick={handleSaveCalendarEvent} disabled={isSaving} className="flex-1 bg-accent text-accent-foreground">
                                        {isSaving ? "Saving..." : "Save"}
                                      </Button>
                                      {getEventForDate(selectedDate) && <Button variant="outline" onClick={handleDeleteCalendarEvent} disabled={isSaving}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>}
                                    </div>
                                  </div>
                                </Card>
                              ) : (
                                <div className="h-full flex items-center justify-center p-8 rounded-lg border-2 border-dashed border-border/50 text-muted-foreground">
                                  <p className="text-sm text-center">Select a date to set availability</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Legend */}
                            <div className="p-4 rounded-lg bg-secondary/50 space-y-3 flex-shrink-0 w-full lg:w-48">
                              <h4 className="font-semibold text-foreground">Legend</h4>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-destructive/70"></div>
                                <span className="text-sm text-muted-foreground">Busy / Booked</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-muted/80"></div>
                                <span className="text-sm text-muted-foreground">Unavailable</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-accent"></div>
                                <span className="text-sm text-muted-foreground">Available</span>
                              </div>
                            </div>
                          </div>

                          {/* Booking Requests Section */}
                          <div className="mt-8 pt-8 border-t border-border">
                            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                              <CalendarIcon className="h-5 w-5 text-accent" />
                              Booking Requests
                            </h3>
                            
                            {bookingRequests.length === 0 ? (
                              <Card className="border-2 border-dashed border-border/50">
                                <CardContent className="p-8 text-center">
                                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                                  <p className="text-muted-foreground">No booking requests yet</p>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="space-y-3">
                                {bookingRequests.map(request => (
                                  <Card 
                                    key={request.id} 
                                    className="border-border/50 hover:border-accent/50 transition-colors cursor-pointer"
                                    onClick={() => {
                                      setSelectedBookingRequest(request);
                                      setShowBookingDetailDialog(true);
                                    }}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                              <p className="font-semibold text-foreground truncate">{request.requester_name}</p>
                                              <Badge 
                                                className={
                                                  request.status === 'pending' 
                                                    ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' 
                                                    : request.status === 'accepted' 
                                                    ? 'bg-green-500/20 text-green-600 border-green-500/30'
                                                    : 'bg-destructive/20 text-destructive border-destructive/30'
                                                }
                                              >
                                                {request.status === 'pending' ? 'Pending' : request.status === 'accepted' ? 'Accepted' : 'Declined'}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                              <span>{new Date(request.event_date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                              })}</span>
                                              {request.event_type && (
                                                <>
                                                  <span>·</span>
                                                  <span>{request.event_type}</span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {request.status === 'pending' && (
                                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button 
                                              size="sm" 
                                              onClick={() => handleAcceptBooking(request)} 
                                              disabled={isSaving} 
                                              className="bg-accent text-accent-foreground hover:bg-accent/90"
                                            >
                                              Accept
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              onClick={() => handleDeclineBooking(request.id)} 
                                              disabled={isSaving}
                                            >
                                              Decline
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Booking Request Detail Dialog */}
                          <Dialog open={showBookingDetailDialog} onOpenChange={setShowBookingDetailDialog}>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <CalendarIcon className="h-5 w-5 text-accent" />
                                  Booking Request Details
                                </DialogTitle>
                              </DialogHeader>
                              {selectedBookingRequest && (
                                <div className="space-y-4 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      className={
                                        selectedBookingRequest.status === 'pending' 
                                          ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' 
                                          : selectedBookingRequest.status === 'accepted' 
                                          ? 'bg-green-500/20 text-green-600 border-green-500/30'
                                          : 'bg-destructive/20 text-destructive border-destructive/30'
                                      }
                                    >
                                      {selectedBookingRequest.status === 'pending' ? 'Pending' : selectedBookingRequest.status === 'accepted' ? 'Accepted' : 'Declined'}
                                    </Badge>
                                  </div>

                                  <Separator />

                                  <div className="space-y-3">
                                    <div>
                                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Requester</Label>
                                      <p className="font-semibold text-foreground mt-1">{selectedBookingRequest.requester_name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
                                        <p className="text-sm text-foreground mt-1 flex items-center gap-1">
                                          <Mail className="h-3 w-3 text-muted-foreground" />
                                          {selectedBookingRequest.requester_email}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone</Label>
                                        <p className="text-sm text-foreground mt-1 flex items-center gap-1">
                                          <Phone className="h-3 w-3 text-muted-foreground" />
                                          {selectedBookingRequest.requester_phone}
                                        </p>
                                      </div>
                                    </div>

                                    <div>
                                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Event Date</Label>
                                      <p className="text-foreground mt-1 flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-accent" />
                                        {new Date(selectedBookingRequest.event_date).toLocaleDateString('en-US', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </p>
                                    </div>

                                    {/* Parse and display time interval separately */}
                                    {selectedBookingRequest.message && selectedBookingRequest.message.startsWith('Time:') && (
                                      <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Time Interval</Label>
                                        <p className="text-foreground mt-1 flex items-center gap-2">
                                          <CalendarIcon className="h-4 w-4 text-accent" />
                                          {selectedBookingRequest.message.split('\n')[0].replace('Time: ', '')}
                                        </p>
                                      </div>
                                    )}

                                    {selectedBookingRequest.event_type && (
                                      <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Event Type</Label>
                                        <p className="text-foreground mt-1">{selectedBookingRequest.event_type}</p>
                                      </div>
                                    )}

                                    {selectedBookingRequest.message && (
                                      <div>
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Message</Label>
                                        <p className="text-foreground mt-1 p-3 bg-muted/50 rounded-lg italic">
                                          "{selectedBookingRequest.message.startsWith('Time:') 
                                            ? selectedBookingRequest.message.split('\n').slice(1).join('\n').trim() || 'No additional message'
                                            : selectedBookingRequest.message}"
                                        </p>
                                      </div>
                                    )}

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

                                  {selectedBookingRequest.status === 'pending' && (
                                    <>
                                      <Separator />
                                      <div className="flex gap-2">
                                        <Button 
                                          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                                          onClick={() => {
                                            handleAcceptBooking(selectedBookingRequest);
                                            setShowBookingDetailDialog(false);
                                          }}
                                          disabled={isSaving}
                                        >
                                          Accept
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          className="flex-1"
                                          onClick={() => {
                                            handleDeclineBooking(selectedBookingRequest.id);
                                            setShowBookingDetailDialog(false);
                                          }}
                                          disabled={isSaving}
                                        >
                                          Decline
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TabsContent>
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
              {activeTab === "settings" && <SettingsTab formData={formData} handleLogout={handleLogout} handleDeleteAccount={handleDeleteAccount} isSaving={isSaving} />}
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
              <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent" />
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
              {pendingCalendarSave?.status === 'available' 
                ? 'Mark as Available?' 
                : 'Mark as Unavailable?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCalendarSave?.status === 'available' 
                ? 'This date has an accepted booking. Marking it as available will reject the booking request. The requester may need to be notified separately.'
                : 'This date has an accepted booking. Marking it as unavailable will reject the booking request. The requester may need to be notified separately.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowBookingWarningDialog(false);
              setPendingCalendarSave(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBookingOverwrite}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSaving}
            >
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
            <AlertDialogAction
              onClick={handleConfirmDeleteWithBooking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSaving}
            >
              {isSaving ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default Dashboard;