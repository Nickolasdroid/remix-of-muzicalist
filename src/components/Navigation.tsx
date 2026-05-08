import { Link, useNavigate, useLocation } from "react-router-dom";
import { Users, Trophy, MapPin, Megaphone, Info, LogIn, Search, Home, User, MessageSquare, Settings, LogOut, Bell, Menu, MoreHorizontal, Globe, Crown, ArrowLeft, HelpCircle, Shield } from "lucide-react";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavigationProps {
  mobileTitle?: string;
  mobileBackPath?: string | number;
  onMobileBack?: () => void;
  hideMobileHeader?: boolean;
}

const Navigation = ({ mobileTitle, mobileBackPath, onMobileBack, hideMobileHeader }: NavigationProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userType, setUserType] = useState<string | null>(null);
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
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url, stage_name, plan, country')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
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
          .then(({ data }) => setProfile(data));
        supabase
          .from('user_roles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => setUserType(data?.user_type || null));
      } else {
        setProfile(null);
        setUserType(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUnreadConversationsCount = async () => {
      if (!user) { setUnreadCount(0); return; }
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`artist_id.eq.${user.id},participant_id.eq.${user.id}`);
      if (!conversations || conversations.length === 0) { setUnreadCount(0); return; }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchUnreadConversationsCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const fetchUnreadNotificationsCount = async () => {
      if (!user) { setUnreadNotifications(0); return; }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchUnreadNotificationsCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const sidebarLinks = [
    { to: '/feed', icon: Home, label: t('navigation.home') },
    { to: '/announcements', icon: Megaphone, label: t('navigation.announcements') },
    { to: '/categories', icon: Users, label: t('navigation.categories') },
    { to: '/leaderboard', icon: Trophy, label: t('navigation.leaderboard') },
    { to: '/countries', icon: Globe, label: t('navigation.countries') },
    { to: '/counties', icon: MapPin, label: t('navigation.counties') },
  ];

  const userSidebarLinks = userType === 'user'
    ? [
        { to: '/notifications', icon: Bell, label: t('navigation.notifications'), badge: unreadNotifications },
        { to: '/messages', icon: MessageSquare, label: t('navigation.messages'), badge: unreadCount },
        { to: '/user-dashboard', icon: User, label: t('navigation.profile') },
      ]
    : [
        { to: '/notifications', icon: Bell, label: t('navigation.notifications'), badge: unreadNotifications },
        { to: '/messages', icon: MessageSquare, label: t('navigation.messages'), badge: unreadCount },
        { to: '/my-plan', icon: Crown, label: t('navigation.myPlan') },
        { to: '/dashboard?tab=profile', icon: User, label: t('navigation.profile') },
      ];

  const mobileBottomNav = [
    { to: '/feed', icon: Home, label: t('navigation.home'), showBadge: false },
    { to: '/announcements', icon: Megaphone, label: t('navigation.announcements'), showBadge: false },
    { to: user ? '/messages' : '/login', icon: MessageSquare, label: t('navigation.messages'), showBadge: true },
    { to: '/search', icon: Search, label: t('navigation.search'), showBadge: false },
    { to: user ? (userType === 'user' ? '/user-dashboard' : '/dashboard?tab=profile') : '/login', icon: User, label: t('navigation.profile'), showBadge: false },
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
          <LanguageSwitcher variant="ghost" />
          <Link to="/login">
            <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              <LogIn className="h-4 w-4 mr-2" />
              {t('navigation.login')}
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-[var(--shadow-gold)]">
              {t('navigation.register')}
            </Button>
          </Link>
        </div>
      </nav>
      )}

      {/* Mobile: Top Header Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-background border-b border-border md:hidden ${hideMobileHeader ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between h-14 px-4">
          {mobileTitle ? (
            <button
              className="p-2 text-foreground/80 hover:text-accent transition-colors"
              onClick={() => {
                if (onMobileBack) onMobileBack();
                else if (typeof mobileBackPath === 'number') navigate(mobileBackPath);
                else if (mobileBackPath) navigate(mobileBackPath as string);
                else navigate(-1);
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
            <SheetContent side="left" className="w-72 bg-background border-r border-border p-0 flex flex-col">
              <div className="p-4 border-b border-border">
                <Link to="/feed" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <img src={logo} alt="Muzicalist" className="h-10 w-10 object-contain" />
                  <span className="font-display font-bold text-lg text-foreground">Muzicalist</span>
                </Link>
              </div>
              <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                {sidebarLinks.filter(link => link.to !== '/feed' && link.to !== '/announcements').map((link) => (
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
                {user && userType === 'artist' && (
                  <Link
                    to="/my-plan"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive('/my-plan') ? 'bg-accent/20 text-accent' : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                    }`}
                  >
                    <Crown className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{t('navigation.myPlan')}</span>
                  </Link>
                )}
                {user && (userType as string) === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive('/admin/dashboard') ? 'bg-accent/20 text-accent' : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                    }`}
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{t('navigation.adminDashboard')}</span>
                  </Link>
                )}
                {user && (
                  <Link
                    to="/dashboard?tab=settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      location.search.includes('tab=settings') ? 'bg-accent/20 text-accent' : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                    }`}
                  >
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{t('navigation.settings')}</span>
                  </Link>
                )}
                <Link
                  to="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive('/help') ? 'bg-accent/20 text-accent' : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                  }`}
                >
                  <HelpCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{t('navigation.helpSupport')}</span>
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive('/about') ? 'bg-accent/20 text-accent' : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                  }`}
                >
                  <Info className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{t('navigation.about')}</span>
                </Link>
                <div className="pt-2">
                  <LanguageSwitcher variant="outline" showLabel className="w-full justify-start" />
                </div>
              </div>
              <div className="p-4 border-t border-border space-y-1">
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{t('navigation.logout')}</span>
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

          {mobileTitle ? (
            <span className="font-display font-bold text-foreground text-lg ml-1">{mobileTitle}</span>
          ) : user ? (
            <>
              {location.pathname === '/dashboard' && location.search.includes('tab=settings') ? (
                <span className="font-display font-bold text-foreground text-lg">{t('navigation.settingsTitle')}</span>
              ) : location.pathname === '/leaderboard' ? (
                <span className="font-display font-bold text-foreground text-lg">{t('navigation.leaderboard')}</span>
              ) : location.pathname === '/countries' ? (
                <span className="font-display font-bold text-foreground text-lg">{t('navigation.countries')}</span>
              ) : location.pathname === '/counties' ? (
                <span className="font-display font-bold text-foreground text-lg">{t('navigation.counties')}</span>
              ) : location.pathname === '/categories' ? (
                <span className="font-display font-bold text-foreground text-lg">{t('navigation.categories')}</span>
              ) : location.pathname === '/notifications' ? (
                <span className="font-display font-bold text-foreground text-lg">{t('navigation.notifications')}</span>
              ) : (
                <Link to="/feed" className="flex items-center gap-2">
                  <img src={logo} alt="Muzicalist" className="h-8 w-8 object-contain" />
                  <span className="font-display font-bold text-foreground">Muzicalist</span>
                </Link>
              )}
            </>
          ) : null}

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
                <LanguageSwitcher variant="ghost" />
                <Link to="/login">
                  <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground text-xs px-3">
                    <LogIn className="h-3.5 w-3.5 mr-1" />
                    {t('navigation.login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs px-3">
                    {t('navigation.register')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile: Bottom Navigation Bar */}
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

      {/* Desktop: Left Sidebar */}
      {!user ? null : (
      <aside className="fixed top-0 left-0 h-screen w-64 bg-background border-r border-border z-40 hidden md:flex md:flex-col">
        <div className="h-16 flex items-center px-4 border-b border-border">
          <Link to="/feed" className="flex items-center gap-2">
            <img src={logo} alt="Muzicalist" className="h-9 w-9 object-contain" />
            <span className="font-display font-bold text-lg text-foreground">Muzicalist</span>
          </Link>
        </div>
        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive(link.to.split('?')[0]) ? 'bg-accent/20 text-accent' : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          ))}
          <Link
            to="/search"
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              isActive('/search') ? 'bg-accent/20 text-accent' : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="font-medium">{t('navigation.search')}</span>
          </Link>
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
        <div className="p-4 border-t border-border">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-foreground/80 hover:bg-accent/10 hover:text-accent">
                <MoreHorizontal className="h-5 w-5" />
                <span className="font-medium">{t('navigation.more')}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-[calc(16rem-2rem)] bg-card border-border p-2 z-50">
              <div className="space-y-1">
                {user && (
                  <Link
                    to="/dashboard?tab=settings"
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      location.search.includes('tab=settings') ? 'bg-accent/20 text-accent' : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
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
                      isActive('/admin/dashboard') ? 'bg-accent/20 text-accent' : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">{t('navigation.adminDashboard')}</span>
                  </Link>
                )}
                <Link
                  to="/help"
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive('/help') ? 'bg-accent/20 text-accent' : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                  }`}
                >
                  <HelpCircle className="h-5 w-5" />
                  <span className="font-medium">{t('navigation.helpSupport')}</span>
                </Link>
                <Link
                  to="/about"
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive('/about') ? 'bg-accent/20 text-accent' : 'text-foreground/80 hover:bg-accent/10 hover:text-accent'
                  }`}
                >
                  <Info className="h-5 w-5" />
                  <span className="font-medium">{t('navigation.about')}</span>
                </Link>
                <div className="px-3 py-2">
                  <LanguageSwitcher variant="outline" showLabel className="w-full justify-start" />
                </div>
                {user && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={handleLogout}
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
      </aside>
      )}
    </>
  );
};

export default Navigation;
