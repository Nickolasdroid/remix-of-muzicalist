import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LogOut, Trash2, Lock, CheckCircle, ShieldCheck, Eye, EyeOff, User, Flag, Paperclip, ChevronRight, Mail, Languages, Settings2, Megaphone, ChevronDown, Search, Sun, Moon, MessageCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { setManualLanguage } from "@/i18n";
import { WORLD_LANGUAGES } from "@/lib/worldLanguages";

export type SettingSection = "main" | "account" | "system" | "email" | "password" | "language" | "theme" | "promotion" | "comments" | "report" | "logout" | "delete";

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
        .select("allow_promotion, comments_allow_from, comments_allow_gifs")
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
    })();
  }, []);

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

  // Mobile setting items
  const mobileSettingItems = [
    { id: "email" as const, label: "Email Address", icon: Mail },
    { id: "password" as const, label: "Change Password", icon: Lock },
    { id: "language" as const, label: "Language", icon: Languages },
    { id: "theme" as const, label: "Theme", icon: Sun },
    { id: "promotion" as const, label: "Promotion", icon: Megaphone },
    { id: "comments" as const, label: "Comments", icon: MessageCircle },
    
    { id: "logout" as const, label: "Sign Out", icon: LogOut },
    { id: "delete" as const, label: "Delete Account", icon: Trash2, destructive: true },
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
      id: "comments",
      label: "Comments",
      icon: MessageCircle
    }
  ];

  // Mobile: Main list view
  const MobileMainList = () => (
    <div className="flex flex-col">
      {mobileSettingItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex items-center justify-between px-4 py-4 ${
              index !== mobileSettingItems.length - 1 ? "border-b border-border" : ""
            } ${item.destructive ? "text-destructive" : "text-foreground"}`}
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

  // Mobile: Password section
  const MobilePasswordSection = () => (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Change Password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Update your password to keep your account secure
        </p>
      </div>

      {/* Step 1: Verify current password */}
      <div className={`p-4 rounded-lg border-2 ${currentPasswordVerified ? 'border-green-500/50 bg-green-500/10' : 'border-accent/30'}`}>
        <div className="flex items-center justify-between mb-3">
          <Label className="flex items-center gap-2 text-sm">
            {currentPasswordVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <ShieldCheck className="h-4 w-4 text-muted-foreground" />}
            Step 1: Verify Current Password
          </Label>
          {currentPasswordVerified && <span className="text-xs text-green-500 font-medium">Verified</span>}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input 
              type={showCurrentPassword ? "text" : "password"} 
              value={passwordData.currentPassword} 
              onChange={e => {
                setPasswordData({ ...passwordData, currentPassword: e.target.value });
                if (currentPasswordVerified) setCurrentPasswordVerified(false);
              }} 
              placeholder="Enter current password" 
              disabled={currentPasswordVerified} 
              className={`pr-10 ${currentPasswordVerified ? 'bg-muted/50' : ''}`} 
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
              onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
              disabled={currentPasswordVerified}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
            </Button>
          </div>
          <Button 
            onClick={handleVerifyCurrentPassword} 
            disabled={isVerifying || !passwordData.currentPassword || currentPasswordVerified} 
            variant={currentPasswordVerified ? "outline" : "default"} 
            className={currentPasswordVerified ? '' : 'bg-accent text-accent-foreground'}
          >
            {isVerifying ? "..." : currentPasswordVerified ? "✓" : "Verify"}
          </Button>
        </div>
      </div>

      {/* Step 2: Set new password */}
      <div className={`p-4 rounded-lg border-2 ${currentPasswordVerified ? 'border-accent/30' : 'border-muted/30 opacity-50'}`}>
        <Label className="flex items-center gap-2 mb-3 text-sm">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Step 2: Set New Password
        </Label>
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground">New Password</Label>
            <div className="relative mt-1">
              <Input 
                type={showNewPassword ? "text" : "password"} 
                value={passwordData.newPassword} 
                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                placeholder="Enter new password" 
                disabled={!currentPasswordVerified} 
                className="pr-10" 
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                onClick={() => setShowNewPassword(!showNewPassword)} 
                disabled={!currentPasswordVerified}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Confirm New Password</Label>
            <div className="relative mt-1">
              <Input 
                type={showConfirmPassword ? "text" : "password"} 
                value={passwordData.confirmPassword} 
                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
                placeholder="Confirm new password" 
                disabled={!currentPasswordVerified} 
                className="pr-10" 
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                disabled={!currentPasswordVerified}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>
          <Button 
            onClick={handleChangePassword} 
            disabled={isChangingPassword || !currentPasswordVerified || !passwordData.newPassword || !passwordData.confirmPassword} 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isChangingPassword ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>
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
        
        {activeSection === "comments" && (
          <div className="p-4">{CommentsSectionContent}</div>
        )}
        
        {activeSection === "logout" && <MobileLogoutSection />}
        {activeSection === "delete" && <MobileDeleteSection />}

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

  // Desktop view
  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-8 px-[9px] py-0">
        {/* Sidebar Navigation */}
        <nav className="lg:w-56 shrink-0">
          <ul className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id || (item.id === "account" && activeSection === "main");
              return (
                <li key={item.id}>
                  <button 
                    onClick={() => setActiveSection(item.id as SettingSection)} 
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-1 max-w-4xl">
          {/* Plan Section */}
          {(activeSection === "main" || activeSection === "account") && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Account</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your account settings
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">Email address</Label>
                    <p className="text-sm text-muted-foreground">
                      Your email address is used for login and notifications
                    </p>
                  </div>
                  <Input 
                    value={formData.email} 
                    disabled 
                    className="bg-muted/50 text-sm" 
                    style={{ width: `${Math.max(formData.email.length + 2, 20)}ch` }} 
                  />
                  <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                </div>

                <Separator />

                {/* Sign Out */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Sign out</Label>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account on this device
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>



                <Separator />

                {/* Change Password */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Password</Label>
                    <p className="text-sm text-muted-foreground">
                      Change your password to keep your account secure
                    </p>
                  </div>
                  <Dialog open={showPasswordDialog} onOpenChange={open => {
                    setShowPasswordDialog(open);
                    if (!open) resetPasswordForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Lock className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Lock className="h-5 w-5 text-accent" />
                          Change Password
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        {/* Step 1: Verify current password */}
                        <div className={`p-4 rounded-lg border-2 ${currentPasswordVerified ? 'border-green-500/50 bg-green-500/10' : 'border-accent/30'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <Label className="flex items-center gap-2">
                              {currentPasswordVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <ShieldCheck className="h-4 w-4 text-muted-foreground" />}
                              Step 1: Verify Current Password
                            </Label>
                            {currentPasswordVerified && <span className="text-xs text-green-500 font-medium">Verified</span>}
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input 
                                type={showCurrentPassword ? "text" : "password"} 
                                value={passwordData.currentPassword} 
                                onChange={e => {
                                  setPasswordData({ ...passwordData, currentPassword: e.target.value });
                                  if (currentPasswordVerified) setCurrentPasswordVerified(false);
                                }} 
                                placeholder="Enter current password" 
                                disabled={currentPasswordVerified} 
                                className={`pr-10 ${currentPasswordVerified ? 'bg-muted/50' : ''}`} 
                              />
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                                disabled={currentPasswordVerified}
                              >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                              </Button>
                            </div>
                            <Button 
                              onClick={handleVerifyCurrentPassword} 
                              disabled={isVerifying || !passwordData.currentPassword || currentPasswordVerified} 
                              variant={currentPasswordVerified ? "outline" : "default"} 
                              className={currentPasswordVerified ? '' : 'bg-accent text-accent-foreground'}
                            >
                              {isVerifying ? "..." : currentPasswordVerified ? "✓" : "Verify"}
                            </Button>
                          </div>
                        </div>

                        {/* Step 2: Set new password */}
                        <div className={`p-4 rounded-lg border-2 ${currentPasswordVerified ? 'border-accent/30' : 'border-muted/30 opacity-50'}`}>
                          <Label className="flex items-center gap-2 mb-3">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                            Step 2: Set New Password
                          </Label>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm text-muted-foreground">New Password</Label>
                              <div className="relative mt-1">
                                <Input 
                                  type={showNewPassword ? "text" : "password"} 
                                  value={passwordData.newPassword} 
                                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                                  placeholder="Enter new password" 
                                  disabled={!currentPasswordVerified} 
                                  className="pr-10" 
                                />
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                                  onClick={() => setShowNewPassword(!showNewPassword)} 
                                  disabled={!currentPasswordVerified}
                                >
                                  {showNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Confirm New Password</Label>
                              <div className="relative mt-1">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  value={passwordData.confirmPassword} 
                                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
                                  placeholder="Confirm new password" 
                                  disabled={!currentPasswordVerified} 
                                  className="pr-10" 
                                />
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                                  disabled={!currentPasswordVerified}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                              </div>
                            </div>
                            <Button 
                              onClick={handleChangePassword} 
                              disabled={isChangingPassword || !currentPasswordVerified || !passwordData.newPassword || !passwordData.confirmPassword} 
                              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                            >
                              {isChangingPassword ? "Updating..." : "Update Password"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Separator />

                {/* Delete Account */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-destructive">Delete account</Label>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
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
              </div>
            </div>
          )}

          {/* System Section */}
          {activeSection === "system" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">System</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  System preferences and settings
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                {/* Language */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Language</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred language
                    </p>
                  </div>
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
                    <PopoverContent
                      align="start"
                      className="w-[--radix-popover-trigger-width] p-0 rounded-lg"
                    >
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
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No languages found
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <Separator />

                {/* Theme */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Theme</Label>
                    <p className="text-sm text-muted-foreground">
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

                </div>
            </div>
          )}

          {/* Promotion Section (desktop) */}
          {activeSection === "promotion" && (
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
          )}


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
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
