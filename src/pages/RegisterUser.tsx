import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

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

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: formData.name,
            last_name: "",
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Insert user role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            user_type: "user",
          });

        if (roleError) throw roleError;

        // Create basic profile with country
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            first_name: formData.name,
            last_name: "",
            email: formData.email,
            phone: "",
            stage_name: formData.name,
            county: "",
          });

        if (profileError) throw profileError;

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
      <div className="max-w-md w-full flex-1 md:flex-none min-h-screen md:min-h-0 md:rounded-2xl shadow-xl md:border-2 border-accent/20 p-4 md:p-8 bg-background">
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
              <Link to="/terms" className="text-accent hover:underline font-semibold">
                {t("userRegistration.termsOfService", "Terms of Service")}
              </Link>{" "}
              {t("userRegistration.and", "and")}{" "}
              <Link to="/privacy" className="text-accent hover:underline font-semibold">
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
