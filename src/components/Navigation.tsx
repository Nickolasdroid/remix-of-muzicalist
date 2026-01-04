import { Link, useNavigate, useLocation } from "react-router-dom";
import { Users, Trophy, MapPin, Megaphone, Info, Flag, LogIn, Search, Home, User, MessageSquare, Settings, LogOut, Bell, Menu, X } from "lucide-react";
import ReportDialog from "./ReportDialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import CountrySelector from "./CountrySelector";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
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
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url, stage_name, plan, country')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
        
        if (data?.country) {
          setSelectedCountry(data.country);
        }
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
      } else {
        setProfile(null);
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

  const sidebarLinks = [
    { to: '/categories', icon: Users, label: 'Categories' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/counties', icon: MapPin, label: 'Regions' },
    { to: '/about', icon: Info, label: 'About' },
  ];

  // Mobile bottom nav items (right to left: Feed - Ads - Search - Profile)
  const mobileBottomNav = [
    { to: user ? '/dashboard?tab=profile' : '/login', icon: User, label: 'Profile' },
    { to: '/categories', icon: Search, label: 'Search' },
    { to: '/announcements', icon: Megaphone, label: 'Ads' },
    { to: '/feed', icon: Home, label: 'Feed' },
  ];

  return (
    <>
      {/* Desktop: Top Header Bar */}
      <nav className="fixed top-0 left-64 right-0 z-50 bg-background border-b border-border hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Center: Feed & Ads */}
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

            {/* Right: Country Selector & User */}
            <div className="flex items-center gap-2">
              <CountrySelector 
                variant="navigation" 
                value={selectedCountry}
                onChange={setSelectedCountry}
                userCountry={profile?.country}
              />
              
              {user ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors focus:outline-none">
                      <Avatar className="h-8 w-8 ring-2 ring-accent/30">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                          {profile?.stage_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 bg-card border-accent/20 p-0">
                    <div className="p-4 border-b border-accent/20">
                      <p className="font-semibold text-accent">My Account</p>
                      {profile?.plan && (
                        <p className="text-sm text-muted-foreground">
                          Plan: <span className="font-semibold text-accent">{profile.plan}</span>
                        </p>
                      )}
                    </div>
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => navigate('/dashboard?tab=profile')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 transition-colors text-left text-sm"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => navigate('/notifications')}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/10 transition-colors text-left text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Bell className="h-4 w-4" />
                          <span>Notifications</span>
                        </div>
                        {unreadNotifications > 0 && (
                          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full">
                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => navigate('/messages')}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/10 transition-colors text-left text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-4 w-4" />
                          <span>Messages</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>
                      <div className="h-px bg-accent/20 my-1" />
                      <button
                        onClick={() => navigate('/dashboard?tab=settings')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 transition-colors text-left text-sm"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors text-left text-sm"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
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
            <SheetContent side="left" className="w-72 bg-background border-r border-border p-0">
              {/* Logo */}
              <div className="p-4 border-b border-border">
                <Link to="/feed" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <img src={logo} alt="Muzicalist" className="h-10 w-10 object-contain" />
                  <span className="font-display font-bold text-lg text-foreground">Muzicalist</span>
                </Link>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search"
                    className="pl-9 w-full bg-background/50 border-border focus:border-accent"
                  />
                </div>
              </div>

              {/* User Section (if logged in) */}
              {user && profile && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-accent/30">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        {profile?.stage_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{profile?.stage_name || 'User'}</p>
                      <p className="text-sm text-muted-foreground">{profile?.plan || 'Free'} Plan</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="p-4 space-y-1">
                {sidebarLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive(link.to.split('?')[0])
                        ? 'bg-accent/20 text-accent'
                        : 'text-foreground/80 hover:bg-accent/10'
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}

                {/* User-specific links */}
                {user && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <Link
                      to="/notifications"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
                        isActive('/notifications')
                          ? 'bg-accent/20 text-accent'
                          : 'text-foreground/80 hover:bg-accent/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5" />
                        <span className="font-medium">Notifications</span>
                      </div>
                      {unreadNotifications > 0 && (
                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full">
                          {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/messages"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
                        isActive('/messages')
                          ? 'bg-accent/20 text-accent'
                          : 'text-foreground/80 hover:bg-accent/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5" />
                        <span className="font-medium">Messages</span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/dashboard?tab=settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        location.search.includes('tab=settings')
                          ? 'bg-accent/20 text-accent'
                          : 'text-foreground/80 hover:bg-accent/10'
                      }`}
                    >
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Settings</span>
                    </Link>
                  </>
                )}

                <div className="h-px bg-border my-2" />
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setReportDialogOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground/80 hover:bg-accent/10 transition-colors"
                >
                  <Flag className="h-5 w-5" />
                  <span className="font-medium">Report</span>
                </button>

                {user ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                ) : (
                  <div className="space-y-2 pt-2">
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

          {/* Center: Logo */}
          <Link to="/feed" className="flex items-center gap-2">
            <img src={logo} alt="Muzicalist" className="h-8 w-8 object-contain" />
            <span className="font-display font-bold text-foreground">Muzicalist</span>
          </Link>

          {/* Right: Country Selector */}
          <CountrySelector 
            variant="navigation" 
            value={selectedCountry}
            onChange={setSelectedCountry}
            userCountry={profile?.country}
          />
        </div>
      </nav>

      {/* Mobile: Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileBottomNav.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                isActive(item.to.split('?')[0])
                  ? 'text-accent'
                  : 'text-foreground/60 hover:text-accent'
              }`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop: Left Sidebar - Always visible */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-background border-r border-border z-40 hidden md:block">
        {/* Logo and Search at top of sidebar */}
        <div className="p-4 border-b border-border">
          <Link to="/feed" className="flex items-center gap-2 p-2 rounded-lg mb-3">
            <img src={logo} alt="Muzicalist" className="h-10 w-10 object-contain" />
            <span className="font-display font-bold text-lg text-foreground">Muzicalist</span>
          </Link>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              className="pl-9 w-full bg-background/50 border-border focus:border-accent"
            />
          </div>
        </div>
        
        <div className="p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                isActive(link.to.split('?')[0])
                  ? 'bg-accent/20 text-accent'
                  : 'text-foreground/80'
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
          
          <button
            onClick={() => setReportDialogOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground/80"
          >
            <Flag className="h-5 w-5" />
            <span className="font-medium">Report</span>
          </button>
        </div>
      </aside>

      <ReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} />
    </>
  );
};

export default Navigation;
