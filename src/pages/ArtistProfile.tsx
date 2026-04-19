import { useParams, Link, useNavigate } from "react-router-dom";
import { formatSmartDate, formatDateNoYear } from "@/lib/utils";
import ExpandableText from "@/components/ExpandableText";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { getCountryFlag } from "@/lib/countryFlags";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { User, MapPin, Star, Music, Calendar as CalendarIcon, Award, Phone, Mail, Instagram, Facebook, Youtube, ArrowLeft, ArrowRight, Images, Play, DollarSign, Euro, Megaphone, MessageCircle, Trash2, FileText, MoreHorizontal, Flag, Heart, Globe, Music2, Clock, Lock, UserPlus, UserCheck, Pencil } from "lucide-react";
import EditContentDialog from "@/components/EditContentDialog";
import { isAdExpired } from "@/lib/adExpiration";
import { getInstrumentIcon } from "@/lib/instrumentIcons";
import TimeSelector from "@/components/TimeSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { parseYMDToLocalDate, formatLocalDateToYMD } from "@/lib/utils";
import InstagramZoomPreview from "@/components/InstagramZoomPreview";
import { getAvatarOutlineClasses, getAvatarOutlineClassesLarge } from "@/lib/subscriptionStyles";
import { getReviewDisplayLimit, getVisibleSocialLinks, canSetEstimatedPrice, canPost, isFree as isPlanFree, getVideoLimit, canUseTimeIntervals } from "@/lib/planLimits";
interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  stage_name: string;
  email: string;
  phone: string;
  county: string;
  country: string | null;
  specialization: string | null;
  music_genres: string | null;
  career_start_year: number | null;
  number_of_events: number;
  bio: string | null;
  avatar_url: string | null;
  plan: string;
  estimated_price: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  spotify_url: string | null;
  instruments: string | null;
  created_at: string | null;
  hide_phone: boolean;
  hide_email: boolean;
}
interface Announcement {
  id: string;
  title: string;
  description: string;
  date: string;
  created_at: string;
  is_premium: boolean;
  media_url: string | null;
  media_type: string | null;
  location: string | null;
  event_date: string | null;
  budget: string | null;
}
interface GalleryItem {
  id: string;
  type: string;
  url: string;
  thumbnail_url: string | null;
}
interface CalendarEvent {
  id: string;
  event_date: string;
  status: string;
  notes: string | null;
}
interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_user_id: string | null;
  reviewer_avatar_url?: string | null;
}
interface Post {
  id: string;
  profile_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  likes: number;
  isLiked: boolean;
}
interface MediaPreview {
  url: string;
  type: "image" | "video";
}
const enrichReviewsWithAvatars = async (reviews: Review[]): Promise<Review[]> => {
  const userIds = reviews.map(r => r.reviewer_user_id).filter(Boolean) as string[];
  if (userIds.length === 0) return reviews;
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .in('id', userIds);
  const avatarMap = new Map(profiles?.map(p => [p.id, p.avatar_url]) || []);
  return reviews.map(r => ({
    ...r,
    reviewer_avatar_url: r.reviewer_user_id ? avatarMap.get(r.reviewer_user_id) || null : null,
  }));
};

const ArtistProfile = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Profile | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    phone: "",
    startTime: "",
    endTime: "",
    endDate: null as Date | null,
    eventType: "",
    message: ""
  });
  const [reviewForm, setReviewForm] = useState({
    name: "",
    email: "",
    rating: 5,
    comment: ""
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<{ id: string; text: string; table: "posts" | "announcements" } | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(items => items.filter(p => p.id !== postId));
      toast({ title: "Post deleted", description: "Your post has been deleted." });
    } catch (err) {
      console.error('Error deleting post:', err);
      toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" });
    } finally {
      setDeletePostId(null);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', announcementId);
      if (error) throw error;
      setAnnouncements(items => items.filter(a => a.id !== announcementId));
      toast({ title: "Deleted", description: "Your item has been deleted." });
    } catch (err) {
      console.error('Error deleting announcement:', err);
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleteAnnouncementId(null);
    }
  };
  const [dateDetailDialogOpen, setDateDetailDialogOpen] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      setCurrentUserId(userId);

      // Redirect to appropriate dashboard if viewing own profile
      if (userId && userId === id) {
        // Check if user is an artist or regular user
        const {
          data: roleData
        } = await supabase.from('user_roles').select('user_type').eq('user_id', userId).maybeSingle();
        if (roleData?.user_type === 'user') {
          navigate('/user-dashboard', {
            replace: true
          });
        } else {
          navigate('/dashboard?tab=profile', {
            replace: true
          });
        }
        return;
      }
      if (session?.user?.id) {
        // Try to fetch user's profile for pre-filling review and booking forms
        const {
          data: profileData
        } = await supabase.from('profiles').select('first_name, last_name, email, phone').eq('id', session.user.id).maybeSingle();
        if (profileData) {
          setCurrentUserProfile(profileData);
          const fullName = `${profileData.first_name} ${profileData.last_name}`.trim();
          setReviewForm((prev) => ({
            ...prev,
            name: fullName,
            email: profileData.email
          }));
          setBookingForm((prev) => ({
            ...prev,
            name: fullName,
            email: profileData.email,
            phone: profileData.phone || ''
          }));
        } else {
          // Fallback to auth email if no profile exists
          setReviewForm((prev) => ({
            ...prev,
            email: session.user.email || ''
          }));
          setBookingForm((prev) => ({
            ...prev,
            email: session.user.email || ''
          }));
        }
      }
    };
    checkAuth();
  }, []);
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!id) return;

      // Fetch profile
      const {
        data: profileData,
        error: profileError
      } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setArtist(profileData);
      }

      // Fetch announcements
      const {
        data: announcementsData
      } = await supabase.from('announcements').select('id, title, description, date, created_at, is_premium, media_url, media_type, location, event_date, budget').eq('profile_id', id).order('is_premium', {
        ascending: false
      }).order('created_at', {
        ascending: false
      });
      setAnnouncements(announcementsData || []);

      // Fetch gallery items
      const {
        data: galleryData
      } = await supabase.from('gallery_items').select('id, type, url, thumbnail_url').eq('profile_id', id);
      setGalleryItems(galleryData || []);

      // Fetch calendar events
      const {
        data: calendarData
      } = await supabase.from('calendar_events').select('id, event_date, status, notes').eq('profile_id', id);
      setCalendarEvents(calendarData || []);

      // Fetch reviews
      const {
        data: reviewsData
      } = await supabase.from('reviews').select('id, reviewer_name, rating, comment, created_at, reviewer_user_id').eq('profile_id', id).order('created_at', {
        ascending: false
      });
      // Fetch reviewer avatars
      const reviewsWithAvatars = await enrichReviewsWithAvatars(reviewsData || []);
      setReviews(reviewsWithAvatars);

      // Fetch posts with likes count
      const {
        data: postsData
      } = await supabase.from('posts').select('id, profile_id, content, media_url, media_type, created_at').eq('profile_id', id).order('created_at', {
        ascending: false
      });

      // Get current user session for checking likes
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Fetch likes count and check if current user liked each post
      const postsWithLikes = await Promise.all((postsData || []).map(async (post) => {
        const {
          count
        } = await supabase.from('post_likes').select('id', {
          count: 'exact',
          head: true
        }).eq('post_id', post.id);
        let isLiked = false;
        if (userId) {
          const {
            data: likeData
          } = await supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', userId).maybeSingle();
          isLiked = !!likeData;
        }
        return {
          ...post,
          likes: count || 0,
          isLiked
        };
      }));
      setPosts(postsWithLikes);

      // Fetch followers count (only count followers whose profiles still exist)
      const { data: followerRows } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('artist_id', id);
      if (followerRows && followerRows.length > 0) {
        const { count: validFollowerCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .in('id', followerRows.map(f => f.follower_id));
        setFollowersCount(validFollowerCount || 0);
      } else {
        setFollowersCount(0);
      }

      // Fetch following count (only count artists whose profiles still exist)
      const { data: followingRows } = await supabase
        .from('followers')
        .select('artist_id')
        .eq('follower_id', id);
      if (followingRows && followingRows.length > 0) {
        const { count: validFollowingCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .in('id', followingRows.map(f => f.artist_id));
        setFollowingCount(validFollowingCount || 0);
      } else {
        setFollowingCount(0);
      }


      // Check if current user follows this artist
      // Check if current user follows this artist
      if (userId) {
        const { data: followData } = await supabase.
        from('followers').
        select('id').
        eq('artist_id', id).
        eq('follower_id', userId).
        maybeSingle();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    };
    fetchArtistData();
  }, [id]);
  const getBusyDates = () => {
    return calendarEvents.filter((event) => event.status === 'busy' || event.status === 'booked').map((event) => parseYMDToLocalDate(event.event_date));
  };
  const getBlockedDates = () => {
    return calendarEvents.filter((event) => event.status === 'blocked' || event.status === 'unavailable').map((event) => parseYMDToLocalDate(event.event_date));
  };
  const isBusyDate = (date: Date) => {
    return getBusyDates().some((busyDate: Date) => busyDate.getDate() === date.getDate() && busyDate.getMonth() === date.getMonth() && busyDate.getFullYear() === date.getFullYear());
  };
  const isBlockedDate = (date: Date) => {
    return getBlockedDates().some((blockedDate: Date) => blockedDate.getDate() === date.getDate() && blockedDate.getMonth() === date.getMonth() && blockedDate.getFullYear() === date.getFullYear());
  };
  const getEventForDate = (date: Date) => {
    return calendarEvents.find((event) => {
      const eventDate = parseYMDToLocalDate(event.event_date);
      return eventDate.getDate() === date.getDate() && eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
    });
  };
  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter((event) => {
      const eventDate = parseYMDToLocalDate(event.event_date);
      return eventDate.getDate() === date.getDate() && eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
    });
  };
  const extractTimeFromNotes = (notes: string | null) => {
    if (!notes) return null;
    // Try to extract time pattern like "Time: 12:00 - 18:00" or "19:00 - Jan 18, 2026 13:15"
    const timeMatch = notes.match(/Time:\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2})\s*-\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2})/i);
    if (timeMatch) {
      return {
        startTime: timeMatch[1],
        endTime: timeMatch[2]
      };
    }
    return null;
  };

  // Parse all time slots from notes that can contain multiple events separated by ---
  const extractAllTimeSlotsFromNotes = (notes: string | null): {
    startTime: string;
    endTime: string;
    bookedBy?: string;
    eventType?: string;
  }[] => {
    if (!notes) return [];
    const entries = notes.split(/\n\n---\n\n/);
    const slots: {
      startTime: string;
      endTime: string;
      bookedBy?: string;
      eventType?: string;
    }[] = [];
    for (const entry of entries) {
      const timeMatch = entry.match(/Time:\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2})\s*-\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2})/i);
      const bookedByMatch = entry.match(/Booked by:\s*(.+)/i);
      const eventTypeMatch = entry.match(/Event:\s*(.+)/i);
      if (timeMatch) {
        slots.push({
          startTime: timeMatch[1],
          endTime: timeMatch[2],
          bookedBy: bookedByMatch?.[1]?.trim(),
          eventType: eventTypeMatch?.[1]?.trim()
        });
      }
    }
    return slots;
  };
  const isOwnProfile = currentUserId === id;
  const handlePostLike = async (postId: string) => {
    if (!currentUserId) {
      toast({
        title: "Login Required",
        description: "Please log in to like posts."
      });
      navigate('/login');
      return;
    }
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Optimistic update
    setPosts((currentPosts) => currentPosts.map((p) => p.id === postId ? {
      ...p,
      isLiked: !p.isLiked,
      likes: p.isLiked ? p.likes - 1 : p.likes + 1
    } : p));
    try {
      if (post.isLiked) {
        // Unlike
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
      } else {
        // Like
        await supabase.from('post_likes').insert({
          post_id: postId,
          user_id: currentUserId
        });
      }
    } catch (error) {
      // Revert on error
      setPosts((currentPosts) => currentPosts.map((p) => p.id === postId ? {
        ...p,
        isLiked: post.isLiked,
        likes: post.likes
      } : p));
      console.error('Error toggling like:', error);
    }
  };
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);

  const handleFollowToggle = () => {
    if (!currentUserId) {
      toast({ title: "Login Required", description: "Please log in to follow artists." });
      navigate('/login');
      return;
    }
    if (!id) return;

    if (isFollowing) {
      setShowUnfollowConfirm(true);
      return;
    }

    doFollow();
  };

  const doFollow = async () => {
    if (!currentUserId || !id) return;
    setIsFollowing(true);
    setFollowersCount((prev) => prev + 1);
    try {
      await supabase.from('followers').insert({ artist_id: id, follower_id: currentUserId });
    } catch (error) {
      setIsFollowing(false);
      setFollowersCount((prev) => prev - 1);
      console.error('Error following:', error);
    }
  };

  const doUnfollow = async () => {
    if (!currentUserId || !id) return;
    setIsFollowing(false);
    setFollowersCount((prev) => prev - 1);
    setShowUnfollowConfirm(false);
    try {
      await supabase.from('followers').delete().eq('artist_id', id).eq('follower_id', currentUserId);
    } catch (error) {
      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
      console.error('Error unfollowing:', error);
    }
  };
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (!date) return;

    // If date is busy or blocked, open detail dialog to show hours
    if (isBusyDate(date) || isBlockedDate(date)) {
      setDateDetailDialogOpen(true);
      return;
    }

    // Only open booking dialog if logged in, not own profile, and date is available
    if (!isOwnProfile) {
      if (!currentUserId) {
        toast({
          title: "Authentication Required",
          description: "Please log in or create an account to make a booking request."
        });
        navigate('/login');
        return;
      }
      setBookingDialogOpen(true);
    }
  };
  // Check if two time slots overlap
  const doTimeSlotsOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);
    // Overlap if one starts before the other ends and ends after the other starts
    return s1 < e2 && e1 > s2;
  };
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !id) return;
    const endDate = bookingForm.endDate || selectedDate;
    const isSameDay = endDate.toDateString() === selectedDate.toDateString();

    // Validate that end time is after start time (only if same day)
    if (bookingForm.startTime && bookingForm.endTime && isSameDay) {
      const [startHour, startMin] = bookingForm.startTime.split(':').map(Number);
      const [endHour, endMin] = bookingForm.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      if (endMinutes <= startMinutes) {
        toast({
          title: "Invalid Time",
          description: "End time must be after start time.",
          variant: "destructive"
        });
        return;
      }
    }

    // Check for time slot conflicts on busy dates
    if (bookingForm.startTime && bookingForm.endTime) {
      const event = getEventForDate(selectedDate);
      if (event && (event.status === 'busy' || event.status === 'booked')) {
        const existingTime = extractTimeFromNotes(event.notes);
        if (existingTime) {
          // Check if requested time overlaps with existing busy time
          if (doTimeSlotsOverlap(bookingForm.startTime, bookingForm.endTime, existingTime.startTime, existingTime.endTime)) {
            toast({
              title: "Time Slot Conflict",
              description: `This time slot overlaps with an existing booking (${existingTime.startTime} - ${existingTime.endTime}). Please select a different time.`,
              variant: "destructive"
            });
            return;
          }
        } else {
          // No specific time in notes means the entire day is booked
          toast({
            title: "Date Unavailable",
            description: "This date is fully booked. Please select a different date.",
            variant: "destructive"
          });
          return;
        }
      }
    }
    try {
      // Include time interval and end date in the message
      const startDateStr = selectedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const endDateStr = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      let timeInfo = '';
      if (bookingForm.startTime && bookingForm.endTime) {
        if (isSameDay) {
          timeInfo = `Time: ${bookingForm.startTime} - ${bookingForm.endTime}\n`;
        } else {
          timeInfo = `Time: ${startDateStr} ${bookingForm.startTime} - ${endDateStr} ${bookingForm.endTime}\n`;
        }
      }
      const fullMessage = timeInfo + (bookingForm.message || '');
      const {
        error
      } = await supabase.from('booking_requests').insert({
        profile_id: id,
        requester_name: bookingForm.name,
        requester_email: bookingForm.email,
        requester_phone: bookingForm.phone,
        requester_user_id: currentUserId,
        event_date: formatLocalDateToYMD(selectedDate),
        event_end_date: formatLocalDateToYMD(endDate),
        event_type: bookingForm.eventType,
        message: fullMessage.trim(),
        status: 'pending'
      });
      if (error) throw error;
      toast({
        title: "Booking Request Sent!",
        description: `Your booking request for ${selectedDate?.toLocaleDateString()} has been sent to ${artist?.stage_name}.`
      });
      setBookingDialogOpen(false);
      setBookingForm((prev) => ({
        name: currentUserProfile ? `${currentUserProfile.first_name} ${currentUserProfile.last_name}`.trim() : "",
        email: currentUserProfile?.email || "",
        phone: currentUserProfile?.phone || "",
        startTime: "",
        endTime: "",
        endDate: null,
        eventType: "",
        message: ""
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send booking request. Please try again.",
        variant: "destructive"
      });
    }
  };
  const getExperienceYears = () => {
    if (!artist?.career_start_year) return 0;
    return new Date().getFullYear() - artist.career_start_year;
  };
  const getGenresArray = () => {
    if (!artist?.music_genres) return [];
    return artist.music_genres.split(',').map((g) => g.trim());
  };
  const getImages = () => galleryItems.filter((item) => item.type === 'image');
  const getVideos = () => galleryItems.filter((item) => item.type === 'video');
  const getAverageRating = () => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };
  const formatDate = formatSmartDate;
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingReview(true);
    try {
      const {
        error
      } = await supabase.from('reviews').insert({
        profile_id: id,
        reviewer_name: reviewForm.name.trim(),
        reviewer_email: reviewForm.email.trim(),
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim() || null,
        reviewer_user_id: currentUserId
      });
      if (error) throw error;

      // Refetch reviews
      const {
        data: reviewsData
      } = await supabase.from('reviews').select('id, reviewer_name, rating, comment, created_at, reviewer_user_id').eq('profile_id', id).order('created_at', {
        ascending: false
      });
      const reviewsWithAvatars = await enrichReviewsWithAvatars(reviewsData || []);
      setReviews(reviewsWithAvatars);
      toast({
        title: "Review Submitted!",
        description: `Thank you for reviewing ${artist?.stage_name}.`
      });
      setReviewDialogOpen(false);
      setReviewForm({
        name: "",
        email: "",
        rating: 5,
        comment: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingReview(false);
    }
  };
  const handleDeleteReview = async (reviewId: string) => {
    if (!id) return;
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
      setDeleteReviewId(null);
    }
  };
  const canDeleteReview = (review: Review) => {
    if (!currentUserId) return false;
    // Artist can delete reviews on their profile
    if (currentUserId === id) return true;
    // Reviewer can delete their own review
    if (currentUserId === review.reviewer_user_id) return true;
    return false;
  };
  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
    return <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-5 w-5 ${star <= rating ? 'text-accent fill-accent' : 'text-muted-foreground'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`} onClick={() => interactive && onRate?.(star)} />)}
      </div>;
  };
  if (loading) {
    return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''}`}>
        <Navigation />
        <div className={`pt-20 ${currentUserId ? 'md:pt-8' : 'md:pt-24'} pb-24 md:pb-20 px-4`}>
          <div className="container mx-auto text-center">
            <p className="text-lg md:text-xl text-muted-foreground">Loading artist profile...</p>
          </div>
        </div>
      </div>;
  }
  if (!artist) {
    return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''}`}>
        <Navigation />
        <div className={`pt-20 ${currentUserId ? 'md:pt-8' : 'md:pt-24'} pb-24 md:pb-20 px-4`}>
          <div className="container mx-auto text-center">
            <h1 className="text-2xl md:text-4xl font-display font-bold mb-4">Artist Not Found</h1>
            <Link to="/">
              <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>;
  }

  // Simplified view for regular user accounts (no specialization)
  const isUserAccount = !artist.specialization;
  if (isUserAccount) {
    return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-card`}>
      <Navigation />
      <div className={`container mx-auto pt-20 ${currentUserId ? 'md:pt-8' : 'md:pt-24'} pb-24 md:pb-8 max-w-lg px-[4px] py-[24px]`}>
        <div className="border border-border rounded-lg p-6 flex flex-col items-center gap-4 my-[33px]">
          <Avatar className="h-24 w-24 border-2 border-accent/20">
            <AvatarImage src={artist.avatar_url || undefined} alt={artist.stage_name} />
            <AvatarFallback className="text-2xl">
              {artist.first_name?.[0]}{artist.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">
            {artist.first_name} {artist.last_name}
          </h1>
          <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
            <span>{announcements.length} {announcements.length === 1 ? 'ad' : 'ads'} published</span>
            {artist.created_at && <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Member since {new Date(artist.created_at).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric'
              })}
              </span>}
          </div>
        </div>

        {/* User's Ads */}
        {announcements.filter((a) => !isAdExpired(a)).length > 0 && <div className="mt-6">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2 mb-2">
              <Megaphone className="h-4 w-4 text-accent" />
              Ads
            </h2>
            <div className="w-full max-w-[500px] mx-auto space-y-1">
              {announcements.filter((a) => !isAdExpired(a)).map((ad) => <Card key={ad.id} className="overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary">
                  <div className="p-4 pb-0 px-[6px] py-[3px]">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-background">
                          <AvatarImage src={artist.avatar_url || undefined} alt={artist.first_name} />
                          <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                            {artist.first_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-foreground">
                            {artist.first_name} {artist.last_name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>User</span>
                            <span>·</span>
                            <span>{formatSmartDate(ad.created_at)}</span>
                            <span>·</span>
                            {ad.is_premium ? <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Promotion</Badge> : <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Ad</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <ExpandableText text={ad.description} className="mt-3" />
                  </div>
                  
                  {ad.is_premium && ad.media_url && <div className="mt-3 cursor-pointer bg-muted/30" onClick={() => setMediaPreview({
                url: ad.media_url!,
                type: ad.media_type === "video" ? "video" : "image"
              })}>
                      {ad.media_type === "video" ? <div className="relative w-full aspect-video">
                          <video src={ad.media_url} className="absolute inset-0 w-full h-full object-contain bg-black" onClick={(e) => e.stopPropagation()} />
                        </div> : <img src={ad.media_url} alt="Announcement media" className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity" />}
                    </div>}
                </Card>)}
            </div>
          </div>}

        {/* Media Preview Dialog */}
        <InstagramZoomPreview media={mediaPreview} onClose={() => setMediaPreview(null)} />
      </div>
    </div>;
  }
  const isPremium = artist.plan === 'Premium';
  const isStandard = artist.plan === 'Standard';
  return <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-card`}>
      <Navigation />
      
      <div className={`pt-16 ${currentUserId ? 'md:pt-8' : 'md:pt-24'} pb-24 md:pb-20 px-0 md:px-4`}>
        <div className="container mx-auto max-w-6xl px-4 md:px-0">
          <Link to="/leaderboard">
            
          </Link>

          {/* Header Section - matching dashboard profile layout */}
          <div className="space-y-6 md:space-y-8">
            {/* Mobile Header Layout */}
            <div className="flex md:hidden flex-col items-center gap-4 mb-6 relative">
              {/* Top row: Rating (left) and Contact (right) */}
              <div className="absolute top-0 left-0 right-0 flex items-start justify-between z-10">
                {/* Rating badge - top left */}
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground shadow-lg">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-bold">{getAverageRating() || 'N/A'}</span>
                  {reviews.length > 0 && <span className="text-xs opacity-80">({reviews.length})</span>}
                </div>
                <div />
              </div>

              {/* Centered Avatar - with top padding to account for absolute positioned elements */}
              <div className={`mt-10 p-1 rounded-full ${getAvatarOutlineClassesLarge(artist.plan)}`}>
                <Avatar className="w-24 h-24 border-3 border-background shadow-lg">
                  <AvatarImage src={artist.avatar_url || undefined} alt={artist.stage_name} />
                  <AvatarFallback className="bg-gradient-to-br from-accent/30 to-accent/10">
                    <User className={`h-12 w-12 ${isPremium ? 'text-accent' : 'text-burgundy'}`} />
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Centered Name */}
              <h1 className="text-2xl font-display font-bold text-foreground text-center -mb-2">
                {artist.stage_name}
              </h1>

              {/* Centered Category + Location */}
              <div className="flex flex-wrap items-center justify-center gap-3 -mb-2">
                {artist.specialization && <Badge className="bg-muted text-muted-foreground border border-border px-3 py-1 text-sm font-semibold">
                    {artist.specialization}
                  </Badge>}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{artist.county}</span>
                  {artist.country && getCountryFlag(artist.country) && <span className="text-base" title={artist.country}>{getCountryFlag(artist.country)}</span>}
                </div>
              </div>

              {/* Followers + Following counts */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-sm font-semibold">{followersCount}</span>
                  <span className="text-sm">followers</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-sm font-semibold">{followingCount}</span>
                  <span className="text-sm">following</span>
                </div>
              </div>

              {/* Follow + Contact buttons */}
              <div className="flex items-center gap-3">
                {!isOwnProfile &&
              <Button
                onClick={handleFollowToggle}
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className={isFollowing ? "border-accent text-accent" : "bg-accent text-accent-foreground hover:bg-accent/90"}>
                    {isFollowing ? <><UserCheck className="mr-1.5 h-4 w-4" /> Following</> : <><UserPlus className="mr-1.5 h-4 w-4" /> Follow</>}
                  </Button>
              }
                {currentUserId && currentUserId !== artist.id ? <Button onClick={() => navigate(`/messages?artistId=${artist.id}`)} className="bg-accent text-accent-foreground hover:bg-accent/90" size="sm">
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Contact
                  </Button> : !currentUserId ? <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate('/login')} size="sm">
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Contact
                  </Button> : null}
              </div>
            </div>

            {/* Desktop Header Layout */}
            <div className="hidden md:flex flex-row gap-8 mb-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className={`p-1 rounded-full ${getAvatarOutlineClassesLarge(artist.plan)}`}>
                  <Avatar className="w-40 h-40 border-4 border-background shadow-lg">
                    <AvatarImage src={artist.avatar_url || undefined} alt={artist.stage_name} />
                    <AvatarFallback className="bg-gradient-to-br from-accent/30 to-accent/10">
                      <User className={`h-20 w-20 ${isPremium ? 'text-accent' : 'text-burgundy'}`} />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Info section */}
              <div className="flex-1 flex flex-col justify-center h-40">
                <div className="flex flex-row items-start justify-between gap-4">
                  <div>
                    {/* Stage name */}
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-display font-bold text-foreground">
                        {artist.stage_name}
                      </h1>
                    </div>
                    
                    {/* Category + Location */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      {artist.specialization && <Badge className="bg-muted text-muted-foreground border border-border px-4 py-1.5 text-base font-semibold">
                          {artist.specialization}
                        </Badge>}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-5 w-5" />
                        <span className="text-base">{artist.county}</span>
                        {artist.country && getCountryFlag(artist.country) && <span className="text-xl" title={artist.country}>{getCountryFlag(artist.country)}</span>}
                      </div>
                    </div>

                    {/* Followers + Following counts */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="text-base font-semibold">{followersCount}</span>
                        <span className="text-base">followers</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="text-base font-semibold">{followingCount}</span>
                        <span className="text-base">following</span>
                      </div>
                    </div>

                    {/* Follow + Contact buttons */}
                    <div className="flex items-center gap-3 mt-3">
                      {!isOwnProfile &&
                    <Button
                      onClick={handleFollowToggle}
                      variant={isFollowing ? "outline" : "default"}
                      className={isFollowing ? "border-accent text-accent" : "bg-accent text-accent-foreground hover:bg-accent/90"}>
                          {isFollowing ? <><UserCheck className="mr-2 h-4 w-4" /> Following</> : <><UserPlus className="mr-2 h-4 w-4" /> Follow</>}
                        </Button>
                    }
                      {currentUserId && currentUserId !== artist.id ? <Button onClick={() => navigate(`/messages?artistId=${artist.id}`)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Contact
                        </Button> : !currentUserId ? <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate('/login')}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Contact
                        </Button> : null}
                    </div>
                  </div>

                  {/* Rating badge */}
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground shadow-lg">
                    <Star className="h-6 w-6 fill-current" />
                    <span className="text-2xl font-bold">{getAverageRating() || 'N/A'}</span>
                    {reviews.length > 0 && <span className="text-sm opacity-80">({reviews.length})</span>}
                  </div>
                </div>
              </div>
            </div>

              {/* Tabs Section */}
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-4 md:mb-8 p-1 rounded-none md:rounded-lg -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
                  <TabsTrigger value="details" className="flex items-center justify-center gap-2 px-2 md:px-4">
                    <User className="h-5 w-5 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Details</span>
                  </TabsTrigger>
                  <TabsTrigger value="posts" className="flex items-center justify-center gap-2 px-2 md:px-4">
                    <FileText className="h-5 w-5 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Posts</span>
                  </TabsTrigger>
                  <TabsTrigger value="announcements" className="flex items-center justify-center gap-2 px-2 md:px-4">
                    <Megaphone className="h-5 w-5 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Announcements</span>
                  </TabsTrigger>
                  <TabsTrigger value="gallery" className="flex items-center justify-center gap-2 px-2 md:px-4">
                    <Images className="h-5 w-5 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Gallery</span>
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="flex items-center justify-center gap-2 px-2 md:px-4">
                    <CalendarIcon className="h-5 w-5 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Calendar</span>
                  </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4 md:space-y-8">
                  {/* Description */}
                  <div>
                    <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-accent" />
                      About
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-lg text-left">
                      {artist.bio || "No bio available."}
                    </p>
                    {artist.created_at && <p className="text-muted-foreground text-sm mt-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-accent" />
                        Member since {new Date(artist.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                      </p>}
                  </div>

                  {/* Instrument Section for Instrumentalists */}
                  {artist.specialization?.toLowerCase() === 'instrumentalist' && artist.instruments &&
              <>
                      <Separator />
                      <div>
                        {(() => {
                    const instrumentName = artist.instruments.split(',')[0].trim();
                    const InstrumentIcon = getInstrumentIcon(instrumentName);
                    return (
                      <div className="flex items-center gap-2">
                              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                                <Music2 className="h-5 w-5 text-accent" />
                                Instrument:
                              </h2>
                              <Badge className="bg-muted/50 text-muted-foreground border border-accent/30 px-4 py-1.5 text-base font-medium">
                                <InstrumentIcon className="h-4 w-4 mr-1.5" />
                                {instrumentName}
                              </Badge>
                            </div>);

                  })()}
                      </div>
                    </>
              }

                  <Separator />

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-8">
                    {/* Music Genres */}
                    <div className="p-3 md:p-0 rounded-lg bg-secondary/30 md:bg-transparent">
                      <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <Music className="h-5 w-5 text-accent" />
                        Music Genres
                      </h3>
                      <div className="flex flex-wrap gap-1.5 md:gap-2 justify-start">
                        {getGenresArray().length > 0 ? getGenresArray().map((genre: string) => <Badge key={genre} variant="outline" className="border-accent/50 text-accent px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm">
                              {genre}
                            </Badge>) : <p className="text-muted-foreground text-sm text-left">No genres specified</p>}
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="p-3 md:p-0 rounded-lg bg-secondary/30 md:bg-transparent">
                      <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-accent" />
                        Experience
                      </h3>
                      <div className="space-y-1 md:space-y-2 text-left">
                        <p className="text-muted-foreground text-sm md:text-base">
                          <span className="font-semibold text-foreground">{getExperienceYears()} years</span> of professional experience
                        </p>
                        <p className="text-muted-foreground flex items-center gap-2 text-sm md:text-base">
                          <Award className="h-4 w-4 text-accent" />
                          <span className="font-semibold text-foreground">{artist.number_of_events}+</span> events performed
                        </p>
                      </div>
                    </div>

                    {/* Estimated Prices */}
                    <div className="p-3 md:p-0 rounded-lg bg-secondary/30 md:bg-transparent">
                      <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-accent" />
                        Estimated Price
                      </h3>
                      <div className="space-y-1 md:space-y-2 text-left">
                        {canSetEstimatedPrice(artist.plan) && artist.estimated_price ? <Badge variant="outline" className="border-accent/50 text-accent text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1">
                            {artist.estimated_price}
                          </Badge> : <p className="text-muted-foreground text-sm">Contact for pricing</p>}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-xl font-display font-bold mb-4 text-left">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                      {currentUserId ? <>
                          {!artist.hide_email && <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-secondary/50">
                            <Mail className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                            <div className="text-left">
                              <p className="text-xs md:text-sm text-muted-foreground">Email</p>
                              <a href={`mailto:${artist.email}`} className="text-foreground hover:text-accent transition-colors text-sm md:text-base">
                                {artist.email}
                              </a>
                            </div>
                          </div>}
                          {!artist.hide_phone && <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-secondary/50">
                            <Phone className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                            <div className="text-left">
                              <p className="text-xs md:text-sm text-muted-foreground">Phone</p>
                              <a href={`tel:${artist.phone}`} className="text-foreground hover:text-accent transition-colors text-sm md:text-base">
                                {artist.phone}
                              </a>
                            </div>
                          </div>}
                          {artist.hide_email && artist.hide_phone && <p className="text-muted-foreground text-sm col-span-full">No contact information available.</p>}
                        </> : <>
                          <button onClick={() => {
                      toast({
                        title: "Login Required",
                        description: "Please log in or create an account to view contact information."
                      });
                      navigate('/login');
                    }} className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer text-left">
                            <Mail className="h-5 w-5 text-accent" />
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="text-foreground">••••••••@••••.com</p>
                            </div>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => {
                      toast({
                        title: "Login Required",
                        description: "Please log in or create an account to view contact information."
                      });
                      navigate('/login');
                    }} className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer text-left">
                            <Phone className="h-5 w-5 text-accent" />
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <p className="text-foreground">+•• ••• ••• •••</p>
                            </div>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </>}
                    </div>
                  </div>

                  <Separator />

                  {/* Social Media */}
                  <div>
                    <h3 className="text-xl font-display font-bold mb-4 text-left">Social Networks</h3>
                    {currentUserId ?
                <div className="flex flex-wrap gap-2 md:gap-3">
                        {(() => {
                          const visibleLinks = getVisibleSocialLinks(artist, artist.plan);
                          const iconMap: Record<string, React.ReactNode> = {
                            facebook: <Facebook className="h-5 w-5 md:h-6 md:w-6 text-accent" />,
                            instagram: <Instagram className="h-5 w-5 md:h-6 md:w-6 text-accent" />,
                            youtube: <Youtube className="h-5 w-5 md:h-6 md:w-6 text-accent" />,
                            tiktok: <Music className="h-5 w-5 md:h-6 md:w-6 text-accent" />,
                            spotify: <svg className="h-5 w-5 md:h-6 md:w-6 text-accent" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>,
                          };
                          if (visibleLinks.length === 0) return <p className="text-muted-foreground">No social media links available.</p>;
                          return visibleLinks.map((link) => (
                            <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center p-2.5 md:p-3 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors" title={link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}>
                              {iconMap[link.platform]}
                            </a>
                          ));
                        })()}
                      </div> :

                <div
                  className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-accent transition-colors"
                  onClick={() => navigate('/login')}>

                        <Lock className="h-4 w-4" />
                        <span className="text-sm">Login to view social media links</span>
                      </div>
                }
                  </div>

                  <Separator />

                  {/* Reviews Section */}
                  <div>
                    <div className="flex flex-row items-center justify-between gap-2 md:gap-3 mb-3 md:mb-4">
                      <h3 className="text-xl font-display font-bold flex items-center gap-2 text-left">
                        <Star className="h-5 w-5 text-accent" />
                        Reviews
                        {getAverageRating() && <span className="text-lg font-display font-bold text-foreground">
                            ({getAverageRating()} • {reviews.length})
                          </span>}
                      </h3>
                      {currentUserId !== id && <Button onClick={() => {
                    if (!currentUserId) {
                      toast({
                        title: "Login Required",
                        description: "Please log in or create an account to write a review."
                      });
                      navigate('/login');
                      return;
                    }
                    setReviewDialogOpen(true);
                  }} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 whitespace-nowrap">
                          Write a Review
                        </Button>}
                    </div>

                    {reviews.length > 0 ? (() => {
                      const reviewLimit = getReviewDisplayLimit(artist?.plan);
                      const visibleReviews = reviewLimit ? reviews.slice(0, reviewLimit) : reviews;
                      return <Carousel className="w-full">
                        <CarouselContent className="-ml-2 md:-ml-4">
                          {visibleReviews.map((review) => <CarouselItem key={review.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                              <div className="flex flex-col gap-3 p-4 rounded-lg border border-accent/20 hover:border-accent/40 transition-colors bg-card/50 h-full relative">
                                {canDeleteReview(review) && <button onClick={() => setDeleteReviewId(review.id)} className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete review">
                                    <Trash2 className="h-4 w-4" />
                                  </button>}
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border border-accent/30 flex-shrink-0">
                                    {review.reviewer_avatar_url && (
                                      <AvatarImage src={review.reviewer_avatar_url} alt={review.reviewer_name} />
                                    )}
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
                      </Carousel>;
                    })() : <div className="text-center py-8 border border-dashed border-accent/30 rounded-lg">
                        <Star className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No reviews yet</p>
                      </div>}
                  </div>
                </TabsContent>

                {/* Posts Tab */}
                <TabsContent value="posts" className="space-y-4 md:space-y-6">
                  <div>
                    <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-accent" />
                      Posts
                    </h2>
                    {!currentUserId ?
                <Card className="p-8 text-center">
                        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Login Required</h3>
                        <p className="text-muted-foreground mb-4">Please log in or create an account to view the artist's posts.</p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button onClick={() => navigate('/login')} className="bg-accent text-accent-foreground hover:bg-accent/90">Login</Button>
                          <Button variant="outline" onClick={() => navigate('/register')}>Register</Button>
                        </div>
                      </Card> : !canPost(artist.plan) ?
                <Card className="p-8 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">This artist doesn't have any posts yet.</p>
                        {isOwnProfile && (
                          <Button onClick={() => navigate('/my-plan')} className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                            Upgrade to Start Posting
                          </Button>
                        )}
                      </Card> :

                <div className="-mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
                  <div className="w-full max-w-[500px] mx-auto space-y-3 md:space-y-4">
                      {(() => {
                    const promotions = announcements.filter((a) => a.is_premium && !isAdExpired(a)).map((a) => ({
                      ...a,
                      type: 'promotion' as const,
                      content: a.description,
                      created_at: a.created_at
                    }));
                    const postItems = posts.map((p) => ({
                      ...p,
                      type: 'post' as const
                    }));
                    const combined = [...postItems, ...promotions].sort(
                      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );

                    return combined.length > 0 ? combined.map((item) => {
                      if (item.type === 'promotion') {
                        const promo = item as typeof promotions[0];
                        return (
                          <Card key={`promo-${promo.id}`} className="overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary">
                                <div className="p-4 pb-0 px-[6px] py-[3px]">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(artist?.plan)}`}>
                                        <Avatar className="w-10 h-10 border-2 border-background">
                                          <AvatarImage src={artist?.avatar_url || undefined} alt={artist?.stage_name} />
                                          <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                            {artist?.stage_name?.charAt(0) || 'A'}
                                          </AvatarFallback>
                                        </Avatar>
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-medium text-foreground">{artist?.stage_name}</h3>
                                          {artist?.plan === 'Premium' && <span className="text-accent text-xs">✓</span>}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <span>{artist?.specialization || "User"}</span>
                                          <span>·</span>
                                          <span>{formatSmartDate(promo.created_at)}</span>
                                          <span>·</span>
                                          <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">Promotion</Badge>
                                        </div>
                                      </div>
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                          <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                      toast({ title: "Report submitted", description: "Thank you for reporting this problem. We'll review it shortly." });
                                    }}>
                                          <Flag className="h-4 w-4 mr-2" />
                                          Report Problem
                                        </DropdownMenuItem>
                                        {isOwnProfile && <>
                                          <DropdownMenuItem onClick={() => setEditItem({ id: promo.id, text: promo.description, table: "announcements" })}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setDeleteAnnouncementId(promo.id)} className="text-destructive focus:text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </>}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <ExpandableText text={promo.description} className="mt-3" />
                                </div>
                                {promo.media_url &&
                            <div className="mt-3 cursor-pointer bg-muted/30" onClick={() => setMediaPreview({ url: promo.media_url!, type: promo.media_type === "video" ? "video" : "image" })}>
                                    {promo.media_type === "video" ?
                              <div className="relative w-full aspect-video pointer-events-none">
                                        <video src={promo.media_url} className="absolute inset-0 w-full h-full object-contain bg-black" />
                                      </div> :

                              <img src={promo.media_url} alt="Promotion media" className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity" />
                              }
                                  </div>
                            }
                                <div className="px-2 py-2">
                                  <div className="flex items-center justify-around">
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/artist/${artist?.id}`)} className="flex-1 gap-2 rounded-md text-muted-foreground hover:bg-transparent hover:text-muted-foreground">
                                      <MessageCircle className="w-5 h-5" />
                                      <span className="font-medium">Contact</span>
                                    </Button>
                                  </div>
                                </div>
                              </Card>);

                      }

                      const post = item as typeof postItems[0];
                      return (
                        <Card key={post.id} className="overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary">
                            {/* Header */}
                            <div className="p-4 pb-0 px-[6px] py-[3px]">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(artist?.plan)}`}>
                                    <Avatar className="w-10 h-10 border-2 border-background">
                                      <AvatarImage src={artist?.avatar_url || undefined} alt={artist?.stage_name} />
                                      <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                        {artist?.stage_name?.charAt(0) || 'A'}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-foreground">
                                        {artist?.stage_name}
                                      </h3>
                                      {artist?.plan === 'Premium' && <span className="text-accent text-xs">✓</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{artist?.specialization || "User"}</span>
                                      <span>·</span>
                                      <span>{formatDate(post.created_at)}</span>
                                      <span>·</span>
                                      <Globe className="h-3 w-3" />
                                    </div>
                                  </div>
                                </div>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                      <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                    toast({
                                      title: "Report submitted",
                                      description: "Thank you for reporting this problem. We'll review it shortly."
                                    });
                                  }}>
                                      <Flag className="h-4 w-4 mr-2" />
                                      Report Problem
                                    </DropdownMenuItem>
                                    {isOwnProfile && <>
                                      <DropdownMenuItem onClick={() => setEditItem({ id: post.id, text: post.content, table: "posts" })}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setDeletePostId(post.id)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Content */}
                              <ExpandableText text={post.content} className="mt-3" />
                            </div>
                            
                            {/* Media */}
                            {post.media_url && <div className="mt-3 cursor-pointer bg-muted/30" onClick={() => setMediaPreview({
                            url: post.media_url!,
                            type: post.media_type === "video" ? "video" : "image"
                          })}>
                                {post.media_type === "video" ? <div className="relative w-full aspect-video pointer-events-none">
                                    <video src={post.media_url} className="absolute inset-0 w-full h-full object-contain bg-black" />
                                  </div> : <img src={post.media_url} alt="Post content" className="w-full h-auto max-h-[400px] object-contain hover:opacity-95 transition-opacity" />}
                              </div>}

                            {/* Likes count */}
                            {post.likes > 0 && <div className="px-4 py-2 flex items-center gap-1.5 text-sm text-muted-foreground border-b border-border/40">
                                <Heart className="h-4 w-4" />
                                <span>{post.likes}</span>
                              </div>}

                            {/* Actions */}
                            <div className="px-2 py-1">
                              <div className="flex items-center justify-around">
                                <Button variant="ghost" size="sm" onClick={() => handlePostLike(post.id)} className={`flex-1 gap-2 rounded-md hover:bg-transparent hover:text-inherit ${post.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}>
                                  <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                  <span className="font-medium">Like</span>
                                </Button>
                                
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/artist/${artist?.id}`)} className="flex-1 gap-2 rounded-md text-muted-foreground hover:bg-transparent hover:text-muted-foreground">
                                  <MessageCircle className="w-5 h-5" />
                                  <span className="font-medium">Contact</span>
                                </Button>
                              </div>
                            </div>
                          </Card>);

                    }) : <Card className="p-8 text-center">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-muted-foreground">No posts yet.</p>
                        </Card>;
                  })()}
                    </div>
                  </div>
                }
                  </div>
                </TabsContent>

                {/* Announcements Tab */}
                <TabsContent value="announcements" className="space-y-4 md:space-y-6">
                  <div>
                    <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-accent" />
                      Announcements
                    </h2>
                    {!currentUserId ?
                <Card className="p-8 text-center">
                        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Login Required</h3>
                        <p className="text-muted-foreground mb-4">Please log in or create an account to view the artist's announcements.</p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button onClick={() => navigate('/login')} className="bg-accent text-accent-foreground hover:bg-accent/90">Login</Button>
                          <Button variant="outline" onClick={() => navigate('/register')}>Register</Button>
                        </div>
                     </Card> : !canPost(artist.plan) ?
                <Card className="p-8 text-center">
                        <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">This artist doesn't have any announcements yet.</p>
                        {isOwnProfile && (
                          <Button onClick={() => navigate('/my-plan')} className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                            Upgrade to Post Announcements
                          </Button>
                        )}
                      </Card> :

                <div className="-mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
                  <div className="w-full max-w-[500px] mx-auto space-y-3 md:space-y-4">
                      {announcements.filter((a) => !a.is_premium && !isAdExpired(a)).length > 0 ? announcements.filter((a) => !a.is_premium && !isAdExpired(a)).map((announcement) => <Card key={announcement.id} className="overflow-hidden shadow-sm my-0 border-solid rounded-none border-secondary">
                            {/* Header */}
                            <div className="p-4 pb-0 px-[6px] py-[3px]">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(artist?.plan)}`}>
                                    <Avatar className="w-10 h-10 border-2 border-background">
                                      <AvatarImage src={artist?.avatar_url || undefined} alt={artist?.stage_name} />
                                      <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                        {artist?.stage_name?.charAt(0) || 'A'}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-foreground">
                                        {artist?.stage_name}
                                      </h3>
                                      {artist?.plan === 'Premium' && <span className="text-accent text-xs">✓</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{artist?.specialization || "User"}</span>
                                      <span>·</span>
                                      <span>{formatSmartDate(announcement.created_at)}</span>
                                      <span>·</span>
                                      <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                                           Ad
                                         </Badge>
                                    </div>
                                  </div>
                                </div>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                      <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                              toast({
                                title: "Report submitted",
                                description: "Thank you for reporting this problem. We'll review it shortly."
                              });
                            }}>
                                      <Flag className="h-4 w-4 mr-2" />
                                      Report Problem
                                    </DropdownMenuItem>
                                    {isOwnProfile && <>
                                      <DropdownMenuItem onClick={() => setDeleteAnnouncementId(announcement.id)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Content */}
                              <ExpandableText text={announcement.description} className="mt-3 my-[5px]" />
                              {(announcement.location || announcement.event_date || announcement.budget) && (
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 mb-1 text-xs text-muted-foreground">
                                  {announcement.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {announcement.location}
                                    </span>
                                  )}
                                  {announcement.event_date && (
                                    <span className="flex items-center gap-1">
                                      <CalendarIcon className="h-3 w-3" />
                                      {formatDateNoYear(announcement.event_date)}
                                    </span>
                                  )}
                                  {announcement.budget && (
                                    <span className="flex items-center gap-1">
                                      <Euro className="h-3 w-3" />
                                      {announcement.budget}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action button */}
                            <div className="px-2 py-1">
                              <div className="flex items-center justify-around">
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/artist/${artist?.id}`)} className="flex-1 gap-2 rounded-md text-accent hover:bg-transparent hover:text-accent">
                                  <ArrowRight className="w-5 h-5" />
                                  <span className="font-medium">Apply Now</span>
                                </Button>
                              </div>
                            </div>
                          </Card>) : <Card className="p-8 text-center">
                          <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-muted-foreground">No announcements yet.</p>
                        </Card>}
                    </div>
                  </div>
                }
                  </div>
                </TabsContent>

                {/* Gallery Tab */}
                <TabsContent value="gallery">
                  <div className="space-y-6 md:space-y-8">
                    {/* Photos Section */}
                    <div>
                      <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <Images className="h-5 w-5 text-accent" />
                        Photos
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                        {getImages().length > 0 ? getImages().map((image, index) => <div key={image.id} className="aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-accent/20 hover:border-accent transition-colors" onClick={() => setMediaPreview({
                      url: image.url,
                      type: "image"
                    })}>
                            <img src={image.url} alt={`Gallery image ${index + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                          </div>) : <div className="col-span-full text-center text-muted-foreground py-8">
                            No photos available yet.
                          </div>}
                      </div>
                    </div>

                    {/* Videos Section */}
                    {getVideoLimit(artist.plan) > 0 && <div>
                      <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <Play className="h-5 w-5 text-accent" />
                        Videos
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                        {getVideos().length > 0 ? getVideos().map((video, index) => <Dialog key={video.id}>
                              <DialogTrigger asChild>
                                <div className="aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-accent/20 hover:border-accent transition-colors bg-black/80 flex items-center justify-center">
                                  <Play className="h-10 w-10 md:h-12 md:w-12 text-accent" />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-[95vw] md:max-w-4xl p-2 md:p-6">
                                <div className="aspect-video">
                                  <iframe src={video.url} className="w-full h-full rounded-lg" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                </div>
                              </DialogContent>
                            </Dialog>) : <div className="col-span-full text-center text-muted-foreground py-8">
                            No videos available yet.
                          </div>}
                      </div>
                    </div>}
                  </div>
                </TabsContent>

                {/* Calendar Tab */}
                <TabsContent value="calendar">
                  <div>
                    <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-accent" />
                      Calendar
                    </h2>
                    
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
                                <div className="w-5 h-5 rounded bg-accent"></div>
                                <span className="text-xs text-muted-foreground">Available</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Calendar */}
                        <div className="flex-shrink-0 w-full flex justify-center lg:justify-start lg:w-auto">
                          <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} className="rounded-lg border border-border shadow-sm pointer-events-auto" modifiers={{
                      busy: getBusyDates(),
                      blocked: getBlockedDates()
                    }} modifiersClassNames={{
                      busy: "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground opacity-70",
                      blocked: "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground opacity-80"
                    }} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} />
                        </div>
                        {/* Date details / prompt (matches dashboard positioning) */}
                        <div className="w-full lg:min-w-0 lg:w-auto">
                          {selectedDate ? <div className="p-3 md:p-4 rounded-lg border border-border bg-card">
                              <h4 className="font-semibold text-foreground mb-2 text-sm md:text-base">Selected Date</h4>
                              <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                                {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                              </p>
                              <Badge className={isBlockedDate(selectedDate) ? "bg-muted text-muted-foreground" : isBusyDate(selectedDate) ? "bg-destructive text-destructive-foreground" : "bg-accent text-accent-foreground"}>
                                {isBlockedDate(selectedDate) ? "Unavailable" : isBusyDate(selectedDate) ? "Booked" : "Available"}
                              </Badge>
                            </div> : <div className="h-full flex items-center justify-center p-8 rounded-lg border-2 border-dashed border-border/50 text-muted-foreground">
                              <p className="text-sm text-center">Select a date to send a booking request</p>
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
                              <div className="w-6 h-6 rounded bg-accent"></div>
                              <span className="text-sm text-muted-foreground">Available</span>
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>
                </TabsContent>

              </Tabs>

              {/* Date Availability Detail Dialog */}
              <Dialog open={dateDetailDialogOpen} onOpenChange={setDateDetailDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-display flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-accent" />
                      Date Availability
                    </DialogTitle>
                    <DialogDescription>
                      {selectedDate?.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                    </DialogDescription>
                  </DialogHeader>
                  {selectedDate && (() => {
                const events = getEventsForDate(selectedDate);
                const isBusy = isBusyDate(selectedDate);
                const isBlocked = isBlockedDate(selectedDate);

                // Collect all time slots from all events on this date
                const allTimeSlots = events.flatMap((event) => extractAllTimeSlotsFromNotes(event.notes));
                const hasTimeSlots = allTimeSlots.length > 0;
                return <div className="space-y-4 mt-2">
                        {/* Busy Time Slots */}
                        {isBusy && hasTimeSlots && <div className="space-y-3">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                              <Clock className="h-4 w-4 text-destructive" />
                              Booked Time Slots ({allTimeSlots.length})
                            </h4>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                              {allTimeSlots.map((slot, index) => <div key={index} className="py-2 px-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                  <div className="flex items-center justify-center gap-3">
                                    <p className="text-lg font-bold text-destructive">{slot.startTime}</p>
                                    <span className="text-muted-foreground">—</span>
                                    <p className="text-lg font-bold text-destructive">{slot.endTime}</p>
                                  </div>
                                </div>)}
                            </div>
                          </div>}

                        {/* No specific time - booked all day */}
                        {isBusy && !hasTimeSlots && <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                            <Clock className="h-6 w-6 text-destructive mx-auto mb-2" />
                            <p className="text-sm font-medium text-foreground">
                              Booked for the entire day
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              00:00 — 23:59
                            </p>
                          </div>}

                        {/* Unavailable day */}
                        {isBlocked && <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                            <p className="text-sm text-muted-foreground">
                              The artist has marked this day as unavailable.
                            </p>
                          </div>}

                        {/* Request Different Time Button - only for busy dates with specific time slots */}
                        {isBusy && hasTimeSlots && !isOwnProfile && <div className="pt-2">
                            <p className="text-xs text-muted-foreground text-center mb-3">
                              You can still request a different time slot on this day.
                            </p>
                            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => {
                      if (!currentUserId) {
                        toast({
                          title: "Authentication Required",
                          description: "Please log in or create an account to make a booking request."
                        });
                        navigate('/login');
                        return;
                      }
                      setDateDetailDialogOpen(false);
                      setBookingDialogOpen(true);
                    }}>
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              Request Different Time
                            </Button>
                          </div>}
                      </div>;
              })()}
                </DialogContent>
              </Dialog>

              <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-display">Review {artist.stage_name}</DialogTitle>
                    <DialogDescription>
                      Share your experience with this artist
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleReviewSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="reviewerName">Your Name</Label>
                      <Input id="reviewerName" placeholder="Your name" value={reviewForm.name} onChange={(e) => setReviewForm({
                    ...reviewForm,
                    name: e.target.value
                  })} required maxLength={100} readOnly={!!currentUserProfile} className={currentUserProfile ? "bg-muted cursor-not-allowed" : ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reviewerEmail">Your Email</Label>
                      <Input id="reviewerEmail" type="email" placeholder="your.email@example.com" value={reviewForm.email} onChange={(e) => setReviewForm({
                    ...reviewForm,
                    email: e.target.value
                  })} required maxLength={255} readOnly={!!currentUserProfile || !!currentUserId} className={currentUserProfile || currentUserId ? "bg-muted cursor-not-allowed" : ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>Rating</Label>
                      <div className="py-2">
                        {renderStars(reviewForm.rating, true, (rating) => setReviewForm({
                      ...reviewForm,
                      rating
                    }))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="reviewComment">Your Review (Optional)</Label>
                        <span className="text-xs text-muted-foreground">{reviewForm.comment.length}/100</span>
                      </div>
                      <Textarea id="reviewComment" placeholder="Share your experience..." value={reviewForm.comment} onChange={(e) => setReviewForm({
                    ...reviewForm,
                    comment: e.target.value
                  })} rows={3} maxLength={100} />
                    </div>
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={submittingReview}>
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Booking Dialog */}
              <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-lg [&>button]:p-1 [&>button_svg]:h-5 [&>button_svg]:w-5">
                  <DialogHeader className="pb-2">
                    <DialogTitle className="text-lg font-medium">
                      {selectedDate && selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    {canUseTimeIntervals(artist?.plan) && (
                    <>
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-sm text-muted-foreground">
                          {selectedDate?.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                        </div>
                        <div className="flex-1">
                          <TimeSelector id="startTime" value={bookingForm.startTime} onChange={(value) => setBookingForm({
                        ...bookingForm,
                        startTime: value
                      })} placeholder="Start time" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {bookingForm.endDate ? bookingForm.endDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          }) : selectedDate?.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={bookingForm.endDate || selectedDate} onSelect={(date) => setBookingForm({
                          ...bookingForm,
                          endDate: date || null
                        })} disabled={(date) => date < (selectedDate || new Date())} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                        <div className="flex-1">
                          <TimeSelector id="endTime" value={bookingForm.endTime} onChange={(value) => setBookingForm({
                        ...bookingForm,
                        endTime: value
                      })} placeholder="End time" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select a different date if the event extends to the next day
                      </p>
                    </div>
                    </>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="eventType">Event Type</Label>
                      <Input id="eventType" placeholder="e.g., Wedding, Corporate Event, Birthday" value={bookingForm.eventType} onChange={(e) => setBookingForm({
                    ...bookingForm,
                    eventType: e.target.value
                  })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Additional Details</Label>
                      <Textarea id="message" placeholder="Tell us more about your event..." value={bookingForm.message} onChange={(e) => setBookingForm({
                    ...bookingForm,
                    message: e.target.value
                  })} rows={1} className="resize-none min-h-10 h-10" />
                    </div>
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      Send Booking Request
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
          </div>
        </div>
      </div>

      {/* Media Preview Dialog */}
      <InstagramZoomPreview media={mediaPreview} onClose={() => setMediaPreview(null)} />

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

      {/* Unfollow Confirmation Dialog */}
      <AlertDialog open={showUnfollowConfirm} onOpenChange={(open) => { if (!open) setShowUnfollowConfirm(false); }}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Unfollow Artist</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to unfollow this artist? You can follow them again later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={doUnfollow}>Unfollow</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <EditContentDialog
        open={!!editItem}
        onOpenChange={(o) => !o && setEditItem(null)}
        table={editItem?.table ?? "posts"}
        itemId={editItem?.id ?? null}
        initialText={editItem?.text ?? ""}
        onSaved={(newText) => {
          if (!editItem) return;
          if (editItem.table === "posts") {
            setPosts(items => items.map(p => p.id === editItem.id ? { ...p, content: newText } : p));
          } else {
            setAnnouncements(items => items.map(a => a.id === editItem.id ? { ...a, description: newText } : a));
          }
        }}
      />

      <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this post? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePostId && handleDeletePost(deletePostId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteAnnouncementId} onOpenChange={(open) => !open && setDeleteAnnouncementId(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAnnouncementId && handleDeleteAnnouncement(deleteAnnouncementId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default ArtistProfile;