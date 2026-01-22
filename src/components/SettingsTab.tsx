import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Trash2, Lock, CheckCircle, ShieldCheck, Eye, EyeOff, User, Flag, Paperclip } from "lucide-react";
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
const SettingsTab = ({
  formData,
  handleLogout,
  handleDeleteAccount,
  isSaving
}: SettingsTabProps) => {
  const {
    toast
  } = useToast();
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
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Report Sent!",
      description: "Thank you for your feedback. We'll review it shortly."
    });
    setReportMessage("");
    setReportFile(null);
    setShowReportDialog(false);
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
      const {
        error
      } = await supabase.auth.signInWithPassword({
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
      const {
        error
      } = await supabase.auth.updateUser({
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
  const navItems = [{
    id: "account",
    label: "Account",
    icon: User
  }];
  return <div className="w-full min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-8 px-[9px] py-0">
        {/* Sidebar Navigation */}
        <nav className="lg:w-56 shrink-0">
          <ul className="space-y-1">
            {navItems.map(item => {
            const Icon = item.icon;
            return <li key={item.id}>
                  <button onClick={() => setActiveSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === item.id ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"} ${item.id === "danger" ? "text-destructive hover:text-destructive" : ""}`}>
                    <Icon className={`h-4 w-4 ${item.id === "danger" && activeSection !== item.id ? "text-destructive" : ""}`} />
                    {item.label}
                  </button>
                </li>;
          })}
          </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-1 max-w-2xl">
          {/* Account Section */}
          {activeSection === "account"}

        </div>
      </div>
    </div>;
};
export default SettingsTab;