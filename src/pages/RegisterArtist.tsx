import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import PasswordStrengthIndicator, { getPasswordScore } from "@/components/PasswordStrengthIndicator";
import logo from "@/assets/logo.png";

type Specialization = "Singer" | "Instrumentalist" | "DJ" | "Band";

const RegisterArtist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    stageName: "",
    phone: "",
    country: "Romania",
    county: "",
    specialization: "" as Specialization | "",
  });

  const update = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.firstName || !form.lastName || !form.stageName || !form.phone || !form.county || !form.specialization) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    if (getPasswordScore(form.password) < 4) {
      toast({ title: "Weak password", description: "Please use a stronger password.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
          },
        },
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("Signup did not return a user.");

      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        stage_name: form.stageName,
        phone: form.phone,
        country: form.country,
        county: form.county,
        specialization: form.specialization as Specialization,
        plan: "Free",
        is_active: false,
      } as never);
      if (profileError) throw profileError;

      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        user_type: "artist" as never,
      });
      if (roleError) throw roleError;

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account, then log in.",
      });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message || "Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary py-8 px-4">
      <div className="max-w-xl mx-auto">
        <Link to="/register" className="inline-flex items-center gap-2 mb-6">
          <img src={logo} alt="Muzicalist" className="h-9 w-9 object-contain" />
          <span className="font-display font-bold text-foreground">Muzicalist</span>
        </Link>

        <div className="bg-card border border-border rounded-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Register as Artist</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Create your account with email & password. You'll choose a paid plan after sign-in.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First name</Label>
                <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="rounded-lg" />
              </div>
              <div>
                <Label>Last name</Label>
                <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="rounded-lg" />
              </div>
            </div>

            <div>
              <Label>Stage name</Label>
              <Input value={form.stageName} onChange={(e) => update("stageName", e.target.value)} className="rounded-lg" />
            </div>

            <div>
              <Label>Specialization</Label>
              <Select value={form.specialization} onValueChange={(v) => update("specialization", v)}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Choose..." />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="Singer">Singer</SelectItem>
                  <SelectItem value="Instrumentalist">Instrumentalist</SelectItem>
                  <SelectItem value="DJ">DJ</SelectItem>
                  <SelectItem value="Band">Band</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="rounded-lg" />
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrengthIndicator password={form.password} />
            </div>

            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="rounded-lg" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => update("country", e.target.value)} className="rounded-lg" />
              </div>
              <div>
                <Label>County / Region</Label>
                <Input value={form.county} onChange={(e) => update("county", e.target.value)} className="rounded-lg" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg h-12"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create artist account
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-accent hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterArtist;
