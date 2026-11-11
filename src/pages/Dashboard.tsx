import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { bandMembersLabel } from "@/lib/bandMembers";
import CollabStatusChip from "@/components/profile/CollabStatusChip";
import { COLLAB_STATUSES, COLLAB_STATUS_LABEL, hasCollabStatus, isCollabStatus, isOpenToCollabs } from "@/lib/collabStatus";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatSmartDate, formatDateNoYear, cn, sanitizeFileName } from "@/lib/utils";
import SettingsTab, { type SettingSection } from "@/components/SettingsTab";
import ExpandableText from "@/components/ExpandableText";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ReviewCard from "@/components/ReviewCard";
import ReviewsSummary from "@/components/ReviewsSummary";
import Navigation from "@/components/Navigation";
import SocialStats from "@/components/SocialStats";
import OfficialProfileHeader from "@/components/profile/OfficialProfileHeader";

import CountryFlagIcon from "@/components/CountryFlagIcon";

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
import { genreLabel } from "@/lib/genreLabel";
import { MUSIC_GENRES } from "@/lib/musicGenres";
import { supabase } from "@/integrations/supabase/client";
import { translateSpecialization } from "@/lib/specializationLabel";
import FeedPostCard from "@/components/FeedPostCard";
import FeedAnnouncementCard from "@/components/FeedAnnouncementCard";
import AnnouncementManagementCard from "@/components/dashboard/AnnouncementManagementCard";
import OpportunityComposer from "@/components/OpportunityComposer";
import OwnerAnnouncementsList from "@/components/dashboard/OwnerAnnouncementsList";
import { useProfileAvatars, useProfileBasics } from "@/hooks/useProfileAvatars";
import ContentKindChips, { announcementKind, type ContentKind } from "@/components/profile/ContentKindChips";
import ProfileViewsCard from "@/components/dashboard/ProfileViewsCard";
import { PROFILE_PANEL } from "@/lib/profileLayout";
import BookingRequestCard from "@/components/BookingRequestCard";
import { sortBookingsForPreview, isClosedBooking, bookingStatusKey } from "@/lib/bookingDisplay";
import PostActionsMenu from "@/components/PostActionsMenu";
import { sharePost } from "@/lib/sharePost";
import { LogOut, Camera, Save, User, MapPin, Star, Music, Calendar as CalendarIcon, CalendarCheck, Award, Phone, Mail, Edit2, X, Megaphone, Plus, Trash2, Images, Play, Upload, MessageSquare, FileText, Settings as SettingsIcon, DollarSign, Euro, Facebook, Instagram, Youtube, Link as LinkIcon, Music2, Heart, Clock, AlertCircle, Users, BarChart3, Lock, MoreHorizontal, Pencil, Search, Share2, Lightbulb, Info, Image as ImageIcon, Video as VideoIcon, Palette, Check, ChevronLeft, ChevronRight, Ban } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COVER_THEMES, getCoverGradient } from "@/lib/coverThemes";
import i18n from "@/i18n";
import { useTranslation } from "react-i18next";
import CommentsDialog from "@/components/CommentsDialog";
import VerifiedBadge from "@/components/VerifiedBadge";

import { Switch } from "@/components/ui/switch";
import { isAdExpired, getDaysRemaining, getAdExpirationDate } from "@/lib/adExpiration";
import { getCurrencyForCountry } from "@/lib/countryCurrencies";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import InstrumentSelector from "@/components/InstrumentSelector";
import { getInstrumentIcon } from "@/lib/instrumentIcons";
import EditableField from "@/components/EditableField";
import { ArtistAvailabilityCalendar, AvailabilityCalendarLayout, calendarAvailabilityStyles } from "@/components/ArtistAvailabilityCalendar";
import BookedEventsList, { parseBookedEvents, type BookedEvent } from "@/components/BookedEventsList";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import GenrePickerDialog from "@/components/GenrePickerDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// react-easy-crop e o librărie grea folosită DOAR când userul deschide
// crop-ul de imagine (showCropper). O încărcăm lazy ca să iasă complet din
// chunk-ul inițial al Dashboard-ului — se descarcă abia la prima deschidere
// a cropper-ului. `Area` e doar un tip, deci import type (zero cost runtime).
import type { Area } from "react-easy-crop";
const Cropper = lazy(() => import("react-easy-crop"));
import { parseYMDToLocalDate } from "@/lib/utils";
import { CompactCalendarLegend } from "@/components/ArtistAvailabilityCalendar";
import { getThumbUrl } from "@/lib/imageUrl";
import { Calendar } from "@/components/ui/calendar";
import { getAvatarOutlineClasses, getAvatarOutlineClassesLarge } from "@/lib/subscriptionStyles";
import { isFree, isPremium, canPost, canSetEstimatedPrice, getImageLimit, getVideoLimit, getPostLimit, getAdLimit, getPromotionLimit, getSocialLinkLimit, countFilledSocialLinks, getEstimatedPriceLimit, computeGalleryVisibility, canPublishPosts } from "@/lib/planLimits";
import { getPeriodStart, getPeriodStartIso, getPeriodEnd } from "@/lib/billingPeriod";
import OverLimitBanner from "@/components/OverLimitBanner";
import { CreationModalShell, UsagePill, CreationSection, FieldLabel } from "@/components/dashboard/CreationModal";
import { SectionShell, SectionHeader, SectionHeaderWithUsage, SectionStats, SectionStatCard, SectionEmptyState } from "@/components/dashboard/SectionLayout";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";
import { Progress } from "@/components/ui/progress";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { useIsMobile } from "@/hooks/use-mobile";
import InstagramZoomPreview from "@/components/InstagramZoomPreview";
import SmoothVideoPlayer from "@/components/SmoothVideoPlayer";
import { getEmbedInfo, isSupportedEmbed, providerLabel } from "@/lib/mediaEmbed";
import PricingEntriesEditor from "@/components/PricingEntriesEditor";
import { useUserRole } from "@/hooks/useUserRole";
import { useEntitlements, serverLimit } from "@/hooks/useEntitlements";
import PostComposerDialog from "@/components/post/PostComposerDialog";
import { PostsGrid, PostsViewSwitcher, postDetailPath, usePostsViewMode } from "@/components/post/PostsView";
import { QuotaInfoButton } from "@/components/dashboard/QuotaInfoButton";
import BookingOfferDialog from "@/components/BookingOfferDialog";
import BookingDetailsDialog from "@/components/BookingDetailsDialog";
import { isDayFullyBooked, parseSlotsFromNotes } from "@/lib/calendarSlots";
const capitalizeFirst = (v: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : v);

/** Inline profile editors: filled grey fields, a quiet Cancel and a gold Save, no icons. */
const EDIT_FIELD = "rounded-lg border-0 bg-foreground/[0.07] text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:ring-offset-0";
const EDIT_CANCEL_BTN = "h-9 rounded-full px-4 text-sm font-bold text-muted-foreground hover:bg-transparent hover:text-foreground";
const GENRE_CHIP = "h-8 rounded-full border-0 px-3.5 text-sm font-normal text-foreground transition-colors";
const EDIT_SAVE_BTN = "h-9 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground hover:bg-accent hover:scale-[1.03] transition-transform";

const Dashboard = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { isAdmin } = useUserRole();
  // Authoritative server-side entitlements (effective plan, limits, current
  // billing-period usage). The local counters below are only a fallback while
  // this request is in flight.
  const { entitlements, refresh: refreshEntitlements } = useEntitlements();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [commentsTarget, setCommentsTarget] = useState<{ id: string; type: "post" | "announcement" } | null>(null);
  const [postsViewMode, setPostsViewMode] = usePostsViewMode();
  const [profile, setProfile] = useState<any>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [pricingCount, setPricingCount] = useState(0);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [pricingEditId, setPricingEditId] = useState<string | null>(null);
  const [pricingRefreshKey, setPricingRefreshKey] = useState(0);
  const [acceptedEventsCount, setAcceptedEventsCount] = useState(0);
  const [responseRate, setResponseRate] = useState<number | null>(null);
  // /calendar (bottom bar) shows only the artist's calendar: availability, requests, bookings
  const location = useLocation();
  const calendarOnly = location.pathname === "/calendar";
  const [activeTab, setActiveTab] = useState(calendarOnly ? "profile" : searchParams.get('tab') || "profile");
  usePageTitle(activeTab === "settings" ? "Settings" : "Profile");
  const [profileSection, setProfileSection] = useState(
    calendarOnly ? "calendar"
      : searchParams.get('section') === "calendar" ? "details"
      // Collaborations live in the Posts tab now (chips Posts · Collaborations)
      : searchParams.get('section') === "announcements" ? "posts"
      : searchParams.get('section') || "details",
  );
  const [postsKind, setPostsKind] = useState<ContentKind>(
    searchParams.get('section') === "announcements" || searchParams.get('new') === "collab" ? "collab" : "posts",
  );

  // Force admins to allowed sections only
  useEffect(() => {
    if (isAdmin && profileSection !== "posts") {
      setProfileSection("posts");
    }
  }, [isAdmin, profileSection]);
  const [settingsSection, setSettingsSection] = useState<SettingSection>("main");

  const settingsSectionTitles: Record<SettingSection, string> = {
    main: t('navigation.settings'),
    account: "Account",
    system: "System",
    email: "Email Address",
    password: "Password & Security",
    language: "Language",
    theme: "Theme",
    promotion: "Promotion",
    comments: "Comments",
    notifications: "Notifications",
    report: "Report a Problem",
    logout: "Sign Out",
    delete: "Delete Account",
    help: "Help Center",
    about: "About Muzicalist",
    billing: "Billing & Subscription",
    edit_profile: "Edit Profile",
    profile_visibility: "Profile Visibility",
    blocked_users: "Blocked Users",
    mentions_tags: "Mentions & Tags",
    display_settings: "Display Settings",
    privacy_policy: "Privacy Policy",
    terms_of_service: "Terms of Service",
    verification: "Identity Verification",
    rules: "Rules",
    contract_details: "Contract Details",
  };

  const getMobileTitle = () => {
    if (activeTab === "settings") {
      return settingsSectionTitles[settingsSection] || t('navigation.settings');
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
    if (calendarOnly) {
      setActiveTab("profile");
      setProfileSection("calendar");
    } else if (section === "calendar") {
      // The calendar moved out of the profile tabs into its own page
      navigate("/calendar", { replace: true });
    } else if (section === "announcements") {
      setProfileSection("posts");
      setPostsKind("collab");
    } else if (section) {
      setProfileSection(section);
    } else {
      // Back on the profile from the Calendar page: the calendar isn't one of the profile tabs
      setProfileSection((prev) => (prev === "calendar" ? (isAdmin ? "posts" : "details") : prev));
    }
    if (searchParams.get('new') === '1') {
      if (section === 'posts') setShowPostDialog(true);
      if (section === 'announcements') setShowAnnouncementDialog(true);
    }
    // From the feed's "+" → Collaboration
    if (searchParams.get('new') === 'collab') {
      setProfileSection("posts");
      setPostsKind("collab");
      setShowAnnouncementDialog(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
    const commentsId = searchParams.get('commentsId');
    const commentsType = searchParams.get('commentsType');
    if (commentsId && (commentsType === 'post' || commentsType === 'announcement')) {
      setCommentsTarget({ id: commentsId, type: commentsType });
    }
  }, [searchParams, calendarOnly]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({
    x: 0,
    y: 0
  });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverImageSrc, setCoverImageSrc] = useState<string | null>(null);
  const [coverCrop, setCoverCrop] = useState({ x: 0, y: 0 });
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverCroppedAreaPixels, setCoverCroppedAreaPixels] = useState<Area | null>(null);
  const [showCoverCropper, setShowCoverCropper] = useState(false);
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
    bandMembers: "",
    collabStatus: ""
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
  // Collaboration being edited (opened from its ⋯ menu)
  const [editOpp, setEditOpp] = useState<{ row: any; lockCore: boolean } | null>(null);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  const announcementTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = announcementTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [newAnnouncement.description]);

  // Announcement limits (plan-based). Server entitlements win when loaded.
  const currentPlan = profile?.plan;
  const STANDARD_AD_LIMIT = isAdmin
    ? Number.POSITIVE_INFINITY
    : serverLimit(entitlements, 'announcements', getAdLimit(currentPlan));
  const PREMIUM_AD_LIMIT = isAdmin
    ? Number.POSITIVE_INFINITY
    : serverLimit(entitlements, 'announcement_promotions', getPromotionLimit(currentPlan));

  // Per-billing-period usage counters. Counters reset automatically at the
  // start of each new subscription cycle (monthly or yearly).
  const [consumedSlots, setConsumedSlots] = useState<{ is_premium: boolean; consumed_at: string; kind?: string }[]>([]);
  const periodStart = getPeriodStart(profile);
  const periodEnd = getPeriodEnd(profile);
  const activeConsumedSlots = consumedSlots.filter(
    (s) => new Date(s.consumed_at).getTime() >= periodStart.getTime(),
  );
  /** Server usage (authoritative) with the legacy slot counter as fallback. */
  const usageOf = (key: string, fallback: number): number => {
    const value = entitlements?.usage?.[key];
    return typeof value === 'number' ? value : fallback;
  };
  const standardAdsUsed = usageOf(
    'announcements',
    activeConsumedSlots.filter((s) => (s.kind ?? 'ad') === 'ad' && !s.is_premium).length,
  );
  const premiumAdsUsed = usageOf(
    'announcement_promotions',
    activeConsumedSlots.filter((s) => (s.kind ?? 'ad') === 'ad' && s.is_premium).length,
  );
  const postsUsed = usageOf('posts', activeConsumedSlots.filter((s) => s.kind === 'post').length);
  // Post promotions consume the existing monthly promotion entitlement.
  const promotionsUsed = usageOf(
    'post_promotions',
    activeConsumedSlots.filter((s) => s.kind === 'promotion').length,
  );
  const standardAdsRemaining = Math.max(STANDARD_AD_LIMIT - standardAdsUsed, 0);
  const premiumAdsRemaining = Math.max(PREMIUM_AD_LIMIT - premiumAdsUsed, 0);
  const PROMOTION_LIMIT = isAdmin
    ? Number.POSITIVE_INFINITY
    : serverLimit(entitlements, 'post_promotions', getPromotionLimit(currentPlan));
  const promotionsRemaining = Math.max(PROMOTION_LIMIT - promotionsUsed, 0);


  // Posts state
  const [posts, setPosts] = useState<any[]>([]);
  const [monthlyPostsCount, setMonthlyPostsCount] = useState(0);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [announcementUploadProgress, setAnnouncementUploadProgress] = useState<number | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<{ id: string; promotedUntil: string | null } | null>(null);
  const [editItem, setEditItem] = useState<{ id: string; kind: 'post' | 'promotion'; text: string } | null>(null);
  const [activePostMenu, setActivePostMenu] = useState<string | null>(null);
  
  
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);

  // Post limits (plan-based) — counted per billing period, resets each cycle.
  const STANDARD_POST_LIMIT = isAdmin
    ? Number.POSITIVE_INFINITY
    : serverLimit(entitlements, 'posts', getPostLimit(currentPlan));
  // One allowance for posts, availability posts and collaborations (mirrors the server triggers)
  const sharedUsed = postsUsed + standardAdsUsed;
  const sharedRemaining = Math.max(STANDARD_POST_LIMIT - sharedUsed, 0);
  const sharedLimitLabel = Number.isFinite(STANDARD_POST_LIMIT) ? STANDARD_POST_LIMIT : '∞';
  /**
   * Creation entitlement (current plan) is intentionally kept SEPARATE from
   * visibility of content the owner already created. A downgrade blocks new
   * creation but never hides historical Posts / Announcements.
   */
  const canCreatePosts = isAdmin || canPublishPosts(currentPlan);
  const canCreateAnnouncements = isAdmin || canPost(currentPlan);

  // Gallery state
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [deleteGalleryItem, setDeleteGalleryItem] = useState<{
    id: string;
    url: string;
    type: string;
  } | null>(null);

  // Gallery limits (plan-based; server entitlements win when loaded)
  const STANDARD_IMAGE_LIMIT = serverLimit(entitlements, 'gallery_images', getImageLimit(currentPlan));
  const STANDARD_VIDEO_LIMIT = serverLimit(entitlements, 'gallery_videos', getVideoLimit(currentPlan));

  // Calculate used gallery items
  const imagesUsed = galleryItems.filter((item) => item.type === 'image').length;
  const videosUsed = galleryItems.filter((item) => item.type === 'video').length;
  const imagesRemaining = STANDARD_IMAGE_LIMIT - imagesUsed;
  const videosRemaining = STANDARD_VIDEO_LIMIT - videosUsed;

  // Visibility map: items uploaded after plan limits are kept stored but hidden
  // from public profile view. Owner still sees them with a lock overlay.
  // Mirrors public.gallery_item_is_active(): items beyond the limit, by position, are inactive.
  const galleryHiddenIds = new Set<string>([
    ...galleryItems.filter((i) => i.type === 'image').slice(STANDARD_IMAGE_LIMIT).map((i) => i.id),
    ...galleryItems.filter((i) => i.type === 'video').slice(STANDARD_VIDEO_LIMIT).map((i) => i.id),
  ]);
  const moveGalleryItem = async (id: string, type: string, dir: -1 | 1) => {
    const list = galleryItems.filter((i) => i.type === type);
    const idx = list.findIndex((i) => i.id === id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= list.length) return;
    const next = list.slice();
    [next[idx], next[to]] = [next[to], next[idx]];
    const others = galleryItems.filter((i) => i.type !== type);
    setGalleryItems(type === 'image' ? [...next, ...others] : [...others, ...next]);
    const { error } = await (supabase as any).rpc('reorder_gallery_items', { _type: type, _ids: next.map((i) => i.id) });
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    }
    await loadGalleryItems();
  };
  const imagesOverLimit = imagesUsed > STANDARD_IMAGE_LIMIT;
  const videosOverLimit = videosUsed > STANDARD_VIDEO_LIMIT;
  const galleryOverLimit = imagesOverLimit || videosOverLimit;

  // Calendar state
  const isMobile = useIsMobile();
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [eventStatus, setEventStatus] = useState<'blocked' | 'available'>('available');
  const [userChangedStatus, setUserChangedStatus] = useState(false);
  const [eventNotes, setEventNotes] = useState("");

  // Booking requests state
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  // Photos of the people who sent booking requests (cards + details dialog)
  const requesterAvatars = useProfileAvatars(bookingRequests.map((r: any) => r.requester_user_id));
  const [sentBookingRequests, setSentBookingRequests] = useState<any[]>([]);
  // The artists I sent requests to (name + photo on the preview cards)
  const sentArtists = useProfileBasics(sentBookingRequests.map((r: any) => r.profile_id));

  const [selectedBookingRequest, setSelectedBookingRequest] = useState<any | null>(null);
  const [showBookingDetailDialog, setShowBookingDetailDialog] = useState(false);
  const [offerBooking, setOfferBooking] = useState<any | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  

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
    // Keep the authoritative server usage counters in sync.
    refreshEntitlements();
    // Pull usage rows since the start of the current billing period.
    const cutoffIso = getPeriodStartIso(profile);
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
      const announcementIds = data.map((announcement: any) => announcement.id);
      const [likesRes, myLikesRes, commentsRes] = await Promise.all([
        announcementIds.length ? (supabase as any).from('announcement_likes').select('announcement_id').in('announcement_id', announcementIds) : Promise.resolve({ data: [] }),
        announcementIds.length ? (supabase as any).from('announcement_likes').select('announcement_id').eq('user_id', user.id).in('announcement_id', announcementIds) : Promise.resolve({ data: [] }),
        announcementIds.length ? (supabase as any).from('comments').select('announcement_id').in('announcement_id', announcementIds) : Promise.resolve({ data: [] }),
      ]);
      const likeCounts = new Map<string, number>();
      (likesRes.data || []).forEach((r: any) => likeCounts.set(r.announcement_id, (likeCounts.get(r.announcement_id) || 0) + 1));
      const myLikes = new Set<string>((myLikesRes.data || []).map((r: any) => r.announcement_id));
      const commentCounts = new Map<string, number>();
      (commentsRes.data || []).forEach((r: any) => commentCounts.set(r.announcement_id, (commentCounts.get(r.announcement_id) || 0) + 1));
      setAnnouncements(data.map((announcement: any) => ({
        ...announcement,
        likes: likeCounts.get(announcement.id) || 0,
        isLiked: myLikes.has(announcement.id),
        commentsCount: commentCounts.get(announcement.id) || 0,
      })));
    }
  };
  const loadGalleryItems = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from('gallery_items').select('*').eq('profile_id', user.id).order('position', {
      ascending: true
    }).order('created_at', { ascending: true });
    if (data) setGalleryItems(data);
  };
  const loadCalendarEvents = async () => {
    if (!user) return;
    const {
      data
    } = await (supabase as any).rpc('get_my_calendar_events');
    if (data) setCalendarEvents(data);
  };
  // Calendar preview: received and sent requests together, the ones that still need
  // attention first (new, offer sent, upcoming confirmed), then the latest closed ones.
  const bookingPreview = useMemo(
    () =>
      sortBookingsForPreview([
        ...bookingRequests.map((r) => ({ ...r, __sent: false })),
        ...sentBookingRequests.map((r) => ({ ...r, __sent: true })),
      ]).slice(0, 5),
    [bookingRequests, sentBookingRequests]
  );

  const loadBookingRequests = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from('booking_requests').select('*').eq('profile_id', user.id).order('created_at', {
      ascending: false
    });
    if (data) setBookingRequests(data);
    const { data: sent } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('requester_user_id', user.id)
      .neq('profile_id', user.id)
      .order('created_at', { ascending: false });
    setSentBookingRequests(sent || []);
  };

  const loadPosts = async () => {
    if (!user) return;
    // Keep the authoritative server usage counters in sync.
    refreshEntitlements();
    const {
      data
    } = await supabase.from('posts').select('*').eq('profile_id', user.id).order('created_at', {
      ascending: false
    });
    if (data) {
      const postIds = data.map((post: any) => post.id);
      const [likesRes, myLikesRes, commentsRes] = await Promise.all([
        postIds.length ? supabase.from('post_likes').select('post_id').in('post_id', postIds) : Promise.resolve({ data: [] }),
        postIds.length ? supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds) : Promise.resolve({ data: [] }),
        postIds.length ? (supabase as any).from('comments').select('post_id').in('post_id', postIds) : Promise.resolve({ data: [] }),
      ]);
      const likeCounts = new Map<string, number>();
      (likesRes.data || []).forEach((r: any) => likeCounts.set(r.post_id, (likeCounts.get(r.post_id) || 0) + 1));
      const myLikes = new Set<string>((myLikesRes.data || []).map((r: any) => r.post_id));
      const commentCounts = new Map<string, number>();
      (commentsRes.data || []).forEach((r: any) => commentCounts.set(r.post_id, (commentCounts.get(r.post_id) || 0) + 1));
      setPosts(data.map((post: any) => ({
        ...post,
        likes: likeCounts.get(post.id) || 0,
        isLiked: myLikes.has(post.id),
        commentsCount: commentCounts.get(post.id) || 0,
      })));

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
    } = await supabase.from('reviews').select('id, reviewer_name, rating, comment, created_at, reviewer_user_id, is_verified_booking').eq('profile_id', user.id).order('created_at', {
      ascending: false
    });
    if (!data) return;
    // Enrich with reviewer avatars — same presentation as the public profile.
    const reviewerIds = Array.from(new Set(data.map((r: any) => r.reviewer_user_id).filter(Boolean)));
    let avatarMap: Record<string, string | null> = {};
    if (reviewerIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', reviewerIds as string[]);
      avatarMap = Object.fromEntries((profs || []).map((p: any) => [p.id, p.avatar_url]));
    }
    setReviews(data.map((r: any) => ({ ...r, reviewer_avatar_url: r.reviewer_user_id ? avatarMap[r.reviewer_user_id] ?? null : null })));
  };
  const loadFollowing = async () => {
    if (!user) return;
    const { data } = await supabase.
    from('followers').
    select('artist_id, profiles!followers_artist_id_fkey(id, stage_name, avatar_url, specialization, county)').
    eq('follower_id', user.id);
    // Count only rows whose target profile still exists — same rule as the public profile.
    const artists = (data || []).map((f: any) => f.profiles).filter(Boolean);
    setFollowingArtists(artists);
    setFollowingCount(artists.length);
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
      // Role guard: regular users must never see the artist dashboard.
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('user_type')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if ((roleRow?.user_type as string) === 'user') {
        navigate('/user-dashboard', { replace: true });
        return;
      }
      setUser(session.user);
      const {
        data: profileRows,
        error
      } = await (supabase as any).rpc('get_my_full_profile');
      const profileData = Array.isArray(profileRows) ? profileRows[0] : profileRows;
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
        bandMembers: (profileData as any).band_members?.toString() || "",
        collabStatus: isCollabStatus((profileData as any).collab_status) ? (profileData as any).collab_status : ""
      });

      // Count accepted booking requests for this artist
      const { count: acceptedCount } = await supabase
        .from('booking_requests')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profileData.id)
        .eq('status', 'accepted');
      setAcceptedEventsCount(acceptedCount || 0);

      // Response rate
      const { data: allReqs } = await supabase
        .from('booking_requests')
        .select('status')
        .eq('profile_id', profileData.id);
      if (!allReqs || allReqs.length === 0) {
        setResponseRate(null);
      } else {
        const responded = allReqs.filter((r: any) => r.status && r.status !== 'pending').length;
        setResponseRate(Math.round((responded / allReqs.length) * 100));
      }
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
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "File too large", description: "Cover image must be under 8MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCoverImageSrc(reader.result as string);
      setCoverCrop({ x: 0, y: 0 });
      setCoverZoom(1);
      setShowCoverCropper(true);
    };
    reader.readAsDataURL(file);
  };
  const handleSaveCover = async () => {
    if (!coverImageSrc || !coverCroppedAreaPixels || !user) return;
    setIsUploadingCover(true);
    try {
      const croppedBlob = await getCroppedImg(coverImageSrc, coverCroppedAreaPixels);
      const fileName = `${user.id}/cover.jpg`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, croppedBlob, {
        contentType: "image/jpeg",
        cacheControl: "0",
        upsert: true,
      });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const freshUrl = `${publicUrl}?v=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_url: freshUrl } as any)
        .eq("id", user.id);
      if (updateError) throw updateError;
      setProfile((prev: any) => ({ ...(prev ?? {}), cover_url: freshUrl }));
      setShowCoverCropper(false);
      setCoverImageSrc(null);
      toast({ title: "Success", description: "Cover image updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to upload cover.", variant: "destructive" });
    } finally {
      setIsUploadingCover(false);
    }
  };
  const handleRemoveCover = async () => {
    if (!user) return;
    setIsUploadingCover(true);
    try {
      await supabase.storage.from("avatars").remove([`${user.id}/cover.jpg`, `${user.id}/cover.png`]);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_url: null } as any)
        .eq("id", user.id);
      if (updateError) throw updateError;
      setProfile((prev: any) => ({ ...(prev ?? {}), cover_url: null }));
      toast({ title: "Success", description: "Cover image removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to remove cover.", variant: "destructive" });
    } finally {
      setIsUploadingCover(false);
    }
  };
  const handleSelectCoverTheme = async (themeId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ cover_theme: themeId } as any)
        .eq("id", user.id);
      if (error) throw error;
      setProfile((prev: any) => ({ ...(prev ?? {}), cover_theme: themeId }));
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update theme.", variant: "destructive" });
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
          updateData.number_of_events = parseInt(formData.numberOfEvents);
          break;
        case 'bio':
          updateData.bio = formData.bio;
          break;
        case 'price':
          updateData.estimated_price = formData.estimatedPrice;
          break;
        case 'social':
          // Only music links are edited now; Facebook / Instagram / TikTok are kept but no longer shown
          updateData.youtube_url = formData.youtubeUrl.trim();
          updateData.spotify_url = formData.spotifyUrl.trim();
          break;
        case 'instruments':
          updateData.instruments = formData.instruments;
          break;
        case 'collabStatus':
          (updateData as any).collab_status = formData.collabStatus || null;
          break;
        case 'bandMembers': {
          const n = parseInt(formData.bandMembers);
          updateData.band_members = formData.bandMembers.trim() === "" || isNaN(n) ? null : Math.max(2, n);
          break;
        }
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
  const handleOpportunityPublished = async ({ id }: { id: string }) => {
    if (!user) return;
    // Record usage for this billing period.
    await (supabase as any).from('consumed_ad_slots').insert({
      profile_id: user.id,
      is_premium: false,
      announcement_id: id,
    });
    await loadAnnouncements();
  };

  const handleCloseAnnouncement = async (id: string) => {
    const { error } = await (supabase as any).from('announcements').update({ status: 'closed' }).eq('id', id);
    if (error) {
      toast({ title: "Error", description: "Failed to close the announcement.", variant: "destructive" });
      return;
    }
    await loadAnnouncements();
    toast({ title: "Announcement closed", description: "It no longer appears in Announcements." });
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      // Free the slot for the current billing period.
      await (supabase as any).from('consumed_ad_slots').delete().eq('announcement_id', id);
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


  // Posts functions
  /** Applies one monthly promotion entitlement to an existing post. */
  const handlePromotePost = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await (supabase as any).rpc('promote_post', { p_post_id: id });
      if (error) throw error;
      await loadPosts();
      await loadAnnouncements();
      setPromoteTarget(null);
      toast({ title: "Success", description: t('postPromotion.success', 'Post promoted!') });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      // Free the slot for the current billing period.
      await (supabase as any).from('consumed_ad_slots').delete().eq('announcement_id', id).eq('kind', 'post');
      await loadPosts();
      await loadAnnouncements();
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
  const handleSaveEditItem = async () => {
    if (!editItem) return;
    setIsSaving(true);
    try {
      if (editItem.kind === 'promotion') {
        const { error } = await supabase.from('announcements').update({ description: editItem.text }).eq('id', editItem.id);
        if (error) throw error;
        await loadAnnouncements();
      } else {
        const { error } = await supabase.from('posts').update({ content: editItem.text }).eq('id', editItem.id);
        if (error) throw error;
        await loadPosts();
      }
      toast({ title: "Success", description: t('dashboardPosts.updated', 'Updated!') });
      setEditItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
    if (!isSupportedEmbed(videoUrl)) {
      toast({
        title: "Unsupported link",
        description: "Paste a valid YouTube, SoundCloud, Spotify or Vimeo URL.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from('gallery_items').insert({
        profile_id: user.id,
        type: 'video',
        url: videoUrl.trim()
      });
      if (error) throw error;
      await loadGalleryItems();
      setVideoUrl("");
      setShowGalleryDialog(false);
      toast({
        title: "Success",
        description: "Embed added!"
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
  // Accepting a request now means sending a priced offer. The booking is confirmed (and the
  // calendar marked busy, server-side) when the organizer accepts the offer.
  const handleAcceptBooking = (request: any) => {
    setOfferBooking(request);
    setOfferDialogOpen(true);
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
      const { data, error } = await supabase.functions.invoke('delete-my-account');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Invalidate any local session
      try { await supabase.auth.signOut({ scope: 'global' }); } catch {}
      try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
      try { localStorage.clear(); } catch {}

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
    return <div className="min-h-screen md:ml-[316px] lg:ml-[356px] bg-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
                            </div>
      </div>;
  }
  // Short facts and profile views: a right-hand panel on wide screens, inline otherwise
  const ownImages = galleryItems.filter((g: any) => g.type === 'image');
  const ownSideCards = (
    <>
                          {/* Availability: same card visitors see; a day opens the calendar */}
                          <div className="rounded-lg bg-foreground/[0.05] p-5">
                            <SectionHeaderWithUsage title="Calendar" size="sm" className="mb-4" />
                            <ArtistAvailabilityCalendar
                              large
                              selected={undefined}
                              onSelect={(d) => { if (d) navigate('/calendar'); }}
                              busyDates={calendarEvents.filter((e) => (e.status === 'busy' || e.status === 'booked') && isDayFullyBooked(parseSlotsFromNotes(e.notes))).map((e) => parseYMDToLocalDate(e.event_date))}
                              partialDates={calendarEvents.filter((e) => (e.status === 'busy' || e.status === 'booked') && !isDayFullyBooked(parseSlotsFromNotes(e.notes))).map((e) => parseYMDToLocalDate(e.event_date))}
                              blockedDates={calendarEvents.filter((e) => e.status === 'blocked' || e.status === 'unavailable').map((e) => parseYMDToLocalDate(e.event_date))}
                            />
                            <p className="mt-1 text-xs text-muted-foreground/80">Pick a day to manage it in your calendar.</p>
                          </div>

                          {/* Reviews */}
                          <div className="rounded-lg bg-foreground/[0.05] p-5">
                            <SectionHeaderWithUsage title="Reviews" size="sm" className="mb-2" />
                            {reviews.length > 0 ? (
                              <>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-bold tabular-nums text-foreground">{getAverageRating()}</span>
                                  <span className="flex items-center gap-0.5" aria-hidden="true">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <Star key={n} className={`h-4 w-4 ${n <= Math.round(Number(getAverageRating())) ? "fill-foreground text-foreground" : "text-foreground/30"}`} />
                                    ))}
                                  </span>
                                  <span className="text-sm text-muted-foreground tabular-nums">({reviews.length})</span>
                                </div>
                                {reviews[0]?.comment && (
                                  <blockquote className="mt-3 text-sm text-muted-foreground">
                                    <p className="line-clamp-3 notranslate" translate="no" data-user-content="true">“{reviews[0].comment}”</p>
                                    <footer className="mt-1 text-xs text-foreground/80 notranslate" translate="no">{reviews[0].reviewer_name}</footer>
                                  </blockquote>
                                )}
                                <button type="button" onClick={() => setProfileSection('reviews')} className="mt-3 text-sm font-bold text-foreground hover:underline">
                                  See all reviews
                                </button>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">No reviews yet</p>
                            )}
                          </div>

                          {/* Gallery preview */}
                          {ownImages.length > 0 && (
                            <div className="rounded-lg bg-foreground/[0.05] p-5">
                              <SectionHeaderWithUsage title="Gallery" size="sm" className="mb-3" />
                              <div className="grid grid-cols-2 gap-2">
                                {ownImages.slice(0, 4).map((img: any) => (
                                  <button
                                    key={img.id}
                                    type="button"
                                    onClick={() => setProfileSection('gallery')}
                                    className="aspect-square overflow-hidden rounded-md bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                                    aria-label="Open the gallery"
                                  >
                                    <img src={getThumbUrl(img.thumbnail_url || img.url, 300)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                  </button>
                                ))}
                              </div>
                              <button type="button" onClick={() => setProfileSection('gallery')} className="mt-3 text-sm font-bold text-foreground hover:underline">
                                See the whole gallery
                              </button>
                            </div>
                          )}

                          <div className="space-y-6 rounded-lg bg-foreground/[0.05] p-5">
                        {/* Instrument Section for Instrumentalists */}
                        {formData.specialization?.toLowerCase() === 'instrumentalist' &&
              <>
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
                    <div className="flex flex-col items-start gap-2">
                                    <SectionHeaderWithUsage
                                      icon={<Music2 className="h-5 w-5 text-accent" />}
                                      title="Instrument"
                                      size="sm"
                                    />

                                    <Badge className="rounded-full border-0 bg-foreground/[0.07] text-foreground px-3 py-1 text-sm font-normal cursor-pointer hover:bg-foreground/[0.12] transition-colors group" onClick={() => handleInstrumentsChange("")}>
                                      <InstrumentIcon className="h-4 w-4 mr-1.5" />
                                      {instrumentName}
                                      <X className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Badge>
                                  </div> :

                    <div className="flex flex-col items-start gap-2">
                                    <SectionHeaderWithUsage
                                      icon={<Music2 className="h-5 w-5 text-accent" />}
                                      title="Instrument"
                                      size="sm"
                                    />

                                    <InstrumentSelector
                        instruments={formData.instruments}
                        onInstrumentsChange={handleInstrumentsChange} />

                                  </div>;

                  })()}
                            </div>
                          </>
              }

                        {/* Collaboration status — singers and instrumentalists only */}
                        {hasCollabStatus(formData.specialization) && <>
                            <div className="group">
                              <div className="flex items-center justify-between mb-3">
                                <SectionHeaderWithUsage
                                  icon={<Users className="h-5 w-5 text-accent" />}
                                  title="Collaborations"
                                  size="sm"
                                />
                                {editingField !== 'collabStatus' && <Button size="sm" variant="ghost" aria-label="Edit" className="h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground" onClick={() => startEditing('collabStatus')}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>}
                              </div>
                              {editingField === 'collabStatus' ? <div className="space-y-3">
                                  <div className="flex flex-col gap-2" role="radiogroup" aria-label="Collaborations">
                                    {COLLAB_STATUSES.map((st) => (
                                      <button
                                        key={st}
                                        type="button"
                                        role="radio"
                                        aria-checked={formData.collabStatus === st}
                                        onClick={() => setFormData({ ...formData, collabStatus: formData.collabStatus === st ? "" : st })}
                                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${formData.collabStatus === st ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                                      >
                                        <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${formData.collabStatus === st ? "border-accent" : "border-muted-foreground/50"}`}>
                                          {formData.collabStatus === st && <span className="h-2 w-2 rounded-full bg-accent" />}
                                        </span>
                                        <span>{COLLAB_STATUS_LABEL[st]}</span>
                                      </button>
                                    ))}
                                  </div>
                                  <p className="text-xs text-muted-foreground">Shown on your profile, under your specialization.</p>
                                  <div className="flex justify-end gap-1">
                                    <Button type="button" variant="ghost" onClick={cancelEditing} className={EDIT_CANCEL_BTN}>Cancel</Button>
                                    <Button type="button" onClick={() => saveField('collabStatus')} disabled={isSaving} className={EDIT_SAVE_BTN}>Save</Button>
                                  </div>
                                </div> : isCollabStatus(formData.collabStatus) ? <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${isOpenToCollabs(formData.collabStatus) ? "bg-green-500/15 text-green-500" : "bg-muted text-muted-foreground"}`}>
                                    <span className="h-2 w-2 rounded-full bg-current" />
                                    {COLLAB_STATUS_LABEL[formData.collabStatus]}
                                  </span> : <p className="text-sm text-muted-foreground">Not specified</p>}
                            </div>
                          </>}

                        {/* Number of members — Bands only */}
                        {formData.specialization?.toLowerCase() === 'band' && <>
                            <div className="group">
                              <div className="flex items-center justify-between mb-3">
                                <SectionHeaderWithUsage
                                  icon={<Users className="h-5 w-5 text-accent" />}
                                  title="Members"
                                  size="sm"
                                />

                                {editingField !== 'bandMembers' && <Button size="sm" variant="ghost" aria-label="Edit" className="h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground" onClick={() => startEditing('bandMembers')}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>}
                              </div>
                              {editingField === 'bandMembers' ? <div className="space-y-2">
                                  <Input type="number" min={2} placeholder="e.g. 5" value={formData.bandMembers} onChange={e => setFormData({ ...formData, bandMembers: e.target.value })} className={`h-10 max-w-[160px] ${EDIT_FIELD}`} />
                                  <div className="flex justify-end gap-1">
                                    <Button type="button" variant="ghost" onClick={cancelEditing} className={EDIT_CANCEL_BTN}>Cancel</Button>
                                    <Button type="button" onClick={() => saveField('bandMembers')} disabled={isSaving} className={EDIT_SAVE_BTN}>Save</Button>
                                  </div>
                                </div> : formData.bandMembers ? <Badge className="rounded-full border-0 bg-foreground/[0.07] text-foreground px-3 py-1 text-sm font-normal hover:bg-foreground/[0.07]">
                                    <span className="notranslate" translate="no">{bandMembersLabel(formData.bandMembers, i18n.language || "ro")}</span>
                                  </Badge> : <p className="text-sm text-muted-foreground">Not specified</p>}
                            </div>
                          </>}


                          <div>
                            <SectionHeaderWithUsage title="Contact Information" size="sm" className="mb-2" />
                            <dl className="space-y-2 text-sm">
                              <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                <dt className="sr-only">Email</dt>
                                <dd className="min-w-0 truncate text-foreground">{formData.email}</dd>
                              </div>
                              <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                <dt className="sr-only">Phone</dt>
                                <dd className="min-w-0 truncate text-foreground">{formData.phone || 'Not set'}</dd>
                              </div>
                            </dl>
                          </div>
                          </div>
                          {!calendarOnly && <ProfileViewsCard plan={currentPlan} />}
                            </>
  );
  const showSidePanel = activeTab === "profile" && !calendarOnly && !isAdmin;

  return <div className={`min-h-screen md:ml-[316px] lg:ml-[356px] bg-black md:py-2 md:pr-2 ${showSidePanel ? "md:flex md:items-start md:gap-2" : ""}`}>
      <Navigation 
        mobileTitle={calendarOnly ? undefined : getMobileTitle()} 
        mobileBackPath={calendarOnly ? undefined : getMobileBackPath()}
        // Calendar on phones: title in the header (like the other pages); Statistics takes the bell's place
        hideMobileNotifications={calendarOnly}
        mobileAction={calendarOnly && isPremium(currentPlan) ? (
          <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Statistics" onClick={() => navigate('/analytics')}>
            <BarChart3 className="h-5 w-5" />
          </Button>
        ) : undefined}
        onMobileBack={activeTab === "settings" && settingsSection !== "main" ? () => {
          setSettingsSection("main");
        } : undefined}
      />
      
      <div style={calendarOnly ? { background: "linear-gradient(180deg, rgba(212,175,55,0.16) 0px, #121212 320px)" } : undefined} className={`${PROFILE_PANEL} min-w-0 flex-1 pt-14 ${activeTab === "profile" && !calendarOnly && !isAdmin ? "md:pt-0" : "md:pt-8"} ${activeTab === "settings" ? "pb-[env(safe-area-inset-bottom)] md:pb-8" : "pb-6 md:pb-20"} px-0`}>
        <div className={`container mx-auto ${activeTab === "profile" && !calendarOnly ? "max-w-none md:px-8" : calendarOnly ? "max-w-6xl md:px-8" : "max-w-4xl md:px-0"} ${activeTab === "settings" ? "px-0" : "px-4"}`}>
          {activeTab !== "profile"}
              {/* Profile Tab */}
              {activeTab === "profile" && <div className="space-y-6 md:space-y-8">
                    {/* Hero Header: Cover + overlapping avatar/name/meta — responsive (owner view) */}
                    {!isAdmin && !calendarOnly && (
                      <div className="relative left-1/2 mb-6 w-screen -translate-x-1/2 md:left-0 md:-ml-8 md:mb-8 md:w-[calc(100%+4rem)] md:translate-x-0">
                        <div className="relative w-full aspect-[16/7] md:aspect-auto md:h-[220px] xl:h-[260px] overflow-hidden bg-gradient-to-br from-accent/20 via-card to-secondary group">
                          {/* Spacer to keep name from overlapping top-right action buttons on tablet */}
                          <div className="absolute top-0 right-0 h-12 md:h-14 w-full pointer-events-none" />
                          {profile?.cover_url ? (
                            <img src={profile.cover_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div
                              className="absolute inset-0"
                              style={{ background: getCoverGradient(profile?.cover_theme) }}
                            />

                          )}
                          {/* Smooth premium fade into the page background */}
                          <div
                            className="pointer-events-none absolute inset-x-0 bottom-0 h-full"
                            style={{
                              background:
                                "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.98) 12%, hsl(var(--background) / 0.9) 25%, hsl(var(--background) / 0.7) 42%, hsl(var(--background) / 0.45) 60%, hsl(var(--background) / 0.2) 78%, hsl(var(--background) / 0) 100%)",
                            }}
                          />


                          {/* Cover edit controls (top-right) */}
                          <div className="absolute top-2 right-2 md:top-3 md:right-3 flex gap-2 z-20">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur text-white text-xs font-medium hover:bg-black/80 transition-colors"
                                >
                                  <Palette className="h-3.5 w-3.5" />
                                  Theme
                                </button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-64 p-3 rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Choose a cover theme</p>
                                <div className="grid grid-cols-5 gap-2">
                                  {COVER_THEMES.map((theme) => {
                                    const selected = profile?.cover_theme === theme.id;
                                    return (
                                      <button
                                        key={theme.id}
                                        type="button"
                                        onClick={() => handleSelectCoverTheme(theme.id)}
                                        title={theme.label}
                                        aria-label={theme.label}
                                        className={`relative h-10 w-10 rounded-lg border-2 transition-all ${selected ? 'border-accent ring-2 ring-accent/40' : 'border-border hover:border-accent/60'}`}
                                        style={{ background: theme.gradient }}
                                      >
                                        {selected && (
                                          <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                                {profile?.cover_theme && !profile?.cover_url && (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectCoverTheme('')}
                                    className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    Reset theme
                                  </button>
                                )}
                              </PopoverContent>
                            </Popover>
                            <label htmlFor="cover-upload" className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur text-white text-xs font-medium hover:bg-black/80 transition-colors ${isUploadingCover ? 'opacity-50 pointer-events-none' : ''}`}>
                              <Camera className="h-3.5 w-3.5" />
                              {profile?.cover_url ? 'Change cover' : 'Add cover'}
                            </label>
                            <input id="cover-upload" type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={isUploadingCover} />
                            {profile?.cover_url && (
                              <button
                                type="button"
                                onClick={handleRemoveCover}
                                disabled={isUploadingCover}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/80 backdrop-blur text-destructive-foreground hover:bg-destructive transition-colors"
                                aria-label="Remove cover"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Verified badge — bottom-right corner */}
                          {profile?.is_verified && (
                            <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 z-20 bg-black/60 backdrop-blur rounded-full p-1.5">
                              <VerifiedBadge size="md" />
                            </div>
                          )}

                        </div>

                        {/* Avatar overlapping cover bottom + info below (Facebook-style) */}
                        <div className="px-4 md:px-8 -mt-10 md:-mt-12 lg:-mt-14 xl:-mt-16 flex items-center gap-3 md:gap-4 lg:gap-5 relative z-10">
                          <div className={`relative p-1 rounded-full ${getAvatarOutlineClassesLarge(profile?.plan)} shadow-xl flex-shrink-0 group/avatar`}>
                            <Avatar className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32">
                              <AvatarImage src={profile?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-accent/30 to-accent/10">
                                <User className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 text-accent" />
                              </AvatarFallback>
                            </Avatar>
                            <label htmlFor="avatar-upload" className="absolute inset-1 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                              <Camera className="h-6 w-6 md:h-8 md:w-8 text-white" />
                            </label>
                            <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold tracking-[-0.03em] text-foreground truncate notranslate" data-user-content="true" data-no-translate="true" translate="no">
                              {formData.stageName}
                            </h1>
                            <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground text-sm md:text-sm lg:text-base mt-0.5 md:mt-1 flex-wrap">
                              {formData.specialization && <span className="font-medium">{translateSpecialization(formData.specialization)}</span>}
                              {formData.specialization && formData.county && <span className="opacity-70">•</span>}
                              {formData.county && <span className="truncate">{formData.county}</span>}
                              {formData.country && <CountryFlagIcon country={formData.country} className="h-3.5 w-5 md:h-4 md:w-6 lg:h-5 lg:w-7 rounded-sm shadow-sm flex-shrink-0" />}
                            </div>
                            {hasCollabStatus(formData.specialization) && isCollabStatus(formData.collabStatus) && (
                              <CollabStatusChip status={formData.collabStatus} className="mt-1.5" />
                            )}
                            {/* Owner view: Followers + Following, same visual language as the public profile */}
                            <SocialStats
                              className="mt-1.5 md:mt-2 flex-nowrap"
                              followersCount={followersCount}
                              followingCount={followingCount}
                              onFollowersClick={() => user && navigate(`/connections/${user.id}?tab=followers`)}
                              onFollowingClick={() => user && navigate(`/connections/${user.id}?tab=following`)}
                            />
                          </div>

                        </div>


                        {/* Stats: three quiet columns, same as the public profile */}
                        <dl className="mx-4 md:mx-8 mt-4 md:mt-6 flex gap-8 md:gap-12">
                          <div className="min-w-0">
                            <dd className="truncate text-lg md:text-xl font-bold text-foreground tabular-nums">
                              {acceptedEventsCount > 0 ? `${acceptedEventsCount}+` : <span>None yet</span>}
                            </dd>
                            <dt className="truncate text-xs md:text-sm text-muted-foreground">Events</dt>
                          </div>
                          <div className="min-w-0">
                            <dd className="truncate text-lg md:text-xl font-bold text-foreground">
                              {profile?.created_at
                                ? new Date(profile.created_at).toLocaleDateString(i18n.language || 'en', { month: 'short', year: 'numeric' }).replace('.', '')
                                : '—'}
                            </dd>
                            <dt className="truncate text-xs md:text-sm text-muted-foreground">Member since</dt>
                          </div>
                          <div className="min-w-0">
                            <dd className="truncate text-lg md:text-xl font-bold text-foreground">
                              {formData.careerStartYear
                                ? (() => {
                                    const yrs = Math.max(1, new Date().getFullYear() - Number(formData.careerStartYear));
                                    const isRo = (i18n.language || 'en').split('-')[0] === 'ro';
                                    const unit = isRo
                                      ? (yrs === 1 ? 'an' : yrs < 20 ? 'ani' : 'de ani')
                                      : (yrs === 1 ? 'year' : 'years');
                                    return `${yrs} ${unit}`;
                                  })()
                                : '—'}
                            </dd>
                            <dt className="truncate text-xs md:text-sm text-muted-foreground">Experience</dt>
                          </div>
                        </dl>



                      </div>
                    )}

                    {/* Admin account header — same component as the public admin profile */}
                    {isAdmin && (
                      <OfficialProfileHeader
                        name={formData.stageName}
                        avatarUrl={profile?.avatar_url}
                        coverUrl={profile?.cover_url}
                        coverTheme={profile?.cover_theme}
                        plan={profile?.plan}
                        followersCount={followersCount}
                        followingCount={followingCount}
                        onFollowersClick={() => user && navigate(`/connections/${user.id}?tab=followers`)}
                        onFollowingClick={() => user && navigate(`/connections/${user.id}?tab=following`)}
                        avatarExtra={
                          <>
                            <label htmlFor="avatar-upload-admin" className="absolute inset-1 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer z-10">
                              <Camera className="h-6 w-6 md:h-8 md:w-8 text-white" />
                            </label>
                            <input id="avatar-upload-admin" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                          </>
                        }
                        coverExtra={
                          <div className="absolute top-2 right-2 md:top-3 md:right-3 flex gap-2 z-20">
                            <label htmlFor="cover-upload-admin" className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur text-white text-xs font-medium hover:bg-black/80 transition-colors ${isUploadingCover ? 'opacity-50 pointer-events-none' : ''}`}>
                              <Camera className="h-3.5 w-3.5" />
                              {profile?.cover_url ? 'Change cover' : 'Add cover'}
                            </label>
                            <input id="cover-upload-admin" type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={isUploadingCover} />
                            {profile?.cover_url && (
                              <button
                                type="button"
                                onClick={handleRemoveCover}
                                disabled={isUploadingCover}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/80 backdrop-blur text-destructive-foreground hover:bg-destructive transition-colors"
                                aria-label="Remove cover"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        }
                      />
                    )}





                    {/* Tabs Section */}
                    <Tabs value={profileSection} onValueChange={setProfileSection} className="w-full">
                      {!calendarOnly && <TabsList className="flex w-full justify-start mt-6 mb-5 md:mb-8 h-auto p-0 gap-2 bg-transparent border-0 rounded-none">
                        {!isAdmin && (
                          <TabsTrigger value="details" className="group relative flex h-8 items-center justify-center px-3.5 rounded-full border-0 bg-foreground/[0.07] text-sm font-normal text-foreground transition-colors hover:bg-foreground/[0.12] data-[state=active]:bg-foreground/[0.24] data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none">
                            <span>Details</span>
                          </TabsTrigger>
                        )}
                        <TabsTrigger value="posts" className="group relative flex h-8 items-center justify-center px-3.5 rounded-full border-0 bg-foreground/[0.07] text-sm font-normal text-foreground transition-colors hover:bg-foreground/[0.12] data-[state=active]:bg-foreground/[0.24] data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none">
                          <span>Posts</span>
                        </TabsTrigger>
                        {!isAdmin && (
                          <TabsTrigger value="reviews" className="group relative flex h-8 items-center justify-center px-3.5 rounded-full border-0 bg-foreground/[0.07] text-sm font-normal text-foreground transition-colors hover:bg-foreground/[0.12] data-[state=active]:bg-foreground/[0.24] data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none">
                            <span>Reviews</span>
                          </TabsTrigger>
                        )}
                        {!isAdmin && (
                          <TabsTrigger value="gallery" className="group relative flex h-8 items-center justify-center px-3.5 rounded-full border-0 bg-foreground/[0.07] text-sm font-normal text-foreground transition-colors hover:bg-foreground/[0.12] data-[state=active]:bg-foreground/[0.24] data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none">
                            <span>Gallery</span>
                          </TabsTrigger>
                        )}
                      </TabsList>}

                      {/* Details Tab */}
                      {!isAdmin && <TabsContent value="details">
                        <div className="space-y-10">
                        {/* Bio/Description */}
                        <div className="group">
                          <div className="flex items-center justify-between mb-4">
                            <SectionHeaderWithUsage
                              icon={<User className="h-5 w-5 text-accent" />}
                              title="About"
                            />
                            {editingField !== 'bio' && !!formData.bio?.trim() && <Button size="sm" variant="ghost" aria-label="Edit" className="h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground" onClick={() => startEditing('bio')}>
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
                  }} placeholder="Tell us about yourself, your musical journey, your style..." className={`min-h-[112px] resize-none ${EDIT_FIELD}`} maxLength={200} />
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-xs tabular-nums ${formData.bio.length >= 200 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  {formData.bio.length}/200 characters
                                </span>
                                <div className="flex gap-1">
                                  <Button type="button" variant="ghost" onClick={cancelEditing} className={EDIT_CANCEL_BTN}>Cancel</Button>
                                  <Button type="button" onClick={() => saveField('bio')} disabled={isSaving} className={EDIT_SAVE_BTN}>Save</Button>
                                </div>
                              </div>
                            </div> : <div>
                              {formData.bio ? <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                                  {formData.bio}
                                </p> : <button type="button" onClick={() => startEditing('bio')} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/25 px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground"><Plus className="h-4 w-4" />Add a description</button>}
                            </div>}
                        </div>

                          {/* Music Genres */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-4">
                              <SectionHeaderWithUsage
                                icon={<Music className="h-5 w-5 text-accent" />}
                                title="Music Genres"
                              />

                              {editingField !== 'genres' && !!formData.musicGenres?.trim() && <Button size="sm" variant="ghost" aria-label="Edit" className="h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground" onClick={() => startEditing('genres')}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>}
                            </div>
                            {editingField === 'genres' ? <div className="space-y-3">
                                {/* Selected genres */}
                                <div className="flex flex-wrap gap-2 min-h-[32px]">
                                  {formData.musicGenres?.split(',').filter((g) => g.trim()).map((genre: string) => <Badge key={genre.trim()} variant="default" className={`${GENRE_CHIP} cursor-pointer bg-foreground/[0.24] font-medium hover:bg-foreground/[0.3]`} onClick={() => {
                        const genres = formData.musicGenres.split(',').map((g) => g.trim()).filter((g) => g);
                        const newGenres = genres.filter((g) => g !== genre.trim());
                        setFormData({
                          ...formData,
                          musicGenres: newGenres.join(', ')
                        });
                      }}>
                                      {genreLabel(genre.trim())}
                                      <X className="ml-1.5 h-3.5 w-3.5" />
                                    </Badge>)}
                                </div>
                                
                                {/* Available genres to add */}
                                {(() => {
                      const ALL_GENRES = MUSIC_GENRES;
                      const selectedSet = new Set(formData.musicGenres?.split(',').map((g) => g.trim()).filter((g) => g) || []);
                      const isAtLimit = selectedSet.size >= 5;
                      const availableGenres = ALL_GENRES.filter((genre) => !selectedSet.has(genre));
                      const VISIBLE_COUNT = 12;
                      const visibleGenres = availableGenres.slice(0, VISIBLE_COUNT);
                      const hasMore = availableGenres.length > VISIBLE_COUNT;

                      const genreBadge = (genre: string) =>
                      <Badge key={genre} variant="outline" className={cn(GENRE_CHIP, "bg-foreground/[0.07]", isAtLimit ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-foreground/[0.12]")} onClick={() => {
                        if (isAtLimit) return;
                        const currentGenres = formData.musicGenres?.split(',').map((g) => g.trim()).filter((g) => g) || [];
                        if (!currentGenres.includes(genre)) {
                          setFormData({ ...formData, musicGenres: [...currentGenres, genre].join(', ') });
                        }
                      }}>
                                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                                      {genreLabel(genre)}
                                    </Badge>;


                      return (
                        <div className="space-y-2">
                                      <Label key={isAtLimit ? "limit" : "add"} className="text-sm text-muted-foreground">{isAtLimit ? "You can choose up to 5 genres. Remove one to add another." : "Click to add genres:"}</Label>
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
                                
                                <div className="flex justify-end gap-1 pt-2">
                                  <Button type="button" variant="ghost" onClick={cancelEditing} className={EDIT_CANCEL_BTN}>Cancel</Button>
                                  <Button type="button" onClick={() => saveField('genres')} disabled={isSaving} className={EDIT_SAVE_BTN}>Save</Button>
                                </div>
                              </div> : <div>
                                <div className="flex flex-wrap gap-2">
                                  {formData.musicGenres?.split(',').filter((g) => g.trim()).map((genre: string) => <Badge key={genre.trim()} variant="secondary" className="rounded-full border-0 bg-foreground/[0.07] text-foreground font-normal px-3 py-1 text-sm hover:bg-foreground/[0.07]">
                                      {genreLabel(genre.trim())}
                                    </Badge>)}
                                  {(!formData.musicGenres || !formData.musicGenres.trim()) && <button type="button" onClick={() => startEditing('genres')} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/25 px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground"><Plus className="h-4 w-4" />Add genres</button>}
                                </div>
                              </div>}
                          </div>


                          {/* Estimated Prices */}
                          <div className="group">
                            <div className="flex items-center justify-between mb-3">
                              <SectionHeaderWithUsage
                                title="Estimated Prices"
                                usage={canSetEstimatedPrice(currentPlan) ? `${pricingCount}/${getEstimatedPriceLimit(currentPlan)}` : undefined}
                              />


                            </div>
                            {!canSetEstimatedPrice(currentPlan) ? (
                              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Lock className="h-4 w-4" />
                                <span>Upgrade to Standard or Premium to display pricing</span>
                              </div>
                            ) : (
                              <>
                                <PricingEntriesEditor
                                  key={`pricing-view-${pricingRefreshKey}`}
                                  profileId={user?.id}
                                  country={profile?.country}
                                  editable={false}
                                  maxEntries={getEstimatedPriceLimit(currentPlan)}
                                  onCountChange={setPricingCount}
                                  onAdd={() => { setPricingEditId(null); setPricingDialogOpen(true); }}
                                  onEditEntry={(id) => { setPricingEditId(id); setPricingDialogOpen(true); }}
                                />
                                <Dialog
                                  open={pricingDialogOpen}
                                  onOpenChange={(open) => {
                                    setPricingDialogOpen(open);
                                    if (!open) setPricingRefreshKey((k) => k + 1);
                                  }}
                                >
                                  <DialogContent className="max-w-md rounded-lg">
                                    <DialogTitle className="sr-only">Estimated Prices</DialogTitle>
                                    <PricingEntriesEditor
                                      key={`pricing-edit-${pricingDialogOpen}`}
                                      profileId={user?.id}
                                      country={profile?.country}
                                      editable={true}
                                      maxEntries={getEstimatedPriceLimit(currentPlan)}
                                      initialEditId={pricingEditId}
                                    />
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                          </div>
                        <div className="space-y-4 xl:hidden">{ownSideCards}</div>
                        </div>

                      </TabsContent>}

                      {/* Reviews Tab (was hidden at the bottom of Details) */}
                      {!isAdmin && <TabsContent value="reviews">
                        <SectionHeaderWithUsage title="Reviews" className="mb-4" />
                        {reviews.length > 0 ? <>
                          <ReviewsSummary ratings={reviews.map((r) => r.rating)} average={getAverageRating()} />
                          <div className="grid gap-3 md:grid-cols-2">
                            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                          </div>
                        </> : <div className="py-2">
                          <p className="text-base font-bold text-foreground">No reviews yet</p>
                          <p className="mt-1 text-sm text-muted-foreground">Organizers can review you after a completed booking. Verified reviews help you rank higher.</p>
                        </div>}
                      </TabsContent>}

                      {/* Posts Tab */}
                      <TabsContent value="posts" className="space-y-4">
                        <ContentKindChips
                          value={postsKind}
                          onChange={setPostsKind}
                          options={[
                            { k: "posts" },
                            ...(announcements.some((a) => !a.is_premium && a.kind === "gig") ? [{ k: "gig" as const }] : []),
                            { k: "collab" },
                          ]}
                        />
                        {postsKind === "posts" ? <>
                        {!canCreatePosts && posts.length === 0 && announcements.filter((a) => a.is_premium).length === 0 ? <div className="text-center py-12 border border-dashed border-border rounded-lg">
                            <Lock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-muted-foreground font-medium">Posts are not available on the Free plan</p>
                            <p className="text-sm text-muted-foreground mt-1">Upgrade to Standard or Premium to create posts and promotions</p>
                            <Button onClick={() => navigate('/my-plan')} className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                              Upgrade
                            </Button>
                          </div> : (() => {
                          // Build unified list
                          const promoItems = announcements.filter((a) => a.is_premium).map((a) => ({
                            ...a,
                            __kind: 'promotion' as const,
                            __text: a.description || '',
                            __date: a.created_at,
                            __mediaType: a.media_type || null,
                            __mediaUrl: a.media_url || null,
                          }));
                          const postItems = posts.map((p) => ({
                            ...p,
                            __kind: 'post' as const,
                            __text: p.content || '',
                            __date: p.created_at,
                            __mediaType: p.media_type || null,
                            __mediaUrl: p.media_url || null,
                            __media: (p as any).media ?? null,
                            __availableOn: (p as any).available_on ?? null,
                            __availableFrom: (p as any).available_from ?? null,
                            __availableUntil: (p as any).available_until ?? null,
                          }));
                          const merged = [...postItems, ...promoItems].sort((a, b) =>
                            new Date(b.__date).getTime() - new Date(a.__date).getTime()
                          );
                          return (
                        <SectionShell>
                          <OverLimitBanner kind="posts" used={sharedUsed} limit={STANDARD_POST_LIMIT} resetDate={periodEnd} />

                          <SectionHeaderWithUsage
                            icon={<FileText className="h-5 w-5 text-accent" />}
                            title={t('dashboardPosts.title', 'Posts')}
                            usage={`${sharedUsed}/${sharedLimitLabel}`}
                            info={<QuotaInfoButton kind="posts" />}
                            action={<>
                              <PostsViewSwitcher mode={postsViewMode} onChange={setPostsViewMode} />
                              {canCreatePosts ? (
                                <Button
                                  size="sm"
                                  onClick={() => setShowPostDialog(true)}
                                  className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg shrink-0"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  {t('dashboardPosts.createPost', 'Add')}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate('/my-plan')}
                                  className="rounded-lg shrink-0"
                                >
                                  <Lock className="h-4 w-4 mr-1" />
                                  {t('common.upgrade', 'Upgrade')}
                                </Button>
                              )}
                            </>}
                          />

                          {/* Post list */}
                          {merged.length === 0 ? (
                            <SectionEmptyState
                              icon={<FileText className="h-10 w-10 opacity-50" />}
                              title={t('dashboardPosts.empty', 'No posts yet. Add your first post!')}
                            />
                          ) : postsViewMode === "grid" ? (
                            <>
                              <PostsGrid
                                items={merged.map((item) => ({
                                  id: item.id,
                                  kind: item.__kind,
                                  text: item.__text,
                                  mediaUrl: item.__mediaUrl,
                                  mediaType: item.__mediaType,
                                }))}
                              />
                            </>
                          ) : (
                            <div className="-mx-4 md:mx-0"><div className="w-full max-w-[500px] mx-auto space-y-2 md:space-y-3">
                              {merged.map((item) => {
                                const isPromo = item.__kind === 'promotion';
                                const postPromotedUntil = item.__kind === 'post' ? ((item as any).promoted_until || null) : null;
                                const isPostPromoted = !!postPromotedUntil && new Date(postPromotedUntil).getTime() > Date.now();
                                const expired = isPromo ? isAdExpired(item as any) : false;
                                const daysLeft = isPromo ? getDaysRemaining(item as any) : 0;
                                const expirationLabel = isPromo && !expired
                                  ? `${new Date(getAdExpirationDate(item as any)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                                  : null;
                                return (
                                  <FeedPostCard
                                    key={`${item.__kind}-${item.id}`}
                                    author={{
                                      id: profile?.id,
                                      stageName: profile?.stage_name || 'Artist',
                                      avatarUrl: profile?.avatar_url,
                                      specializationLabel: translateSpecialization(profile?.specialization),
                                      county: profile?.county,
                                      plan: profile?.plan,
                                    }}
                                    content={item.__text}
                                    createdAt={item.__date}
                                    mediaUrl={item.__mediaUrl}
                                    mediaType={item.__mediaType}
                                    media={(item as any).__media}
                                    availableOn={(item as any).__availableOn}
                                    availableFrom={(item as any).__availableFrom}
                                    availableUntil={(item as any).__availableUntil}
                                    isOwner
                                    likes={(item as any).likes || 0}
                                    commentsCount={(item as any).commentsCount || 0}
                                    isLiked={(item as any).isLiked}
                                    promoted={isPostPromoted}
                                    shares={(item as any).shares || 0}
                                    onOpen={() => navigate(postDetailPath(item.id, item.__kind))}
                                    onMediaClick={(it) => it && setMediaPreview(it)}
                                    onLike={() => isPromo ? handleAnnouncementLike(item.id) : (item.id && handlePostLike(item.id))}
                                    onComment={() => setCommentsTarget({ id: item.id, type: isPromo ? 'announcement' : 'post' })}
                                    onShare={() => sharePost({ profileId: profile?.id, stageName: profile?.stage_name || 'Artist', type: isPromo ? 'announcement' : 'post' })}
                                    metaExtra={
                                      isPromo ? (
                                        <>
                                          <span>·</span>
                                          {expired ? (
                                            <span className="text-destructive">{t('dashboardPosts.expired', 'Expired')}</span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 text-accent">
                                              <Megaphone className="h-3 w-3" />
                                              {t('dashboardPosts.promoted', 'Promoted')}
                                              {expirationLabel && <span className="opacity-80">· {expirationLabel}</span>}
                                            </span>
                                          )}
                                        </>
                                      ) : null
                                    }
                                    menu={
                                      <PostActionsMenu
                                        open={activePostMenu === `${item.__kind}-${item.id}`}
                                        onOpenChange={(open) => setActivePostMenu(open ? `${item.__kind}-${item.id}` : null)}
                                        disabled={isSaving}
                                        actions={[
                                          {
                                            key: 'edit',
                                            label: t('dashboardPosts.edit', 'Edit'),
                                            icon: Pencil,
                                            onSelect: () => setEditItem({ id: item.id, kind: isPromo ? 'promotion' : 'post', text: item.__text }),
                                          },
                                          {
                                            key: 'delete',
                                            label: t('dashboardPosts.delete', 'Delete'),
                                            icon: Trash2,
                                            destructive: true,
                                            onSelect: () => isPromo ? setDeleteAnnouncementId(item.id) : setDeletePostId(item.id),
                                          },
                                        ]}
                                      />
                                    }
                                  />

                                );
                              })}
                            </div></div>
                          )}


                          {/* Edit dialog */}
                          <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
                            <DialogContent className="max-w-md rounded-lg">
                              <DialogHeader>
                                <DialogTitle>
                                  {editItem?.kind === 'promotion'
                                    ? t('dashboardPosts.editPromotion', 'Edit Promotion')
                                    : t('dashboardPosts.editPost', 'Edit Post')}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-2">
                                <Textarea
                                  value={editItem?.text || ''}
                                  onChange={(e) => setEditItem(editItem ? { ...editItem, text: e.target.value.slice(0, 200) } : null)}
                                  rows={5}
                                  maxLength={200}
                                  className="rounded-lg"
                                />
                                <p className="text-xs text-muted-foreground text-right">{(editItem?.text || '').length}/200</p>
                                <Button
                                  onClick={handleSaveEditItem}
                                  disabled={isSaving || !(editItem?.text || '').trim()}
                                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg"
                                >
                                  {isSaving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>


                        </SectionShell>

                          );
                        })()}
                        </> : <>
                        {/* Locked state only when creation is blocked AND the owner has no existing announcements at all (promoted ones included). */}
                        {!canCreateAnnouncements && announcements.length === 0 ? <div className="text-center py-12 border border-dashed border-border rounded-lg">

                            <Lock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-muted-foreground font-medium">Collaborations are not available on the Free plan</p>
                            <p className="text-sm text-muted-foreground mt-1">Upgrade to Standard or Premium to look for musicians to play with</p>
                            <Button onClick={() => navigate('/my-plan')} className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                              Upgrade
                            </Button>
                          </div> :
                        <SectionShell>
                          <OverLimitBanner kind="posts" used={sharedUsed} limit={STANDARD_POST_LIMIT} resetDate={periodEnd} />
                          <SectionHeaderWithUsage
                            key={`opp-head-${postsKind}`}
                            icon={postsKind === "gig" ? <CalendarIcon className="h-5 w-5 text-accent" /> : <Users className="h-5 w-5 text-accent" />}
                            title={postsKind === "gig" ? "Events" : "Collaborations"}
                            usage={`${sharedUsed}/${sharedLimitLabel}`}
                            info={<QuotaInfoButton kind="announcements" />}
                            action={
                              !canCreateAnnouncements ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate('/my-plan')}
                                  className="rounded-lg shrink-0"
                                >
                                  <Lock className="h-4 w-4 mr-1" />
                                  {t('common.upgrade', 'Upgrade')}
                                </Button>
                              ) : (
                              <Button
                                size="sm"
                                onClick={() => setShowAnnouncementDialog(true)}
                                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg shrink-0"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                {t('dashboardPosts.createPost', 'Add')}
                              </Button>
                              )
                            }
                          />
                          <OpportunityComposer
                            open={showAnnouncementDialog || !!editOpp}
                            onOpenChange={(o) => {
                              if (o) return;
                              setShowAnnouncementDialog(false);
                              setEditOpp(null);
                            }}
                            isArtist
                            editing={editOpp}
                            onUpdated={() => loadAnnouncements()}
                            blockedReason={sharedUsed >= STANDARD_POST_LIMIT ? "You have used all the posts in your plan for this period." : null}
                            meta={Number.isFinite(STANDARD_POST_LIMIT) ? (
                              <>
                                <span className={sharedRemaining === 0 ? "text-destructive" : "text-accent"}>
                                  <span className="tabular-nums">{sharedRemaining}</span>{" "}
                                  <span>{sharedRemaining === 1 ? "post left" : "posts left"}</span>
                                </span>
                                <QuotaInfoButton kind="announcements" />
                              </>
                            ) : undefined}
                            onPublished={handleOpportunityPublished}
                          />
                          <div id="announcements-list">
                            <OwnerAnnouncementsList
                              announcements={announcements.filter((a) => !a.is_premium && announcementKind(a, "collab") === postsKind)}
                              isArtist
                              listClassName="-mx-4 md:mx-0"
                              disabled={isSaving}
                              onClose={handleCloseAnnouncement}
                              onDelete={(id) => setDeleteAnnouncementId(id)}
                              onEdit={(row, lockCore) => setEditOpp({ row, lockCore })}
                              onChosen={() => loadAnnouncements()}
                              empty={
                                <SectionEmptyState
                                  icon={<Users className="h-10 w-10 opacity-50" />}
                                  title="No collaborations yet"
                                />
                              }
                            />
                          </div>
                        </SectionShell>}
                        </>}
                      </TabsContent>


                      {/* Gallery Tab */}
                      {!isAdmin && <TabsContent value="gallery">
                        <SectionShell>
                          {/* Hidden inputs powering the inline + slots */}
                          <Input id="gallery-upload-inline" type="file" accept="image/*" onChange={handleGalleryImageUpload} className="hidden" />

                          <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('userDashboard.add', 'Add')}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <p className="text-sm text-muted-foreground">
                                  {t('dashboardGallery.videoLinkDescription', 'Paste a YouTube, SoundCloud, Spotify or Vimeo link')}
                                </p>
                                <div className="space-y-3">
                                  <div>
                                    <Label htmlFor="gallery-video-url" className="sr-only">
                                      {t('dashboardGallery.videoUrlLabel', 'Video link')}
                                    </Label>
                                    <Input
                                      id="gallery-video-url"
                                      type="url"
                                      placeholder="https://www.youtube.com/watch?v=…"
                                      value={videoUrl}
                                      onChange={(e) => setVideoUrl(e.target.value)}
                                    />
                                    {videoUrl && !isSupportedEmbed(videoUrl) && (
                                      <p className="text-xs text-destructive mt-1.5">
                                        {t('dashboardGallery.unsupportedLink', 'Unsupported link. Use a YouTube, SoundCloud, Spotify or Vimeo URL.')}
                                      </p>
                                    )}
                                    {videoUrl && isSupportedEmbed(videoUrl) && (
                                      <p className="text-xs text-muted-foreground mt-1.5">
                                        {t('dashboardGallery.detectedProvider', 'Detected: {{provider}}. The clip stays on the artist\'s account — we only embed it.', { provider: providerLabel(getEmbedInfo(videoUrl)!.provider) })}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    onClick={handleAddVideo}
                                    disabled={!videoUrl || !isSupportedEmbed(videoUrl) || isSaving}
                                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                                  >
                                    {isSaving ? t('common.creating', 'Adding…') : t('dashboardGallery.embedLink', 'Embed link')}
                                  </Button>
                                  <p className="text-xs text-muted-foreground text-center">
                                    {t('dashboardGallery.streamedDirectly', 'Streamed directly from the source — no file is uploaded to our servers.')}
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {galleryOverLimit && (
                            <div
                              className="flex items-start gap-3 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-sm"
                              role="alert"
                            >
                              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-medium text-destructive">
                                  Your gallery exceeds your current plan limits
                                </p>
                                <p className="text-muted-foreground">
                                  Items marked with a lock are hidden from your public profile but stay saved.
                                  Move them earlier, delete others or upgrade to show them again.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Photos section */}
                          <SectionHeaderWithUsage
                                                        title={t('dashboardGallery.photos', 'Photos')}
                            usage={`${imagesUsed}/${STANDARD_IMAGE_LIMIT}`}
                          />


                          <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                            {galleryItems.filter((item) => item.type === 'image').map((item, idx, arr) => {
                              const hidden = galleryHiddenIds.has(item.id);
                              return (
                                <div key={item.id} className="relative group">
                                  <div
                                    className="aspect-square rounded-lg overflow-hidden bg-foreground/[0.05] cursor-pointer relative"
                                    onClick={() => setMediaPreview({ url: item.url, type: 'image' })}
                                    title={hidden ? "Hidden from public view because your current subscription does not support this gallery slot. Upgrade your subscription to make this media visible again." : undefined}
                                  >
                                    <img src={item.url} alt="Gallery item" className={`w-full h-full object-cover hover:scale-110 transition-transform duration-300 ${hidden ? 'grayscale' : ''}`} />
                                    {hidden && (
                                      <div className="pointer-events-none absolute inset-0 bg-background/35">
                                        <div className="absolute bottom-2 left-2 rounded-full bg-background/85 p-1.5 shadow-md" aria-label={t('dashboardGallery.inactive', 'Inactive')}>
                                          <Lock className="h-3.5 w-3.5 text-foreground" />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="absolute bottom-2 right-2 flex gap-1">
                                    <Button size="icon" variant="secondary" className="h-7 w-7 shadow-md" aria-label={t('dashboardGallery.moveEarlier', 'Move earlier')} onClick={(e) => { e.stopPropagation(); moveGalleryItem(item.id, 'image', -1); }} disabled={isSaving || idx === 0}>
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="secondary" className="h-7 w-7 shadow-md" aria-label={t('dashboardGallery.moveLater', 'Move later')} onClick={(e) => { e.stopPropagation(); moveGalleryItem(item.id, 'image', 1); }} disabled={isSaving || idx === arr.length - 1}>
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8 shadow-md" onClick={(e) => { e.stopPropagation(); setDeleteGalleryItem({
                                    id: item.id,
                                    url: item.url,
                                    type: item.type
                                  }); }} disabled={isSaving}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })}
                            {imagesUsed < STANDARD_IMAGE_LIMIT && (
                              <button
                                type="button"
                                aria-label={t('dashboardGallery.photos', 'Photos')}
                                onClick={() => document.getElementById('gallery-upload-inline')?.click()}
                                disabled={isSaving}
                                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg bg-foreground/[0.05] text-muted-foreground transition-colors hover:bg-foreground/[0.1] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                              >
                                <Plus className="h-6 w-6" />
                                <span className="px-1 text-center text-xs font-medium leading-tight">Add photo</span>
                              </button>
                            )}
                          </div>


                          {/* Videos section */}
                          <SectionHeaderWithUsage
                                                        title={t('dashboardGallery.videos', 'Videos')}
                            usage={`${videosUsed}/${STANDARD_VIDEO_LIMIT}`}
                          />

                          <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                            {galleryItems.filter((item) => item.type === 'video').map((item, idx, arr) => {
                              const hidden = galleryHiddenIds.has(item.id);
                              const info = getEmbedInfo(item.url);
                              return (
                                <div key={item.id} className="relative group">
                                  <div
                                    className="aspect-square rounded-lg overflow-hidden bg-black/80 flex items-center justify-center cursor-pointer relative"
                                    onClick={() => setMediaPreview({ url: item.url, type: 'video' })}
                                    title={hidden ? "Hidden from public view because your current subscription does not support this gallery slot. Upgrade your subscription to make this media visible again." : info ? providerLabel(info.provider) : undefined}
                                  >
                                    {info?.thumbnail ? (
                                      <img src={info.thumbnail} alt="" className={`absolute inset-0 w-full h-full object-cover ${hidden ? 'grayscale opacity-70' : 'opacity-80'}`} />
                                    ) : null}
                                    <Play className={`relative h-12 w-12 text-white drop-shadow-lg ${hidden ? 'opacity-40' : ''}`} />
                                    {info && info.provider !== 'direct' && (
                                      <span className="absolute bottom-1 left-1 text-[10px] uppercase tracking-wide bg-black/70 text-white px-1.5 py-0.5 rounded">
                                        {providerLabel(info.provider)}
                                      </span>
                                    )}
                                    {hidden && (
                                      <div className="pointer-events-none absolute inset-0 bg-background/35">
                                        <div className="absolute bottom-2 left-2 rounded-full bg-background/85 p-1.5 shadow-md" aria-label={t('dashboardGallery.inactive', 'Inactive')}>
                                          <Lock className="h-3.5 w-3.5 text-foreground" />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="absolute bottom-2 right-2 flex gap-1">
                                    <Button size="icon" variant="secondary" className="h-7 w-7 shadow-md" aria-label={t('dashboardGallery.moveEarlier', 'Move earlier')} onClick={(e) => { e.stopPropagation(); moveGalleryItem(item.id, 'video', -1); }} disabled={isSaving || idx === 0}>
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="secondary" className="h-7 w-7 shadow-md" aria-label={t('dashboardGallery.moveLater', 'Move later')} onClick={(e) => { e.stopPropagation(); moveGalleryItem(item.id, 'video', 1); }} disabled={isSaving || idx === arr.length - 1}>
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8 shadow-md" onClick={(e) => { e.stopPropagation(); setDeleteGalleryItem({
                                    id: item.id,
                                    url: item.url,
                                    type: item.type
                                  }); }} disabled={isSaving}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })}
                            {videosUsed < STANDARD_VIDEO_LIMIT && (
                              <button
                                type="button"
                                aria-label={t('dashboardGallery.videos', 'Videos')}
                                onClick={() => setShowGalleryDialog(true)}
                                disabled={isSaving}
                                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg bg-foreground/[0.05] text-muted-foreground transition-colors hover:bg-foreground/[0.1] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                              >
                                <Plus className="h-6 w-6" />
                                <span className="px-1 text-center text-xs font-medium leading-tight">Add video</span>
                              </button>
                            )}
                          </div>

                        </SectionShell>

                      </TabsContent>}

                      {/* Calendar Tab */}
                      {!isAdmin && <TabsContent value="calendar">
                        <div className={calendarOnly ? "pt-4" : undefined}>
                          <div className={`mb-6 items-center justify-between gap-3 ${calendarOnly ? "hidden md:flex" : "flex"}`}>
                            <h1 className="text-[2rem] font-bold leading-tight tracking-[-0.02em] text-foreground md:text-5xl">Calendar</h1>
                            {isPremium(currentPlan) && (
                              <Button variant="outline" size="sm" onClick={() => navigate('/analytics')} className="h-9 gap-1.5 rounded-full border-foreground/25 bg-transparent px-4 font-bold hover:border-foreground hover:bg-transparent">
                                <BarChart3 className="h-4 w-4" />
                                Statistics
                              </Button>
                            )}
                          </div>
                          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                            <div className="rounded-lg bg-foreground/[0.05] p-4 md:p-6">
                            <ArtistAvailabilityCalendar large selected={selectedDate} onSelect={(date) => {
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
                    }} busyDates={calendarEvents.filter((e) => (e.status === 'busy' || e.status === 'booked') && isDayFullyBooked(parseSlotsFromNotes(e.notes))).map((e) => parseYMDToLocalDate(e.event_date))} partialDates={calendarEvents.filter((e) => (e.status === 'busy' || e.status === 'booked') && !isDayFullyBooked(parseSlotsFromNotes(e.notes))).map((e) => parseYMDToLocalDate(e.event_date))} blockedDates={calendarEvents.filter((e) => e.status === 'blocked' || e.status === 'unavailable').map((e) => parseYMDToLocalDate(e.event_date))} />
                            </div>

                            {/* Date Details Form */}
                            {(() => {
                              const detailsNode = selectedDate ? (() => {
                                const isPastDate = selectedDate < new Date(new Date().setHours(0, 0, 0, 0));
                                const pastEvent = isPastDate ? getEventForDate(selectedDate) : null;
                                
                                if (isPastDate) {
                                  // Read-only view for past dates
                                  return <div>
                                    <h4 className="mb-4 text-2xl font-bold tracking-[-0.01em] text-foreground md:mb-3 md:text-lg">
                                      {capitalizeFirst(selectedDate.toLocaleDateString(i18n.language || 'ro', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      }))}
                                    </h4>
                                    {pastEvent ? (
                                      <div className="space-y-3">
                                        <div>
                                          <Label>Status</Label>
                                          <div className={`mt-1 text-sm font-semibold ${
                                            pastEvent.status === 'busy' || pastEvent.status === 'booked'
                                              ? 'text-destructive'
                                              : pastEvent.status === 'blocked'
                                              ? 'text-muted-foreground'
                                              : 'text-foreground'
                                          }`}>
                                            {pastEvent.status === 'busy' || pastEvent.status === 'booked' ? 'Booked' : pastEvent.status === 'blocked' ? 'Unavailable' : 'Available'}
                                          </div>
                                        </div>
                                        {pastEvent.notes && (
                                          <div>
                                            <Label>Details</Label>
                                            <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                                              {pastEvent.notes}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No events recorded for this date.</p>
                                    )}
                                  </div>;
                                }
                                
                                // Editable view for today and future dates
                                return <div>
                                  <h4 className="mb-4 text-2xl font-bold tracking-[-0.01em] text-foreground md:mb-3 md:text-lg">
                                    {capitalizeFirst(selectedDate.toLocaleDateString(i18n.language || 'ro', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }))}
                                  </h4>
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-sm font-normal text-muted-foreground">Status</Label>
                                      {(() => {
                            const currentEvent = getEventForDate(selectedDate);
                            const isBooked = currentEvent?.status === 'busy' || currentEvent?.status === 'booked';
                            const showAsBooked = isBooked && !userChangedStatus;
                            const chip = (selected: boolean) => `h-10 rounded-full px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${selected ? 'bg-foreground/[0.24] font-medium text-foreground' : 'bg-foreground/[0.07] text-foreground hover:bg-foreground/[0.12]'}`;
                            return <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Status">
                                            {showAsBooked && <span role="radio" aria-checked="true" className="inline-flex h-9 items-center rounded-full bg-destructive/20 px-4 text-sm font-medium text-destructive">Booked</span>}
                                            {(['available', 'blocked'] as const).map((v) => (
                                              <button
                                                key={v}
                                                type="button"
                                                role="radio"
                                                aria-checked={!showAsBooked && eventStatus === v}
                                                onClick={() => {
                                                  setEventStatus(v);
                                                  setUserChangedStatus(true);
                                                  if (isBooked) setEventNotes("");
                                                }}
                                                className={chip(!showAsBooked && eventStatus === v)}
                                              >
                                                {v === 'available' ? 'Available' : 'Unavailable'}
                                              </button>
                                            ))}
                                          </div>;
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
                                          <Label className="text-sm font-normal text-muted-foreground">Notes (optional)</Label>
                                          <Textarea value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} placeholder="Event details..." rows={3} className={`mt-1.5 min-h-[88px] resize-none ${EDIT_FIELD}`} />
                                        </div>;
                        })()}
                                    <div className="flex gap-2">
                                      <Button onClick={handleSaveCalendarEvent} disabled={isSaving} className="h-12 flex-1 rounded-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90">
                                        {isSaving ? "Saving..." : "Save"}
                                      </Button>
                                      {getEventForDate(selectedDate) && <Button variant="outline" onClick={handleDeleteCalendarEvent} disabled={isSaving} aria-label="Delete" className="h-12 w-12 rounded-full border-foreground/25 bg-transparent p-0 hover:border-foreground hover:bg-transparent">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>}
                                    </div>
                                  </div>
                                </div>;
                              })() : null;

                              if (isMobile) {
                                return (
                                  <Drawer shouldScaleBackground={false} open={!!selectedDate} onOpenChange={(open) => {
                                    if (!open) {
                                      setSelectedDate(undefined);
                                      setUserChangedStatus(false);
                                      setEventStatus('available');
                                      setEventNotes("");
                                    }
                                  }}>
                                    <DrawerContent className="px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
                                      <DrawerHeader className="sr-only">
                                        <DrawerTitle>Date details</DrawerTitle>
                                      </DrawerHeader>
                                      {detailsNode}
                                    </DrawerContent>
                                  </Drawer>
                                );
                              }

                              return (
                                <div className="w-full lg:min-w-0">
                                  {detailsNode ? <div className="rounded-lg bg-foreground/[0.05] p-5">{detailsNode}</div> : <div className="rounded-lg bg-foreground/[0.05] p-5">
                                    <p className="text-base font-bold text-foreground">Pick a day</p>
                                    <p className="mt-1 text-sm text-muted-foreground">Mark it available or unavailable, or see the events booked that day.</p>
                                  </div>}
                                </div>
                              );
                            })()}

                          </div>

                          {/* Booking Requests Section */}
                          <div className="mt-10">
                            <div className="flex items-center justify-between mb-4 gap-2">
                              <h3 className="text-xl md:text-2xl font-display font-bold tracking-[-0.01em] flex items-center gap-2">
                                Booking Requests
                                {(() => {
                                  const todayStr = new Date().toISOString().split("T")[0];
                                  const newCount = bookingRequests.filter(
                                    (r) => r.status === "pending" && r.event_date >= todayStr
                                  ).length;
                                  return newCount > 0 ? (
                                    <Badge variant="secondary" className="ml-2 rounded-full bg-foreground/[0.12] text-foreground hover:bg-foreground/[0.12]">
                                      {newCount}
                                    </Badge>
                                  ) : null;
                                })()}
                              </h3>
                              {bookingRequests.length + sentBookingRequests.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-full font-bold text-foreground hover:bg-transparent hover:underline"
                                  onClick={() => navigate("/booking-requests")}
                                >
                                  See all
                                </Button>
                              )}
                            </div>
                            
                            {bookingPreview.length === 0 ? <div className="py-2">
                                <p className="text-base font-bold text-foreground">No booking requests yet</p>
                                <p className="mt-1 text-sm text-muted-foreground">Requests from organizers will show up here.</p>
                              </div> : <div className="space-y-2.5">
                                {bookingPreview.map((request: any) => request.__sent ? (
                                  <BookingRequestCard
                                    key={`sent-${request.id}`}
                                    booking={request}
                                    viewer="requester"
                                    counterpartName={sentArtists[request.profile_id]?.stage_name || "Artist"}
                                    counterpartAvatarUrl={sentArtists[request.profile_id]?.avatar_url}
                                    onClick={() => navigate("/booking-requests?tab=sent")}
                                  />
                                ) : (
                                  <BookingRequestCard
                                    key={request.id}
                                    booking={request}
                                    viewer="artist"
                                    counterpartName={request.requester_name}
                                    counterpartAvatarUrl={requesterAvatars[request.requester_user_id]}
                                    onClick={() => {
                                      setSelectedBookingRequest(request);
                                      setShowBookingDetailDialog(true);
                                    }}
                                    actions={request.status === 'pending' ? (
                                      <>
                                        <Button size="sm" onClick={() => handleAcceptBooking(request)} disabled={isSaving} className="h-9 rounded-full bg-accent px-4 font-bold text-accent-foreground hover:bg-accent/90">
                                          Send offer
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDeclineBooking(request.id)} disabled={isSaving} className="h-9 rounded-full border-foreground/25 bg-transparent px-4 font-bold hover:border-foreground hover:bg-transparent">
                                          Decline
                                        </Button>
                                      </>
                                    ) : undefined}
                                  />
                                ))}
                              </div>}
                          </div>

                          {/* Booking Request Detail Dialog */}
                          <BookingDetailsDialog
                            open={showBookingDetailDialog}
                            onOpenChange={setShowBookingDetailDialog}
                            booking={selectedBookingRequest}
                            viewer="artist"
                            counterpartName={selectedBookingRequest?.requester_name || ""}
                            counterpartAvatarUrl={selectedBookingRequest ? requesterAvatars[selectedBookingRequest.requester_user_id] : null}
                            artistName={profile?.stage_name || 'Artist'}
                            onOffer={() => selectedBookingRequest && handleAcceptBooking(selectedBookingRequest)}
                            onArtistDecline={async (id) => {
                              await handleDeclineBooking(id);
                              const { data } = await supabase.from('booking_requests').select('*').eq('id', id).maybeSingle();
                              if (data) setSelectedBookingRequest(data);
                            }}
                            onDelete={handleDeleteBookingRequest}
                            onChanged={loadBookingRequests}
                          />

                          <BookingOfferDialog
                            open={offerDialogOpen}
                            onOpenChange={setOfferDialogOpen}
                            booking={offerBooking}
                            onSent={() => {
                              setShowBookingDetailDialog(false);
                              loadBookingRequests();
                            }}
                          />
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

      {/* Right panel, same as on the public profile */}
      {showSidePanel && (
        <aside className="sticky top-[72px] hidden h-[calc(100vh-80px)] w-[300px] shrink-0 flex-col gap-2 overflow-y-auto rounded-lg bg-background p-2 [scrollbar-width:thin] xl:flex 2xl:w-[340px]">
          {ownSideCards}
        </aside>
      )}

      {/* Image Cropper Modal */}
      {showCropper && imageSrc && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-foreground mb-4">Crop Profile Picture</h3>
            
            <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden mb-4">
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white/70">…</div>}>
                <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} cropShape="rect" showGrid={true} />
              </Suspense>
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

      {/* Cover Cropper Modal */}
      {showCoverCropper && coverImageSrc && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-6 max-w-3xl w-full">
            <h3 className="text-xl font-bold text-foreground mb-1">Adjust cover photo</h3>
            <p className="text-sm text-muted-foreground mb-4">Drag to reposition and zoom to center your cover image.</p>

            <div className="relative w-full h-[320px] bg-black rounded-lg overflow-hidden mb-4">
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white/70">…</div>}>
                <Cropper
                  image={coverImageSrc}
                  crop={coverCrop}
                  zoom={coverZoom}
                  aspect={16 / 6}
                  onCropChange={setCoverCrop}
                  onZoomChange={setCoverZoom}
                  onCropComplete={(_area: Area, pixels: Area) => setCoverCroppedAreaPixels(pixels)}
                  cropShape="rect"
                  showGrid={true}
                  objectFit="horizontal-cover"
                />
              </Suspense>
            </div>

            <div className="space-y-2 mb-4">
              <Label>Zoom: {coverZoom.toFixed(1)}x</Label>
              <input type="range" min={1} max={3} step={0.1} value={coverZoom} onChange={(e) => setCoverZoom(parseFloat(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent" />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setShowCoverCropper(false);
                setCoverImageSrc(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveCover} disabled={isUploadingCover} className="bg-accent text-accent-foreground">
                {isUploadingCover ? "Saving..." : "Save cover"}
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

      <PostComposerDialog
        open={showPostDialog}
        onOpenChange={setShowPostDialog}
        onPublished={async () => { await loadPosts(); }}
      />
      <InstagramZoomPreview media={mediaPreview} onClose={() => setMediaPreview(null)} />
      <CommentsDialog
        open={!!commentsTarget}
        onOpenChange={(open) => { if (!open) setCommentsTarget(null); }}
        targetType={commentsTarget?.type ?? "post"}
        targetId={commentsTarget?.id ?? null}
        currentUserId={user?.id ?? null}
        isAdmin={isAdmin}
        onCountChange={(count) => {
          if (!commentsTarget) return;
          if (commentsTarget.type === "post") {
            setPosts((prev) => prev.map((p) => p.id === commentsTarget.id ? { ...p, commentsCount: count } : p));
          } else {
            setAnnouncements((prev) => prev.map((a) => a.id === commentsTarget.id ? { ...a, commentsCount: count } : a));
          }
        }}
      />
    </div>;
};
export default Dashboard;
