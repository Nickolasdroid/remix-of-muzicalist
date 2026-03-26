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
            first_name: formData.firstName,
            last_name: formData.lastName,
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
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: "",
            stage_name: `${formData.firstName} ${formData.lastName}`,
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
      <div className="max-w-md w-full flex-1 md:flex-none min-h-screen md:min-h-0 bg-card md:rounded-2xl shadow-xl md:border-2 border-accent/20 p-4 md:p-8">
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-display font-bold mb-1 md:mb-2 text-foreground">
            {t("userRegistration.title")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t("userRegistration.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <Label htmlFor="firstName">{t("userRegistration.firstName")}</Label>
              <Input
                id="firstName"
                placeholder={t("userRegistration.placeholders.firstName")}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">{t("userRegistration.lastName")}</Label>
              <Input
                id="lastName"
                placeholder={t("userRegistration.placeholders.lastName")}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
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

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? t("userRegistration.creatingAccount") : t("userRegistration.createAccount")}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t("userRegistration.orContinueWith", "or continue with")}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            disabled
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        </form>

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
      </div>
      </div>
    </div>
  );
};

export default RegisterUser;
