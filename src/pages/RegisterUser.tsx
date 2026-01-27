import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CountrySelector from "@/components/CountrySelector";

const RegisterUser = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auto-detect country on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_name) {
          setFormData(prev => ({ ...prev, country: data.country_name }));
        }
      } catch (error) {
        console.log('Could not auto-detect country');
      }
    };
    detectCountry();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.country) {
      toast.error(t("userRegistration.validation.countryRequired"));
      return;
    }
    
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
            phone: formData.phone,
            stage_name: `${formData.firstName} ${formData.lastName}`,
            county: "",
            country: formData.country,
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
    <div className="min-h-screen flex flex-col md:items-center md:justify-center bg-background p-0 md:p-4">
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
          <div className="grid grid-cols-2 gap-3 md:gap-4">
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
            <Label htmlFor="country">{t("artistRegistration.country")}</Label>
            <CountrySelector
              value={formData.country}
              onChange={(value) => setFormData({ ...formData, country: value })}
            />
          </div>

          <div>
            <Label htmlFor="phone">{t("userRegistration.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t("userRegistration.placeholders.phone")}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
  );
};

export default RegisterUser;
