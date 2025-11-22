import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { UserPlus, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";

const Register = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    stageName: "",
    email: "",
    phone: "",
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

  const romanianCounties = [
    "București", "Cluj", "Timiș", "Iași", "Constanța", "Brașov", 
    "Prahova", "Dolj", "Galați", "Argeș", "Sibiu", "Bacău"
  ];

  const totalSteps = 4;
  const progressPercentage = (currentStep / totalSteps) * 100;

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
        if (!formData.specialization || !formData.lastName || !formData.firstName || !formData.stageName || !formData.email || !formData.phone || !formData.county) {
          toast({
            title: "Error",
            description: "Please complete all fields in Step 1",
            variant: "destructive"
          });
          return false;
        }
        break;
      case 2:
        if (!formData.musicGenres || !formData.experienceLevel || !formData.numberOfEvents || !formData.careerStartYear) {
          toast({
            title: "Error",
            description: "Please complete all fields in Step 2",
            variant: "destructive"
          });
          return false;
        }
        break;
      case 3:
        if (!imageSrc) {
          toast({
            title: "Error",
            description: "Please upload a profile picture",
            variant: "destructive"
          });
          return false;
        }
        break;
      case 4:
        if (!formData.password || !formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Please set your password",
            variant: "destructive"
          });
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    toast({
      title: "Registration Successful!",
      description: "Your artist profile has been created. You can now login.",
    });
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent mb-6 shadow-[var(--shadow-gold)]">
              <UserPlus className="h-10 w-10 text-accent-foreground" />
            </div>
            <h1 className="text-5xl font-display font-bold mb-4 text-foreground">
              Register as Artist
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Step {currentStep} of {totalSteps}
            </p>
            <Progress value={progressPercentage} className="w-full max-w-md mx-auto" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 bg-gradient-to-br from-card to-secondary p-8 rounded-2xl border-2 border-accent/30 shadow-[var(--shadow-elegant)]">
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl font-display font-bold text-foreground mb-6">Basic Information</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization *</Label>
                  <Select value={formData.specialization} onValueChange={(value) => setFormData({...formData, specialization: value})}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Singer">Singer</SelectItem>
                      <SelectItem value="Instrumentalist">Instrumentalist</SelectItem>
                      <SelectItem value="DJ">DJ</SelectItem>
                      <SelectItem value="Band">Band</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="bg-input border-border focus:border-accent"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="bg-input border-border focus:border-accent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stageName">Stage Name *</Label>
                  <Input
                    id="stageName"
                    required
                    value={formData.stageName}
                    onChange={(e) => setFormData({...formData, stageName: e.target.value})}
                    className="bg-input border-border focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-input border-border focus:border-accent"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="bg-input border-border focus:border-accent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="county">County *</Label>
                  <Select value={formData.county} onValueChange={(value) => setFormData({...formData, county: value})}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {romanianCounties.map(county => (
                        <SelectItem key={county} value={county}>{county}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={nextStep} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl font-display font-bold text-foreground mb-6">Professional Information</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="musicGenres">Music Genres *</Label>
                  <Input
                    id="musicGenres"
                    required
                    value={formData.musicGenres}
                    onChange={(e) => setFormData({...formData, musicGenres: e.target.value})}
                    className="bg-input border-border focus:border-accent"
                    placeholder="e.g., Pop, Rock, Jazz"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel">Experience Level *</Label>
                    <Select value={formData.experienceLevel} onValueChange={(value) => setFormData({...formData, experienceLevel: value})}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                        <SelectItem value="Professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfEvents">Number of Events *</Label>
                    <Input
                      id="numberOfEvents"
                      type="number"
                      required
                      min="0"
                      value={formData.numberOfEvents}
                      onChange={(e) => setFormData({...formData, numberOfEvents: e.target.value})}
                      className="bg-input border-border focus:border-accent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careerStartYear">Year of Career Start *</Label>
                  <Input
                    id="careerStartYear"
                    type="number"
                    required
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.careerStartYear}
                    onChange={(e) => setFormData({...formData, careerStartYear: e.target.value})}
                    className="bg-input border-border focus:border-accent"
                  />
                </div>

                <div className="flex justify-between">
                  <Button type="button" onClick={previousStep} variant="outline" size="lg">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="button" onClick={nextStep} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Profile Picture */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl font-display font-bold text-foreground mb-6">Profile Picture</h2>
                
                <div className="space-y-4">
                  <Label htmlFor="profilePic">Upload Profile Picture *</Label>
                  <Input
                    id="profilePic"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="bg-input border-border focus:border-accent"
                  />

                  {imageSrc && (
                    <div className="space-y-4">
                      <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden">
                        <Cropper
                          image={imageSrc}
                          crop={crop}
                          zoom={zoom}
                          aspect={1}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropComplete}
                          cropShape="round"
                          showGrid={false}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="zoom">Zoom: {zoom.toFixed(1)}x</Label>
                        <input
                          id="zoom"
                          type="range"
                          min={1}
                          max={3}
                          step={0.1}
                          value={zoom}
                          onChange={(e) => setZoom(parseFloat(e.target.value))}
                          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button type="button" onClick={previousStep} variant="outline" size="lg">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="button" onClick={nextStep} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Password */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-2xl font-display font-bold text-foreground mb-6">Set Your Password</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="bg-input border-border focus:border-accent"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="bg-input border-border focus:border-accent"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" onClick={previousStep} variant="outline" size="lg">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    type="submit" 
                    size="lg"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300"
                  >
                    Create Artist Profile
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

export default Register;
