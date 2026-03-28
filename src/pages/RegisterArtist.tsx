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
import { MusicGenreCombobox } from "@/components/MusicGenreCombobox";
import CountrySelector from "@/components/CountrySelector";
import { getPhonePrefix, getMaxPhoneLength, validatePhoneNumber, getPhoneConfig } from "@/lib/countryPhoneCodes";
import { getDivisionName, getCountryRegions } from "@/lib/countryAdminDivisions";
import registerArtistBg from "@/assets/register-artist-bg.png";
import logo from "@/assets/logo.png";

const RegisterArtist = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authChecking, setAuthChecking] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
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
  const progressPercentage = currentStep / totalSteps * 100;

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

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
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
          <form onSubmit={handleSubmit} className="min-h-screen md:min-h-screen p-4 md:p-6 md:border-0 md:rounded-none border-accent/30 flex flex-col">
            <div className="w-full max-w-3xl mx-auto space-y-3 md:space-y-5 flex-1 md:border md:border-accent/30 md:rounded-2xl md:p-6 md:bg-black/20 pt-10 md:pt-6">
            {/* Title and steps inside the bordered container */}
            <div className="w-full text-center">
              <h1 className="text-lg md:text-2xl font-display font-semibold mb-1 md:mb-2 text-muted-foreground">
                {t("artistRegistration.title")}
              </h1>
              {/* Step indicators */}
              <div className="flex items-center justify-center gap-1.5 md:gap-3 mt-2 md:mt-3">
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
                    <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-input border-border focus:border-accent h-9" placeholder={t("artistRegistration.placeholders.email")} />
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

                <div className="flex justify-between">
                  <Button type="button" onClick={previousStep} variant="outline" size="lg">
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
                  </Button>
                  <Button type="submit" size="lg" disabled={isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300">
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