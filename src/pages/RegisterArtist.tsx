import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { UserPlus, ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";
import { supabase } from "@/integrations/supabase/client";
import { MusicGenreCombobox } from "@/components/MusicGenreCombobox";
import CountrySelector from "@/components/CountrySelector";
import { getPhonePrefix, getMaxPhoneLength, validatePhoneNumber, getPhoneConfig } from "@/lib/countryPhoneCodes";

const RegisterArtist = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    stageName: "",
    email: "",
    phone: "",
    country: "",
    county: "",
    specialization: "",
    musicGenres: "",
    experienceLevel: "",
    numberOfEvents: "",
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
  
  const romanianCounties = ["Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brăila", "Brașov", "București", "Buzău", "Călărași", "Caraș-Severin", "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova", "Sălaj", "Satu Mare", "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vâlcea", "Vaslui", "Vrancea"];
  const totalSteps = 4;
  const progressPercentage = currentStep / totalSteps * 100;

  // Update phone prefix when country changes
  useEffect(() => {
    if (formData.country) {
      const newPrefix = getPhonePrefix(formData.country);
      const config = getPhoneConfig(formData.country);
      if (newPrefix && config) {
        setFormData(prev => {
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
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const previousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise(resolve => {
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
    return new Promise(resolve => {
      canvas.toBlob(blob => {
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
        county: formData.county,
        specialization: formData.specialization as any,
        music_genres: formData.musicGenres,
        experience_level: formData.experienceLevel as any,
        number_of_events: parseInt(formData.numberOfEvents),
        career_start_year: parseInt(formData.careerStartYear),
        avatar_url: avatarUrl
      });
      if (profileError) throw profileError;
      
      toast({
        title: t("artistRegistration.success.title"),
        description: t("artistRegistration.success.message")
      });
      setTimeout(() => {
        navigate(`/artist/${authData.user.id}`);
      }, 2000);
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

  return (
    <div className="min-h-screen md:min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col md:items-center md:justify-center py-0 md:py-12 px-0 md:px-4">
        <div className="w-full max-w-4xl flex-1 md:flex-none">
          <form onSubmit={handleSubmit} className="min-h-screen md:min-h-0 space-y-4 md:space-y-8 bg-gradient-to-br from-card to-secondary p-4 md:p-12 md:rounded-2xl md:border-2 border-accent/30 md:shadow-[var(--shadow-elegant)]">
            <div className="text-center mb-4 md:mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded-full bg-accent mb-4 md:mb-6 shadow-[var(--shadow-gold)]">
                <UserPlus className="h-7 w-7 md:h-10 md:w-10 text-accent-foreground" />
              </div>
              <h1 className="text-2xl md:text-5xl font-display font-bold mb-2 md:mb-4 text-foreground">
                {t("artistRegistration.title")}
              </h1>
              <p className="text-sm md:text-xl text-muted-foreground mb-4 md:mb-6">
                {t("auth.register.step", { current: currentStep, total: totalSteps })}
              </p>
              <Progress value={progressPercentage} className="w-full max-w-md mx-auto" />
            </div>
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-3 md:space-y-4 animate-in fade-in duration-500">
                <h2 className="text-lg md:text-xl font-display font-bold text-foreground mb-3 md:mb-4">
                  {t("auth.register.basicInfo")}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="firstName" className="text-xs md:text-sm">{t("artistRegistration.firstName")}</Label>
                    <Input id="firstName" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="bg-input border-border focus:border-accent h-9" placeholder={t("artistRegistration.placeholders.firstName")} />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="text-xs md:text-sm">{t("artistRegistration.lastName")}</Label>
                    <Input id="lastName" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="bg-input border-border focus:border-accent h-9" placeholder={t("artistRegistration.placeholders.lastName")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="email" className="text-xs md:text-sm">{t("artistRegistration.email")}</Label>
                    <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-input border-border focus:border-accent h-9" placeholder={t("artistRegistration.placeholders.email")} />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="phone" className="text-xs md:text-sm">{t("artistRegistration.phone")}</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      required 
                      value={formData.phone} 
                      onChange={e => {
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
                      placeholder={t("artistRegistration.placeholders.phone")} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="md:col-span-2">
                    <CountrySelector value={formData.country} onChange={value => setFormData({ ...formData, country: value })} showLabel variant="list" />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="county" className="text-xs md:text-sm">{t("artistRegistration.county")}</Label>
                    <Select value={formData.county} onValueChange={value => setFormData({ ...formData, county: value })}>
                      <SelectTrigger className="bg-input border-border h-9">
                        <SelectValue placeholder={t("artistRegistration.placeholders.selectCounty")} />
                      </SelectTrigger>
                      <SelectContent>
                        {romanianCounties.map(county => <SelectItem key={county} value={county}>{county}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="button" onClick={nextStep} size="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {t("common.next")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {currentStep === 2 && (
              <div className="space-y-3 md:space-y-4 animate-in fade-in duration-500">
                <h2 className="text-lg md:text-xl font-display font-bold text-foreground mb-3 md:mb-4">
                  {t("auth.register.professionalInfo")}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="stageName" className="text-xs md:text-sm">{t("artistRegistration.stageName")}</Label>
                    <Input id="stageName" required value={formData.stageName} onChange={e => setFormData({ ...formData, stageName: e.target.value })} className="bg-input border-border focus:border-accent h-9" placeholder={t("artistRegistration.placeholders.stageName")} />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="specialization" className="text-xs md:text-sm">{t("artistRegistration.specialization")}</Label>
                    <Select value={formData.specialization} onValueChange={value => setFormData({ ...formData, specialization: value })}>
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
                    <Label htmlFor="experienceLevel" className="text-xs md:text-sm">{t("artistRegistration.experienceLevel")}</Label>
                    <Select value={formData.experienceLevel} onValueChange={value => setFormData({ ...formData, experienceLevel: value })}>
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
                    <Label htmlFor="careerStartYear" className="text-xs md:text-sm">{t("artistRegistration.careerStartYear")}</Label>
                    <Select value={formData.careerStartYear} onValueChange={value => setFormData({ ...formData, careerStartYear: value })}>
                      <SelectTrigger className="bg-input border-border h-9">
                        <SelectValue placeholder={t("artistRegistration.placeholders.careerStart")} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
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
            )}

            {/* Step 3: Profile Picture */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl font-display font-bold text-foreground mb-6">
                  {t("auth.register.profilePicture")}
                </h2>
                
                <div className="space-y-4">
                  <Label htmlFor="profilePic">{t("artistRegistration.uploadPhoto")}</Label>
                  <Input id="profilePic" type="file" accept="image/*" onChange={handleImageUpload} className="bg-input border-border focus:border-accent" />

                  {imageSrc && (
                    <div className="space-y-4">
                      <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden">
                        <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} cropShape="rect" showGrid={false} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="zoom">{t("artistRegistration.adjustPhoto")}: {zoom.toFixed(1)}x</Label>
                        <input id="zoom" type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent" />
                      </div>
                    </div>
                  )}
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
            )}

            {/* Step 4: Password */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl font-display font-bold text-foreground mb-6">
                  {t("auth.register.createPassword")}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("artistRegistration.password")}</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="bg-input border-border focus:border-accent pr-10" placeholder={t("artistRegistration.placeholders.password")} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("artistRegistration.confirmPassword")}</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="bg-input border-border focus:border-accent pr-10" placeholder={t("artistRegistration.placeholders.confirmPassword")} />
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
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterArtist;
