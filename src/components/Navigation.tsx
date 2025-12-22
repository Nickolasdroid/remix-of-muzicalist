import { Link, useNavigate } from "react-router-dom";
import { Users, Trophy, MapPin, Megaphone, Info, Mail, LogIn, Search, Home, User, MessageSquare, FileText, Settings, LogOut, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "./ui/sheet";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import CountrySelector from "./CountrySelector";

const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { to: "/feed", icon: Home, label: "Home" },
    { to: "/announcements", icon: Megaphone, label: "Announcements" },
    { to: "/categories", icon: Users, label: "Categories" },
    { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { to: "/counties", icon: MapPin, label: "Counties" },
    { to: "/about", icon: Info, label: "About" },
    { to: "/contact", icon: Mail, label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-accent/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <img src={logo} alt="Muzicalist" className="h-10 md:h-12 w-10 md:w-12 object-contain transition-transform group-hover:scale-110" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors text-sm xl:text-base"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search & Country (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search"
                className="pl-9 w-32 lg:w-40 bg-background/50 border-accent/20 focus:border-accent"
              />
            </div>
            <CountrySelector />
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="flex items-center gap-2 md:gap-4">
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
                <Link to="/login" className="hidden sm:block">
                  <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:block">
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-[var(--shadow-gold)]">
                    Register
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-card border-accent/20 p-0">
                <div className="flex flex-col h-full">
                  <SheetHeader className="p-4 border-b border-accent/20">
                    <div className="flex items-center justify-between">
                      <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                        <img src={logo} alt="Muzicalist" className="h-10 w-10 object-contain" />
                      </Link>
                    </div>
                  </SheetHeader>

                  {/* Mobile Search */}
                  <div className="p-4 border-b border-accent/20">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search artists..."
                        className="pl-9 w-full bg-background/50 border-accent/20 focus:border-accent"
                      />
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-1">
                      {navLinks.map((link) => (
                        <SheetClose asChild key={link.to}>
                          <Link
                            to={link.to}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent/10 transition-colors text-foreground/80 hover:text-accent"
                          >
                            <link.icon className="h-5 w-5" />
                            <span>{link.label}</span>
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </nav>

                  {/* Mobile Auth Buttons */}
                  {!user && (
                    <div className="p-4 border-t border-accent/20 space-y-2">
                      <SheetClose asChild>
                        <Link to="/login" className="block">
                          <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                            <LogIn className="h-4 w-4 mr-2" />
                            Login
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/register" className="block">
                          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                            Register
                          </Button>
                        </Link>
                      </SheetClose>
                    </div>
                  )}

                  {/* Country Selector */}
                  <div className="p-4 border-t border-accent/20">
                    <CountrySelector />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;