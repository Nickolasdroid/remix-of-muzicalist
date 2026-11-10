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
      // Logging in, not signing up: no account type preselected (a new Google account is asked on /welcome)
      try { localStorage.removeItem("signup_intent"); } catch { /* storage unavailable */ }
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
        title="Log in to your account"
        footer={
          <>
            <span>Don't have an account?</span>{" "}
            <Link to="/register" className="font-medium text-foreground underline underline-offset-2 hover:text-accent">
              Sign up for Muzicalist
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-bold text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={authInputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-bold text-foreground">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`${authInputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className={`${authButtonClass} !mt-6`}>
            {isLoading ? "Logging in..." : "Log in"}
          </Button>

          <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground" aria-hidden="true">
            <span className="h-px flex-1 bg-[#292929]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[#292929]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#727272] text-base font-bold text-foreground transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            {googleLoading ? <span>Opening Google…</span> : <span>Continue with Google</span>}
          </button>

          <p className="!mt-6 text-center">
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

