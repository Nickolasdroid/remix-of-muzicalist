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
import { LogOut, Trash2, Lock, CheckCircle, ShieldCheck, Shield, Eye, EyeOff, User, UserX, AtSign, Monitor, Flag, Paperclip, ChevronRight, Mail, Languages, Settings2, Megaphone, ChevronDown, Search, Sun, Moon, MessageCircle, HelpCircle, Info, Bell, Star, Heart, MessageSquare, UserPlus, Calendar, CalendarX, CreditCard, FileText } from "lucide-react";
import BillingSection from "@/components/BillingSection";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { setManualLanguage } from "@/i18n";
import { WORLD_LANGUAGES } from "@/lib/worldLanguages";

export type SettingSection = "main" | "account" | "system" | "email" | "password" | "language" | "theme" | "promotion" | "comments" | "notifications" | "report" | "logout" | "delete" | "help" | "about" | "billing" | "edit_profile" | "profile_visibility" | "blocked_users" | "mentions_tags" | "display_settings" | "privacy_policy" | "terms_of_service";

export type NotificationPreferenceKey =
  | "reviews"
  | "likes"
  | "comments"
  | "followers"
  | "booking_requests"
  | "booking_updates"
  | "messages"
  | "system";

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  reviews: true,
  likes: true,
  comments: true,
  followers: true,
  booking_requests: true,
  booking_updates: true,
  messages: true,
  system: true,
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
  accountType?: "user" | "artist";
}

const SettingsTab = ({
  formData,
  handleLogout,
  handleDeleteAccount,
  isSaving,
  activeSection: controlledSection,
  onSectionChange,
  accountType = "artist",
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
        
        { id: "password", label: "Change Password", icon: Lock },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "comments", label: "Comments", icon: MessageCircle },
        { id: "delete", label: "Delete Account", icon: Trash2, destructive: true },
      ],
    },
    {
      title: "Billing",
      items: [
        { id: "billing", label: "Billing", icon: CreditCard },
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
        { id: "privacy_policy", label: "Privacy Policy", icon: FileText },
        { id: "terms_of_service", label: "Terms of Service", icon: FileText },
      ],
    },
    {
      title: "Login",
      items: [
        { id: "logout", label: "Sign Out", icon: LogOut },
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
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const artistNotificationItems: { key: NotificationPreferenceKey; label: string; description: string; icon: any }[] = [
    { key: "reviews", label: "Reviews", description: "When someone leaves you a review", icon: Star },
    { key: "likes", label: "Likes", description: "When someone likes your post, announcement, or comment", icon: Heart },
    { key: "comments", label: "Comments", description: "When someone comments on your post or announcement", icon: MessageSquare },
    { key: "followers", label: "New followers", description: "When someone starts following you", icon: UserPlus },
    { key: "booking_requests", label: "Booking requests", description: "When someone sends you a new booking request", icon: Calendar },
    { key: "booking_updates", label: "Booking updates", description: "Cancellations and status changes on bookings", icon: CalendarX },
    { key: "messages", label: "Messages", description: "When you receive a new message", icon: MessageCircle },
  ];

  const userNotificationItems: { key: NotificationPreferenceKey; label: string; description: string; icon: any }[] = [
    { key: "comments", label: "Announcement comments", description: "When someone comments on one of your announcements.", icon: MessageSquare },
    { key: "messages", label: "Messages", description: "When you receive a new private message.", icon: MessageCircle },
    { key: "booking_requests", label: "Booking request status", description: "When an artist accepts or rejects your booking request.", icon: Calendar },
    { key: "booking_updates", label: "Booking status updates", description: "When there is an update regarding one of your booking requests.", icon: CalendarX },
    { key: "system", label: "System notifications", description: "Important updates regarding your account, security, policies, or platform changes.", icon: Bell },
  ];

  const notificationItems = accountType === "user" ? userNotificationItems : artistNotificationItems;

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


  // Unified view (mobile = Instagram-style master/detail, desktop = three-column)
  const defaultDesktopSection: SettingSection = "edit_profile";
  const effectiveSection: SettingSection = activeSection === "main" ? (isMobile ? "main" : defaultDesktopSection) : activeSection;


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

  const PrivacyPolicyContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Privacy Policy</h2>
        <p className="text-sm text-muted-foreground mt-1">How we collect, use and protect your data</p>
      </div>
      <Separator />
      <Button onClick={() => navigate('/privacy-policy')} className="bg-accent text-accent-foreground hover:bg-accent/90">
        <FileText className="h-4 w-4 mr-2" />
        Open Privacy Policy
      </Button>
    </div>
  );

  const TermsOfServiceContent = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Terms of Service</h2>
        <p className="text-sm text-muted-foreground mt-1">The rules and conditions for using Muzicalist</p>
      </div>
      <Separator />
      <Button onClick={() => navigate('/terms-of-service')} className="bg-accent text-accent-foreground hover:bg-accent/90">
        <FileText className="h-4 w-4 mr-2" />
        Open Terms of Service
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
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogTrigger asChild>
          <Button variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

  // Instagram-style grouped sections for the desktop settings sidebar
  const desktopSettingGroups: {
    title: string;
    items: { id: SettingSection; label: string; icon: any; destructive?: boolean }[];
  }[] = [
    {
      title: "Account",
      items: [
        { id: "edit_profile", label: "Edit Profile", icon: User },
        { id: "password", label: "Password & Security", icon: Lock },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "billing", label: "Billing & Subscription", icon: CreditCard },
      ],
    },
    {
      title: "Privacy",
      items: [
        { id: "profile_visibility", label: "Profile Visibility", icon: Shield },
        { id: "blocked_users", label: "Blocked Users", icon: UserX },
        { id: "comments", label: "Comments", icon: MessageCircle },
        { id: "mentions_tags", label: "Mentions & Tags", icon: AtSign },
      ],
    },
    {
      title: "Preferences",
      items: [
        { id: "language", label: "Language", icon: Languages },
        { id: "theme", label: "Theme", icon: Sun },
        { id: "display_settings", label: "Display Settings", icon: Monitor },
      ],
    },
    {
      title: "Support",
      items: [
        { id: "help", label: "Help Center", icon: HelpCircle },
        { id: "report", label: "Report a Problem", icon: Flag },
        { id: "about", label: "About Muzicalist", icon: Info },
        { id: "privacy_policy", label: "Privacy Policy", icon: FileText },
        { id: "terms_of_service", label: "Terms of Service", icon: FileText },
      ],
    },
    {
      title: "Danger Zone",
      items: [
        { id: "delete", label: "Delete Account", icon: Trash2, destructive: true },
      ],
    },
  ];

  // For regular User accounts, hide artist/subscription-only sections to keep
  // the settings menu minimal and focused on essential account management.
  const userHiddenSections = new Set<SettingSection>([
    "billing",
    "comments",
    "mentions_tags",
    "display_settings",
    "about",
    "promotion",
  ]);
  const visibleGroups = accountType === "user"
    ? desktopSettingGroups
        .map((g) => ({ ...g, items: g.items.filter((i) => !userHiddenSections.has(i.id)) }))
        .filter((g) => g.items.length > 0)
    : desktopSettingGroups;




  return <DesktopSettingsLayout
    groups={visibleGroups}
    activeSection={effectiveSection}
    setActiveSection={setActiveSection}
    isMobile={isMobile}
    contentMap={{
      
      password: PasswordContent,
      notifications: NotificationsSectionContent,
      comments: CommentsSectionContent,
      language: LanguageContent,
      theme: ThemeContent,
      promotion: PromotionContent,
      help: HelpContent,
      report: ReportContent,
      about: AboutContent,
      privacy_policy: PrivacyPolicyContent,
      terms_of_service: TermsOfServiceContent,
      logout: LogoutContent,
      delete: DeleteContent,
      billing: (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" />
              Billing & Subscription
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your billing details, invoices and subscription
            </p>
          </div>
          <Separator />
          <div className="max-w-3xl">
            <BillingSection />
          </div>
        </div>
      ),
      edit_profile: <EditProfilePanel />,

      profile_visibility: (
        <ComingSoonPanel
          icon={Shield}
          title="Profile Visibility"
          description="Control who can find and view your profile, contact details and availability. More granular visibility options are coming soon."
        />
      ),
      blocked_users: (
        <ComingSoonPanel
          icon={UserX}
          title="Blocked Users"
          description="Manage the list of users you have blocked. Blocked users won't be able to view your profile, message you or interact with your content. This area is coming soon."
        />
      ),
      mentions_tags: (
        <ComingSoonPanel
          icon={AtSign}
          title="Mentions & Tags"
          description="Decide who is allowed to mention or tag you in posts, announcements and comments. Configurable rules are on the way."
        />
      ),
      display_settings: (
        <ComingSoonPanel
          icon={Monitor}
          title="Display Settings"
          description="Fine-tune density, font size and motion. Additional display options will appear here soon."
        />
      ),
    }}
    extraDialogs={
      <>
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
      </>
    }
  />;
};

// --- Desktop layout sub-components ---

const ComingSoonPanel = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: any;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <Icon className="h-5 w-5 text-accent" />
        {title}
      </h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
    </div>
    <Separator />
    {actionLabel && onAction ? (
      <Button onClick={onAction} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg">
        {actionLabel}
      </Button>
    ) : (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground max-w-2xl">
        We're working on this section. It will be available in an upcoming update.
      </div>
    )}
  </div>
);

const EditProfilePanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<string>("prefer_not_to_say");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { data: rows } = await (supabase as any).rpc("get_my_full_profile");
      const data = Array.isArray(rows) ? rows[0] : null;
      if (data) {
        setEmail((data as any).email || user.email || "");
        setFirstName((data as any).first_name || "");
        setLastName((data as any).last_name || "");
        setGender((data as any).gender || "prefer_not_to_say");
      } else {
        setEmail(user.email || "");
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: "Error", description: "First name and last name are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ first_name: firstName.trim(), last_name: lastName.trim(), gender } as any)
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated successfully." });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <User className="h-5 w-5 text-accent" />
          Edit Profile
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Update your personal information. Email cannot be changed.
        </p>
      </div>
      <Separator />
      <div className="max-w-xl space-y-5">
        <div className="space-y-2">
          <Label htmlFor="ep-email">Email</Label>
          <Input id="ep-email" type="email" value={email} disabled readOnly className="rounded-lg bg-muted/40 cursor-not-allowed" />
          <p className="text-xs text-muted-foreground">Your email address cannot be modified.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ep-first">First name</Label>
            <Input id="ep-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={loading} className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-last">Last name</Label>
            <Input id="ep-last" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={loading} className="rounded-lg" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Sex</Label>
          <RadioGroup value={gender} onValueChange={setGender} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { v: "male", l: "Male" },
              { v: "female", l: "Female" },
              { v: "other", l: "Other" },
              { v: "prefer_not_to_say", l: "Prefer not to say" },
            ].map((opt) => (
              <label
                key={opt.v}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <RadioGroupItem value={opt.v} id={`ep-gender-${opt.v}`} />
                <span className="text-sm">{opt.l}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const DesktopSettingsLayout = ({
  groups,
  activeSection,
  setActiveSection,
  contentMap,
  extraDialogs,
  isMobile,
}: {
  groups: { title: string; items: { id: SettingSection; label: string; icon: any; destructive?: boolean }[] }[];
  activeSection: SettingSection;
  setActiveSection: (s: SettingSection) => void;
  contentMap: Partial<Record<SettingSection, React.ReactNode>>;
  extraDialogs: React.ReactNode;
  isMobile: boolean;
}) => {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const filteredGroups = q
    ? groups
        .map((g) => ({ ...g, items: g.items.filter((it) => it.label.toLowerCase().includes(q)) }))
        .filter((g) => g.items.length > 0)
    : groups;

  // Mobile master/detail: show list when "main", show content otherwise
  const showNav = !isMobile || activeSection === "main";
  const showContent = !isMobile || activeSection !== "main";

  return (
    <div className="w-full lg:fixed lg:inset-y-0 lg:left-64 lg:right-0 lg:z-20 bg-background">
      <div className="flex flex-col lg:flex-row gap-0 px-0 py-0 lg:h-full">
        {/* Settings navigation panel — Instagram-style, flush against main sidebar */}
        {showNav && (
          <nav className="w-full lg:w-80 lg:shrink-0 lg:h-full lg:overflow-y-auto lg:border-r lg:border-border bg-background">
            <div className="bg-transparent px-0 pt-2 pb-0 lg:p-5">
              <h1 className="hidden lg:block text-2xl lg:text-lg font-semibold text-foreground px-4 lg:px-1 mb-3">Settings</h1>
              <div className="relative mb-3 lg:mb-4 px-4 lg:px-0">
                <Search className="absolute left-7 lg:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search settings…"
                  className="pl-9 h-10 rounded-lg bg-background/50 border-border focus-visible:ring-accent"
                />
              </div>
              <div className="flex flex-col gap-3 lg:gap-4">
                {filteredGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 lg:px-2 pb-1.5 lg:pb-1.5">
                      {group.title}
                    </h3>
                    <ul className="space-y-0 lg:space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = !isMobile && activeSection === item.id;
                        const baseTransition = "transition-all duration-200 ease-out";
                        const activeCls = item.destructive
                          ? "bg-destructive/10 text-destructive ring-1 ring-destructive/30"
                          : "bg-accent/15 text-accent ring-1 ring-accent/30 shadow-[0_0_0_1px_hsl(var(--accent)/0.05)]";
                        const idleCls = item.destructive
                          ? "text-destructive/80 hover:bg-destructive/5 hover:text-destructive active:bg-destructive/10"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground active:bg-muted/70";
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => setActiveSection(item.id)}
                              className={`w-full flex items-center justify-between gap-3 px-4 lg:px-3 py-2.5 lg:py-2 rounded-none lg:rounded-lg text-sm font-semibold lg:font-medium ${baseTransition} lg:hover:translate-x-0.5 ${
                                isActive ? activeCls : idleCls
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Icon
                                  className={`h-5 w-5 lg:h-4 lg:w-4 shrink-0 ${baseTransition} ${
                                    isActive
                                      ? item.destructive
                                        ? "text-destructive"
                                        : "text-accent"
                                      : item.destructive
                                        ? "text-destructive"
                                        : "text-muted-foreground"
                                  }`}
                                />
                                <span className="flex-1 text-left truncate">{item.label}</span>
                              </div>
                              {isMobile && (
                                <ChevronRight className={`h-5 w-5 shrink-0 ${item.destructive ? "text-destructive/60" : "text-muted-foreground"}`} strokeWidth={2} />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {filteredGroups.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No settings match "{search}"</p>
                )}
              </div>
            </div>
          </nav>
        )}

        {/* Dynamic content panel */}
        {showContent && (
          <div className="flex-1 min-w-0 lg:h-full lg:overflow-y-auto">
            <div className="bg-background px-4 py-4 lg:p-10 lg:min-h-full lg:max-w-4xl lg:mx-auto">
              <div key={activeSection} className="animate-fade-in">
                {contentMap[activeSection] ?? contentMap.edit_profile}
              </div>
              {extraDialogs}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsTab;
