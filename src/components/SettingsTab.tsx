import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogOut, Trash2, Lock, CheckCircle, ShieldCheck, Eye, EyeOff, User, KeyRound, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SettingsTabProps {
  formData: {
    email: string;
  };
  handleLogout: () => void;
  handleDeleteAccount: () => void;
  isSaving: boolean;
}

const SettingsTab = ({ formData, handleLogout, handleDeleteAccount, isSaving }: SettingsTabProps) => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("account");
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

  const resetPasswordForm = () => {
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setCurrentPasswordVerified(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
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

  const navItems = [
    { id: "account", label: "Account", icon: User },
  ];

  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-8">
        {/* Sidebar Navigation */}
        <nav className="lg:w-56 shrink-0">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === item.id
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    } ${item.id === "danger" ? "text-destructive hover:text-destructive" : ""}`}
                  >
                    <Icon className={`h-4 w-4 ${item.id === "danger" && activeSection !== item.id ? "text-destructive" : ""}`} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-1 max-w-2xl">
          {/* Account Section */}
          {activeSection === "account" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Account</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your account settings
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <div>
                    <Label className="text-base font-medium">Email address</Label>
                    <p className="text-sm text-muted-foreground">
                      Your email address is used for login and notifications
                    </p>
                  </div>
                  <Input
                    value={formData.email}
                    disabled
                    className="bg-muted/50"
                    style={{ width: `${Math.max(formData.email.length + 2, 20)}ch` }}
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <Separator />

                {/* Sign Out */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Sign out</Label>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account on this device
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>

                <Separator />

                {/* Change Password */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Password</Label>
                    <p className="text-sm text-muted-foreground">
                      Change your password to keep your account secure
                    </p>
                  </div>
                  <Dialog open={showPasswordDialog} onOpenChange={(open) => {
                    setShowPasswordDialog(open);
                    if (!open) resetPasswordForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
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
                              {currentPasswordVerified ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                              )}
                              Step 1: Verify Current Password
                            </Label>
                            {currentPasswordVerified && (
                              <span className="text-xs text-green-500 font-medium">Verified</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                type={showCurrentPassword ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={(e) => {
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
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
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

                        {/* Step 2: Set new password (disabled until verified) */}
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
                                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
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
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Confirm New Password</Label>
                              <div className="relative mt-1">
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
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
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
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
                    <Label className="text-base font-medium text-destructive">Delete account</Label>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
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
