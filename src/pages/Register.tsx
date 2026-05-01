import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserCircle, Mic, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type AccountType = "artist" | "user";

const PENDING_KEY = "muz_pending_account_type";

const Register = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [selected, setSelected] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/", { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  const handleGoogle = async (type: AccountType) => {
    setSelected(type);
    setLoading(true);
    try {
      // Persist choice so we can apply it after the OAuth round-trip.
      localStorage.setItem(PENDING_KEY, type);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        console.error(result.error);
        toast.error("Could not start Google sign-in. Please try again.");
        setLoading(false);
        return;
      }
      // If redirected, the browser will navigate away.
      // If we got tokens immediately (rare), fall through and let the auth state listener take over.
    } catch (e) {
      console.error(e);
      toast.error("Sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary pb-24 md:pb-4">
      <div className="h-16 flex items-center px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Muzicalist" className="h-8 w-8 md:h-9 md:w-9 object-contain" />
          <span className="font-display font-bold text-foreground md:text-lg">Muzicalist</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-4xl w-full px-4">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3 md:mb-4 text-foreground">
              Join Muzicalist
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Choose your account type, then continue with Google
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Artist */}
            <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-card to-secondary p-6 md:p-8 border-2 border-transparent hover:border-accent transition-all duration-500">
              <div className="relative z-10 text-center">
                <div className="mb-4 md:mb-6 inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full bg-accent/20 group-hover:bg-accent transition-all duration-500">
                  <Mic className="h-8 w-8 md:h-12 md:w-12 text-accent group-hover:text-accent-foreground transition-colors" />
                </div>
                <h2 className="text-xl md:text-2xl font-display font-bold mb-2 md:mb-3 text-foreground">
                  Register as Artist
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                  Showcase your talent, get discovered, and connect with clients.
                </p>
                <ul className="text-left space-y-2 mb-6 md:mb-8 text-xs md:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span><span>Create a professional profile</span></li>
                  <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span><span>Upload your media gallery</span></li>
                  <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span><span>Receive booking requests</span></li>
                  <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span><span>Post announcements</span></li>
                </ul>
                <Button
                  onClick={() => navigate("/register/artist")}
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg"
                  size="lg"
                >
                  Register with Email
                </Button>
                <Button
                  onClick={() => handleGoogle("artist")}
                  disabled={loading}
                  variant="outline"
                  className="w-full rounded-lg mt-2"
                  size="lg"
                >
                  {loading && selected === "artist" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <GoogleMark />
                  )}
                  Continue with Google
                </Button>
              </div>
            </div>

            {/* User */}
            <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-card to-secondary p-6 md:p-8 border-2 border-transparent hover:border-accent transition-all duration-500">
              <div className="relative z-10 text-center">
                <div className="mb-4 md:mb-6 inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full bg-accent/20 group-hover:bg-accent transition-all duration-500">
                  <UserCircle className="h-8 w-8 md:h-12 md:w-12 text-accent group-hover:text-accent-foreground transition-colors" />
                </div>
                <h2 className="text-xl md:text-2xl font-display font-bold mb-2 md:mb-3 text-foreground">
                  Register as User
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                  Find the perfect entertainment for your event and post opportunities.
                </p>
                <ul className="text-left space-y-2 mb-6 md:mb-8 text-xs md:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span><span>Browse artist profiles</span></li>
                  <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span><span>Contact artists directly</span></li>
                  <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span><span>Post job opportunities</span></li>
                  <li className="flex items-start gap-2"><span className="text-accent mt-0.5">✓</span><span>Manage your requests</span></li>
                </ul>
                <Button
                  onClick={() => navigate("/register/user")}
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg"
                  size="lg"
                >
                  Register with Email
                </Button>
                <Button
                  onClick={() => handleGoogle("user")}
                  disabled={loading}
                  variant="outline"
                  className="w-full rounded-lg mt-2"
                  size="lg"
                >
                  {loading && selected === "user" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <GoogleMark />
                  )}
                  Continue with Google
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 md:mt-8">
            <p className="text-sm md:text-base text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-accent hover:underline font-semibold"
              >
                Sign in
              </button>
            </p>
            <p className="text-xs text-muted-foreground/70 mt-3">
              Activation requires a paid plan. You'll choose Standard or Premium right after signing in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoogleMark = () => (
  <svg className="h-4 w-4 mr-2" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.3-7.2 2.3-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.2C40 35.4 44 30.2 44 24c0-1.2-.1-2.4-.4-3.5z"/>
  </svg>
);

export default Register;
