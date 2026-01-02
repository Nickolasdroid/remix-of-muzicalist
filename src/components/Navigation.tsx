import { Link, useNavigate, useLocation } from "react-router-dom";
import { Users, Trophy, MapPin, Megaphone, Info, Flag, LogIn, Search, Home, User, MessageSquare, Settings, LogOut } from "lucide-react";
import ReportDialog from "./ReportDialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
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

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
        
        // Set country from profile
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

      // Get all conversations where user is participant
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`artist_id.eq.${user.id},participant_id.eq.${user.id}`);

      if (!conversations || conversations.length === 0) {
        setUnreadCount(0);
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      // Get unread messages grouped by conversation
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .is('read_at', null);

      // Count unique conversations with unread messages
      const uniqueConversations = new Set((unreadMessages || []).map(m => m.conversation_id));
      setUnreadCount(uniqueConversations.size);
    };

    fetchUnreadConversationsCount();

    // Subscribe to new messages for real-time updates
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

  const sidebarLinks = [
    ...(user ? [{ to: '/dashboard?tab=profile', icon: User, label: 'Profile' }] : []),
    { to: '/categories', icon: Users, label: 'Categories' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/counties', icon: MapPin, label: 'Regions' },
    { to: '/about', icon: Info, label: 'About' },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <nav className="fixed top-0 left-64 right-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Center: Feed & Ads */}
            <div className="hidden md:flex items-center gap-2">
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
              {/* Country Selector */}
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

      {/* Left Sidebar - Always visible */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-card border-r border-border z-40">
        {/* Logo and Search at top of sidebar */}
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2 p-2 hover:bg-accent/10 rounded-lg transition-colors mb-3">
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
          
          {/* Report button */}
          <button
            onClick={() => setReportDialogOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-foreground/80 hover:bg-accent/10 hover:text-accent"
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
