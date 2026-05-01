import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import PasswordStrengthIndicator, { getPasswordScore } from "@/components/PasswordStrengthIndicator";

const RegisterUser = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [authChecking, setAuthChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Google sign-up failed.");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
    } catch (err: any) {
      toast.error(err?.message || "Google sign-up failed.");
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/", { replace: true });
      } else {
        setAuthChecking(false);
      }
    });
  }, [navigate]);


  if (authChecking) return null;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t("userRegistration.validation.passwordMismatch"));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t("userRegistration.validation.passwordTooShort"));
      return;
    }

    if (getPasswordScore(formData.password) < 3) {
      toast.error(t("passwordStrength.tooWeak", "Please choose a stronger password (meet at least 3 of the requirements)."));
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            account_type: "user",
            first_name: formData.name,
            last_name: "",
            full_name: formData.name,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Profile + user_roles rows are created automatically by the
        // handle_new_user() trigger using the metadata above.

        toast.success(t("userRegistration.success"));
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top-left logo linking to homepage */}
      <div className="fixed top-0 left-0 z-50 p-4 md:px-8 md:py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Muzicalist" className="h-8 w-8 md:h-9 md:w-9 object-contain" />
        </Link>
      </div>
      <div className="flex-1 flex flex-col md:items-center md:justify-center p-0 md:p-4">
      <div className="max-w-md w-full flex-1 md:flex-none min-h-screen md:min-h-0 md:rounded-2xl shadow-xl md:border-2 p-4 md:p-8 bg-background border-secondary">
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-display font-bold mb-1 md:mb-2 text-foreground">
            {t("userRegistration.title")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t("userRegistration.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div>
            <Label htmlFor="name">{t("userRegistration.name", "Name")}</Label>
            <Input
              id="name"
              placeholder={t("userRegistration.placeholders.name", "Your name")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">{t("userRegistration.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("userRegistration.placeholders.email")}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>


          <div>
            <Label htmlFor="password">{t("userRegistration.password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("userRegistration.placeholders.password")}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrengthIndicator password={formData.password} />
          </div>

          <div>
            <Label htmlFor="confirmPassword">{t("userRegistration.confirmPassword")}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("userRegistration.placeholders.confirmPassword")}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
              {t("userRegistration.agreeToTerms", "I agree to the")}{" "}
              <Link to="/terms-of-service" className="text-accent hover:underline font-semibold">
                {t("userRegistration.termsOfService", "Terms of Service")}
              </Link>{" "}
              {t("userRegistration.and", "and")}{" "}
              <Link to="/privacy-policy" className="text-accent hover:underline font-semibold">
                {t("userRegistration.privacyPolicy", "Privacy Policy")}
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !agreedToTerms}
          >
            {isLoading ? t("userRegistration.creatingAccount") : t("userRegistration.createAccount")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("userRegistration.or", "or")}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? t("userRegistration.creatingAccount") : t("userRegistration.continueWithGoogle", "Continue with Google")}
          </Button>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              {t("userRegistration.alreadyHaveAccount")}{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-accent hover:underline font-semibold"
              >
                {t("userRegistration.signIn")}
              </button>
            </p>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default RegisterUser;
