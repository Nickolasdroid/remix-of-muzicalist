import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.webp";
import PasswordStrengthIndicator, { getPasswordScore } from "@/components/PasswordStrengthIndicator";
import AuthShell, { authButtonClass, authInputClass } from "@/components/AuthShell";
import SEO from "@/components/SEO";
import { RECOVERY_ERROR_KEY, RECOVERY_KEY } from "@/lib/recoveryCapture";

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mode: "request" = ask for email; "update" = user came via recovery link, set new password
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // When user clicks the recovery link in their email, Supabase fires
    // a PASSWORD_RECOVERY event with a temporary session.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("update");
      }
    });

    // The link is usually read before this page loads (see recoveryCapture)
    let linkError: string | null = null;
    try {
      if (sessionStorage.getItem(RECOVERY_KEY) === "1" || window.location.hash.includes("type=recovery")) {
        setMode("update");
      }
      linkError = sessionStorage.getItem(RECOVERY_ERROR_KEY);
      sessionStorage.removeItem(RECOVERY_ERROR_KEY);
    } catch {
      /* storage unavailable */
    }
    if (linkError) {
      toast({
        title: "This link has expired",
        description: "Reset links work once and only for a short time. Enter your email to get a new one.",
        variant: "destructive",
      });
    }

    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;

      toast({
        title: "Check your inbox",
        description:
          "If an account exists for this email, you'll receive a password reset link shortly.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not send reset email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in both password fields.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (getPasswordScore(password) < 3) {
      toast({
        title: "Weak password",
        description:
          "Please choose a stronger password (at least 3 of 5 requirements).",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: "Password updated",
        description: "You can now log in with your new password.",
      });

      try {
        sessionStorage.removeItem(RECOVERY_KEY);
      } catch {
        /* storage unavailable */
      }
      await supabase.auth.signOut({ scope: "local" });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not update password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO title="Reset password | Muzicalist" description="Reset your Muzicalist account password." path="/reset-password" noindex />
      <AuthShell
        title={mode === "request" ? "Reset your password" : "Create new password"}
        footer={
          <Link to="/login" className="font-medium text-foreground underline underline-offset-2 hover:text-accent">
            Back to login
          </Link>
        }
      >
        {mode === "request" ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter your email and we'll send you a link to set a new password.</p>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-bold text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClass}
              />
            </div>
            <Button type="submit" disabled={isLoading} className={`${authButtonClass} !mt-6`}>
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-bold text-foreground">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${authInputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrengthIndicator password={password} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-bold text-foreground">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={authInputClass}
              />
            </div>
            <Button type="submit" disabled={isLoading} className={`${authButtonClass} !mt-6`}>
              {isLoading ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}
      </AuthShell>
    </>
  );
};

export default ResetPassword;
