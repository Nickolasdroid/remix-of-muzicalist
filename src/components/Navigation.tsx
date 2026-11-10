import { useNavigate, useLocation } from "react-router-dom";
import { canGoBackInApp, goBack, isRootPath, parentPathFor } from "@/lib/backNavigation";
import { PrefetchLink as Link } from "@/components/PrefetchLink";
import { preloadForPath } from "@/lib/routePreload";
import { getPlan } from "@/lib/planLimits";
import { Users, Trophy, MapPin, Megaphone, Info, LogIn, Search, Home, User, MessageSquare, Settings, LogOut, Bell, Menu, MoreHorizontal, Globe, Crown, ArrowLeft, HelpCircle, Shield, ChevronRight, CalendarCheck, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLanguage, translateTextsSync } from "@/i18n";
import logo from "@/assets/logo.webp";
import CountrySelector from "./CountrySelector";

/** One row of the mobile side menu: icon + label, optional trailing badge, chevron. */
const MobileMenuRow = ({
  to,
  icon: Icon,
  label,
  active,
  trailing,
  onNavigate,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  first?: boolean;
  trailing?: React.ReactNode;
  onNavigate: () => void;
}) => (
  <Link
    to={to}
    onClick={onNavigate}
    className="flex items-center gap-4 px-5 py-3.5 transition-colors active:bg-foreground/[0.07]"
  >
    <Icon className="h-6 w-6 shrink-0 text-foreground" />
    <span className={`min-w-0 flex-1 truncate text-base ${active ? "font-bold text-foreground" : "font-medium text-foreground"}`}>{label}</span>
    {trailing}
  </Link>
);

interface NavigationProps {
  mobileTitle?: string;
  mobileBackPath?: string | number;
  onMobileBack?: () => void;
  hideMobileHeader?: boolean;
  /** Replaces the right-side mobile header actions (e.g. a page CTA). */
  mobileAction?: React.ReactNode;
  /** Extra mobile header action shown before the notifications bell (e.g. a filter icon). */
  mobileExtraAction?: React.ReactNode;
  /**
   * Hides the mobile notifications bell for signed-in users. Used on artist list pages so
   * the header doesn't pull attention away from the profiles; guests keep login/register.
   */
  hideMobileNotifications?: boolean;
}

/** Reserves body space for the fixed mobile bottom bar while it is rendered. */
const BottomNavSpacer = ({ active }: { active: boolean }) => {
  useEffect(() => {
    if (!active) return;
    document.body.classList.add('has-mobile-bottom-nav');
    return () => document.body.classList.remove('has-mobile-bottom-nav');
  }, [active]);
  return null;
};

const Navigation = ({ mobileTitle, mobileBackPath, onMobileBack, hideMobileHeader, mobileAction, mobileExtraAction, hideMobileNotifications }: NavigationProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const currentLang = getCurrentLanguage();
  const skipAutoTranslate = currentLang === 'ro';
  // The mobile/desktop top bar is marked data-no-translate so the DOM
  // auto-translator never double-translates the labels it already renders via
  // t(). But mobileTitle is frequently passed in as a hardcoded English string
  // by the page components, so it would otherwise stay English while the rest
  // of the page is localized. Run it through the same synchronous dictionary
  // (static RO + overrides + AI cache) used everywhere else, falling back to
  // the original text when there's no translation (e.g. it's already localized
  // or is a proper noun like a country/category name).
  const localizedMobileTitle = (() => {
    if (!mobileTitle) return mobileTitle;
    if (currentLang === 'en') return mobileTitle;
    const translated = translateTextsSync(currentLang, [mobileTitle])[mobileTitle.trim()];
    return translated || mobileTitle;
  })();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(() => {
    // Seed from cache so a remount (Navigation is mounted per-page) doesn't
    // start from null and flash the sidebar without cached-dependent items.
    try {
      const cached = sessionStorage.getItem('nav_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [userType, setUserType] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('nav_user_type') || null;
    } catch {
      return null;
    }
  });
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [unreadCount, setUnreadCount] = useState(0);
  // Bookings waiting for me: new requests (artist) or offers to accept (organizer)
  const [bookingActionCount, setBookingActionCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navQuery, setNavQuery] = useState(() =>
    typeof window !== 'undefined' && window.location.pathname === '/search' ? new URLSearchParams(window.location.search).get('q') || '' : '',
  );
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const notificationSeenKey = user ? `muzicalist-notifications-seen:${user.id}` : null;

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

  // Track the currently loaded user id so we only refetch profile/role when the
  // user actually changes (login/logout) — NOT on every auth event such as
  // TOKEN_REFRESHED, which fires on navigation and caused the "My Plan" flash.
  const loadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadUserData = async (sessionUser: any) => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url, stage_name, first_name, last_name, plan, country')
        .eq('id', sessionUser.id)
        .single();
      setProfile(profileData);
      try {
        sessionStorage.setItem('nav_profile', JSON.stringify(profileData ?? null));
      } catch {}

      if (profileData?.country) {
        setSelectedCountry(profileData.country);
      }

      // Fetch user type
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('user_type')
        .eq('user_id', sessionUser.id)
        .maybeSingle();
      const resolvedType = roleData?.user_type || null;
      setUserType(resolvedType);
      try {
        if (resolvedType) sessionStorage.setItem('nav_user_type', resolvedType);
        else sessionStorage.removeItem('nav_user_type');
      } catch {}
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        loadedUserIdRef.current = session.user.id;
        // Refresh in background; cached state already seeded the UI so there's
        // no flash on this remount.
        await loadUserData(session.user);
      } else {
        try {
          sessionStorage.removeItem('nav_profile');
          sessionStorage.removeItem('nav_user_type');
        } catch {}
        setProfile(null);
        setUserType(null);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Only refetch when the user id actually changed. Token refreshes and
        // other auth events on navigation keep the same id and must not reset
        // profile/userType (which caused the sidebar items to flash).
        if (loadedUserIdRef.current !== session.user.id) {
          loadedUserIdRef.current = session.user.id;
          loadUserData(session.user);
        }
      } else {
        loadedUserIdRef.current = null;
        try {
          sessionStorage.removeItem('nav_profile');
          sessionStorage.removeItem('nav_user_type');
        } catch {}
        setProfile(null);
        setUserType(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch count of conversations with unread messages
  useEffect(() => {
    const fetchUnreadConversationsCount = async () => {
      if (!user) {
        setUnreadCount(0);
        return;
      }

      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`artist_id.eq.${user.id},participant_id.eq.${user.id}`);

      if (!conversations || conversations.length === 0) {
        setUnreadCount(0);
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .is('read_at', null);

      const uniqueConversations = new Set((unreadMessages || []).map(m => m.conversation_id));
      setUnreadCount(uniqueConversations.size);
    };

    fetchUnreadConversationsCount();

    const channel = supabase
      .channel('nav-unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUnreadConversationsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch count of unread notifications
  useEffect(() => {
    const fetchUnreadNotificationsCount = async () => {
      if (!user) {
        setUnreadNotifications(0);
        return;
      }

      // Opening the page marks every notification as read (Notifications.tsx),
      // so the badge clears here and stays clear on the next visit.
      if (location.pathname === '/notifications') {
        localStorage.setItem(`muzicalist-notifications-seen:${user.id}`, new Date().toISOString());
        setUnreadNotifications(0);
        return;
      }

      const lastSeenAt = localStorage.getItem(`muzicalist-notifications-seen:${user.id}`);

      let query = supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (lastSeenAt) query = query.gt('created_at', lastSeenAt);

      const { count } = await query;

      setUnreadNotifications(count || 0);
    };

    fetchUnreadNotificationsCount();

    const channel = supabase
      .channel('nav-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          fetchUnreadNotificationsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, location.pathname]);

  // Clear only the navigation badge when visiting the notifications page.
  useEffect(() => {
    if (!user || location.pathname !== '/notifications') return;
    if (notificationSeenKey) {
      localStorage.setItem(notificationSeenKey, new Date().toISOString());
    }
    setUnreadNotifications(0);
  }, [location.pathname, notificationSeenKey, user]);

  useEffect(() => {
    if (!user) {
      setBookingActionCount(0);
      return;
    }
    let active = true;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [received, offers] = await Promise.all([
        userType === 'user'
          ? Promise.resolve({ count: 0 })
          : supabase.from('booking_requests').select('id', { count: 'exact', head: true }).eq('profile_id', user.id).eq('status', 'pending').gte('event_date', today),
        supabase.from('booking_requests').select('id', { count: 'exact', head: true }).eq('requester_user_id', user.id).neq('profile_id', user.id).eq('status', 'offered').gte('event_date', today),
      ]);
      if (active) setBookingActionCount(((received as { count?: number | null }).count || 0) + ((offers as { count?: number | null }).count || 0));
    })();
    return () => {
      active = false;
    };
  }, [user, userType, location.pathname]);

  // Determine dashboard path based on user type
  const dashboardPath = userType === 'user' ? '/user-dashboard' : '/dashboard';
  
  const sidebarLinks = [
    { to: '/feed', icon: Home, label: t('navigation.home') },
    // Search second, like the bottom bar (the calendar sits after Regions)
    { to: '/search', icon: Search, label: t('common.search') },
    { to: '/categories', icon: Users, label: t('navigation.categories') },
    { to: '/leaderboard', icon: Trophy, label: t('navigation.leaderboard') },
    { to: '/countries', icon: Globe, label: t('navigation.countries', 'Countries') },
    { to: '/counties', icon: MapPin, label: t('navigation.regions', 'Regions') },
  ];

  // User-specific sidebar links (only shown when logged in)
  // For regular users, show different links than for artists
  const userSidebarLinks = userType === 'user' 
    ? [
        { to: '/notifications', icon: Bell, label: t('navigation.notifications'), badge: unreadNotifications },
        { to: '/messages', icon: MessageSquare, label: t('navigation.messages'), badge: unreadCount },
        { to: '/user-dashboard', icon: User, label: t('navigation.profile') },
      ]
    : [
        { to: '/notifications', icon: Bell, label: t('navigation.notifications'), badge: unreadNotifications },
        { to: '/messages', icon: MessageSquare, label: t('navigation.messages'), badge: unreadCount },
        ...(userType === 'artist' ? [{ to: '/my-plan', icon: Crown, label: t('navigation.myPlan', 'My Plan') }] : []),
        { to: '/dashboard?tab=profile', icon: User, label: t('navigation.profile') },
      ];

  // Mobile bottom nav items (left to right: Feed - Announcements - Messages - Profile)
  const mobileBottomNav = [
    { to: '/feed', icon: Home, label: t('navigation.home'), showBadge: false },
    { to: '/search', icon: Search, label: t('common.search'), showBadge: false },
    { to: user ? '/messages' : '/login', icon: MessageSquare, label: t('navigation.messages'), showBadge: true },
    // Artists: their calendar; organizers: their bookings. Badge = items waiting for an answer
    userType === 'user'
      ? { to: user ? '/booking-requests' : '/login', icon: CalendarCheck, label: t('navigation.bookings', 'Bookings'), showBadge: false, badgeCount: bookingActionCount }
      : { to: user ? '/calendar' : '/login', icon: CalendarCheck, label: t('navigation.calendar', 'Calendar'), showBadge: false, badgeCount: bookingActionCount },
    { to: user ? (userType === 'user' ? '/user-dashboard' : '/dashboard?tab=profile') : '/login', icon: User, label: t('navigation.profile'), showBadge: false },
  ];

  // Back arrow: pages with their own title, and every page that isn't a main
  // destination (bottom bar / menu). It goes to the previous page inside the
  // app; opened from a link, it goes to the logical parent instead of leaving.
  const showMobileBack = !!mobileTitle || !!onMobileBack || (!isRootPath(location.pathname) && (!!user || canGoBackInApp()));
  const handleMobileBack = () => {
    if (onMobileBack) return onMobileBack();
    const fallback = typeof mobileBackPath === 'string' ? mobileBackPath : parentPathFor(location.pathname, !!user);
    goBack(navigate, fallback);
  };

  // Signed-in pages sit under the fixed desktop top bar
  useEffect(() => {
    document.body.classList.toggle('has-app-topbar', !!user);
    const guestTabs = !user && !['/login', '/register', '/reset-password', '/welcome'].includes(location.pathname);
    document.body.classList.toggle('has-guest-tabbar', guestTabs);
    return () => {
      document.body.classList.remove('has-app-topbar');
      document.body.classList.remove('has-guest-tabbar');
    };
  }, [user, location.pathname]);

  const showBottomNav = !!user && !((location.pathname === '/dashboard' || location.pathname === '/user-dashboard') && location.search.includes('tab=settings'));

  return (
    <>
      {/* Desktop: top bar with home, search and account, signed in or not (like Spotify) */}
      {(
      <nav data-no-translate={skipAutoTranslate ? true : undefined} className="fixed top-0 left-0 right-0 h-16 z-50 bg-black hidden md:flex items-center justify-between gap-2 px-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link to={user ? "/feed" : "/"} className="mr-2 flex shrink-0 items-center gap-2" aria-label="Muzicalist">
            <img src={logo} alt="" className="h-9 w-9 object-contain" />
            <span className="hidden font-bold text-lg text-foreground uppercase xl:inline" style={{ fontFamily: "Montserrat, 'Montserrat Fallback', sans-serif", letterSpacing: "-0.02em" }}>Muzicalist</span>
          </Link>
          <Link
            to={user ? "/feed" : "/"}
            aria-label={t('navigation.home')}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1f1f1f] transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${location.pathname === '/' || location.pathname === '/feed' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Home className="h-6 w-6" fill={location.pathname === '/' || location.pathname === '/feed' ? 'currentColor' : 'none'} />
          </Link>
          {/* Search: artists by name, type or place (opens the full list filtered) */}
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = String(new FormData(e.currentTarget).get('q') || '').trim();
              navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
            }}
            className="group relative w-full max-w-[460px]"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground" />
            <input
              name="q"
              type="search"
              value={navQuery}
              onChange={(e) => {
                setNavQuery(e.target.value);
                // On the search page the results follow what you type
                if (location.pathname === '/search') {
                  const v = e.target.value.trim();
                  navigate(v ? `/search?q=${encodeURIComponent(v)}` : '/search', { replace: true });
                }
              }}
              placeholder={t('navigation.searchArtists', 'Which artist are you looking for?')}
              className="h-12 w-full rounded-full border-0 bg-[#1f1f1f] pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground transition-colors hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            />
          </form>
        </div>

        {user ? (
          <Link
            to={userType === 'user' ? '/user-dashboard' : (userType as string) === 'admin' ? '/admin/dashboard' : '/dashboard'}
            aria-label={t('navigation.profile', 'Profile')}
            className="ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1f1f1f] transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || undefined} alt="" className="object-cover" />
              <AvatarFallback className="bg-foreground/10 text-sm font-semibold text-foreground">
                {(profile?.stage_name || profile?.first_name || 'M').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
        <>
        <div className="ml-4 hidden shrink-0 items-center gap-5 lg:flex">
          {[
            { to: '/plans', label: t('navigation.plans', 'Plans') },
            { to: '/help', label: t('navigation.help', 'Help') },
            { to: '/about', label: t('navigation.about', 'About') },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="text-base font-bold text-muted-foreground transition-all hover:scale-[1.04] hover:text-foreground">
              {l.label}
            </Link>
          ))}
          <span className="mx-2 h-7 w-px bg-foreground/80" aria-hidden="true" />
        </div>

        <div className="flex shrink-0 items-center gap-2" aria-label={t('navigation.authActions', 'Authentication')}>
          <Link to="/register" className="rounded-full px-4 py-2.5 text-base font-bold text-muted-foreground transition-all hover:scale-[1.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
            {t('navigation.registerDesktop')}
          </Link>
          <Link to="/login" className="rounded-full bg-white px-8 py-3 text-base font-bold text-black transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
            {t('navigation.loginDesktop')}
          </Link>
        </div>
        </>
        )}
      </nav>
      )}

      {/* Mobile: Top Header Bar */}
      <nav data-no-translate={skipAutoTranslate ? true : undefined} className={`fixed top-0 left-0 right-0 z-50 md:hidden ${user ? 'bg-background' : 'bg-black'} ${hideMobileHeader ? 'hidden' : ''}`}>
        <div className={`flex items-center justify-between h-14 ${user ? 'px-4' : 'gap-2 px-2 min-[375px]:px-4'}`}>
          {/* Left: Back button (when mobileTitle provided) or Menu Button (logged in) or Logo (logged out) */}
          {showMobileBack ? (
            <button
              className="-ml-1 p-2 text-foreground/80 hover:text-accent transition-colors"
              aria-label={t('common.back', 'Back')}
              onClick={handleMobileBack}
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          ) : user ? (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 text-foreground/80 hover:text-accent transition-colors">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm border-0 bg-[#121212] p-0 flex flex-col !duration-150 data-[state=open]:!duration-150 data-[state=closed]:!duration-150">
              {/* Who's signed in, like Spotify: photo, name, a link to the profile */}
              <Link
                to={userType === 'user' ? '/user-dashboard' : (userType as string) === 'admin' ? '/admin/dashboard' : '/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-5 pb-5 pt-6"
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} alt="" className="object-cover" />
                  <AvatarFallback className="bg-foreground/10 text-foreground font-semibold">
                    {(profile?.stage_name || profile?.first_name || 'M').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate text-lg font-bold text-foreground notranslate" translate="no">
                    {profile?.stage_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Muzicalist'}
                  </span>
                  <span className="block text-sm text-muted-foreground">{t('navigation.viewProfile', 'View profile')}</span>
                </span>
              </Link>
              <div className="mx-5 h-px bg-foreground/10" aria-hidden="true" />

              <nav className="flex-1 overflow-y-auto flex flex-col py-2">
                {sidebarLinks.filter(link => link.to !== '/feed' && link.to !== '/search').map((link) => (
                  <MobileMenuRow
                    key={link.to}
                    to={link.to}
                    icon={link.icon}
                    label={link.label}
                    active={isActive(link.to.split('?')[0])}
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                ))}

                <div className="mx-5 my-2 h-px bg-foreground/10" aria-hidden="true" />

                {user && userType === 'artist' && (
                  <MobileMenuRow
                    to="/my-plan"
                    icon={Crown}
                    label={t('navigation.myPlan', 'My Plan')}
                    active={isActive('/my-plan')}
                    onNavigate={() => setMobileMenuOpen(false)}
                    trailing={(() => {
                      const plan = getPlan(profile?.plan);
                      return plan === 'Free' ? (
                        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                          {t('navigation.upgrade', 'Upgrade')}
                        </span>
                      ) : (
                        <span className="notranslate text-sm text-muted-foreground" translate="no">{plan}</span>
                      );
                    })()}
                  />
                )}

                {user && (userType as string) === 'admin' && (
                  <MobileMenuRow
                    to="/admin/dashboard"
                    icon={Shield}
                    label={t('navigation.adminDashboard', 'Admin Dashboard')}
                    active={isActive('/admin/dashboard')}
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                )}

                {user && (
                  <MobileMenuRow
                    to={userType === 'user' ? "/user-dashboard?tab=settings" : "/dashboard?tab=settings"}
                    icon={Settings}
                    label={t('navigation.settings')}
                    active={location.search.includes('tab=settings')}
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                )}

                <MobileMenuRow
                  to="/help"
                  icon={HelpCircle}
                  label={t('navigation.helpSupport', 'Help & Support')}
                  active={isActive('/help')}
                  onNavigate={() => setMobileMenuOpen(false)}
                />

                <div className="mt-auto pb-2 pt-6 safe-area-bottom">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setLogoutConfirmOpen(true);
                    }}
                    className="flex w-full items-center gap-4 px-5 py-3.5 text-muted-foreground transition-colors active:bg-foreground/[0.07]"
                  >
                    <LogOut className="h-6 w-6" />
                    <span className="text-base font-medium">{t('navigation.logout')}</span>
                  </button>
                </div>
              </nav>

            </SheetContent>
          </Sheet>
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Muzicalist — The Global Stage for Musical Artists" className="h-8 w-8 object-contain" />
              <span className="font-bold text-foreground uppercase" style={{ fontFamily: "Montserrat, 'Montserrat Fallback', sans-serif", letterSpacing: "-0.02em" }}>Muzicalist</span>
            </Link>
          )}

          {/* Center: Custom mobile title or page title (logged in) or nothing */}
          {mobileTitle ? (
            <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-7.5rem)] truncate text-center font-display font-bold text-foreground text-lg">{localizedMobileTitle}</span>
          ) : user ? (
            <>
              {(location.pathname === '/dashboard' || location.pathname === '/user-dashboard') && location.search.includes('tab=settings') ? (
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-7.5rem)] truncate text-center font-display font-bold text-foreground text-lg">{t('navigation.settings')}</span>
              ) : location.pathname === '/leaderboard' ? (
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-7.5rem)] truncate text-center font-display font-bold text-foreground text-lg">{t('navigation.leaderboard')}</span>
              ) : location.pathname === '/countries' ? (
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-7.5rem)] truncate text-center font-display font-bold text-foreground text-lg">{t('navigation.countries', 'Countries')}</span>
              ) : location.pathname === '/counties' ? (
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-7.5rem)] truncate text-center font-display font-bold text-foreground text-lg">{t('navigation.regions', 'Regions')}</span>
              ) : location.pathname === '/categories' ? (
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-7.5rem)] truncate text-center font-display font-bold text-foreground text-lg">{t('navigation.categories')}</span>
              ) : location.pathname === '/calendar' ? (
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-7.5rem)] truncate text-center font-display font-bold text-foreground text-lg">{t('navigation.calendar', 'Calendar')}</span>
              ) : location.pathname === '/notifications' ? (
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-7.5rem)] truncate text-center font-display font-bold text-foreground text-lg">{t('navigation.notifications')}</span>
              ) : (
                <Link to="/feed" className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2">
                  <img src={logo} alt="Muzicalist — The Global Stage for Musical Artists" className="h-8 w-8 object-contain" />
                  <span className="font-bold text-foreground uppercase" style={{ fontFamily: "Montserrat, 'Montserrat Fallback', sans-serif", letterSpacing: "-0.02em" }}>Muzicalist</span>
                </Link>
              )}
            </>
          ) : showMobileBack ? (
            <Link to="/" className="ml-1 flex items-center" aria-label="Muzicalist">
              <img src={logo} alt="Muzicalist" className="h-8 w-8 object-contain" />
            </Link>
          ) : null}

          {/* Right: Auth buttons (logged out) or Notifications (logged in) */}
          <div className="ml-auto flex shrink-0 items-center gap-1" aria-label={!user && !mobileAction ? t('navigation.authActions', 'Authentication') : undefined}>
            {!mobileAction && mobileExtraAction}
            {mobileAction ? mobileAction : user && hideMobileNotifications ? null : user ? (
              <button
                onClick={() => navigate('/notifications')}
                onMouseEnter={() => preloadForPath('/notifications')}
                onFocus={() => preloadForPath('/notifications')}
                className="p-2 text-foreground/80 hover:text-accent transition-colors relative"
              >
                <Bell className="h-6 w-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
            ) : (
              <>
                <Link to="/register" className="rounded-full px-2.5 py-2 text-sm font-bold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                  {t('navigation.registerMobile')}
                </Link>
                <Link to="/login" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                  {t('navigation.loginMobile')}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile: Bottom Navigation Bar (only for logged-in users, hidden on settings) */}
      <BottomNavSpacer active={showBottomNav} />
      {showBottomNav && (
        <nav data-no-translate={skipAutoTranslate ? true : undefined} className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur md:hidden safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-1">
            {mobileBottomNav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors relative ${
                  (isActive(item.to.split('?')[0]) || (item.to === '/feed' && location.pathname === '/' && user))
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <item.icon className="h-6 w-6" />
                  {item.showBadge && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {!item.showBadge && (item as { badgeCount?: number }).badgeCount ? (
                    <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full">
                      {((item as { badgeCount?: number }).badgeCount ?? 0) > 9 ? '9+' : (item as { badgeCount?: number }).badgeCount}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Phone, not signed in: Home, Search, Log in at the bottom (like Spotify) */}
      {!user && !['/login', '/register', '/reset-password', '/welcome'].includes(location.pathname) && (
        <nav data-no-translate={skipAutoTranslate ? true : undefined} className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur md:hidden safe-area-bottom">
          <div className="flex h-16 items-center justify-around px-1">
            {[
              { to: '/', icon: Home, label: t('navigation.home') },
              { to: '/search', icon: Search, label: t('common.search') },
              { to: '/login', icon: User, label: t('navigation.loginDesktop') },
            ].map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  <item.icon className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Desktop: Left Sidebar - Only when logged in */}
      {!user ? null : (
      <aside data-no-translate={skipAutoTranslate ? true : undefined} className="fixed top-16 left-0 h-[calc(100vh-64px)] w-[316px] lg:w-[356px] bg-black z-40 hidden md:flex md:flex-col gap-2 p-2 pt-0">
        {/* Panel 1: logo and browsing (like Spotify's Home / Search box) */}
        <div className="rounded-lg bg-background px-3 py-2">
          {sidebarLinks.map((link) => {
            const active = isActive(link.to.split('?')[0]);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex h-10 items-center gap-4 rounded-md px-2 text-[15px] font-bold transition-colors ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <link.icon className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Panel 2: your things (like Spotify's library) */}
        <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-background px-3 py-3">
          <div className="mb-1 flex items-center justify-between gap-2 px-2">
            <p className="text-[15px] font-bold text-foreground">{t('navigation.yourSpace', 'Your space')}</p>
            {/* Create: posts, stories, collaborations (artists) or a new event (organizers) */}
            <button
              type="button"
              onClick={() => navigate(userType === 'user' ? '/user-dashboard?new=announcement' : '/feed?create=1')}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground/[0.07] px-3 text-sm font-bold text-foreground transition-colors hover:bg-foreground/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Plus className="h-4 w-4" />
              {t('navigation.create', 'Create')}
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {[
              {
                to: userType === 'user' ? '/booking-requests' : '/calendar',
                icon: CalendarCheck,
                label: userType === 'user' ? t('navigation.bookings', 'Bookings') : t('navigation.calendar', 'Calendar'),
                badge: bookingActionCount,
              },
              ...userSidebarLinks,
            ].map((link) => {
              const active = isActive(link.to.split('?')[0]) || (link.to.includes('?') && location.search.includes(link.to.split('?')[1]));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex h-12 items-center justify-between gap-3 rounded-md px-2 transition-colors hover:bg-foreground/[0.07] ${active ? 'bg-foreground/[0.1] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${active ? 'bg-foreground/[0.14] text-foreground' : 'bg-[#282828] text-foreground/80'}`}>
                      <link.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="truncate text-[15px] font-medium text-foreground">{link.label}</span>
                  </span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                      {link.badge > 9 ? '9+' : link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* More Button at bottom */}
          <div className="pt-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex h-10 items-center gap-4 rounded-md px-2 text-[15px] font-bold transition-colors text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-5 w-5" />
                <span className="font-medium">{t('navigation.more')}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-[calc(316px-2rem)] lg:w-[calc(356px-2rem)] p-2 z-50">
              <div className="space-y-1">
                {user && (
                  <Link
                    to={userType === 'user' ? "/user-dashboard?tab=settings" : "/dashboard?tab=settings"}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      location.search.includes('tab=settings')
                        ? 'text-foreground font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">{t('navigation.settings')}</span>
                  </Link>
                )}
                {user && (userType as string) === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive('/admin/dashboard')
                        ? 'text-foreground font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">{t('navigation.adminDashboard', 'Admin Dashboard')}</span>
                  </Link>
                )}

                
                {user && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={() => setLogoutConfirmOpen(true)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">{t('navigation.logout')}</span>
                    </button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        </div>
      </aside>
      )}

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent data-no-translate={skipAutoTranslate ? true : undefined} className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('navigation.logOutQuestion', 'Log out?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('navigation.logOutDescription', 'Are you sure you want to log out of your account?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('navigation.logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
};

export default Navigation;
