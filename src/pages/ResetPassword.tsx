import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import artistOnboardingBg from "@/assets/artist-onboarding-bg.jpg";
import logo from "@/assets/logo.png";
import {
  PasswordStrengthIndicator,
  getPasswordScore,
} from "@/components/PasswordStrengthIndicator";

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

    // Also handle direct landings: if URL contains a recovery hash/type, switch to update.
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("update");
    }

    return () => {
      sub.subscription.unsubscribe();
    };
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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel */}
      <div className="relative hidden md:flex w-full md:w-1/2 min-h-[40vh] md:min-h-screen flex-col justify-center overflow-hidden">
        <img
          src={artistOnboardingBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/80 via-red-900/60 to-black/90" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-red-600/20 blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/3 w-[200px] h-[200px] rounded-full bg-amber-500/10 blur-[80px]" />

        <div className="relative z-10 px-8 md:px-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            {mode === "request" ? (
              <>Reset your<br />Password</>
            ) : (
              <>Set a new<br />Password</>
            )}
          </h1>
          <p className="text-sm md:text-base text-white/70 max-w-md">
            {mode === "request"
              ? "Enter your email and we'll send you a link to reset your password."
              : "Choose a strong new password to secure your account."}
          </p>
        </div>
      </div>

      <Link to="/" className="fixed top-4 left-4 md:top-6 md:left-6 z-50">
        <img src={logo} alt="Muzicalist" className="h-8 w-8 md:h-10 md:w-10 object-contain" />
      </Link>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 min-h-[60vh] md:min-h-screen flex items-center justify-center bg-background px-6 py-12 md:px-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {mode === "request" ? "Forgot your password?" : "Create new password"}
            </h2>
          </div>

          {mode === "request" ? (
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div className="border border-border rounded-xl p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-input border-border text-base pl-10"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
                >
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="border border-border rounded-xl p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-input border-border text-base pl-10 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 bg-input border-border text-base pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
                >
                  {isLoading ? "Updating..." : "Update password"}
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="inline-flex items-center gap-1 text-accent hover:underline font-semibold">
              <ArrowLeft size={14} /> Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
