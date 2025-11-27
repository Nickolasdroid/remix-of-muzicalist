import { Link, useNavigate } from "react-router-dom";
import { Users, Trophy, MapPin, Megaphone, Info, Mail, LogIn, Search, Home, User, MessageSquare, FileText, Settings, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import CountrySelector from "./CountrySelector";
import ArtistSidebar from "./ArtistSidebar";

const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url, stage_name, plan, specialization')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);

        // Fetch user type
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .single();
        setUserType(roleData?.user_type ?? null);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('profiles')
          .select('avatar_url, stage_name, plan, specialization')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data));

        supabase
          .from('user_roles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => setUserType(data?.user_type ?? null));
      } else {
        setProfile(null);
        setUserType(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-accent/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="Muzicalist" className="h-12 w-auto transition-transform group-hover:scale-110" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/feed" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link to="/categories" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <Users className="h-4 w-4" />
              Categories
            </Link>
            <Link to="/leaderboard" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
            <Link to="/counties" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <MapPin className="h-4 w-4" />
              Counties
            </Link>
            <Link to="/announcements" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <Megaphone className="h-4 w-4" />
              Announcements
            </Link>
            <Link to="/about" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <Info className="h-4 w-4" />
              About
            </Link>
            <Link to="/contact" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
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
              <>
                {userType === 'artist' ? (
                  <>
                    <button 
                      onClick={() => setSidebarOpen(true)}
                      className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors focus:outline-none"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-accent/30">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                          {profile?.stage_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                    <ArtistSidebar 
                      open={sidebarOpen} 
                      onOpenChange={setSidebarOpen}
                      profile={profile}
                      onLogout={handleLogout}
                    />
                  </>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors focus:outline-none">
                        <Avatar className="h-8 w-8 ring-2 ring-accent/30">
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                            {profile?.stage_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-card border-accent/20">
                      <DropdownMenuLabel className="text-accent">My Account</DropdownMenuLabel>
                      {profile?.plan && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Plan: <span className="font-semibold text-accent">{profile.plan}</span>
                        </div>
                      )}
                      <DropdownMenuSeparator className="bg-accent/20" />
                      <DropdownMenuItem onClick={() => navigate('/dashboard?tab=profile')} className="cursor-pointer hover:bg-accent/10">
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/dashboard?tab=messages')} className="cursor-pointer hover:bg-accent/10">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        My Messages
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-accent/20" />
                      <DropdownMenuItem onClick={() => navigate('/dashboard?tab=settings')} className="cursor-pointer hover:bg-accent/10">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-destructive/10 text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
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
