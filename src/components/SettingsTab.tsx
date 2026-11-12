import { useState, useRef, useEffect, useMemo } from "react";
import { savePromotionChoice } from "@/lib/promotionConsent";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LogOut, Trash2, Lock, CheckCircle, ShieldCheck, Shield, Eye, EyeOff, User, UserX, AtSign, Monitor, Flag, Paperclip, ChevronRight, Mail, Languages, Settings2, Megaphone, ChevronDown, Search, Sun, Moon, MessageCircle, HelpCircle, Info, Bell, BookOpenCheck, Star, Heart, MessageSquare, UserPlus, Calendar, CalendarX, CreditCard, FileText, FileSignature, Check, X as XIcon, Loader2 } from "lucide-react";
import BillingSection from "@/components/BillingSection";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { setManualLanguage } from "@/i18n";
import { WORLD_LANGUAGES } from "@/lib/worldLanguages";
import { getCountryName } from "@/lib/countryFlags";
import VerificationCard from "@/components/VerificationCard";
import ReportProblemForm from "@/components/ReportProblemForm";
import BlockedUsersPanel from "@/components/BlockedUsersPanel";
import ContractDetailsForm from "@/components/ContractDetailsForm";


export type SettingSection = "main" | "account" | "system" | "email" | "password" | "language" | "theme" | "promotion" | "comments" | "notifications" | "report" | "logout" | "delete" | "help" | "about" | "billing" | "edit_profile" | "profile_visibility" | "blocked_users" | "mentions_tags" | "display_settings" | "privacy_policy" | "terms_of_service" | "verification" | "rules" | "contract_details";

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

const SUPPORT_DESTINATIONS: Partial<Record<SettingSection, string>> = {
  help: "/help",
  rules: "/rules",
  about: "/about",
  privacy_policy: "/privacy-policy",
  terms_of_service: "/terms-of-service",
};

type CommentsAllowFrom = "everyone" | "following" | "off";
type MentionsAllowFrom = "everyone" | "artists" | "following" | "nobody";

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

/** Shared look for the settings pages: filled grey fields, grey option rows, pill buttons. */
const SET_FIELD = "h-12 rounded-lg border-0 bg-foreground/[0.07] text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-100 disabled:text-muted-foreground";
const SET_OPTION = (active: boolean) =>
  `flex items-start gap-3 rounded-lg p-3.5 cursor-pointer transition-colors ${active ? "bg-foreground/[0.12]" : "bg-foreground/[0.05] hover:bg-foreground/[0.08]"}`;
const SET_PRIMARY_BTN = "h-12 rounded-full bg-accent px-8 text-base font-bold text-accent-foreground hover:bg-accent hover:scale-[1.02] transition-transform";
const SET_OUTLINE_BTN = "h-11 rounded-full border border-foreground/25 bg-transparent px-6 text-sm font-bold text-foreground hover:border-foreground hover:bg-transparent";
const SET_DANGER_BTN = "h-11 rounded-full bg-destructive px-6 text-sm font-bold text-destructive-foreground hover:bg-destructive/90";

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
  const [currentPasswordValid, setCurrentPasswordValid] = useState<null | boolean>(null);
  const [isCheckingCurrentPassword, setIsCheckingCurrentPassword] = useState(false);
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
  const [allowPromotion, setAllowPromotion] = useState(false);
  const [commentsAllowFrom, setCommentsAllowFrom] = useState<CommentsAllowFrom>("everyone");
  const [mentionsAllowFrom, setMentionsAllowFrom] = useState<MentionsAllowFrom>("everyone");
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
        .select("allow_promotion, comments_allow_from, comments_allow_gifs, mentions_allow_from, notification_preferences")
        .eq("id", user.id)
        .maybeSingle();
      if (data && typeof (data as any).allow_promotion === "boolean") {
        setAllowPromotion((data as any).allow_promotion);
      }
      if (data && (data as any).comments_allow_from) {
        setCommentsAllowFrom((data as any).comments_allow_from as CommentsAllowFrom);
      }
      if (data && (data as any).mentions_allow_from) {
        setMentionsAllowFrom((data as any).mentions_allow_from as MentionsAllowFrom);
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

  const applyMentionsAllowFrom = async (next: MentionsAllowFrom) => {
    if (next === mentionsAllowFrom) return;
    const prev = mentionsAllowFrom;
    setMentionsAllowFrom(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ mentions_allow_from: next } as any)
      .eq("id", user.id);
    if (error) {
      setMentionsAllowFrom(prev);
      toast({ title: "Error", description: "Could not update mentions preference.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Mentions preference updated." });
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

  const handleTogglePromotion = async (next: boolean) => {
    setAllowPromotion(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await savePromotionChoice(user.id, next);
    if (error) {
      setAllowPromotion(!next);
      toast({ title: "Error", description: "Could not update promotion preference.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: next ? "Promotion enabled." : "Promotion disabled." });
    }
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

  useEffect(() => {
    const value = passwordData.currentPassword;
    if (!value || !formData.email) {
      setCurrentPasswordValid(null);
      return;
    }
    setIsCheckingCurrentPassword(true);
    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: value,
        });
        setCurrentPasswordValid(!error);
      } catch {
        setCurrentPasswordValid(false);
      } finally {
        setIsCheckingCurrentPassword(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [passwordData.currentPassword, formData.email]);

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
        ...(accountType === "artist" ? [{ id: "verification" as SettingSection, label: "Identity Verification", icon: ShieldCheck }] : []),
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
        { id: "rules", label: "Rules", icon: BookOpenCheck },
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
        <p className="text-sm text-muted-foreground">
          Your email address is used for login and notifications
        </p>
      </div>
      <Input 
        value={formData.email} 
        disabled 
        className={SET_FIELD} 
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
    <div className="px-4 pt-2 pb-2 space-y-6">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Password must contain at least 6 characters and include a combination of numbers, letters, and special characters (!$@%).
      </p>



      <div className="space-y-3">
        <div>
          <div className="relative">
            <Input
              type={showCurrentPassword ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={e => {
                setPasswordData({ ...passwordData, currentPassword: e.target.value });
                setCurrentPasswordValid(null);
              }}
              placeholder="Current password"
              className={`${SET_FIELD} pr-20`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isCheckingCurrentPassword ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : currentPasswordValid === true ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : currentPasswordValid === false ? (
                <XIcon className="h-4 w-4 text-destructive" />
              ) : null}
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {currentPasswordValid === false && (
            <p className="mt-1.5 text-xs text-destructive">Current password is incorrect.</p>
          )}
          {currentPasswordValid === true && (
            <p className="mt-1.5 text-xs text-green-500">Current password verified.</p>
          )}
        </div>

        <div className="relative">
          <Input
            type={showNewPassword ? "text" : "password"}
            value={passwordData.newPassword}
            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            placeholder="New password"
            disabled={currentPasswordValid !== true}
            className={`${SET_FIELD} pr-12 disabled:opacity-50`}
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
            disabled={currentPasswordValid !== true}
            className={`${SET_FIELD} pr-12 disabled:opacity-50`}
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
        className="text-sm font-bold text-foreground underline-offset-4 hover:underline"
      >
        Forgot password?
      </button>

      <Button
        onClick={handleInstagramStyleChangePassword}
        disabled={isChangingPassword || currentPasswordValid !== true || !passwordData.newPassword || !passwordData.confirmPassword}
        className={`w-full ${SET_PRIMARY_BTN}`}
      >
        {isChangingPassword ? "Updating..." : "Change password"}
      </Button>
    </div>
  );

  // Mobile: Report section
  const MobileReportSection = () => (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Send us feedback or report a problem
        </p>
      </div>

      <ReportProblemForm />
    </div>
  );


  // Mobile: Language section
  const MobileLanguageSection = () => {
    return (
      <div className="p-4 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
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
        <p className="text-sm text-muted-foreground">
          Choose between dark and light appearance
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => toggleTheme("dark")}
          className={`h-11 justify-center gap-2 rounded-full text-sm font-medium text-foreground ${theme === "dark" ? "bg-foreground/[0.24] hover:bg-foreground/[0.24]" : "bg-foreground/[0.07] hover:bg-foreground/[0.12]"}`}
        >
          <Moon className="h-4 w-4" />
          Dark
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => toggleTheme("light")}
          className={`h-11 justify-center gap-2 rounded-full text-sm font-medium text-foreground ${theme === "light" ? "bg-foreground/[0.24] hover:bg-foreground/[0.24]" : "bg-foreground/[0.07] hover:bg-foreground/[0.12]"}`}
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
        <p className="text-sm text-muted-foreground">
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
        <p className="text-sm text-muted-foreground">
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
        <p className="text-sm text-muted-foreground">
          Choose who can comment on your posts and announcements
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Allow comments from</Label>
        <RadioGroup
          value={commentsAllowFrom}
          onValueChange={(v) => handleCommentsAllowFromChange(v as CommentsAllowFrom)}
          className="space-y-2"
        >
          <label
            htmlFor="comments-everyone"
            className={SET_OPTION(commentsAllowFrom === "everyone")}
          >
            <RadioGroupItem value="everyone" id="comments-everyone" className="mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium">Everyone</div>
              <div className="text-xs text-muted-foreground mt-0.5">Anyone on Muzicalist can comment</div>
            </div>
          </label>

          <label
            htmlFor="comments-following"
            className={SET_OPTION(commentsAllowFrom === "following")}
          >
            <RadioGroupItem value="following" id="comments-following" className="mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium">People you follow</div>
              <div className="text-xs text-muted-foreground mt-0.5">Only accounts you follow can comment</div>
            </div>
          </label>

          <label
            htmlFor="comments-off"
            className={SET_OPTION(commentsAllowFrom === "off")}
          >
            <RadioGroupItem value="off" id="comments-off" className="mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium">Off</div>
              <div className="text-xs text-muted-foreground mt-0.5">No one can comment on your content</div>
            </div>
          </label>
        </RadioGroup>
      </div>

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
        <p className="text-sm text-muted-foreground">
          Choose which notifications you want to receive
        </p>
      </div>

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
        <p className="text-sm text-muted-foreground">
          Your email address is used for login and notifications
        </p>
      </div>
      <div className="space-y-2">
        <Input
          value={formData.email}
          disabled
          className={SET_FIELD}
          style={{ width: `${Math.max(formData.email.length + 2, 20)}ch` }}
        />
        <p className="text-sm text-muted-foreground">Email cannot be changed</p>
      </div>
    </div>
  );

  const PasswordContent = (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Password must contain at least 6 characters and include a combination of numbers, letters, and special characters (!$@%).
        </p>
      </div>
      <div className="space-y-3 max-w-md">
        <div>
          <div className="relative">
            <Input
              type={showCurrentPassword ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={e => {
                setPasswordData({ ...passwordData, currentPassword: e.target.value });
                setCurrentPasswordValid(null);
              }}
              placeholder="Current password"
              className={`${SET_FIELD} pr-20`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isCheckingCurrentPassword ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : currentPasswordValid === true ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : currentPasswordValid === false ? (
                <XIcon className="h-4 w-4 text-destructive" />
              ) : null}
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {currentPasswordValid === false && (
            <p className="mt-1.5 text-xs text-destructive">Current password is incorrect.</p>
          )}
          {currentPasswordValid === true && (
            <p className="mt-1.5 text-xs text-green-500">Current password verified.</p>
          )}
        </div>
        <div className="relative">
          <Input
            type={showNewPassword ? "text" : "password"}
            value={passwordData.newPassword}
            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            placeholder="New password"
            disabled={currentPasswordValid !== true}
            className={`${SET_FIELD} pr-12 disabled:opacity-50`}
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
            disabled={currentPasswordValid !== true}
            className={`${SET_FIELD} pr-12 disabled:opacity-50`}
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
          className="text-sm font-bold text-foreground underline-offset-4 hover:underline"
        >
          Forgot password?
        </button>
        <Button
          onClick={handleInstagramStyleChangePassword}
          disabled={isChangingPassword || currentPasswordValid !== true || !passwordData.newPassword || !passwordData.confirmPassword}
          className={`w-full ${SET_PRIMARY_BTN}`}
        >
          {isChangingPassword ? "Updating..." : "Change password"}
        </Button>
      </div>
    </div>
  );

  const LanguageContent = (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Choose your preferred language
        </p>
      </div>
      <div className="max-w-md">
        <Popover open={languagePopoverOpen} onOpenChange={setLanguagePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={languagePopoverOpen}
              className="h-12 w-full justify-between rounded-lg border-0 bg-foreground/[0.07] px-4 hover:bg-foreground/[0.1]"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">{currentLanguage.flag}</span>
                <span className="font-medium">{currentLanguage.label}</span>
              </span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0 rounded-lg">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  placeholder="Search language…"
                  className="h-9 rounded-full border-0 bg-foreground/[0.07] pl-8 focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:ring-offset-0"
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
                      isActive ? "bg-foreground/[0.1] text-foreground" : "hover:bg-foreground/[0.07]"
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="flex-1 text-sm font-medium">{lang.label}</span>
                    <span className="text-xs text-muted-foreground">{lang.english}</span>
                    {isActive && <Check className="ml-1 h-4 w-4 text-foreground" />}
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
        <p className="text-sm text-muted-foreground">
          Choose between dark and light appearance
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 max-w-md">
        <Button
          type="button"
          variant="ghost"
          onClick={() => toggleTheme("dark")}
          className={`h-11 justify-center gap-2 rounded-full text-sm font-medium text-foreground ${theme === "dark" ? "bg-foreground/[0.24] hover:bg-foreground/[0.24]" : "bg-foreground/[0.07] hover:bg-foreground/[0.12]"}`}
        >
          <Moon className="h-4 w-4" />
          Dark
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => toggleTheme("light")}
          className={`h-11 justify-center gap-2 rounded-full text-sm font-medium text-foreground ${theme === "light" ? "bg-foreground/[0.24] hover:bg-foreground/[0.24]" : "bg-foreground/[0.07] hover:bg-foreground/[0.12]"}`}
        >
          <Sun className="h-4 w-4" />
          Light
        </Button>
      </div>
    </div>
  );

  const PromotionContent = (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="allow-promotion" className="text-sm font-medium">
            Allow promotion on Muzicalist channels
          </Label>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Muzicalist may post about you on its Instagram, Facebook and TikTok, using your name, photos and profile description. We tag you and link to your profile. We'll remove a post about you if you ask.
          </p>
        </div>
        <Switch id="allow-promotion" checked={allowPromotion} onCheckedChange={handleTogglePromotion} />
      </div>
    </div>
  );

  const ReportContent = (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Send us feedback or report a problem</p>
      </div>
      <div className="max-w-2xl">
        <ReportProblemForm />
      </div>

    </div>
  );

  const LogoutContent = (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
      </div>
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className={SET_OUTLINE_BTN}>
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
        <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className={SET_DANGER_BTN}>
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
        { id: "edit_profile", label: "Account details", icon: User },
        { id: "password", label: "Password & Security", icon: Lock },
        ...(accountType === "artist" ? [{ id: "verification" as SettingSection, label: "Identity Verification", icon: ShieldCheck }] : []),
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "billing", label: "Billing & Subscription", icon: CreditCard },
        { id: "contract_details", label: "Contract Details", icon: FileSignature },
      ],
    },
    {
      title: "Privacy",
      items: [
        { id: "profile_visibility", label: "Profile Visibility", icon: Shield },
        { id: "blocked_users", label: "Blocked Users", icon: UserX },
        { id: "comments", label: "Comments", icon: MessageCircle },
        { id: "mentions_tags", label: "Mentions & Tags", icon: AtSign },
        ...(accountType === "artist" ? [{ id: "promotion" as SettingSection, label: "Promotion", icon: Megaphone }] : []),
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
        { id: "rules", label: "Rules", icon: BookOpenCheck },
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

  const VerificationPanel = () => {
    const [uid, setUid] = useState<string | null>(null);
    useEffect(() => {
      supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    }, []);
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Verify your identity to earn a verified badge on your public profile and build trust with clients.
          </p>
        </div>
        <div className="max-w-3xl -mx-4 md:mx-0">
          {uid ? <VerificationCard profileId={uid} /> : null}
        </div>
      </div>
    );
  };


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
      report: ReportContent,
      logout: LogoutContent,
      delete: DeleteContent,
      billing: (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Manage your billing details, invoices and subscription
            </p>
          </div>
          <div className="max-w-3xl">
            <BillingSection />
          </div>
        </div>
      ),
      edit_profile: <EditProfilePanel />,
      contract_details: (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              {accountType === "artist"
                ? "The details that appear on the contracts generated when an organizer accepts your offer. Optional: without them, contracts use the name from your profile."
                : "The details that appear on the contracts generated when you accept an artist's offer."}
            </p>
          </div>
          <div className="max-w-2xl">
            <ContractDetailsForm showSaveButton variant={accountType === "artist" ? "artist" : "organizer"} />
          </div>
        </div>
      ),

      profile_visibility: (
        <ComingSoonPanel
          icon={Shield}
          title="Profile Visibility"
          description="Control who can find and view your profile, contact details and availability. More granular visibility options are coming soon."
        />
      ),
      blocked_users: <BlockedUsersPanel />,

      mentions_tags: (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Decide who is allowed to mention or tag you in posts, announcements and comments
            </p>
          </div>

          <div className="space-y-3 max-w-3xl">
            <Label className="text-sm font-medium">Who can mention or tag you?</Label>
            <RadioGroup
              value={mentionsAllowFrom}
              onValueChange={(v) => applyMentionsAllowFrom(v as MentionsAllowFrom)}
              className="space-y-2"
            >
              {([
                { value: "everyone", label: "Everyone", hint: "Anyone can mention or tag you." },
                { value: "artists", label: "Artists", hint: "Only artists can mention or tag you." },
                { value: "following", label: "People I follow", hint: "Only people you follow can mention or tag you." },
                { value: "nobody", label: "No one", hint: "Nobody can mention or tag you." },
              ] as { value: MentionsAllowFrom; label: string; hint: string }[]).map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`mentions-${opt.value}`}
                  className={SET_OPTION(mentionsAllowFrom === opt.value)}
                >
                  <RadioGroupItem value={opt.value} id={`mentions-${opt.value}`} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.hint}</div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      ),
      display_settings: (
        <ComingSoonPanel
          icon={Monitor}
          title="Display Settings"
          description="Fine-tune density, font size and motion. Additional display options will appear here soon."
        />
      ),
      verification: <VerificationPanel />,
    }}
    extraDialogs={
      <>
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
      <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
    </div>
    {actionLabel && onAction ? (
      <Button onClick={onAction} className={SET_PRIMARY_BTN}>
        {actionLabel}
      </Button>
    ) : (
      <div className="max-w-2xl rounded-lg bg-foreground/[0.05] p-6 text-sm text-muted-foreground">
        We're working on this section. It will be available in an upcoming update.
      </div>
    )}
  </div>
);

const EditProfilePanel = () => {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [county, setCounty] = useState("");
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
        setPhone((data as any).phone || "");
        setFirstName((data as any).first_name || "");
        setLastName((data as any).last_name || "");
        setCountry((data as any).country || "");
        setCounty((data as any).county || "");
      } else {
        setEmail(user.email || "");
      }
      setLoading(false);
    })();
  }, []);


  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          The details of your account. Email cannot be changed.
        </p>
      </div>
      <div className="max-w-xl space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-bold" htmlFor="ep-email">Email</Label>
          <Input id="ep-email" type="email" value={email} disabled readOnly className={SET_FIELD} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-bold" htmlFor="ep-phone">Phone</Label>
          <Input id="ep-phone" type="tel" value={phone} disabled readOnly className={SET_FIELD} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-bold notranslate" translate="no" htmlFor="ep-country">{(i18n.language || "en").toLowerCase().startsWith("ro") ? "Țară" : "Country"}</Label>
            <Input
              id="ep-country"
              value={country ? getCountryName(country) : ""}
              disabled
              readOnly
              placeholder="Not set"
              className={SET_FIELD}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold" htmlFor="ep-county">Region</Label>
            <Input
              id="ep-county"
              value={county || ""}
              disabled
              readOnly
              placeholder="Not set"
              className={SET_FIELD}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-bold" htmlFor="ep-first">First name</Label>
            <Input id="ep-first" value={firstName} disabled readOnly className={SET_FIELD} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold" htmlFor="ep-last">Last name</Label>
            <Input id="ep-last" value={lastName} disabled readOnly className={SET_FIELD} />
          </div>
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const filteredGroups = q
    ? groups
        .map((g) => ({ ...g, items: g.items.filter((it) => it.label.toLowerCase().includes(q)) }))
        .filter((g) => g.items.length > 0)
    : groups;

  const activeTitle = groups.flatMap((g) => g.items).find((it) => it.id === activeSection)?.label;

  // Mobile master/detail: show list when "main", show content otherwise
  const showNav = !isMobile || activeSection === "main";
  const showContent = !isMobile || activeSection !== "main";

  return (
    <div className="w-full bg-background lg:fixed lg:w-auto lg:bottom-2 lg:left-[356px] lg:right-2 lg:top-[72px] lg:z-20 lg:overflow-hidden lg:rounded-lg">
      <div className="flex flex-col lg:flex-row gap-0 px-0 py-0 lg:h-full">
        {/* Settings navigation panel — Instagram-style, flush against main sidebar */}
        {showNav && (
          <nav className="w-full bg-background lg:h-full lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:[scrollbar-width:thin]">
            <div className="bg-transparent px-0 pt-2 pb-6 lg:px-3 lg:py-6">
              <h1 className="hidden lg:block px-3 mb-4 text-2xl font-bold tracking-[-0.01em] text-foreground">{t('navigation.settings')}</h1>
              <div className="relative mb-4 px-4 lg:px-0">
                <Search className="absolute left-8 lg:left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search settings…"
                  className="h-10 rounded-full border-0 bg-foreground/[0.07] pl-10 text-sm focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:ring-offset-0"
                />
              </div>
              <div className="flex flex-col gap-5">
                {filteredGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="px-4 pb-1 text-base font-bold text-foreground lg:px-3 lg:text-sm">
                      {group.title}
                    </h3>
                    <ul className="space-y-0 lg:space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = !isMobile && activeSection === item.id;
                        const baseTransition = "transition-colors";
                        const activeCls = item.destructive
                          ? "bg-foreground/[0.1] text-destructive"
                          : "bg-foreground/[0.1] text-foreground";
                        const idleCls = item.destructive
                          ? "text-destructive hover:bg-foreground/[0.07]"
                          : "text-foreground lg:text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground";
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => {
                                const supportDestination = SUPPORT_DESTINATIONS[item.id];
                                if (supportDestination) {
                                  navigate(supportDestination);
                                  return;
                                }
                                setActiveSection(item.id);
                              }}
                              className={`w-full flex items-center justify-between gap-3 px-4 lg:px-3 py-3 lg:py-2.5 rounded-none lg:rounded-md text-base lg:text-sm font-normal lg:font-medium ${baseTransition} ${
                                isActive ? activeCls : idleCls
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Icon
                                  className={`h-5 w-5 lg:h-4 lg:w-4 shrink-0 ${baseTransition} ${
                                    isActive
                                      ? item.destructive
                                        ? "text-destructive"
                                        : "text-foreground"
                                      : item.destructive
                                        ? "text-destructive"
                                        : "text-muted-foreground"
                                  }`}
                                />
                                <span className="flex-1 text-left truncate">{item.label}</span>
                              </div>
                              {isMobile && (
                                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={2} />
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
          <div className="flex-1 min-w-0 lg:h-full lg:overflow-y-auto lg:bg-foreground/[0.03] lg:[scrollbar-width:thin]">
            <div className="px-4 pt-4 pb-8 lg:mx-auto lg:min-h-full lg:max-w-3xl lg:px-10 lg:py-10">
              {!isMobile && activeTitle && (
                <h2 key={`t-${activeSection}`} className="mb-3 text-[2rem] font-bold leading-tight tracking-[-0.02em] text-foreground lg:text-5xl">{activeTitle}</h2>
              )}
              <div key={activeSection} className="settings-content animate-fade-in">
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
