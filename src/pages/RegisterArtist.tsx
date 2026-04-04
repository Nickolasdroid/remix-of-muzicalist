import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UserPlus, ArrowLeft, ArrowRight, Eye, EyeOff, User, Mail, Phone, Globe, MapPin, Mic, Star, Calendar, Camera, Lock, Music, Award, Sparkles, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { MusicGenreCombobox } from "@/components/MusicGenreCombobox";
import { Checkbox } from "@/components/ui/checkbox";
import CountrySelector from "@/components/CountrySelector";
import { getPhonePrefix, getMaxPhoneLength, validatePhoneNumber, getPhoneConfig } from "@/lib/countryPhoneCodes";
import { getDivisionName, getCountryRegions } from "@/lib/countryAdminDivisions";
import registerArtistBg from "@/assets/register-artist-bg.png";
import artistOnboardingBg from "@/assets/artist-onboarding-bg.jpg";
import logo from "@/assets/logo.png";

const RegisterArtist = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authChecking, setAuthChecking] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [step0Email, setStep0Email] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    stageName: "",
    email: "",
    phone: "",
    country: "",
    county: "",
    specialization: "",
    experienceLevel: "",
    careerStartYear: "",
    password: "",
    confirmPassword: ""
  });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
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

  const availableRegions = formData.country ? getCountryRegions(formData.country) : [];
  const divisionLabel = formData.country ? getDivisionName(formData.country) : t("artistRegistration.county");
  const totalSteps = 4;
  const progressPercentage = currentStep >= 1 ? (currentStep / totalSteps) * 100 : 0;

  const handleStep0Continue = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!step0Email || !emailRegex.test(step0Email)) {
      toast({
        title: t("common.error"),
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    const emailExists = await checkEmailExists(step0Email);
    if (emailExists) {
      toast({
        title: t("common.error"),
        description: t("artistRegistration.validation.emailExists", "This email address is already registered. Please use a different email."),
        variant: "destructive"
      });
      return;
    }
    setFormData(prev => ({ ...prev, email: step0Email }));
    setCurrentStep(1);
  };

  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({
        title: t("common.error"),
        description: "Google sign-in failed. Please try again.",
        variant: "destructive"
      });
      return;
    }
    if (result.redirected) {
      return;
    }
    // After successful Google auth, redirect
    navigate("/");
  };

  // Update phone prefix when country changes
  useEffect(() => {
    if (formData.country) {
      const newPrefix = getPhonePrefix(formData.country);
      const config = getPhoneConfig(formData.country);
      if (newPrefix && config) {
        setFormData((prev) => {
          const currentPhone = prev.phone;
          // If phone is empty, just set the prefix
          if (!currentPhone) {
            return { ...prev, phone: newPrefix };
          }
          // Extract digits after any existing prefix
          const digitsOnly = currentPhone.replace(/^\+\d+/, "").replace(/\D/g, "");
          // Truncate to max allowed digits for this country
          const truncatedDigits = digitsOnly.slice(0, config.maxLength);
          return { ...prev, phone: newPrefix + truncatedDigits };
        });
      }
    }
  }, [formData.country]);

  if (authChecking) return null;

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.lastName || !formData.firstName || !formData.email || !formData.phone || !formData.country || !formData.county) {
          toast({
            title: t("common.error"),
            description: t("artistRegistration.validation.completeStep1"),
            variant: "destructive"
          });
          return false;
        }
        // Validate phone number length
        const phoneValidation = validatePhoneNumber(formData.phone, formData.country);
        if (!phoneValidation.valid) {
          toast({
            title: t("common.error"),
            description: phoneValidation.message,
            variant: "destructive"
          });
          return false;
        }
        break;
      case 2:
        if (!formData.stageName || !formData.specialization || !formData.experienceLevel || !formData.careerStartYear) {
          toast({
            title: t("common.error"),
            description: t("artistRegistration.validation.completeStep2"),
            variant: "destructive"
          });
          return false;
        }
        break;
      case 3:
        if (!imageSrc) {
          toast({
            title: t("common.error"),
            description: t("artistRegistration.validation.uploadPhoto"),
            variant: "destructive"
          });
          return false;
        }
        break;
      case 4:
        if (!formData.password || !formData.confirmPassword) {
          toast({
            title: t("common.error"),
            description: t("artistRegistration.validation.setPassword"),
            variant: "destructive"
          });
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: t("common.error"),
            description: t("artistRegistration.validation.passwordMismatch"),
            variant: "destructive"
          });
          return false;
        }
        break;
    }
    return true;
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();
    return !!data;
  };

  const nextStep = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 1) {
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        toast({
          title: t("common.error"),
          description: t("artistRegistration.validation.emailExists", "This email address is already registered. Please use a different email."),
          variant: "destructive"
        });
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        user_type: "artist"
      });
      if (roleError) throw roleError;

      let avatarUrl = null;
      if (imageSrc && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
        const fileName = `${authData.user.id}/avatar.jpg`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        stage_name: formData.stageName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        county: formData.county,
        specialization: formData.specialization as any,
        experience_level: formData.experienceLevel as any,
        career_start_year: parseInt(formData.careerStartYear),
        avatar_url: avatarUrl
      });
      if (profileError) throw profileError;

      toast({
        title: t("artistRegistration.success.title"),
        description: t("artistRegistration.success.message")
      });
      setRegisteredUserId(authData.user.id);
      setShowPlanSelection(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: t("artistRegistration.error.title"),
        description: error.message || t("artistRegistration.error.message"),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const plans = [
    {
      name: "Free",
      monthlyPrice: 0,
      description: "Get started with basic features",
      features: ["Basic profile", "Limited visibility", "Community access"],
      cta: "Continue with Free",
      highlighted: false,
    },
    {
      name: "Standard",
      monthlyPrice: 12,
      description: "Grow your presence and reach",
      features: ["Enhanced profile", "Priority listing", "Analytics dashboard", "Booking requests"],
      cta: "Choose Standard",
      highlighted: true,
    },
    {
      name: "Premium",
      monthlyPrice: 24,
      description: "Maximum exposure and tools",
      features: ["Premium profile badge", "Top search ranking", "Advanced analytics", "Unlimited bookings", "Priority support"],
      cta: "Choose Premium",
      highlighted: false,
    },
  ];

  const getPrice = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return "€0";
    if (isAnnual) return `€${Math.round(monthlyPrice * 10)}`;
    return `€${monthlyPrice}`;
  };

  const getSpecializationLabel = (spec: string) => {
    const map: Record<string, string> = {
      Singer: t("artistRegistration.specializations.singer"),
      Instrumentalist: t("artistRegistration.specializations.instrumentalist"),
      DJ: t("artistRegistration.specializations.dj"),
      Band: t("artistRegistration.specializations.band"),
    };
    return map[spec] || spec;
  };

  const handlePlanSelect = (planName: string) => {
    // For Free plan, just navigate. For paid plans, navigate (payment integration later).
    if (registeredUserId) {
      navigate(`/artist/${registeredUserId}`);
    }
  };

  if (showPlanSelection) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary to-background">
        <div className="fixed top-0 left-0 z-50 p-4 md:px-8 md:py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Muzicalist" className="h-8 w-8 md:h-9 md:w-9 object-contain" />
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 mb-4">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                {getSpecializationLabel(formData.specialization)}
              </span>
            </div>
            <h1 className="text-xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-3">
              Choose Your Plan
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground max-w-xl mx-auto mb-6">
              Select the plan that best fits your needs as a {getSpecializationLabel(formData.specialization).toLowerCase()}
            </p>
            <div className="inline-flex items-center gap-0 rounded-full border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!isAnnual ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isAnnual ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Annual <span className="text-xs opacity-75">Save ~17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl w-full mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`flex flex-col ${plan.highlighted ? 'border-accent shadow-lg scale-[1.02]' : 'border-border'}`}
              >
                <CardHeader className="text-center">
                  <CardTitle className="text-lg md:text-xl font-display">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-2xl md:text-3xl font-bold text-foreground">{getPrice(plan.monthlyPrice)}</span>
                    <span className="text-muted-foreground text-sm">{isAnnual ? '/year' : '/month'}</span>
                  </div>
                  <CardDescription className="mt-2 text-xs md:text-sm">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => handlePlanSelect(plan.name)}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 0: Split-screen onboarding
  if (currentStep === 0) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left Panel - Branding */}
        <div className="relative w-full md:w-1/2 min-h-[40vh] md:min-h-screen flex flex-col items-center justify-center overflow-hidden">
          {/* Background image */}
          <img
            src={artistOnboardingBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/80 via-red-900/60 to-black/90" />
          {/* Subtle glow effects */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-red-600/20 blur-[100px]" />
          <div className="absolute bottom-1/3 left-1/3 w-[200px] h-[200px] rounded-full bg-amber-500/10 blur-[80px]" />

          {/* Content */}
          <div className="relative z-10 text-center px-8 md:px-12 py-12">
            <Link to="/" className="inline-block mb-8">
              <img src={logo} alt="Muzicalist" className="h-10 w-10 md:h-12 md:w-12 object-contain" />
            </Link>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              Join Muzicalist
            </h1>
            <p className="text-lg md:text-xl text-white/80 font-medium mb-3">
              Create your artist profile and get booked for events
            </p>
            <p className="text-sm md:text-base text-white/60 max-w-md mx-auto">
              Connect with clients, showcase your talent, and grow your music career.
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-full md:w-1/2 min-h-[60vh] md:min-h-screen flex items-center justify-center bg-background px-6 py-12 md:px-12">
          <div className="w-full max-w-md space-y-8">
            {/* Logo on mobile hidden since it's in left panel, show on desktop right side */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                Create Artist Account
              </h2>
              <p className="text-muted-foreground">
                Start with your email address
              </p>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="step0-email" className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </Label>
              <Input
                id="step0-email"
                type="email"
                value={step0Email}
                onChange={(e) => setStep0Email(e.target.value)}
                placeholder="Enter your email address"
                className="h-12 bg-input border-border focus:border-accent text-base"
                onKeyDown={(e) => e.key === "Enter" && handleStep0Continue()}
              />
            </div>

            {/* Continue Button - Gold gradient */}
            <Button
              type="button"
              onClick={handleStep0Continue}
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
            >
              Continue
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full h-12 text-base rounded-xl border-border hover:bg-accent/10"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </Button>
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to the{" "}
              <Link to="/terms" className="text-accent hover:underline font-medium">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-accent hover:underline font-medium">
                Privacy Policy
              </Link>
            </p>

            {/* Login link */}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-accent hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-secondary to-background">
      {/* Top-left logo linking to homepage */}
      <div className="fixed top-0 left-0 z-50 p-4 md:px-8 md:py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Muzicalist" className="h-8 w-8 md:h-9 md:w-9 object-contain" />
        </Link>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center py-0 px-0 md:py-0">
        <div className="w-full flex-1 md:flex-none">
          <form onSubmit={handleSubmit} className="min-h-screen md:min-h-screen p-4 md:p-12 md:border-0 md:rounded-none border-accent/30 flex flex-col">
            <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-8 flex-1 md:border md:border-accent/30 md:rounded-2xl md:p-8 md:bg-black/20 pt-10 md:pt-8">
            {/* Title and steps inside the bordered container */}
            <div className="w-full text-center">
              <h1 className="text-lg md:text-2xl font-display font-semibold mb-2 md:mb-4 text-muted-foreground">
                {t("artistRegistration.title")}
              </h1>
              {/* Step indicators */}
              <div className="flex items-center justify-center gap-1.5 md:gap-3 mt-4 md:mt-6">
                {[
                  { num: 1, label: "Basic" },
                  { num: 2, label: "Professional" },
                  { num: 3, label: "Media" },
                  { num: 4, label: "Security" },
                ].map((step, i, arr) => (
                  <div key={step.num} className="flex items-center gap-1.5 md:gap-3">
                    <div className="flex items-center gap-1 md:gap-1.5">
                      <div
                        className={cn(
                          "w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[11px] md:text-sm font-bold transition-all",
                          currentStep === step.num
                            ? "bg-accent text-accent-foreground shadow-[var(--shadow-gold)]"
                            : currentStep > step.num
                            ? "bg-accent/30 text-accent"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {step.num}
                      </div>
                      <span
                        className={cn(
                          "text-[11px] md:text-sm font-medium transition-colors",
                          currentStep === step.num
                            ? "text-accent"
                            : currentStep > step.num
                            ? "text-accent/60"
                            : "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div
                        className={cn(
                          "w-4 md:w-10 h-0.5 rounded-full transition-colors",
                          currentStep > step.num ? "bg-accent/60" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 &&
              <div className="space-y-3 md:space-y-4 animate-in fade-in duration-500">


                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="firstName" className="text-sm flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" />{t("artistRegistration.firstName")}</Label>
                    <Input id="firstName" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="bg-input border-border focus:border-accent h-9" placeholder={t("artistRegistration.placeholders.firstName")} />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="text-sm flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" />{t("artistRegistration.lastName")}</Label>
                    <Input id="lastName" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="bg-input border-border focus:border-accent h-9" placeholder={t("artistRegistration.placeholders.lastName")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="country" className="text-sm flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{t("artistRegistration.country")}</Label>
                    <CountrySelector
                      value={formData.country}
                      onChange={(value) => setFormData({ ...formData, country: value, county: "" })} />

                  </div>

                  <div className="space-y-1">
                      <Label htmlFor="county" className="text-sm flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{divisionLabel}</Label>
                      <Select value={formData.county} onValueChange={(value) => setFormData({ ...formData, county: value })} disabled={!formData.country || availableRegions.length === 0}>
                        <SelectTrigger className="bg-input border-border h-9">
                          <SelectValue placeholder={formData.country ? t("artistRegistration.placeholders.selectCounty") : t("artistRegistration.placeholders.selectCountryFirst", "Select a country first")} />
                        </SelectTrigger>
                        <SelectContent side="bottom" avoidCollisions={false}>
                          {availableRegions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-sm flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{t("artistRegistration.phone")}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      disabled={!formData.country}
                      value={formData.phone}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        const prefix = getPhonePrefix(formData.country);
                        // Ensure prefix cannot be deleted
                        if (prefix && !newValue.startsWith(prefix)) {
                          return;
                        }
                        // Only allow digits after prefix (no spaces)
                        const afterPrefix = newValue.slice(prefix.length);
                        if (afterPrefix && !/^\d*$/.test(afterPrefix)) {
                          return;
                        }
                        // Check max length
                        const maxLength = getMaxPhoneLength(formData.country);
                        if (newValue.length <= maxLength) {
                          setFormData({ ...formData, phone: newValue });
                        }
                      }}
                      className="bg-input border-border focus:border-accent h-9"
                      placeholder={t("artistRegistration.placeholders.phone")} />

                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-sm flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{t("artistRegistration.email")}</Label>
                    <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-input border-border focus:border-accent h-9 read-only:opacity-70" placeholder={t("artistRegistration.placeholders.email")} readOnly={!!step0Email} />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="button" onClick={nextStep} size="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {t("common.next")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              }

            {/* Step 2: Professional Information */}
            {currentStep === 2 &&
              <div className="space-y-3 md:space-y-4 animate-in fade-in duration-500">


                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="stageName" className="text-sm flex items-center gap-1.5"><Mic className="h-3.5 w-3.5 text-muted-foreground" />{t("artistRegistration.stageName")}</Label>
                    <Input id="stageName" required value={formData.stageName} onChange={(e) => setFormData({ ...formData, stageName: e.target.value })} className="bg-input border-border focus:border-accent h-9" placeholder={t("artistRegistration.placeholders.stageName")} />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="specialization" className="text-sm flex items-center gap-1.5"><Music className="h-3.5 w-3.5 text-muted-foreground" />{t("artistRegistration.specialization")}</Label>
                    <Select value={formData.specialization} onValueChange={(value) => setFormData({ ...formData, specialization: value })}>
                      <SelectTrigger className="bg-input border-border h-9">
                        <SelectValue placeholder={t("artistRegistration.placeholders.selectSpecialization")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Singer">{t("artistRegistration.specializations.singer")}</SelectItem>
                        <SelectItem value="Instrumentalist">{t("artistRegistration.specializations.instrumentalist")}</SelectItem>
                        <SelectItem value="DJ">{t("artistRegistration.specializations.dj")}</SelectItem>
                        <SelectItem value="Band">{t("artistRegistration.specializations.band")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="experienceLevel" className="text-sm flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-muted-foreground" />{t("artistRegistration.experienceLevel")}</Label>
                    <Select value={formData.experienceLevel} onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}>
                      <SelectTrigger className="bg-input border-border h-9">
                        <SelectValue placeholder={t("artistRegistration.placeholders.experienceLevel")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">{t("artistRegistration.experienceLevels.beginner")}</SelectItem>
                        <SelectItem value="Intermediate">{t("artistRegistration.experienceLevels.intermediate")}</SelectItem>
                        <SelectItem value="Advanced">{t("artistRegistration.experienceLevels.advanced")}</SelectItem>
                        <SelectItem value="Professional">{t("artistRegistration.experienceLevels.professional")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="careerStartYear" className="text-sm flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />{t("artistRegistration.careerStartYear")}</Label>
                    <Select value={formData.careerStartYear} onValueChange={(value) => setFormData({ ...formData, careerStartYear: value })}>
                      <SelectTrigger className="bg-input border-border h-9">
                        <SelectValue placeholder={t("artistRegistration.placeholders.careerStart")} />
                      </SelectTrigger>
                      <SelectContent side="bottom" avoidCollisions={false}>
                        {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i).map((year) =>
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button type="button" onClick={previousStep} variant="outline" size="default">
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
                  </Button>
                  <Button type="button" onClick={nextStep} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {t("common.next")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              }

            {/* Step 3: Profile Picture */}
            {currentStep === 3 &&
              <div className="space-y-6 animate-in fade-in duration-500">


                
                <div className="space-y-4">
                  <Label htmlFor="profilePic">{t("artistRegistration.uploadPhoto")}</Label>
                  <Input id="profilePic" type="file" accept="image/*" onChange={handleImageUpload} className="bg-input border-border focus:border-accent" />

                  {imageSrc &&
                  <div className="space-y-4">
                      <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-black rounded-lg overflow-hidden">
                        <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} cropShape="rect" showGrid={false} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="zoom">{t("artistRegistration.adjustPhoto")}: {zoom.toFixed(1)}x</Label>
                        <input id="zoom" type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent" />
                      </div>
                    </div>
                  }
                </div>

                <div className="flex justify-between">
                  <Button type="button" onClick={previousStep} variant="outline" size="lg">
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
                  </Button>
                  <Button type="button" onClick={nextStep} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {t("common.next")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              }

            {/* Step 4: Password */}
            {currentStep === 4 &&
              <div className="space-y-6 animate-in fade-in duration-500">


                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-muted-foreground" />{t("artistRegistration.password")}</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="bg-input border-border focus:border-accent pr-10" placeholder={t("artistRegistration.placeholders.password")} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-muted-foreground" />{t("artistRegistration.confirmPassword")}</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="bg-input border-border focus:border-accent pr-10" placeholder={t("artistRegistration.placeholders.confirmPassword")} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="artist-terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  />
                  <label htmlFor="artist-terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
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

                <div className="flex justify-between">
                  <Button type="button" onClick={previousStep} variant="outline" size="lg">
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
                  </Button>
                  <Button type="submit" size="lg" disabled={isSubmitting || !agreedToTerms} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300">
                    {isSubmitting ? t("common.creating") : t("common.create")}
                  </Button>
                </div>
              </div>
              }
            </div>
          </form>
        </div>
      </div>
    </div>);

};

export default RegisterArtist;