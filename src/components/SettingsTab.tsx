import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { LogOut, Trash2, Lock, CheckCircle, ShieldCheck } from "lucide-react";
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
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

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
      // Re-authenticate by signing in with current credentials
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
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setCurrentPasswordVerified(false);
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

  return (
    <Card className="border-2 border-accent/30 shadow-[var(--shadow-gold)]">
      <CardContent className="p-8">
        <h3 className="text-xl font-display font-bold mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div>
            <Label>Email (Cannot be changed)</Label>
            <Input
              value={formData.email}
              disabled
              className="mt-2 bg-muted/50"
            />
          </div>

          <Separator className="my-6" />

          {/* Password Change Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-accent" />
              <h3 className="text-xl font-display font-bold">Change Password</h3>
            </div>
            
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
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, currentPassword: e.target.value });
                    if (currentPasswordVerified) setCurrentPasswordVerified(false);
                  }}
                  placeholder="Enter current password"
                  disabled={currentPasswordVerified}
                  className={currentPasswordVerified ? 'bg-muted/50' : ''}
                />
                <Button 
                  onClick={handleVerifyCurrentPassword}
                  disabled={isVerifying || !passwordData.currentPassword || currentPasswordVerified}
                  variant={currentPasswordVerified ? "outline" : "default"}
                  className={currentPasswordVerified ? '' : 'bg-accent text-accent-foreground'}
                >
                  {isVerifying ? "Verifying..." : currentPasswordVerified ? "Verified" : "Verify"}
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
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    disabled={!currentPasswordVerified}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    disabled={!currentPasswordVerified}
                    className="mt-1"
                  />
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

          <Separator className="my-6" />

          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-xl font-display font-bold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                >
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
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
