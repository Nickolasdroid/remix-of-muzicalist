import { Link, useNavigate, useLocation } from "react-router-dom";
import { Users, Trophy, MapPin, Megaphone, Info, Mail, LogIn, Search, Home, User, MessageSquare, Settings, LogOut, Menu, X } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          .select('avatar_url, stage_name, plan')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('profiles')
          .select('avatar_url, stage_name, plan')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const sidebarLinks = [
    ...(user ? [{ to: '/dashboard?tab=profile', icon: User, label: 'My Profile' }] : []),
    { to: '/categories', icon: Users, label: 'Categories' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/counties', icon: MapPin, label: 'Counties' },
    { to: '/about', icon: Info, label: 'About' },
    { to: '/contact', icon: Mail, label: 'Contact' },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/50 border-b border-accent/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo (opens menu) + Search */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-2 p-2 rounded-lg transition-colors"
              >
                <img src={logo} alt="Muzicalist" className="h-10 w-10 object-contain" />
                {sidebarOpen ? (
                  <X className="h-5 w-5 text-foreground" />
                ) : (
                  <Menu className="h-5 w-5 text-foreground" />
                )}
              </button>

              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search"
                  className="pl-9 w-40 bg-background/50 border-accent/20 focus:border-accent"
                />
              </div>
            </div>

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

            {/* Right: Country Selector + User */}
            <div className="flex items-center gap-4">
              <CountrySelector />
              
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
                        <span>My Profile</span>
                      </button>
                      <button
                        onClick={() => navigate('/messages')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/10 transition-colors text-left text-sm"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>My Messages</span>
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

      {/* Left Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-background/50 border-r border-accent/20 z-40 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
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
        </div>
      </aside>

      {/* Overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 top-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation;
