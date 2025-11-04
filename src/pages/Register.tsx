import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    stageName: "",
    email: "",
    phone: "",
    county: "",
    specialization: "",
    description: "",
    password: "",
    confirmPassword: ""
  });

  const romanianCounties = [
    "București", "Cluj", "Timiș", "Iași", "Constanța", "Brașov", 
    "Prahova", "Dolj", "Galați", "Argeș", "Sibiu", "Bacău"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
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
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent mb-6 shadow-[var(--shadow-gold)]">
              <UserPlus className="h-10 w-10 text-accent-foreground" />
            </div>
            <h1 className="text-5xl font-display font-bold mb-4 text-foreground">
              Register as Artist
            </h1>
            <p className="text-xl text-muted-foreground">
              Create your professional artist profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 bg-gradient-to-br from-card to-secondary p-8 rounded-2xl border-2 border-accent/30 shadow-[var(--shadow-elegant)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="bg-input border-border focus:border-accent"
                />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description (max 500 characters)</Label>
              <Textarea
                id="description"
                maxLength={500}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-input border-border focus:border-accent min-h-[120px]"
                placeholder="Tell us about your musical experience..."
              />
            </div>

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

            <Button 
              type="submit" 
              size="lg"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300"
            >
              Create Artist Profile
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
