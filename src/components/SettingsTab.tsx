import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LogOut, Trash2, Lock, CheckCircle, ShieldCheck, Eye, EyeOff, User, Flag, Paperclip, ChevronRight, Mail, Languages, Settings2, Megaphone, ChevronDown, Search, Sun, Moon, MessageCircle, HelpCircle, Info, Bell, Star, Heart, MessageSquare, UserPlus, Calendar, CalendarX } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { setManualLanguage } from "@/i18n";
import { WORLD_LANGUAGES } from "@/lib/worldLanguages";

export type SettingSection = "main" | "account" | "system" | "email" | "password" | "language" | "theme" | "promotion" | "comments" | "notifications" | "report" | "logout" | "delete" | "help" | "about";

export type NotificationPreferenceKey =
  | "reviews"
  | "likes"
  | "comments"
  | "followers"
  | "booking_requests"
  | "booking_updates"
  | "messages";

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  reviews: true,
  likes: true,
  comments: true,
  followers: true,
  booking_requests: true,
  booking_updates: true,
  messages: true,
};

type CommentsAllowFrom = "everyone" | "following" | "off";

const LANGUAGE_OPTIONS = WORLD_LANGUAGES;

interface SettingsTabProps {
  formData: {
    email: string;
  };
  handleLogout: () => void;
  handleDeleteAccount: () => void;
  isSaving: boolean;
  activeSection?: SettingSection;
  onSectionChange?: (section: SettingSection) => void;
}

const SettingsTab = ({
  formData,
  handleLogout,
  handleDeleteAccount,
  isSaving,
  activeSection: controlledSection,
  onSectionChange,
}: SettingsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { i18n } = useTranslation();
  const [internalSection, setInternalSection] = useState<SettingSection>("main");
  
  const activeSection = controlledSection ?? internalSection;
  const setActiveSection = (section: SettingSection) => {
    onSectionChange?.(section);
    setInternalSection(section);
  };
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const reportFileInputRef = useRef<HTMLInputElement>(null);
  const [allowPromotion, setAllowPromotion] = useState(true);
  const [showPromotionInfo, setShowPromotionInfo] = useState(false);
  const [showDisablePromotionConfirm, setShowDisablePromotionConfirm] = useState(false);
  const [commentsAllowFrom, setCommentsAllowFrom] = useState<CommentsAllowFrom>("everyone");
  const [commentsAllowGifs, setCommentsAllowGifs] = useState(true);
  const [showDisableCommentsConfirm, setShowDisableCommentsConfirm] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<{ code: string; label: string } | null>(null);
  const [languagePopoverOpen, setLanguagePopoverOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof document !== "undefined" && document.documentElement.classList.contains("light")) return "light";
    return "dark";
  });

  const [pendingTheme, setPendingTheme] = useState<"dark" | "light" | null>(null);

  const applyTheme = (next: "dark" | "light") => {
    setTheme(next);
    if (next === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    try { localStorage.setItem("theme", next); } catch {}
  };

  const toggleTheme = (next: "dark" | "light") => {
    if (next === theme) return;
    setPendingTheme(next);
  };

  const confirmThemeChange = () => {
    if (!pendingTheme) return;
    applyTheme(pendingTheme);
    const label = pendingTheme === "light" ? "Light" : "Dark";
    setPendingTheme(null);
    toast({ title: "Theme changed", description: label });
  };

  const ThemeConfirmDialog = (
    <AlertDialog open={!!pendingTheme} onOpenChange={(open) => !open && setPendingTheme(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change theme?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingTheme
              ? `Are you sure you want to switch the theme to ${pendingTheme === "light" ? "Light" : "Dark"}?`
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-end gap-2 space-x-0">
          <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmThemeChange}>Change theme</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const currentLangCode = (i18n.language || "en").toLowerCase();
  const currentLangBase = currentLangCode.split("-")[0];
  const currentLanguage = useMemo(
    () =>
      LANGUAGE_OPTIONS.find((l) => l.code.toLowerCase() === currentLangCode) ||
      LANGUAGE_OPTIONS.find((l) => l.code.toLowerCase() === currentLangBase) ||
      LANGUAGE_OPTIONS[0],
    [currentLangCode, currentLangBase],
  );

  const filteredLanguages = useMemo(() => {
    const q = languageSearch.trim().toLowerCase();
    if (!q) return LANGUAGE_OPTIONS;
    return LANGUAGE_OPTIONS.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.english.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    );
  }, [languageSearch]);

  const requestLanguageChange = (code: string, label: string) => {
    if (code.toLowerCase() === currentLanguage.code.toLowerCase()) {
      setLanguagePopoverOpen(false);
      return;
    }
    setPendingLanguage({ code, label });
  };

  const confirmLanguageChange = async () => {
    if (!pendingLanguage) return;
    const lang = pendingLanguage;
    setPendingLanguage(null);
    setLanguagePopoverOpen(false);
    try {
      await setManualLanguage(lang.code);
      toast({ title: "Language changed", description: lang.label });
    } catch (e) {
      toast({ title: "Could not change language", variant: "destructive" });
    }
  };

  const LanguageConfirmDialog = (
    <AlertDialog open={!!pendingLanguage} onOpenChange={(open) => !open && setPendingLanguage(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change language?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingLanguage
              ? `Are you sure you want to switch the site language to ${pendingLanguage.label}? The interface will be translated automatically.`
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-end gap-2 space-x-0">
          <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmLanguageChange}>Change language</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );


  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("allow_promotion, comments_allow_from, comments_allow_gifs, notification_preferences")
        .eq("id", user.id)
        .maybeSingle();
      if (data && typeof (data as any).allow_promotion === "boolean") {
        setAllowPromotion((data as any).allow_promotion);
      }
      if (data && (data as any).comments_allow_from) {
        setCommentsAllowFrom((data as any).comments_allow_from as CommentsAllowFrom);
      }
      if (data && typeof (data as any).comments_allow_gifs === "boolean") {
        setCommentsAllowGifs((data as any).comments_allow_gifs);
      }
      if (data && (data as any).notification_preferences && typeof (data as any).notification_preferences === "object") {
        setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...((data as any).notification_preferences as Partial<NotificationPreferences>) });
      }
    })();
  }, []);

  const applyNotificationPref = async (key: NotificationPreferenceKey, next: boolean) => {
    const prev = notificationPrefs;
    const updated = { ...prev, [key]: next };
    setNotificationPrefs(updated);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ notification_preferences: updated } as any)
      .eq("id", user.id);
    if (error) {
      setNotificationPrefs(prev);
      toast({ title: "Error", description: "Could not update notification preference.", variant: "destructive" });
    }
  };

  const applyCommentsAllowFrom = async (next: CommentsAllowFrom) => {
    const prev = commentsAllowFrom;
    setCommentsAllowFrom(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ comments_allow_from: next } as any)
      .eq("id", user.id);
    if (error) {
      setCommentsAllowFrom(prev);
      toast({ title: "Error", description: "Could not update comments preference.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Comments preference updated." });
    }
  };

  const handleCommentsAllowFromChange = (next: CommentsAllowFrom) => {
    if (next === commentsAllowFrom) return;
    if (next === "off") {
      setShowDisableCommentsConfirm(true);
      return;
    }
    applyCommentsAllowFrom(next);
  };

  const applyCommentsAllowGifs = async (next: boolean) => {
    setCommentsAllowGifs(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ comments_allow_gifs: next } as any)
      .eq("id", user.id);
    if (error) {
      setCommentsAllowGifs(!next);
      toast({ title: "Error", description: "Could not update GIF preference.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: next ? "GIF comments enabled." : "GIF comments disabled." });
    }
  };

  const applyPromotionChange = async (next: boolean) => {
    setAllowPromotion(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ allow_promotion: next } as any)
      .eq("id", user.id);
    if (error) {
      setAllowPromotion(!next);
      toast({ title: "Error", description: "Could not update promotion preference.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: next ? "Promotion enabled." : "Promotion disabled." });
    }
  };

  const handleTogglePromotion = (next: boolean) => {
    if (!next) {
      setShowDisablePromotionConfirm(true);
      return;
    }
    applyPromotionChange(true);
  };

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setCurrentPasswordVerified(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReportFile(e.target.files[0]);
    }
  };

  const handleReportSubmit = () => {
    if (!reportMessage.trim()) {
      toast({
        title: "Error",
        description: "Please write your report before sending.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Report Sent!",
      description: "Thank you for your feedback. We'll review it shortly.",
    });

    setReportMessage("");
    setReportFile(null);
    setShowReportDialog(false);
    if (isMobile) setActiveSection("main");
  };

  const handleVerifyCurrentPassword = async () => {
    if (!passwordData.currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password.",
        variant: "destructive"
      });
      return;
    }
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: passwordData.currentPassword
      });
      if (error) {
        toast({
          title: "Error",
          description: "Current password is incorrect.",
          variant: "destructive"
        });
        setCurrentPasswordVerified(false);
        return;
      }
      setCurrentPasswordVerified(true);
      toast({
        title: "Verified",
        description: "Current password verified. You can now set a new password."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify password.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPasswordVerified) {
      toast({
        title: "Error",
        description: "Please verify your current password first.",
        variant: "destructive"
      });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Password updated successfully!"
      });
      resetPasswordForm();
      setShowPasswordDialog(false);
      if (isMobile) setActiveSection("main");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Mobile setting items grouped by category (Instagram-style)
  const mobileSettingGroups: {
    title: string;
    items: { id: SettingSection; label: string; icon: any; destructive?: boolean }[];
  }[] = [
    {
      title: "Your account",
      items: [
        { id: "email", label: "Email Address", icon: Mail },
        { id: "password", label: "Change Password", icon: Lock },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "comments", label: "Comments", icon: MessageCircle },
      ],
    },
    {
      title: "How you use the app",
      items: [
        { id: "language", label: "Language", icon: Languages },
        { id: "theme", label: "Theme", icon: Sun },
      ],
    },
    {
      title: "Who can interact with you",
      items: [
        { id: "promotion", label: "Promotion", icon: Megaphone },
      ],
    },
    {
      title: "Support",
      items: [
        { id: "help", label: "Help & Support", icon: HelpCircle },
        { id: "report", label: "Report an Issue", icon: Flag },
        { id: "about", label: "About", icon: Info },
      ],
    },
    {
      title: "Login",
      items: [
        { id: "logout", label: "Sign Out", icon: LogOut },
        { id: "delete", label: "Delete Account", icon: Trash2, destructive: true },
      ],
    },
  ];

  // Desktop nav items
  const navItems = [
    {
      id: "account",
      label: "Account",
      icon: User
    },
    {
      id: "system",
      label: "System",
      icon: Settings2
    },
    {
      id: "promotion",
      label: "Promotion",
      icon: Megaphone
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell
    },
    {
      id: "comments",
      label: "Comments",
      icon: MessageCircle
    },
    {
      id: "help",
      label: "Help & Support",
      icon: HelpCircle
    },
    {
      id: "about",
      label: "About",
      icon: Info
    }
  ];

  // Mobile: Main list view (Instagram-style grouped sections)
  const MobileMainList = () => (
    <div className="flex flex-col -mx-4">
      {mobileSettingGroups.map((group, groupIndex) => (
        <div
          key={group.title}
          className={groupIndex !== 0 ? "border-t border-border" : ""}
        >
          <div className="px-4 pt-3 pb-1">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {group.title}
            </h3>
          </div>
          <div className="flex flex-col">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center justify-between px-4 py-3 ${
                    item.destructive ? "text-destructive" : "text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${item.destructive ? "text-destructive" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className={`h-5 w-5 ${item.destructive ? "text-destructive/50" : "text-muted-foreground"}`} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // Mobile: Email section
  const MobileEmailSection = () => (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Email Address</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your email address is used for login and notifications
        </p>
      </div>
      <Input 
        value={formData.email} 
        disabled 
        className="bg-muted/50 text-sm" 
      />
      <p className="text-sm text-muted-foreground">Email cannot be changed</p>
    </div>
  );

  // Mobile: Password section (Instagram-style)
  const handleInstagramStyleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({ title: "Error", description: "Completează toate câmpurile.", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Error", description: "Parola trebuie să aibă cel puțin 6 caractere.", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Parolele nu coincid.", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: passwordData.currentPassword,
      });
      if (verifyError) {
        toast({ title: "Error", description: "Parola actuală este incorectă.", variant: "destructive" });
        setIsChangingPassword(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
      toast({ title: "Succes", description: "Parola a fost schimbată." });
      resetPasswordForm();
      setActiveSection("main");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Eroare la schimbarea parolei.", variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const MobilePasswordSection = () => (
    <div className="px-4 pt-2 pb-8 space-y-6">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Password must contain at least 6 characters and include a combination of numbers, letters, and special characters (!$@%).
      </p>



      <div className="space-y-3">
        <div className="relative">
          <Input
            type={showCurrentPassword ? "text" : "password"}
            value={passwordData.currentPassword}
            onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            placeholder="Current password"
            className="h-12 rounded-lg pr-12"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative">
          <Input
            type={showNewPassword ? "text" : "password"}
            value={passwordData.newPassword}
            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            placeholder="New password"
            className="h-12 rounded-lg pr-12"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            value={passwordData.confirmPassword}
            onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            placeholder="Re-enter new password"
            className="h-12 rounded-lg pr-12"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate("/reset-password")}
        className="text-sm font-semibold text-accent hover:underline"
      >
        Forgot password?
      </button>

      <Button
        onClick={handleInstagramStyleChangePassword}
        disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
        className="w-full h-12 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
      >
        {isChangingPassword ? "Updating..." : "Change password"}
      </Button>
    </div>
  );

  // Mobile: Report section
  const MobileReportSection = () => (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Report an Issue</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Send us feedback or report a problem
        </p>
      </div>

      <Textarea
        value={reportMessage}
        onChange={(e) => setReportMessage(e.target.value)}
        placeholder="Describe your issue or feedback..."
        className="min-h-[150px] resize-none"
      />
      
      {reportFile && (
        <p className="text-sm text-muted-foreground">
          Attached: {reportFile.name}
        </p>
      )}
      
      <div className="flex items-center justify-between gap-3">
        <Button
          onClick={handleReportSubmit}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Send report
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => reportFileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Attach file
        </Button>
        
        <input
          ref={reportFileInputRef}
          type="file"
          onChange={handleReportFileChange}
          className="hidden"
        />
      </div>
    </div>
  );

  // Mobile: Language section
  const MobileLanguageSection = () => {
    return (
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Language</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your preferred language
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={languageSearch}
            onChange={(e) => setLanguageSearch(e.target.value)}
            placeholder="Search language…"
            className="pl-9 rounded-lg"
          />
        </div>
        <div className="space-y-2">
          {filteredLanguages.map((lang) => {
            const isActive = lang.code.toLowerCase() === currentLanguage.code.toLowerCase();
            return (
              <button
                key={lang.code}
                onClick={() => requestLanguageChange(lang.code, lang.label)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors ${
                  isActive
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-border text-foreground hover:border-muted-foreground/50"
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="flex-1 text-left font-medium">{lang.label}</span>
                {isActive && <CheckCircle className="h-5 w-5 text-accent" />}
              </button>
            );
          })}
          {filteredLanguages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No languages found</p>
          )}
        </div>
      </div>
    );
  };

  // Mobile: Theme section
  const MobileThemeSection = () => (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Theme</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose between dark and light appearance
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={theme === "dark" ? "default" : "outline"}
          onClick={() => toggleTheme("dark")}
          className="h-11 rounded-lg justify-center gap-2"
        >
          <Moon className="h-4 w-4" />
          Dark
        </Button>
        <Button
          type="button"
          variant={theme === "light" ? "default" : "outline"}
          onClick={() => toggleTheme("light")}
          className="h-11 rounded-lg justify-center gap-2"
        >
          <Sun className="h-4 w-4" />
          Light
        </Button>
      </div>
    </div>
  );


  // Mobile: Logout section
  const MobileLogoutSection = () => (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Sign Out</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sign out of your account on this device
        </p>
      </div>
      <Button variant="outline" onClick={handleLogout} className="w-full">
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );

  // Mobile: Delete section
  const MobileDeleteSection = () => (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-destructive">Delete Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Permanently delete your account and all data
        </p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers including your profile,
              announcements, gallery, and calendar events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
              disabled={isSaving}
            >
              {isSaving ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // Shared: Comments section content (used by both mobile and desktop)
  const CommentsSectionContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Comments</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose who can comment on your posts and announcements
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Allow comments from</Label>
        <RadioGroup
          value={commentsAllowFrom}
          onValueChange={(v) => handleCommentsAllowFromChange(v as CommentsAllowFrom)}
          className="space-y-2"
        >
          <label
            htmlFor="comments-everyone"
            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
              commentsAllowFrom === "everyone" ? "border-accent/50 bg-accent/5" : "border-border hover:border-muted-foreground/50"
            }`}
          >
            <RadioGroupItem value="everyone" id="comments-everyone" className="mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium">Everyone</div>
              <div className="text-xs text-muted-foreground mt-0.5">Anyone on Muzicalist can comment</div>
            </div>
          </label>

          <label
            htmlFor="comments-following"
            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
              commentsAllowFrom === "following" ? "border-accent/50 bg-accent/5" : "border-border hover:border-muted-foreground/50"
            }`}
          >
            <RadioGroupItem value="following" id="comments-following" className="mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium">People you follow</div>
              <div className="text-xs text-muted-foreground mt-0.5">Only accounts you follow can comment</div>
            </div>
          </label>

          <label
            htmlFor="comments-off"
            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
              commentsAllowFrom === "off" ? "border-accent/50 bg-accent/5" : "border-border hover:border-muted-foreground/50"
            }`}
          >
            <RadioGroupItem value="off" id="comments-off" className="mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium">Off</div>
              <div className="text-xs text-muted-foreground mt-0.5">No one can comment on your content</div>
            </div>
          </label>
        </RadioGroup>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Label className="text-sm font-medium">Allow GIF comments</Label>
          <p className="text-sm text-muted-foreground mt-0.5">
            People can add GIFs to comments on your posts and announcements
          </p>
        </div>
        <Switch checked={commentsAllowGifs} onCheckedChange={applyCommentsAllowGifs} />
      </div>
    </div>
  );

  const DisableCommentsDialog = (
    <AlertDialog open={showDisableCommentsConfirm} onOpenChange={setShowDisableCommentsConfirm}>
      <AlertDialogContent className="rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Turn off comments?</AlertDialogTitle>
          <AlertDialogDescription>
            No one will be able to comment on your posts or announcements. You can re-enable comments at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-end gap-2 space-x-0">
          <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => applyCommentsAllowFrom("off")}>Turn off</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Shared: Notifications section content (used by both mobile and desktop)
  const notificationItems: { key: NotificationPreferenceKey; label: string; description: string; icon: any }[] = [
    { key: "reviews", label: "Reviews", description: "When someone leaves you a review", icon: Star },
    { key: "likes", label: "Likes", description: "When someone likes your post, announcement, or comment", icon: Heart },
    { key: "comments", label: "Comments", description: "When someone comments on your post or announcement", icon: MessageSquare },
    { key: "followers", label: "New followers", description: "When someone starts following you", icon: UserPlus },
    { key: "booking_requests", label: "Booking requests", description: "When someone sends you a new booking request", icon: Calendar },
    { key: "booking_updates", label: "Booking updates", description: "Cancellations and status changes on bookings", icon: CalendarX },
    { key: "messages", label: "Messages", description: "When you receive a new message", icon: MessageCircle },
  ];

  const NotificationsSectionContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which notifications you want to receive
        </p>
      </div>

      <Separator />

      <div className="space-y-1">
        {notificationItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={item.key}>
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm font-medium">{item.label}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
                <Switch
                  checked={notificationPrefs[item.key]}
                  onCheckedChange={(v) => applyNotificationPref(item.key, v)}
                />
              </div>
              {idx < notificationItems.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>
    </div>
  );


  // Mobile view
  if (isMobile) {
    return (
      <div className="w-full">
        {activeSection === "main" && <MobileMainList />}
        
        {activeSection === "email" && <MobileEmailSection />}
        {activeSection === "password" && <MobilePasswordSection />}
        {activeSection === "language" && <MobileLanguageSection />}
        {activeSection === "theme" && <MobileThemeSection />}
        {activeSection === "promotion" && (
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Promotion</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Allow Muzicalist to feature your profile on its channels
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setShowPromotionInfo(true)}
                className="text-left flex-1"
              >
                <Label className="text-sm font-medium cursor-pointer">
                  Allow promotion on Muzicalist channels
                </Label>
              </button>
              <Switch checked={allowPromotion} onCheckedChange={handleTogglePromotion} />
            </div>
          </div>
        )}
        
        {activeSection === "notifications" && (
          <div className="p-4">{NotificationsSectionContent}</div>
        )}

        {activeSection === "comments" && (
          <div className="p-4">{CommentsSectionContent}</div>
        )}
        
        {activeSection === "report" && <MobileReportSection />}
        {activeSection === "logout" && <MobileLogoutSection />}
        {activeSection === "delete" && <MobileDeleteSection />}
        {activeSection === "help" && (
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Help & Support</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Find answers and get assistance
              </p>
            </div>
            <Button
              onClick={() => navigate('/help')}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Go to Help & Support
            </Button>
          </div>
        )}
        {activeSection === "about" && (
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">About</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Learn more about Muzicalist
              </p>
            </div>
            <Button
              onClick={() => navigate('/about')}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Info className="h-4 w-4 mr-2" />
              Go to About
            </Button>
          </div>
        )}

        <Dialog open={showPromotionInfo} onOpenChange={setShowPromotionInfo}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-accent" />
                Promotion on Muzicalist channels
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground leading-relaxed">
              I agree that Muzicalist may use the information and materials from my profile (including name, images, description, and announcements) for promotional purposes, both on the platform and on its social media channels, without affecting my rights to the content.
            </p>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showDisablePromotionConfirm} onOpenChange={setShowDisablePromotionConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable promotion?</AlertDialogTitle>
              <AlertDialogDescription>
                By disabling promotion, your profile will no longer be featured by Muzicalist on its social media channels or in promotional materials. This may significantly reduce your visibility, lower the number of profile views, and decrease your chances of receiving booking requests and being discovered by new clients. Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row justify-end gap-2 space-x-0">
              <AlertDialogCancel className="mt-0 flex-1 sm:flex-none">Keep enabled</AlertDialogCancel>
              <AlertDialogAction className="flex-1 sm:flex-none" onClick={() => applyPromotionChange(false)}>Disable</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {LanguageConfirmDialog}
        {ThemeConfirmDialog}
        {DisableCommentsDialog}
      </div>
    );
  }

  // Desktop view — grouped sidebar like mobile, detail panel on right
  const effectiveSection: SettingSection = activeSection === "main" ? "email" : activeSection;

  const EmailContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Email Address</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your email address is used for login and notifications
        </p>
      </div>
      <Separator />
      <div className="space-y-2">
        <Input
          value={formData.email}
          disabled
          className="bg-muted/50 text-sm"
          style={{ width: `${Math.max(formData.email.length + 2, 20)}ch` }}
        />
        <p className="text-sm text-muted-foreground">Email cannot be changed</p>
      </div>
    </div>
  );

  const PasswordContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Change Password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Password must contain at least 6 characters and include a combination of numbers, letters, and special characters (!$@%).
        </p>
      </div>
      <Separator />
      <div className="space-y-3 max-w-md">
        <div className="relative">
          <Input
            type={showCurrentPassword ? "text" : "password"}
            value={passwordData.currentPassword}
            onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            placeholder="Current password"
            className="h-12 rounded-lg pr-12"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="relative">
          <Input
            type={showNewPassword ? "text" : "password"}
            value={passwordData.newPassword}
            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            placeholder="New password"
            className="h-12 rounded-lg pr-12"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            value={passwordData.confirmPassword}
            onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            placeholder="Re-enter new password"
            className="h-12 rounded-lg pr-12"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => navigate("/reset-password")}
          className="text-sm font-semibold text-accent hover:underline"
        >
          Forgot password?
        </button>
        <Button
          onClick={handleInstagramStyleChangePassword}
          disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          className="w-full h-12 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
        >
          {isChangingPassword ? "Updating..." : "Change password"}
        </Button>
      </div>
    </div>
  );

  const LanguageContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Language</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose your preferred language
        </p>
      </div>
      <Separator />
      <div className="max-w-md">
        <Popover open={languagePopoverOpen} onOpenChange={setLanguagePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={languagePopoverOpen}
              className="w-full justify-between rounded-lg h-11"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">{currentLanguage.flag}</span>
                <span className="font-medium">{currentLanguage.label}</span>
              </span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0 rounded-lg">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  placeholder="Search language…"
                  className="pl-8 h-9 rounded-lg"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-[320px] overflow-y-auto p-1">
              {filteredLanguages.map((lang) => {
                const isActive = lang.code.toLowerCase() === currentLanguage.code.toLowerCase();
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => requestLanguageChange(lang.code, lang.label)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="flex-1 text-sm font-medium">{lang.label}</span>
                    <span className="text-xs text-muted-foreground">{lang.english}</span>
                    {isActive && <CheckCircle className="h-4 w-4 ml-1" />}
                  </button>
                );
              })}
              {filteredLanguages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No languages found</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  const ThemeContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Theme</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose between dark and light appearance
        </p>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-2 max-w-md">
        <Button
          type="button"
          variant={theme === "dark" ? "default" : "outline"}
          onClick={() => toggleTheme("dark")}
          className="h-11 rounded-lg justify-center gap-2"
        >
          <Moon className="h-4 w-4" />
          Dark
        </Button>
        <Button
          type="button"
          variant={theme === "light" ? "default" : "outline"}
          onClick={() => toggleTheme("light")}
          className="h-11 rounded-lg justify-center gap-2"
        >
          <Sun className="h-4 w-4" />
          Light
        </Button>
      </div>
    </div>
  );

  const PromotionContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Promotion</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage how Muzicalist promotes your profile
        </p>
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setShowPromotionInfo(true)}
          className="text-left group flex-1"
        >
          <Label className="text-sm font-medium cursor-pointer group-hover:text-accent">
            Allow promotion on Muzicalist channels
          </Label>
        </button>
        <Switch checked={allowPromotion} onCheckedChange={handleTogglePromotion} />
      </div>
    </div>
  );

  const HelpContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Help & Support</h2>
        <p className="text-sm text-muted-foreground mt-1">Find answers and get assistance</p>
      </div>
      <Separator />
      <Button onClick={() => navigate('/help')} className="bg-accent text-accent-foreground hover:bg-accent/90">
        <HelpCircle className="h-4 w-4 mr-2" />
        Go to Help & Support
      </Button>
    </div>
  );

  const AboutContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">About</h2>
        <p className="text-sm text-muted-foreground mt-1">Learn more about Muzicalist</p>
      </div>
      <Separator />
      <Button onClick={() => navigate('/about')} className="bg-accent text-accent-foreground hover:bg-accent/90">
        <Info className="h-4 w-4 mr-2" />
        Go to About
      </Button>
    </div>
  );

  const ReportContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Flag className="h-5 w-5 text-accent" />
          Report an Issue
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Send us feedback or report a problem</p>
      </div>
      <Separator />
      <div className="max-w-2xl space-y-3">
        <Textarea
          value={reportMessage}
          onChange={(e) => setReportMessage(e.target.value)}
          placeholder="Describe your issue or feedback..."
          className="min-h-[150px] resize-none rounded-lg"
        />
        {reportFile && (
          <p className="text-sm text-muted-foreground">Attached: {reportFile.name}</p>
        )}
        <div className="flex items-center gap-3">
          <Button onClick={handleReportSubmit} className="bg-accent text-accent-foreground hover:bg-accent/90">
            Send report
          </Button>
          <Button type="button" variant="outline" onClick={() => reportFileInputRef.current?.click()}>
            <Paperclip className="h-4 w-4 mr-2" />
            Attach file
          </Button>
          <input
            ref={reportFileInputRef}
            type="file"
            onChange={handleReportFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );

  const LogoutContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Sign Out</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign out of your account on this device</p>
      </div>
      <Separator />
      <Button variant="outline" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );

  const DeleteContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-destructive">Delete Account</h2>
        <p className="text-sm text-muted-foreground mt-1">Permanently delete your account and all data</p>
      </div>
      <Separator />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers including your profile, announcements, gallery, and calendar events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSaving}
            >
              {isSaving ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-8 px-[9px] py-0">
        {/* Grouped sidebar (same structure as mobile) */}
        <nav className="lg:w-64 shrink-0">
          <div className="flex flex-col gap-4">
            {mobileSettingGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pb-2">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = effectiveSection === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? item.destructive
                                ? "bg-destructive/10 text-destructive"
                                : "bg-accent/10 text-accent"
                              : item.destructive
                                ? "text-destructive hover:bg-destructive/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Detail panel */}
        <div className="flex-1 max-w-4xl">
          {effectiveSection === "email" && EmailContent}
          {effectiveSection === "password" && PasswordContent}
          {effectiveSection === "notifications" && NotificationsSectionContent}
          {effectiveSection === "comments" && CommentsSectionContent}
          {effectiveSection === "language" && LanguageContent}
          {effectiveSection === "theme" && ThemeContent}
          {effectiveSection === "promotion" && PromotionContent}
          {effectiveSection === "help" && HelpContent}
          {effectiveSection === "about" && AboutContent}
          {effectiveSection === "logout" && LogoutContent}
          {effectiveSection === "delete" && DeleteContent}

          {/* Promotion info dialog */}
          <Dialog open={showPromotionInfo} onOpenChange={setShowPromotionInfo}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-accent" />
                  Promotion on Muzicalist channels
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I agree that Muzicalist may use the information and materials from my profile (including name, images, description, and announcements) for promotional purposes, both on the platform and on its social media channels, without affecting my rights to the content.
              </p>
            </DialogContent>
          </Dialog>

          <AlertDialog open={showDisablePromotionConfirm} onOpenChange={setShowDisablePromotionConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disable promotion?</AlertDialogTitle>
                <AlertDialogDescription>
                  By disabling promotion, your profile will no longer be featured by Muzicalist on its social media channels or in promotional materials. This may significantly reduce your visibility, lower the number of profile views, and decrease your chances of receiving booking requests and being discovered by new clients. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row justify-end gap-2 space-x-0">
                <AlertDialogCancel className="mt-0">Keep enabled</AlertDialogCancel>
                <AlertDialogAction onClick={() => applyPromotionChange(false)}>Disable</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {LanguageConfirmDialog}
          {ThemeConfirmDialog}
          {DisableCommentsDialog}
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
