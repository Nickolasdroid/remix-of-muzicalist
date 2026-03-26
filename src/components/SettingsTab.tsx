import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Trash2, Lock, CheckCircle, ShieldCheck, Eye, EyeOff, User, Flag, Paperclip, ChevronRight, Mail, Crown, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";

export type SettingSection = "main" | "account" | "email" | "password" | "language" | "report" | "logout" | "delete";

interface SettingsTabProps {
  formData: {
    email: string;
    plan?: string;
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
    { id: "report" as const, label: "Report an Issue", icon: Flag },
    { id: "logout" as const, label: "Sign Out", icon: LogOut },
    { id: "delete" as const, label: "Delete Account", icon: Trash2, destructive: true },
  ];

  // Desktop nav items
  const navItems = [
    {
      id: "account",
      label: "Account",
      icon: User
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

  // Subscription plans data
  const subscriptionPlans = [
    {
      id: "Free",
      name: "Free",
      price: "0",
      description: "Get started with basic features",
      features: [
        "Basic profile",
        "5 standard ads",
        "5 gallery images",
        "3 gallery videos",
        "15 posts/month",
      ],
      highlighted: false,
    },
    {
      id: "Standard",
      name: "Standard",
      price: "29",
      description: "More visibility and features",
      features: [
        "Enhanced profile",
        "15 standard ads",
        "2 premium ads",
        "15 gallery images",
        "10 gallery videos",
        "50 posts/month",
        "Priority in search results",
      ],
      highlighted: false,
    },
    {
      id: "Premium",
      name: "Premium",
      price: "59",
      description: "Maximum exposure and all features",
      features: [
        "Premium profile badge",
        "Unlimited standard ads",
        "10 premium ads",
        "Unlimited gallery items",
        "Unlimited posts",
        "Top placement in search",
        "Featured on homepage",
        "Analytics dashboard",
      ],
      highlighted: true,
    },
  ];

  const currentPlan = formData.plan || "Free";

  // Mobile: Plan section
  const MobilePlanSection = () => {
    return (
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">My Plan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose the plan that fits your needs
          </p>
        </div>
        
        <div className="space-y-4">
          {subscriptionPlans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isPremiumPlan = plan.id === "Premium";
            
            return (
              <div
                key={plan.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCurrentPlan
                    ? isPremiumPlan
                      ? "border-yellow-500/50 bg-yellow-500/10"
                      : "border-accent/50 bg-accent/10"
                    : plan.highlighted
                    ? "border-yellow-500/30 hover:border-yellow-500/50"
                    : "border-border hover:border-muted-foreground/50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        isPremiumPlan
                          ? "bg-yellow-500/20"
                          : isCurrentPlan
                          ? "bg-accent/20"
                          : "bg-muted"
                      }`}
                    >
                      <Crown
                        className={`h-5 w-5 ${
                          isPremiumPlan
                            ? "text-yellow-500"
                            : isCurrentPlan
                            ? "text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <p
                        className={`font-semibold ${
                          isPremiumPlan
                            ? "text-yellow-500"
                            : isCurrentPlan
                            ? "text-accent"
                            : "text-foreground"
                        }`}
                      >
                        {plan.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>
                  </div>
                  {isCurrentPlan && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent/20 text-accent">
                      Current
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-foreground">
                    €{plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {!isCurrentPlan && (
                  <Button
                    className={`w-full ${
                      isPremiumPlan
                        ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500"
                        : "bg-accent text-accent-foreground hover:bg-accent/90"
                    }`}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to {plan.name}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
    const currentLang = i18n.language?.startsWith("ro") ? "ro" : "en";
    return (
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Language</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your preferred language
          </p>
        </div>
        <div className="space-y-2">
          {[
            { code: "en", label: "English", flag: "🇬🇧" },
            { code: "ro", label: "Română", flag: "🇷🇴" },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors ${
                currentLang === lang.code
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border text-foreground hover:border-muted-foreground/50"
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="flex-1 text-left font-medium">{lang.label}</span>
              {currentLang === lang.code && <CheckCircle className="h-5 w-5 text-accent" />}
            </button>
          ))}
        </div>
      </div>
    );
  };

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

  // Mobile view
  if (isMobile) {
    return (
      <div className="w-full min-h-screen">
        {activeSection === "main" && <MobileMainList />}
        
        {activeSection === "email" && <MobileEmailSection />}
        {activeSection === "password" && <MobilePasswordSection />}
        {activeSection === "language" && <MobileLanguageSection />}
        {activeSection === "report" && <MobileReportSection />}
        {activeSection === "logout" && <MobileLogoutSection />}
        {activeSection === "delete" && <MobileDeleteSection />}
      </div>
    );
  }

  // Desktop view
  return (
    <div className="w-full min-h-screen">
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
          {activeSection === "plan" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">My Plan</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose the plan that fits your needs
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {subscriptionPlans.map((plan) => {
                  const isCurrentPlan = currentPlan === plan.id;
                  const isPremiumPlan = plan.id === "Premium";

                  return (
                    <div
                      key={plan.id}
                      className={`relative p-5 rounded-lg border-2 transition-all ${
                        isCurrentPlan
                          ? isPremiumPlan
                            ? "border-yellow-500/50 bg-yellow-500/10"
                            : "border-accent/50 bg-accent/10"
                          : plan.highlighted
                          ? "border-yellow-500/30 hover:border-yellow-500/50"
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                    >
                      {plan.highlighted && !isCurrentPlan && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-xs font-semibold px-3 py-1 rounded-full">
                            Recommended
                          </span>
                        </div>
                      )}

                      {isCurrentPlan && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                            Current Plan
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-4 mt-2">
                        <div
                          className={`p-2 rounded-full ${
                            isPremiumPlan
                              ? "bg-yellow-500/20"
                              : isCurrentPlan
                              ? "bg-accent/20"
                              : "bg-muted"
                          }`}
                        >
                          <Crown
                            className={`h-5 w-5 ${
                              isPremiumPlan
                                ? "text-yellow-500"
                                : isCurrentPlan
                                ? "text-accent"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div>
                          <p
                            className={`font-semibold ${
                              isPremiumPlan
                                ? "text-yellow-500"
                                : isCurrentPlan
                                ? "text-accent"
                                : "text-foreground"
                            }`}
                          >
                            {plan.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-3xl font-bold text-foreground">
                          €{plan.price}
                        </span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">
                        {plan.description}
                      </p>

                      <ul className="space-y-2 mb-5">
                        {plan.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <CheckCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {!isCurrentPlan && (
                        <Button
                          className={`w-full ${
                            isPremiumPlan
                              ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500"
                              : "bg-accent text-accent-foreground hover:bg-accent/90"
                          }`}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade to {plan.name}
                        </Button>
                      )}

                      {isCurrentPlan && (
                        <div className="w-full py-2 text-center text-sm font-medium text-muted-foreground">
                          Your current plan
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Account Section */}
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

                {/* Language */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Language</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred language
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { code: "en", label: "🇬🇧 English" },
                      { code: "ro", label: "🇷🇴 Română" },
                    ].map((lang) => {
                      const currentLang = i18n.language?.startsWith("ro") ? "ro" : "en";
                      return (
                        <Button
                          key={lang.code}
                          variant={currentLang === lang.code ? "default" : "outline"}
                          size="sm"
                          onClick={() => i18n.changeLanguage(lang.code)}
                          className={currentLang === lang.code ? "bg-accent text-accent-foreground" : ""}
                        >
                          {lang.label}
                        </Button>
                      );
                    })}
                  </div>
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

                {/* Report */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Report an issue</Label>
                    <p className="text-sm text-muted-foreground">
                      Send us feedback or report a problem
                    </p>
                  </div>
                  <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Flag className="h-5 w-5 text-accent" />
                          Report
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
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
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
