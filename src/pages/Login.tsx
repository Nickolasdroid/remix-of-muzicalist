import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import artistOnboardingBg from "@/assets/artist-onboarding-bg.jpg";
import logo from "@/assets/logo.png";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if ((roleData?.user_type as string) === 'admin') {
          navigate('/admin/dashboard');
        } else if (roleData?.user_type === 'user') {
          navigate('/user-dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('user_type')
        .eq('user_id', data.user.id)
        .maybeSingle();

      toast({
        title: "Login Successful!",
        description: "Welcome back to Muzicalist.",
      });

      if ((roleData?.user_type as string) === 'admin') {
        navigate('/admin/dashboard');
      } else if (roleData?.user_type === 'user') {
        navigate('/user-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel - Branding */}
      <div className="relative hidden md:flex w-full md:w-1/2 min-h-[40vh] md:min-h-screen flex-col justify-center overflow-hidden">
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
        <div className="relative z-10 px-8 md:px-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Welcome Back<br />to Muzicalist
          </h1>
          <p className="text-sm md:text-base text-white/70 max-w-md">
            Log in and manage your artist profile, bookings and opportunities.
          </p>
        </div>

      </div>

      {/* Homepage logo - top left */}
      <Link to="/" className="fixed top-4 left-4 md:top-6 md:left-6 z-50">
        <img src={logo} alt="Muzicalist" className="h-8 w-8 md:h-10 md:w-10 object-contain" />
      </Link>

      {/* Right Panel - Login Form */}
      <div className="w-full md:w-1/2 min-h-[60vh] md:min-h-screen flex items-center justify-center bg-background px-6 pt-20 pb-12 md:py-12 md:px-12">
        <div className="w-full max-w-md">
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="border border-border rounded-xl p-6 space-y-5 bg-accent-foreground">
              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-3">
                <img src={logo} alt="Muzicalist" className="h-12 w-12 object-contain" />
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                  Login to your Account
                </h2>
              </div>

              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 bg-input border-border text-base"
                  placeholder="Email"
                />
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 bg-input border-border text-base pr-12"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  Remember me
                </label>
                <Link to="/reset-password" className="text-accent hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              {/* Register link */}
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-accent hover:underline font-semibold">
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
