import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import logo from "@/assets/logo.png";
import AuthHeader from "@/components/AuthHeader";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({
          title: "Google sign-in failed",
          description: result.error.message || "Please try again.",
          variant: "destructive",
        });
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
    } catch (err: any) {
      toast({
        title: "Google sign-in failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "success") {
      const email = params.get("email");
      if (email) {
        setFormData((prev) => ({ ...prev, email }));
      }
      toast({
        title: "Cont creat cu succes",
        description: "Te rugăm să te autentifici pentru a continua.",
      });
      window.history.replaceState({}, "", "/login");
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let role: string | undefined;
      for (let i = 0; i < 4; i++) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .maybeSingle();
        role = roleData?.user_type as string | undefined;
        if (role) break;
        await new Promise((r) => setTimeout(r, 350));
      }

      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'user') {
        navigate('/user-dashboard');
      } else {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate, toast]);

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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Homepage logo - top left */}
      <Link to="/" className="fixed top-4 left-4 md:top-6 md:left-6 z-50">
        <img src={logo} alt="Muzicalist" className="h-8 w-8 md:h-10 md:w-10 object-contain" />
      </Link>

      {/* Login Form - centered */}
      <div className="w-full min-h-screen flex items-start md:items-center justify-center px-6 pt-24 pb-12 md:py-12">
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
                className="w-full h-12 text-base font-semibold rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
              >
                {isLoading ? "Getting started..." : "Get Started"}
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
