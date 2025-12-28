import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  User, 
  MapPin, 
  Star, 
  Music, 
  Calendar as CalendarIcon, 
  Award,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  ArrowLeft,
  Images,
  Play,
  DollarSign,
  Megaphone,
  MessageCircle,
  Trash2,
  FileText,
  MoreHorizontal,
  Flag,
  ThumbsUp,
  Globe
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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
}

interface Announcement {
  id: string;
  title: string;
  description: string;
  date: string;
  is_premium: boolean;
  media_url: string | null;
  media_type: string | null;
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
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_user_id: string | null;
}

interface Post {
  id: string;
  profile_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
}

interface MediaPreview {
  url: string;
  type: "image" | "video";
}

const ArtistProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Profile | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ first_name: string; last_name: string; email: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    phone: "",
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
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
      
      if (session?.user?.id) {
        // Try to fetch user's profile for pre-filling review form
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profileData) {
          setCurrentUserProfile(profileData);
          setReviewForm(prev => ({
            ...prev,
            name: `${profileData.first_name} ${profileData.last_name}`.trim(),
            email: profileData.email
          }));
        } else {
          // Fallback to auth email if no profile exists
          setReviewForm(prev => ({
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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setArtist(profileData);
      }

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('id, title, description, date, is_premium, media_url, media_type')
        .eq('profile_id', id)
        .order('is_premium', { ascending: false })
        .order('date', { ascending: false });

      setAnnouncements(announcementsData || []);

      // Fetch gallery items
      const { data: galleryData } = await supabase
        .from('gallery_items')
        .select('id, type, url, thumbnail_url')
        .eq('profile_id', id);

      setGalleryItems(galleryData || []);

      // Fetch calendar events
      const { data: calendarData } = await supabase
        .from('calendar_events')
        .select('id, event_date, status')
        .eq('profile_id', id);

      setCalendarEvents(calendarData || []);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, reviewer_name, rating, comment, created_at, reviewer_user_id')
        .eq('profile_id', id)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);

      // Fetch posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('id, profile_id, content, media_url, media_type, created_at')
        .eq('profile_id', id)
        .order('created_at', { ascending: false });

      setPosts(postsData || []);

      setLoading(false);
    };

    fetchArtistData();
  }, [id]);

  const getBusyDates = () => {
    return calendarEvents
      .filter(event => event.status === 'busy' || event.status === 'booked')
      .map(event => new Date(event.event_date));
  };

  const getBlockedDates = () => {
    return calendarEvents
      .filter(event => event.status === 'blocked' || event.status === 'unavailable')
      .map(event => new Date(event.event_date));
  };

  const isBusyDate = (date: Date) => {
    return getBusyDates().some(
      (busyDate: Date) =>
        busyDate.getDate() === date.getDate() &&
        busyDate.getMonth() === date.getMonth() &&
        busyDate.getFullYear() === date.getFullYear()
    );
  };

  const isBlockedDate = (date: Date) => {
    return getBlockedDates().some(
      (blockedDate: Date) =>
        blockedDate.getDate() === date.getDate() &&
        blockedDate.getMonth() === date.getMonth() &&
        blockedDate.getFullYear() === date.getFullYear()
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && !isBusyDate(date) && !isBlockedDate(date)) {
      setBookingDialogOpen(true);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !id) return;

    try {
      const { error } = await supabase.from('booking_requests').insert({
        profile_id: id,
        requester_name: bookingForm.name,
        requester_email: bookingForm.email,
        requester_phone: bookingForm.phone,
        event_date: selectedDate.toISOString().split('T')[0],
        event_type: bookingForm.eventType,
        message: bookingForm.message,
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: "Booking Request Sent!",
        description: `Your booking request for ${selectedDate?.toLocaleDateString()} has been sent to ${artist?.stage_name}.`,
      });
      
      setBookingDialogOpen(false);
      setBookingForm({
        name: "",
        email: "",
        phone: "",
        eventType: "",
        message: ""
      });
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
    return artist.music_genres.split(',').map(g => g.trim());
  };

  const getImages = () => galleryItems.filter(item => item.type === 'image');
  const getVideos = () => galleryItems.filter(item => item.type === 'video');

  const getAverageRating = () => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const formatDate = (dateString: string) => {
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        profile_id: id,
        reviewer_name: reviewForm.name.trim(),
        reviewer_email: reviewForm.email.trim(),
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim() || null,
        reviewer_user_id: currentUserId
      });

      if (error) throw error;

      // Refetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, reviewer_name, rating, comment, created_at, reviewer_user_id')
        .eq('profile_id', id)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);

      toast({
        title: "Review Submitted!",
        description: `Thank you for reviewing ${artist?.stage_name}.`,
      });

      setReviewDialogOpen(false);
      setReviewForm({ name: "", email: "", rating: 5, comment: "" });
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
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(reviews.filter(r => r.id !== reviewId));

      toast({
        title: "Review Deleted",
        description: "The review has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive"
      });
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
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? 'text-accent fill-accent'
                : 'text-muted-foreground'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRate?.(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-32 pb-20 px-4">
          <div className="container mx-auto text-center">
            <p className="text-xl text-muted-foreground">Loading artist profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-32 pb-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-display font-bold mb-4">Artist Not Found</h1>
            <Link to="/">
              <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPremium = artist.plan === 'Premium';

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-32 pb-20 px-4 md:px-8 lg:px-12">
        <div className="w-full">
          <Link to="/leaderboard">
            <Button variant="ghost" className="mb-6 hover:text-accent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Artists
            </Button>
          </Link>

          <div className="p-8">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="flex-shrink-0">
                  <Avatar className="w-40 h-40 border-4 shadow-lg border-accent">
                    <AvatarImage src={artist.avatar_url || undefined} alt={artist.stage_name} />
                    <AvatarFallback className="bg-gradient-to-br from-accent/30 to-accent/10">
                      <User className={`h-20 w-20 ${isPremium ? 'text-accent' : 'text-burgundy'}`} />
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-display font-bold text-foreground">
                          {artist.stage_name}
                        </h1>
                        <Badge 
                          className={`px-4 py-1.5 text-sm font-semibold ${
                            isPremium 
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0 shadow-lg shadow-amber-500/30' 
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          {isPremium ? '★ Premium' : 'Standard'}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mb-4">
                        {artist.specialization && (
                          <Badge className="bg-accent text-accent-foreground px-4 py-2 text-base">
                            {artist.specialization}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-5 w-5" />
                          <span className="text-base">{artist.county}{artist.country ? `, ${artist.country}` : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground shadow-lg">
                      <Star className="h-6 w-6 fill-current" />
                      <span className="text-2xl font-bold">{getAverageRating() || 'N/A'}</span>
                      {reviews.length > 0 && (
                        <span className="text-sm opacity-80">({reviews.length})</span>
                      )}
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="flex flex-wrap gap-3 mt-6">
                    {currentUserId && currentUserId !== artist.id ? (
                      <Button 
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => navigate(`/messages?artistId=${artist.id}`)}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Contact
                      </Button>
                    ) : !currentUserId ? (
                      <Button 
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => navigate('/login')}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Login to Contact
                      </Button>
                    ) : null}
                    <a href={`tel:${artist.phone}`}>
                      <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                        <Phone className="mr-2 h-4 w-4" />
                        Call Now
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Tabs Section */}
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-8">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="announcements">Announcements</TabsTrigger>
                  <TabsTrigger value="gallery">Gallery</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-8">
                  {/* Description */}
                  <div>
                    <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                      <User className="h-6 w-6 text-accent" />
                      About
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {artist.bio || "No bio available."}
                    </p>
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
                      <div className="flex flex-wrap gap-2">
                        {getGenresArray().length > 0 ? (
                          getGenresArray().map((genre: string) => (
                            <Badge key={genre} variant="outline" className="border-accent/50 text-accent px-3 py-1">
                              {genre}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No genres specified</p>
                        )}
                      </div>
                    </div>

                    {/* Experience */}
                    <div>
                      <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-accent" />
                        Experience
                      </h3>
                      <div className="space-y-2">
                        <p className="text-muted-foreground">
                          <span className="font-semibold text-foreground">{getExperienceYears()} years</span> of professional experience
                        </p>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Award className="h-4 w-4 text-accent" />
                          <span className="font-semibold text-foreground">{artist.number_of_events}+</span> events performed
                        </p>
                      </div>
                    </div>

                    {/* Estimated Prices */}
                    <div>
                      <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-accent" />
                        Estimated Price
                      </h3>
                      <div className="space-y-2">
                        {artist.estimated_price ? (
                          <Badge variant="outline" className="border-accent/50 text-accent text-sm px-3 py-1">
                            {artist.estimated_price}
                          </Badge>
                        ) : (
                          <p className="text-muted-foreground">Contact for pricing</p>
                        )}
                      </div>
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
                          <a href={`mailto:${artist.email}`} className="text-foreground hover:text-accent transition-colors">
                            {artist.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
                        <Phone className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <a href={`tel:${artist.phone}`} className="text-foreground hover:text-accent transition-colors">
                            {artist.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Social Media */}
                  <div>
                    <h3 className="text-xl font-display font-bold mb-4">Follow on Social Media</h3>
                    <div className="flex flex-wrap gap-3">
                      {artist.facebook_url && (
                        <a 
                          href={artist.facebook_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors"
                        >
                          <Facebook className="h-5 w-5 text-accent" />
                          <span className="text-sm">Facebook</span>
                        </a>
                      )}
                      {artist.instagram_url && (
                        <a 
                          href={artist.instagram_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors"
                        >
                          <Instagram className="h-5 w-5 text-accent" />
                          <span className="text-sm">Instagram</span>
                        </a>
                      )}
                      {artist.youtube_url && (
                        <a 
                          href={artist.youtube_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors"
                        >
                          <Youtube className="h-5 w-5 text-accent" />
                          <span className="text-sm">YouTube</span>
                        </a>
                      )}
                      {artist.tiktok_url && (
                        <a 
                          href={artist.tiktok_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors"
                        >
                          <Music className="h-5 w-5 text-accent" />
                          <span className="text-sm">TikTok</span>
                        </a>
                      )}
                      {artist.spotify_url && (
                        <a 
                          href={artist.spotify_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/50 hover:bg-accent/10 transition-colors"
                        >
                          <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                          <span className="text-sm">Spotify</span>
                        </a>
                      )}
                      {!artist.facebook_url && !artist.instagram_url && !artist.youtube_url && !artist.tiktok_url && !artist.spotify_url && (
                        <p className="text-muted-foreground">No social media links available.</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Reviews Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-display font-bold flex items-center gap-2">
                        <Star className="h-4 w-4 text-accent" />
                        Reviews
                        {getAverageRating() && (
                          <span className="text-lg font-display font-bold text-foreground">
                            ({getAverageRating()} • {reviews.length})
                          </span>
                        )}
                      </h3>
                      {currentUserId !== id && (
                        <Button 
                          onClick={() => setReviewDialogOpen(true)}
                          size="sm"
                          className="bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                          Write a Review
                        </Button>
                      )}
                    </div>

                    {reviews.length > 0 ? (
                      <Carousel className="w-full">
                        <CarouselContent>
                          {reviews.map((review) => (
                            <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                              <div className="flex flex-col gap-3 p-4 rounded-lg border border-accent/20 hover:border-accent/40 transition-colors bg-card/50 h-full relative">
                                {canDeleteReview(review) && (
                                  <button
                                    onClick={() => handleDeleteReview(review.id)}
                                    className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                    title="Delete review"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border border-accent/30 flex-shrink-0">
                                    <AvatarFallback className="bg-accent/10 text-accent text-sm">
                                      {review.reviewer_name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-sm text-foreground block">{review.reviewer_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${star <= review.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`}
                                    />
                                  ))}
                                </div>
                                {review.comment && (
                                  <p className="text-sm text-muted-foreground flex-1">{review.comment}</p>
                                )}
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-0 -translate-x-1/2" />
                        <CarouselNext className="right-0 translate-x-1/2" />
                      </Carousel>
                    ) : (
                      <div className="text-center py-8 border border-dashed border-accent/30 rounded-lg">
                        <Star className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No reviews yet</p>
                        {currentUserId !== id && (
                          <Button 
                            onClick={() => setReviewDialogOpen(true)}
                            size="sm"
                            variant="outline"
                            className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                          >
                            Write the First Review
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Posts Tab */}
                <TabsContent value="posts" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                      <FileText className="h-6 w-6 text-accent" />
                      Posts
                    </h2>
                    <div className="max-w-[500px] mx-auto space-y-4">
                      {posts.length > 0 ? (
                        posts.map((post) => (
                          <Card key={post.id} className="overflow-hidden border-border/40 shadow-sm rounded-lg">
                            {/* Header */}
                            <div className="p-4 pb-0">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className={`p-0.5 rounded-full ${
                                      artist?.plan === 'Premium' 
                                        ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600' 
                                        : 'bg-gradient-to-r from-red-500 via-red-600 to-red-500'
                                    }`}
                                  >
                                    <Avatar className="w-10 h-10 border-2 border-background">
                                      <AvatarImage src={artist?.avatar_url || undefined} alt={artist?.stage_name} />
                                      <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                        {artist?.stage_name?.charAt(0) || 'A'}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-foreground">
                                        {artist?.stage_name}
                                      </h3>
                                      {artist?.plan === 'Premium' && (
                                        <span className="text-accent text-xs">✓</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{artist?.specialization || "Artist"}</span>
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
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        toast({
                                          title: "Report submitted",
                                          description: "Thank you for reporting this problem. We'll review it shortly.",
                                        });
                                      }}
                                    >
                                      <Flag className="h-4 w-4 mr-2" />
                                      Report Problem
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Content */}
                              <p className="text-foreground mt-3 whitespace-pre-wrap">{post.content}</p>
                            </div>
                            
                            {/* Media */}
                            {post.media_url && (
                              <div 
                                className="mt-3 cursor-pointer bg-muted/30"
                                onClick={() => setMediaPreview({
                                  url: post.media_url!,
                                  type: post.media_type === "video" ? "video" : "image"
                                })}
                              >
                                {post.media_type === "video" ? (
                                  <div className="relative w-full aspect-video">
                                    <video 
                                      src={post.media_url} 
                                      className="absolute inset-0 w-full h-full object-contain bg-black"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                ) : (
                                  <div className="relative w-full aspect-[4/5] sm:aspect-video">
                                    <img 
                                      src={post.media_url} 
                                      alt="Post content"
                                      className="absolute inset-0 w-full h-full object-contain hover:opacity-95 transition-opacity"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="px-2 py-1">
                              <div className="flex items-center justify-around">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 gap-2 rounded-md text-muted-foreground hover:bg-muted"
                                >
                                  <ThumbsUp className="w-5 h-5" />
                                  <span className="font-medium">Like</span>
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/artist/${artist?.id}`)}
                                  className="flex-1 gap-2 rounded-md text-muted-foreground hover:bg-muted"
                                >
                                  <MessageCircle className="w-5 h-5" />
                                  <span className="font-medium">Contact</span>
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <Card className="p-8 text-center">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-muted-foreground">No posts yet.</p>
                        </Card>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Announcements Tab */}
                <TabsContent value="announcements" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                      <Megaphone className="h-6 w-6 text-accent" />
                      Announcements
                    </h2>
                    <div className="max-w-[500px] mx-auto space-y-4">
                      {announcements.length > 0 ? (
                        announcements.map((announcement) => (
                          <Card key={announcement.id} className="overflow-hidden border-border/40 shadow-sm rounded-lg">
                            {/* Header */}
                            <div className="p-4 pb-0">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className={`p-0.5 rounded-full ${
                                      artist?.plan === 'Premium' 
                                        ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600' 
                                        : 'bg-gradient-to-r from-red-500 via-red-600 to-red-500'
                                    }`}
                                  >
                                    <Avatar className="w-10 h-10 border-2 border-background">
                                      <AvatarImage src={artist?.avatar_url || undefined} alt={artist?.stage_name} />
                                      <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                        {artist?.stage_name?.charAt(0) || 'A'}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-foreground">
                                        {artist?.stage_name}
                                      </h3>
                                      {artist?.plan === 'Premium' && (
                                        <span className="text-accent text-xs">✓</span>
                                      )}
                                      {announcement.is_premium && (
                                        <Badge className="bg-accent/10 text-accent border-accent/30 text-xs">
                                          Promotion
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{artist?.specialization || "Artist"}</span>
                                      <span>·</span>
                                      <span>{new Date(announcement.date).toLocaleDateString()}</span>
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
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        toast({
                                          title: "Report submitted",
                                          description: "Thank you for reporting this problem. We'll review it shortly.",
                                        });
                                      }}
                                    >
                                      <Flag className="h-4 w-4 mr-2" />
                                      Report Problem
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Content */}
                              <p className="text-foreground mt-3 whitespace-pre-wrap">{announcement.description}</p>
                            </div>
                            
                            {/* Media for premium announcements */}
                            {announcement.is_premium && announcement.media_url && (
                              <div 
                                className="mt-3 cursor-pointer bg-muted/30"
                                onClick={() => setMediaPreview({
                                  url: announcement.media_url!,
                                  type: announcement.media_type === "video" ? "video" : "image"
                                })}
                              >
                                {announcement.media_type === "video" ? (
                                  <div className="relative w-full aspect-video">
                                    <video 
                                      src={announcement.media_url} 
                                      className="absolute inset-0 w-full h-full object-contain bg-black"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                ) : (
                                  <div className="relative w-full aspect-[4/5] sm:aspect-video">
                                    <img 
                                      src={announcement.media_url} 
                                      alt="Announcement media"
                                      className="absolute inset-0 w-full h-full object-contain hover:opacity-95 transition-opacity"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Contact button */}
                            <div className="px-2 py-2">
                              <div className="flex items-center justify-around">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/artist/${artist?.id}`)}
                                  className="flex-1 gap-2 rounded-md text-muted-foreground hover:bg-muted"
                                >
                                  <MessageCircle className="w-5 h-5" />
                                  <span className="font-medium">Contact</span>
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <Card className="p-8 text-center">
                          <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-muted-foreground">No announcements yet.</p>
                        </Card>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Gallery Tab */}
                <TabsContent value="gallery">
                  <div className="space-y-8">
                    {/* Photos Section */}
                    <div>
                      <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                        <Images className="h-6 w-6 text-accent" />
                        Photos
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {getImages().length > 0 ? (
                          getImages().map((image, index) => (
                            <Dialog key={image.id}>
                              <DialogTrigger asChild>
                                <div className="aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-accent/20 hover:border-accent transition-colors">
                                  <img 
                                    src={image.url} 
                                    alt={`Gallery image ${index + 1}`}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                  />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-2 flex items-center justify-center">
                                <img 
                                  src={image.url} 
                                  alt={`Gallery image ${index + 1}`}
                                  className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
                                />
                              </DialogContent>
                            </Dialog>
                          ))
                        ) : (
                          <div className="col-span-full text-center text-muted-foreground py-8">
                            No photos available yet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Videos Section */}
                    <div>
                      <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                        <Play className="h-6 w-6 text-accent" />
                        Videos
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {getVideos().length > 0 ? (
                          getVideos().map((video, index) => (
                            <Dialog key={video.id}>
                              <DialogTrigger asChild>
                                <div className="aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-accent/20 hover:border-accent transition-colors bg-black/80 flex items-center justify-center">
                                  <Play className="h-12 w-12 text-accent" />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <div className="aspect-video">
                                  <iframe
                                    src={video.url}
                                    className="w-full h-full rounded-lg"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ))
                        ) : (
                          <div className="col-span-full text-center text-muted-foreground py-8">
                            No videos available yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Calendar Tab */}
                <TabsContent value="calendar">
                  <div>
                    <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                      <CalendarIcon className="h-6 w-6 text-accent" />
                      Availability Calendar
                    </h2>
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          className="rounded-lg border border-border shadow-sm"
                          modifiers={{
                            busy: getBusyDates(),
                            blocked: getBlockedDates()
                          }}
                          modifiersClassNames={{
                            busy: "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground opacity-70",
                            blocked: "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground opacity-80"
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </div>
                      <div className="lg:w-64 space-y-4">
                        <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
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
                        {selectedDate && (
                          <div className="p-4 rounded-lg border border-border bg-card">
                            <h4 className="font-semibold text-foreground mb-2">Selected Date</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              {selectedDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            <Badge 
                              className={
                                isBlockedDate(selectedDate)
                                  ? "bg-muted text-muted-foreground"
                                  : isBusyDate(selectedDate) 
                                    ? "bg-destructive text-destructive-foreground" 
                                    : "bg-accent text-accent-foreground"
                              }
                            >
                              {isBlockedDate(selectedDate) 
                                ? "Unavailable" 
                                : isBusyDate(selectedDate) 
                                  ? "Busy" 
                                  : "Available"
                              }
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

              </Tabs>

              {/* Review Dialog */}
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
                      <Input
                        id="reviewerName"
                        placeholder="Your name"
                        value={reviewForm.name}
                        onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                        required
                        maxLength={100}
                        readOnly={!!currentUserProfile}
                        className={currentUserProfile ? "bg-muted cursor-not-allowed" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reviewerEmail">Your Email</Label>
                      <Input
                        id="reviewerEmail"
                        type="email"
                        placeholder="your.email@example.com"
                        value={reviewForm.email}
                        onChange={(e) => setReviewForm({ ...reviewForm, email: e.target.value })}
                        required
                        maxLength={255}
                        readOnly={!!currentUserProfile || !!currentUserId}
                        className={currentUserProfile || currentUserId ? "bg-muted cursor-not-allowed" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rating</Label>
                      <div className="py-2">
                        {renderStars(reviewForm.rating, true, (rating) => setReviewForm({ ...reviewForm, rating }))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reviewComment">Your Review (Optional)</Label>
                      <Textarea
                        id="reviewComment"
                        placeholder="Share your experience..."
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        rows={4}
                        maxLength={1000}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      disabled={submittingReview}
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Booking Dialog */}
              <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-display">Book {artist.stage_name}</DialogTitle>
                    <DialogDescription>
                      {selectedDate && `Selected date: ${selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}`}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={bookingForm.name}
                        onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+40 712 345 678"
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventType">Event Type</Label>
                      <Input
                        id="eventType"
                        placeholder="e.g., Wedding, Corporate Event, Birthday"
                        value={bookingForm.eventType}
                        onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Additional Details</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your event..."
                        value={bookingForm.message}
                        onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                        rows={4}
                      />
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
      <Dialog open={!!mediaPreview} onOpenChange={() => setMediaPreview(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none [&>button]:text-white">
          <div className="flex items-center justify-center w-full h-full p-4">
            {mediaPreview?.type === "video" ? (
              <video 
                src={mediaPreview.url} 
                controls
                autoPlay
                className="max-w-full max-h-[85vh] object-contain"
              />
            ) : (
              <img 
                src={mediaPreview?.url} 
                alt="Full size preview"
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArtistProfile;