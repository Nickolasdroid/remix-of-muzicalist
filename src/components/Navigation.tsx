import { Link, useNavigate, useLocation } from "react-router-dom";
import { Users, Trophy, MapPin, Megaphone, Info, LogIn, Search, Home, User, MessageSquare, Settings, LogOut, Bell, Menu, MoreHorizontal, Globe, Crown, ArrowLeft, HelpCircle, Shield, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import CountrySelector from "./CountrySelector";

interface NavigationProps {
  mobileTitle?: string;
  mobileBackPath?: string | number;
  onMobileBack?: () => void;
  hideMobileHeader?: boolean;
}

const Navigation = ({ mobileTitle, mobileBackPath, onMobileBack, hideMobileHeader }: NavigationProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

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

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url, stage_name, plan, country')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
        
        if (profileData?.country) {
          setSelectedCountry(profileData.country);
        }
        
        // Fetch user type
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .maybeSingle();
        setUserType(roleData?.user_type || null);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('profiles')
          .select('avatar_url, stage_name, plan, country')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setProfile(data);
            if (data?.country) {
              setSelectedCountry(data.country);
            }
          });
        
        // Fetch user type
        supabase
          .from('user_roles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            setUserType(data?.user_type || null);
          });
      } else {
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

      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

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
  }, [user]);

  // Determine dashboard path based on user type
  const dashboardPath = userType === 'user' ? '/user-dashboard' : '/dashboard';
  
  const sidebarLinks = [
    { to: '/feed', icon: Home, label: 'Home' },
    { to: '/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/categories', icon: Users, label: 'Categories' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/countries', icon: Globe, label: 'Countries' },
    { to: '/counties', icon: MapPin, label: 'Regions' },
  ];

  // User-specific sidebar links (only shown when logged in)
  // For regular users, show different links than for artists
  const userSidebarLinks = userType === 'user' 
    ? [
        { to: '/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifications },
        { to: '/messages', icon: MessageSquare, label: 'Messages', badge: unreadCount },
        { to: '/user-dashboard', icon: User, label: 'Profile' },
      ]
    : [
        { to: '/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifications },
        { to: '/messages', icon: MessageSquare, label: 'Messages', badge: unreadCount },
        ...(userType === 'admin' ? [] : [{ to: '/my-plan', icon: Crown, label: 'My Plan' }]),
        { to: '/dashboard?tab=profile', icon: User, label: 'Profile' },
      ];

  // Mobile bottom nav items (left to right: Feed - Announcements - Messages - Profile)
  const mobileBottomNav = [
    { to: '/feed', icon: Home, label: 'Home', showBadge: false },
    { to: '/announcements', icon: Megaphone, label: 'Announcements', showBadge: false },
    { to: user ? '/messages' : '/login', icon: MessageSquare, label: 'Messages', showBadge: true },
    { to: '/search', icon: Search, label: 'Search', showBadge: false },
    { to: user ? (userType === 'user' ? '/user-dashboard' : '/dashboard?tab=profile') : '/login', icon: User, label: 'Profile', showBadge: false },
  ];

  return (
    <>
      {/* Desktop: Top Header Bar - Only when NOT logged in */}
      {!user && (
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 bg-background border-b border-border hidden md:flex items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Muzicalist" className="h-9 w-9 object-contain" />
            <span className="font-display font-bold text-lg text-foreground">Muzicalist</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-[var(--shadow-gold)]">
              Register
            </Button>
          </Link>
        </div>
      </nav>
      )}

      {/* Mobile: Top Header Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-background border-b border-border md:hidden ${hideMobileHeader ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Back button (when mobileTitle provided) or Menu Button (logged in) or Logo (logged out) */}
          {mobileTitle ? (
            <button
              className="p-2 text-foreground/80 hover:text-accent transition-colors"
              onClick={() => {
                if (onMobileBack) {
                  onMobileBack();
                } else if (typeof mobileBackPath === 'number') {
                  navigate(mobileBackPath);
                } else if (mobileBackPath) {
                  navigate(mobileBackPath);
                } else {
                  navigate(-1);
                }
              }}
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
            <SheetContent side="left" className="w-screen max-w-none sm:max-w-none bg-background border-r border-border p-0 flex flex-col !duration-150 data-[state=open]:!duration-150 data-[state=closed]:!duration-150">
              {/* Logo */}
              <div className="p-4 border-b border-border">
                <Link to="/feed" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <img src={logo} alt="Muzicalist" className="h-10 w-10 object-contain" />
                  <span className="font-display font-bold text-lg text-foreground">Muzicalist</span>
                </Link>
              </div>

              {/* Main navigation - Instagram-style list */}
              <div className="flex-1 overflow-y-auto">
                {sidebarLinks.filter(link => link.to !== '/feed' && link.to !== '/announcements').map((link) => {
                  const active = isActive(link.to.split('?')[0]);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-4 border-b border-border active:bg-accent/10 transition-colors ${
                        active ? 'text-accent' : 'text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <link.icon className={`h-5 w-5 ${active ? 'text-accent' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-semibold">{link.label}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                  );
                })}

                {/* My Plan (only for artist accounts) */}
                {user && userType === 'artist' && (
                  <Link
                    to="/my-plan"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-4 border-b border-border active:bg-accent/10 transition-colors ${
                      isActive('/my-plan') ? 'text-accent' : 'text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Crown className={`h-5 w-5 ${isActive('/my-plan') ? 'text-accent' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-semibold">My Plan</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                )}

                {/* Admin Dashboard (admin only) */}
                {user && (userType as string) === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-4 border-b border-border active:bg-accent/10 transition-colors ${
                      isActive('/admin/dashboard') ? 'text-accent' : 'text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className={`h-5 w-5 ${isActive('/admin/dashboard') ? 'text-accent' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-semibold">Admin Dashboard</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                )}

                {/* Settings (only when logged in) */}
                {user && (
                  <Link
                    to="/dashboard?tab=settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-4 border-b border-border active:bg-accent/10 transition-colors ${
                      location.search.includes('tab=settings') ? 'text-accent' : 'text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className={`h-5 w-5 ${location.search.includes('tab=settings') ? 'text-accent' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-semibold">Settings</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                )}

                {/* Help & Support */}
                <Link
                  to="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-4 border-b border-border active:bg-accent/10 transition-colors ${
                    isActive('/help') ? 'text-accent' : 'text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className={`h-5 w-5 ${isActive('/help') ? 'text-accent' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-semibold">Help & Support</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>

                {/* About */}
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-4 border-b border-border active:bg-accent/10 transition-colors ${
                    isActive('/about') ? 'text-accent' : 'text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Info className={`h-5 w-5 ${isActive('/about') ? 'text-accent' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-semibold">About</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>

                {/* Logout */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-between px-4 py-4 border-b border-border text-destructive active:bg-destructive/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-semibold">Logout</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-destructive/60" />
                </button>
              </div>

            </SheetContent>
          </Sheet>
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Muzicalist" className="h-8 w-8 object-contain" />
              <span className="font-display font-bold text-foreground">Muzicalist</span>
            </Link>
          )}

          {/* Center: Custom mobile title or page title (logged in) or nothing */}
          {mobileTitle ? (
            <span className="font-display font-bold text-foreground text-lg ml-1">{mobileTitle}</span>
          ) : user ? (
            <>
              {location.pathname === '/dashboard' && location.search.includes('tab=settings') ? (
                <span className="font-display font-bold text-foreground text-lg">Settings</span>
              ) : location.pathname === '/leaderboard' ? (
                <span className="font-display font-bold text-foreground text-lg">Leaderboard</span>
              ) : location.pathname === '/countries' ? (
                <span className="font-display font-bold text-foreground text-lg">Countries</span>
              ) : location.pathname === '/counties' ? (
                <span className="font-display font-bold text-foreground text-lg">Regions</span>
              ) : location.pathname === '/categories' ? (
                <span className="font-display font-bold text-foreground text-lg">Categories</span>
              ) : location.pathname === '/notifications' ? (
                <span className="font-display font-bold text-foreground text-lg">Notifications</span>
              ) : (
                <Link to="/feed" className="flex items-center gap-2">
                  <img src={logo} alt="Muzicalist" className="h-8 w-8 object-contain" />
                  <span className="font-display font-bold text-foreground">Muzicalist</span>
                </Link>
              )}
            </>
          ) : null}

          {/* Right: Auth buttons (logged out) or Notifications (logged in) */}
          <div className="flex items-center gap-1">
            {user ? (
              <button
                onClick={() => navigate('/notifications')}
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
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground text-xs px-3">
                    <LogIn className="h-3.5 w-3.5 mr-1" />
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs px-3">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile: Bottom Navigation Bar (only for logged-in users) */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-1">
            {mobileBottomNav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors relative ${
                  (isActive(item.to.split('?')[0]) || (item.to === '/feed' && location.pathname === '/' && user))
                    ? 'text-accent'
                    : 'text-foreground/60 hover:text-accent'
                }`}
              >
                <div className="relative">
                  <item.icon className="h-6 w-6" />
                  {item.showBadge && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Desktop: Left Sidebar - Only when logged in */}
      {!user ? null : (
      <aside className="fixed top-0 left-0 h-screen w-64 bg-background border-r border-border z-40 hidden md:flex md:flex-col">
        {/* Logo at top of sidebar - h-16 to align with header */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <Link to="/feed" className="flex items-center gap-2">
            <img src={logo} alt="Muzicalist" className="h-9 w-9 object-contain" />
            <span className="font-display font-bold text-lg text-foreground">Muzicalist</span>
          </Link>
        </div>
        
        {/* Main navigation links */}
        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive(link.to.split('?')[0])
                  ? 'bg-accent/20 text-accent'
                  : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}

          {/* Search Link - between Regions and Notifications */}
          <Link
            to="/search"
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              isActive('/search')
                ? 'bg-accent/20 text-accent'
                : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="font-medium">Search</span>
          </Link>

          {/* User-specific links */}
          {user && (
            <>
              {userSidebarLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
                    isActive(link.to.split('?')[0]) || (link.to.includes('?') && location.search.includes(link.to.split('?')[1]))
                      ? 'bg-accent/20 text-accent'
                      : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <link.icon className="h-5 w-5" />
                    <span className="font-medium">{link.label}</span>
                  </div>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full">
                      {link.badge > 9 ? '9+' : link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </>
          )}
        </div>

        {/* More Button at bottom */}
        <div className="p-4 border-t border-border">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-foreground/80 hover:bg-accent/10 hover:text-accent">
                <MoreHorizontal className="h-5 w-5" />
                <span className="font-medium">More</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-[calc(16rem-2rem)] bg-card border-border p-2 z-50">
              <div className="space-y-1">
                {user && (
                  <Link
                    to="/dashboard?tab=settings"
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      location.search.includes('tab=settings')
                        ? 'bg-accent/20 text-accent'
                        : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                    }`}
                  >
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Settings</span>
                  </Link>
                )}
                {user && (userType as string) === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive('/admin/dashboard')
                        ? 'bg-accent/20 text-accent'
                        : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">Admin Dashboard</span>
                  </Link>
                )}
                <Link
                  to="/help"
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive('/help')
                      ? 'bg-accent/20 text-accent'
                      : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                  }`}
                >
                  <HelpCircle className="h-5 w-5" />
                  <span className="font-medium">Help & Support</span>
                </Link>
                <Link
                  to="/about"
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive('/about')
                      ? 'bg-accent/20 text-accent'
                      : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                  }`}
                >
                  <Info className="h-5 w-5" />
                  <span className="font-medium">About</span>
                </Link>
                
                {user && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </aside>
      )}

    </>
  );
};

export default Navigation;
