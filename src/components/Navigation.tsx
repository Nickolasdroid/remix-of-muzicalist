import { Link, useNavigate, useLocation } from "react-router-dom";
import { Users, Trophy, MapPin, Megaphone, Info, Mail, LogIn, Search, Home, User, MessageSquare, FileText, Settings, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import CountrySelector from "./CountrySelector";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  useEffect(() => {
    // Check current session
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

    // Listen for auth changes
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-accent/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <img src={logo} alt="Muzicalist" className="h-12 w-12 object-contain transition-transform group-hover:scale-110" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/feed" className={`flex items-center gap-2 transition-colors ${isActive('/feed') ? 'text-accent' : 'text-foreground/80 hover:text-accent'}`}>
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link to="/announcements" className={`flex items-center gap-2 transition-colors ${isActive('/announcements') ? 'text-accent' : 'text-foreground/80 hover:text-accent'}`}>
              <Megaphone className="h-4 w-4" />
              Announcements
            </Link>
            <Link to="/categories" className={`flex items-center gap-2 transition-colors ${isActive('/categories') ? 'text-accent' : 'text-foreground/80 hover:text-accent'}`}>
              <Users className="h-4 w-4" />
              Categories
            </Link>
            <Link to="/leaderboard" className={`flex items-center gap-2 transition-colors ${isActive('/leaderboard') ? 'text-accent' : 'text-foreground/80 hover:text-accent'}`}>
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
            <Link to="/counties" className={`flex items-center gap-2 transition-colors ${isActive('/counties') ? 'text-accent' : 'text-foreground/80 hover:text-accent'}`}>
              <MapPin className="h-4 w-4" />
              Counties
            </Link>
            <Link to="/about" className={`flex items-center gap-2 transition-colors ${isActive('/about') ? 'text-accent' : 'text-foreground/80 hover:text-accent'}`}>
              <Info className="h-4 w-4" />
              About
            </Link>
            <Link to="/contact" className={`flex items-center gap-2 transition-colors ${isActive('/contact') ? 'text-accent' : 'text-foreground/80 hover:text-accent'}`}>
              <Mail className="h-4 w-4" />
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search"
                className="pl-9 w-40 bg-background/50 border-accent/20 focus:border-accent"
              />
            </div>
            <CountrySelector />
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors focus:outline-none">
                    <Avatar className="h-8 w-8 ring-2 ring-accent/30">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                        {profile?.stage_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-card border-accent/20">
                  <SheetHeader>
                    <SheetTitle className="text-accent">My Account</SheetTitle>
                    {profile?.plan && (
                      <div className="text-sm text-muted-foreground">
                        Plan: <span className="font-semibold text-accent">{profile.plan}</span>
                      </div>
                    )}
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    <button
                      onClick={() => navigate('/dashboard?tab=profile')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/10 transition-colors text-left"
                    >
                      <User className="h-5 w-5" />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={() => navigate('/messages')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/10 transition-colors text-left"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>My Messages</span>
                    </button>
                    <button
                      onClick={() => navigate('/dashboard?tab=announcements')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/10 transition-colors text-left"
                    >
                      <Megaphone className="h-5 w-5" />
                      <span>My Announcements</span>
                    </button>
                    <button
                      onClick={() => navigate('/dashboard?tab=posts')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/10 transition-colors text-left"
                    >
                      <FileText className="h-5 w-5" />
                      <span>My Posts</span>
                    </button>
                    <div className="h-px bg-accent/20 my-2" />
                    <button
                      onClick={() => navigate('/dashboard?tab=settings')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/10 transition-colors text-left"
                    >
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
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
  );
};

export default Navigation;
