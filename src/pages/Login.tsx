import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import logo from "@/assets/logo.webp";
import AuthShell, { authButtonClass, authInputClass } from "@/components/AuthShell";
import SEO from "@/components/SEO";

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

      // Suspension check
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileCheck && profileCheck.is_active === false) {
        await supabase.auth.signOut({ scope: 'local' });
        toast({
          title: "Account suspended",
          description:
            "Your Muzicalist account has been suspended. Please contact contact@muzicalist.com if you believe this is a mistake.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

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
    <>
      <SEO title="Log in | Muzicalist" description="Log in to your Muzicalist account to book musical artists, manage bookings, and message performers." path="/login" noindex />
      <AuthShell
        title="Log in to Muzicalist"
        footer={
          <>
            <span>Don't have an account?</span>{" "}
            <Link to="/register" className="font-medium text-foreground underline underline-offset-2 hover:text-accent">
              Sign up for Muzicalist
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={authInputClass}
              placeholder="Email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-bold text-foreground">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`${authInputClass} pr-12`}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className={`${authButtonClass} !mt-8`}>
            {isLoading ? "Logging in..." : "Log in"}
          </Button>

          <p className="text-center">
            <Link to="/reset-password" className="text-base font-medium text-foreground underline underline-offset-2 hover:text-accent">
              Forgot your password?
            </Link>
          </p>
        </form>
      </AuthShell>
    </>
  );
};

export default Login;

