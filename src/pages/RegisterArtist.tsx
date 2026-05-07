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
import { UserPlus, ArrowLeft, ArrowRight, Eye, EyeOff, User, Mail, Phone, Globe, MapPin, Mic, Star, Calendar, Camera, Lock, Music, Award, Sparkles, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import { supabase } from "@/integrations/supabase/client";
import { startCheckout } from "@/lib/checkout";
import { lovable } from "@/integrations/lovable/index";
import { MusicGenreCombobox } from "@/components/MusicGenreCombobox";
import { Checkbox } from "@/components/ui/checkbox";
import CountrySelector, { getCountryNameByCode } from "@/components/CountrySelector";
import { getPhonePrefix, getMaxPhoneLength, validatePhoneNumber, getPhoneConfig } from "@/lib/countryPhoneCodes";
import { getDivisionName, getCountryRegions } from "@/lib/countryAdminDivisions";
import registerArtistBg from "@/assets/register-artist-bg.png";
import logo from "@/assets/logo.png";
import { subscriptionPlans, formatPlanPrice } from "@/lib/subscriptionPlans";
import PasswordStrengthIndicator, { getPasswordScore } from "@/components/PasswordStrengthIndicator";

const RegisterArtist = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authChecking, setAuthChecking] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [step0Email, setStep0Email] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  
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
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cancelled = params.get("checkout") === "cancelled";

    if (cancelled) {
      toast({
        title: t("artistRegistration.checkoutCancelled.title", "Plată anulată"),
        description: t(
          "artistRegistration.checkoutCancelled.message",
          "Plata a fost anulată. Reia înregistrarea pentru a alege un plan."
        ),
      });
      window.history.replaceState({}, "", "/register/artist");
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/", { replace: true });
      } else {
        setAuthChecking(false);
      }
    });
  }, [navigate, t, toast]);

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
        if (getPasswordScore(formData.password) < 3) {
          toast({
            title: t("common.error"),
            description: t("passwordStrength.tooWeak", "Please choose a stronger password (meet at least 3 of the requirements)."),
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
    if (!validateStep(currentStep)) return;
    // Account is NOT created here anymore — only after Free is chosen
    // or after Stripe confirms payment for Standard/Premium.
    setShowPlanSelection(true);
  };

  const plans = subscriptionPlans;

  const getPrice = (monthlyPrice: number) => formatPlanPrice(monthlyPrice, isAnnual);

  const getSpecializationLabel = (spec: string) => {
    const map: Record<string, string> = {
      Singer: t("artistRegistration.specializations.singer"),
      Instrumentalist: t("artistRegistration.specializations.instrumentalist"),
      DJ: t("artistRegistration.specializations.dj"),
      Band: t("artistRegistration.specializations.band"),
    };
    return map[spec] || spec;
  };

  const getAvatarBase64 = async (): Promise<string | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] ?? "");
        };
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(croppedBlob);
      });
    } catch (e) {
      console.warn("Avatar processing failed:", e);
      return null;
    }
  };

  const handleFreeSignup = async () => {
    setIsSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const countryName = getCountryNameByCode(formData.country) || formData.country;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            account_type: "artist",
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: formData.stageName,
            stage_name: formData.stageName,
            phone: formData.phone,
            country: countryName,
            county: formData.county,
            specialization: formData.specialization,
            experience_level: formData.experienceLevel,
            career_start_year: formData.careerStartYear,
          },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      if (imageSrc && croppedAreaPixels) {
        try {
          const base64 = await getAvatarBase64();
          if (base64) {
            await supabase.functions.invoke("upload-artist-avatar", {
              body: {
                user_id: authData.user.id,
                email: formData.email,
                image_base64: base64,
                content_type: "image/jpeg",
              },
            });
          }
        } catch (avatarErr) {
          console.warn("Avatar upload failed:", avatarErr);
        }
      }

      toast({
        title: t("artistRegistration.success.title"),
        description: t("artistRegistration.success.message"),
      });
      navigate(`/login?signup=success&email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      console.error("Free signup error:", error);
      toast({
        title: t("artistRegistration.error.title"),
        description: error?.message || t("artistRegistration.error.message"),
        variant: "destructive",
      });
      setCheckoutLoading(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlanSelect = async (planName: string) => {
    if (planName === "Free") {
      setCheckoutLoading("Free");
      await handleFreeSignup();
      return;
    }

    if (planName === "Standard" || planName === "Premium") {
      setCheckoutLoading(planName);
      try {
        const countryName = getCountryNameByCode(formData.country) || formData.country;
        const avatar_base64 = await getAvatarBase64();
        const origin = window.location.origin;

        const { data, error } = await supabase.functions.invoke("create-pending-artist-checkout", {
          body: {
            email: formData.email,
            password: formData.password,
            first_name: formData.firstName,
            last_name: formData.lastName,
            stage_name: formData.stageName,
            phone: formData.phone,
            country: countryName,
            county: formData.county,
            specialization: formData.specialization,
            experience_level: formData.experienceLevel,
            career_start_year: formData.careerStartYear,
            avatar_base64,
            plan: planName,
            billing: isAnnual ? "yearly" : "monthly",
            success_url: `${origin}/login?signup=success&email=${encodeURIComponent(formData.email)}`,
            cancel_url: `${origin}/register/artist?checkout=cancelled`,
          },
        });

        if (error || !data?.url) {
          throw new Error(data?.error || error?.message || "Could not start checkout");
        }
        window.location.href = data.url as string;
      } catch (err: any) {
        console.error("Paid plan checkout error:", err);
        toast({
          title: t("common.error"),
          description: err?.message || "Could not start checkout",
          variant: "destructive",
        });
        setCheckoutLoading(null);
      }
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
              <div key={plan.id} className="relative mt-4">
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-card border border-accent text-accent text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}
                {plan.id === 'Premium' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-card border border-amber-500 text-amber-500 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                      ⭐ Best for Professionals
                    </span>
                  </div>
                )}
                <Card
                  className={`flex flex-col h-full ${plan.highlighted ? 'border-accent shadow-lg' : 'border-border'}`}
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
                        <li
                          key={feature.text}
                          className={`flex items-start gap-2 text-xs md:text-sm ${feature.included ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}
                        >
                          {feature.included ? (
                            <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-destructive/60 shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? '' : 'line-through'}>{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs text-muted-foreground/80 italic">{plan.tagline}</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full ${plan.id === 'Premium' ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : ''}`}
                      variant={plan.id === 'Premium' ? 'default' : (plan.highlighted ? 'default' : 'outline')}
                      onClick={() => handlePlanSelect(plan.name)}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === plan.name ? 'Redirecting…' : plan.registerCta}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 0: Split-screen onboarding
  if (currentStep === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Homepage logo - top left */}
        <Link to="/" className="fixed top-4 left-4 md:top-6 md:left-6 z-50">
          <img src={logo} alt="Muzicalist" className="h-8 w-8 md:h-10 md:w-10 object-contain" />
        </Link>

        {/* Form - centered */}
        <div className="w-full min-h-screen flex items-start md:items-center justify-center px-6 pt-24 pb-12 md:py-12">
        
          <div className="w-full max-w-md">
            <div className="border border-border rounded-xl p-6 space-y-5 bg-accent-foreground">
              {/* Header with logo */}
              <div className="flex flex-col items-center text-center space-y-3">
                <img src={logo} alt="Muzicalist" className="h-12 w-12 object-contain" />
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  Join Muzicalist as an Artist
                </h2>
                <p className="text-sm text-muted-foreground">
                  Start with your email address
                </p>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="step0-email"
                    type="email"
                    value={step0Email}
                    onChange={(e) => setStep0Email(e.target.value)}
                    placeholder="Email"
                    className="h-12 bg-input border-border text-base pl-10"
                    onKeyDown={(e) => e.key === "Enter" && handleStep0Continue()}
                  />
                </div>
              </div>

              {/* Continue Button - Gold gradient */}
              <Button
                type="button"
                onClick={handleStep0Continue}
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
              >
                Continue
              </Button>

              {/* Terms */}
              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to the{" "}
                <Link to="/terms-of-service" className="text-accent hover:underline font-medium">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link to="/privacy-policy" className="text-accent hover:underline font-medium">
                  Privacy Policy
                </Link>
              </p>

              {/* Login link */}
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-accent hover:underline font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top-left logo linking to homepage */}
      <div className="fixed top-0 left-0 z-50 p-4 md:px-8 md:py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Muzicalist" className="h-8 w-8 md:h-9 md:w-9 object-contain" />
        </Link>
      </div>

      {/* Multi-Step Form - centered */}
      <div className="relative w-full min-h-screen flex flex-col">
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 md:px-8 lg:px-12">
          <div className="w-full max-w-xl">
            {/* Form Container */}
            <form onSubmit={handleSubmit} className="border border-accent/20 rounded-2xl p-5 md:p-8 bg-card/50 backdrop-blur-sm shadow-xl space-y-6">
            {/* Title (inside form) */}
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">
                Join Muzicalist as an Artist
              </h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps} — {
                  currentStep === 1 ? "Basic Information" :
                  currentStep === 2 ? "Professional Details" :
                  currentStep === 3 ? "Media Upload" :
                  "Security Setup"
                }
              </p>
            </div>

            {/* Step Progress Bar (inside form) */}
            <div className="flex items-center justify-center gap-1 md:gap-2">
              {[
                { num: 1, label: "Basic" },
                { num: 2, label: "Professional" },
                { num: 3, label: "Media" },
                { num: 4, label: "Security" },
              ].map((step, i, arr) => (
                <div key={step.num} className="flex items-center gap-1 md:gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-300",
                        currentStep === step.num
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/30"
                          : currentStep > step.num
                          ? "bg-gradient-to-r from-amber-500/80 to-amber-600/80 text-black"
                          : "bg-muted/50 text-muted-foreground border border-border"
                      )}
                    >
                      {currentStep > step.num ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        step.num
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] md:text-xs font-medium transition-colors",
                        currentStep === step.num
                          ? "text-amber-500"
                          : currentStep > step.num
                          ? "text-amber-500/60"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className={cn(
                        "w-6 md:w-12 h-0.5 rounded-full transition-all duration-300 mb-5",
                        currentStep > step.num ? "bg-amber-500/60" : "bg-border"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Basic Information */}
            {currentStep === 1 &&
              <div className="space-y-3 md:space-y-4 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="firstName" className="text-sm">{t("artistRegistration.firstName")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input id="firstName" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="bg-input border-border focus:border-accent h-9 pl-9" placeholder={t("artistRegistration.placeholders.firstName")} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="text-sm">{t("artistRegistration.lastName")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input id="lastName" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="bg-input border-border focus:border-accent h-9 pl-9" placeholder={t("artistRegistration.placeholders.lastName")} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="country" className="text-sm">{t("artistRegistration.country")}</Label>
                    <CountrySelector
                      value={formData.country}
                      onChange={(value) => setFormData({ ...formData, country: value, county: "" })} />
                  </div>

                  <div className="space-y-1">
                      <Label htmlFor="county" className="text-sm">{divisionLabel}</Label>
                      <Select value={formData.county} onValueChange={(value) => setFormData({ ...formData, county: value })} disabled={!formData.country || availableRegions.length === 0}>
                        <SelectTrigger className="bg-input border-border h-9 pl-9 relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <SelectValue placeholder={formData.country ? t("artistRegistration.placeholders.selectCounty") : t("artistRegistration.placeholders.selectCountryFirst", "Select a country first")} />
                        </SelectTrigger>
                        <SelectContent side="bottom" avoidCollisions={false}>
                          {availableRegions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-sm">{t("artistRegistration.phone")}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="phone"
                        type="tel"
                        required
                        disabled={!formData.country}
                        value={formData.phone}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          const prefix = getPhonePrefix(formData.country);
                          if (prefix && !newValue.startsWith(prefix)) {
                            return;
                          }
                          const afterPrefix = newValue.slice(prefix.length);
                          if (afterPrefix && !/^\d*$/.test(afterPrefix)) {
                            return;
                          }
                          const maxLength = getMaxPhoneLength(formData.country);
                          if (newValue.length <= maxLength) {
                            setFormData({ ...formData, phone: newValue });
                          }
                        }}
                        className="bg-input border-border focus:border-accent h-9 pl-9"
                        placeholder={t("artistRegistration.placeholders.phone")} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:justify-end pt-3">
                  <Button type="button" onClick={nextStep} size="default" className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/25 transition-all duration-300">
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
                    <Label htmlFor="stageName" className="text-sm">{t("artistRegistration.stageName")}</Label>
                    <div className="relative">
                      <Mic className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input id="stageName" required value={formData.stageName} onChange={(e) => setFormData({ ...formData, stageName: e.target.value })} className="bg-input border-border focus:border-accent h-9 pl-9" placeholder={t("artistRegistration.placeholders.stageName")} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="specialization" className="text-sm">{t("artistRegistration.specialization")}</Label>
                    <Select value={formData.specialization} onValueChange={(value) => setFormData({ ...formData, specialization: value })}>
                      <SelectTrigger className="bg-input border-border h-9 pl-9 relative">
                        <Music className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                    <Label htmlFor="experienceLevel" className="text-sm">{t("artistRegistration.experienceLevel")}</Label>
                    <Select value={formData.experienceLevel} onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}>
                      <SelectTrigger className="bg-input border-border h-9 pl-9 relative">
                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                    <Label htmlFor="careerStartYear" className="text-sm">{t("artistRegistration.careerStartYear")}</Label>
                    <Select value={formData.careerStartYear} onValueChange={(value) => setFormData({ ...formData, careerStartYear: value })}>
                      <SelectTrigger className="bg-input border-border h-9 pl-9 relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
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

                <div className="flex flex-col-reverse md:flex-row md:justify-between gap-3 pt-3">
                  <Button type="button" onClick={previousStep} variant="outline" size="default" className="w-full md:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
                  </Button>
                  <Button type="button" onClick={nextStep} size="default" className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/25 transition-all duration-300">
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

                <div className="flex flex-col-reverse md:flex-row md:justify-between gap-3">
                  <Button type="button" onClick={previousStep} variant="outline" size="default" className="w-full md:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
                  </Button>
                  <Button type="button" onClick={nextStep} size="default" className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/25 transition-all duration-300">
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
                    <Label htmlFor="password">{t("artistRegistration.password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input id="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="bg-input border-border focus:border-accent pl-9 pr-10" placeholder={t("artistRegistration.placeholders.password")} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={formData.password} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("artistRegistration.confirmPassword")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="bg-input border-border focus:border-accent pl-9 pr-10" placeholder={t("artistRegistration.placeholders.confirmPassword")} />
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
                    <Link to="/terms-of-service" className="text-accent hover:underline font-semibold">
                      {t("userRegistration.termsOfService", "Terms of Service")}
                    </Link>{" "}
                    {t("userRegistration.and", "and")}{" "}
                    <Link to="/privacy-policy" className="text-accent hover:underline font-semibold">
                      {t("userRegistration.privacyPolicy", "Privacy Policy")}
                    </Link>
                  </label>
                </div>

                <div className="flex flex-col-reverse md:flex-row md:justify-between gap-3">
                  <Button type="button" onClick={previousStep} variant="outline" size="default" className="w-full md:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
                  </Button>
                  <Button type="submit" size="default" disabled={isSubmitting || !agreedToTerms} className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/25 transition-all duration-300 disabled:opacity-50">
                    {isSubmitting ? t("common.creating") : t("common.create")}
                  </Button>
                </div>
              </div>
              }
            </form>
          </div>
        </div>
      </div>

    </div>);


};

export default RegisterArtist;