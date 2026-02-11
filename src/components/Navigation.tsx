import { Link, useNavigate, useLocation } from "react-router-dom";
import { Users, Trophy, MapPin, Megaphone, Info, LogIn, Search, Home, User, MessageSquare, Settings, LogOut, Bell, Menu, MoreHorizontal, Globe, Crown } from "lucide-react";
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

const Navigation = () => {
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
        { to: '/user-dashboard', icon: User, label: 'My Ads' },
      ]
    : [
        { to: '/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifications },
        { to: '/messages', icon: MessageSquare, label: 'Messages', badge: unreadCount },
        { to: '/dashboard?tab=plan', icon: Crown, label: 'My Plan' },
        { to: '/dashboard?tab=profile', icon: User, label: 'Profile' },
      ];

  // Mobile bottom nav items (left to right: Feed - Ads - Messages - Profile)
  const mobileBottomNav = [
    { to: '/feed', icon: Home, label: 'Feed', showBadge: false },
    { to: '/announcements', icon: Megaphone, label: 'Ads', showBadge: false },
    { to: user ? '/messages' : '/login', icon: MessageSquare, label: 'Messages', showBadge: true },
    { to: '/search', icon: Search, label: 'Search', showBadge: false },
    { to: user ? (userType === 'user' ? '/user-dashboard' : '/dashboard?tab=profile') : '/login', icon: User, label: 'Profile', showBadge: false },
  ];

  return (
    <>
      {/* Desktop: Top Header Bar */}
      <nav className="fixed top-0 left-64 right-0 h-16 z-50 bg-background border-b border-border hidden md:flex items-center justify-between px-6">
        {/* Left: Feed & Ads */}
        <div className="flex items-center gap-2">
          <Link
            to="/feed"
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
              isActive('/feed')
                ? 'bg-accent/20 text-accent'
                : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="font-medium">Feed</span>
          </Link>
          <Link
            to="/announcements"
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
              isActive('/announcements')
                ? 'bg-accent/20 text-accent'
                : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
            }`}
          >
            <Megaphone className="h-5 w-5" />
            <span className="font-medium">Ads</span>
          </Link>
        </div>

        {/* Right: Login/Register (only when not logged in) */}
        {!user && (
          <div className="flex items-center gap-2">
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
        )}
      </nav>

      {/* Mobile: Top Header Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border md:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 text-foreground/80 hover:text-accent transition-colors">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-background border-r border-border p-0 flex flex-col">
              {/* Logo */}
              <div className="p-4 border-b border-border">
                <Link to="/feed" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <img src={logo} alt="Muzicalist" className="h-10 w-10 object-contain" />
                  <span className="font-display font-bold text-lg text-foreground">Muzicalist</span>
                </Link>
              </div>

              {/* Main navigation - same order as desktop */}
              <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                {/* Main Links: Categories, Leaderboard, Regions */}
                {sidebarLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive(link.to.split('?')[0])
                        ? 'bg-accent/20 text-accent'
                        : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                    }`}
                  >
                    <link.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}

                {/* Settings (only when logged in) */}
                {user && (
                  <Link
                    to="/dashboard?tab=settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      location.search.includes('tab=settings')
                        ? 'bg-accent/20 text-accent'
                        : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                    }`}
                  >
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Settings</span>
                  </Link>
                )}
                
                {/* About */}
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive('/about')
                      ? 'bg-accent/20 text-accent'
                      : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                  }`}
                >
                  <Info className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">About</span>
                </Link>
              </div>

              {/* Bottom section - Logout only */}
              <div className="p-4 border-t border-border space-y-1">
                {user ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Logout</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                        <LogIn className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                        Register
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Center: Logo or Page Title */}
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
          ) : (
            <Link to="/feed" className="flex items-center gap-2">
              <img src={logo} alt="Muzicalist" className="h-8 w-8 object-contain" />
              <span className="font-display font-bold text-foreground">Muzicalist</span>
            </Link>
          )}

          {/* Right: Notifications */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (user) {
                  navigate('/notifications');
                } else {
                  navigate('/login');
                }
              }}
              className="p-2 text-foreground/80 hover:text-accent transition-colors relative"
            >
              <Bell className="h-6 w-6" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile: Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {mobileBottomNav.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors relative ${
                isActive(item.to.split('?')[0])
                  ? 'text-accent'
                  : 'text-foreground/60 hover:text-accent'
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5 mb-1" />
                {item.showBadge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop: Left Sidebar - Always visible */}
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
          {/* Search Link */}
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

    </>
  );
};

export default Navigation;
