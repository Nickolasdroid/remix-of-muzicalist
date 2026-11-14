import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff, Mic, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthShell, { authButtonClass, authInputClass } from "@/components/AuthShell";
import PasswordStrengthIndicator, { getPasswordScore } from "@/components/PasswordStrengthIndicator";
import SEO from "@/components/SEO";
import { trackPixelEvent } from "@/components/MetaPixel";
import { cn } from "@/lib/utils";
import { peekPlanIntent } from "@/lib/planIntent";
import { appOrigin } from "@/lib/native";

export type AccountType = "artist" | "user";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The two kinds of account, used here and on the welcome screen after Google. */
export const AccountTypeChoice = ({
  value,
  onChange,
}: {
  value: AccountType | null;
  onChange: (v: AccountType) => void;
}) => (
  <div className="space-y-3" role="radiogroup" aria-label="Account type">
    {(
      [
        { v: "user" as const, icon: Search, title: "I'm looking for artists", text: "For weddings, parties, corporate events and more." },
        { v: "artist" as const, icon: Mic, title: "I'm an artist", text: "Singer, instrumentalist, DJ or band. Get booking requests." },
      ]
    ).map(({ v, icon: Icon, title, text }) => {
      const selected = value === v;
      return (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => onChange(v)}
          className={cn(
            "flex w-full items-center gap-4 rounded-md border px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
            selected ? "border-foreground bg-foreground/[0.06]" : "border-[#727272] hover:border-foreground",
          )}
        >
          <Icon className="h-6 w-6 shrink-0 text-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-foreground">{title}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">{text}</span>
          </span>
          <span
            className={cn("h-5 w-5 shrink-0 rounded-full border-2", selected ? "border-accent bg-accent shadow-[inset_0_0_0_3px_#121212]" : "border-[#727272]")}
            aria-hidden="true"
          />
        </button>
      );
    })}
  </div>
);

/** Where a new account goes first. Artists fill in their profile before anything else. */
export const homeForAccount = (type: AccountType) => (type === "artist" ? "/complete-profile" : "/user-dashboard");

/**
 * One sign-up for everyone, Spotify style: email (or Google), password, name, then
 * "artist or looking for artists". Artists finish their profile after the account exists;
 * everyone starts on the Free plan.
 */
const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preset = searchParams.get("type");

  const [authChecking, setAuthChecking] = useState(true);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<AccountType | null>(preset === "artist" || preset === "user" ? preset : null);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/", { replace: true });
      else setAuthChecking(false);
    });
  }, [navigate]);

  // Already registered? Say so before they type a password
  useEffect(() => {
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setEmailTaken(false);
      setEmailChecking(false);
      return;
    }
    setEmailChecking(true);
    const handle = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id").eq("email", value).maybeSingle();
      setEmailTaken(!!data);
      setEmailChecking(false);
    }, 450);
    return () => clearTimeout(handle);
  }, [email]);

  if (authChecking) return null;

  const planIntent = accountType === "user" ? null : peekPlanIntent();

  const google = async () => {
    setGoogleLoading(true);
    // Google can't carry the role: the welcome screen preselects it from here
    try {
      if (accountType) localStorage.setItem("signup_intent", accountType);
    } catch {
      /* storage unavailable */
    }
    try {
      // Native Supabase OAuth: the browser is redirected to Google, then back to the app.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: appOrigin() },
      });
      if (error) {
        toast.error(error.message || "Google sign-up failed.");
        setGoogleLoading(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Google sign-up failed.");
      setGoogleLoading(false);
    }
  };

  const emailValid = EMAIL_RE.test(email.trim()) && !emailTaken && !emailChecking;
  const passwordValid = password.length >= 8 && getPasswordScore(password) >= 3;
  const nameValid = name.trim().length >= 2;
  const typeValid = accountType === "user" || accountType === "artist";

  const createAccount = async () => {
    if (!accountType || !typeValid || submitting) return;
    setSubmitting(true);
    const fullName = name.trim();
    const [first, ...rest] = fullName.split(/\s+/);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${appOrigin()}/login`,
          data: {
            account_type: accountType,
            first_name: first,
            last_name: rest.join(" "),
            full_name: fullName,
            ...(accountType === "artist" ? { stage_name: fullName } : {}),
          },
        },
      });
      if (error) throw error;
      trackPixelEvent("CompleteRegistration");
      if (data.session) {
        navigate(homeForAccount(accountType), { replace: true });
      } else {
        navigate(`/login?signup=success&email=${encodeURIComponent(email.trim())}`, { replace: true });
      }
    } catch (error: any) {
      const raw = (error?.message || "").toLowerCase();
      if (raw.includes("rate limit") || raw.includes("too many") || error?.status === 429) {
        toast.error("Too many sign-up attempts. Wait a few minutes and try again. If you already got a confirmation email, check your inbox and spam folder.");
      } else {
        toast.error(error?.message || "Sign-up failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_TITLES = ["", "Create a password", "Tell us about yourself", "What brings you here?"];

  const stepHeader =
    step > 0 ? (
      <div className="mb-8">
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-[#727272]/50">
          <div className="h-full bg-accent transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            aria-label="Back"
            className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <p className="text-sm text-muted-foreground">
              <span>Step</span> {step} <span>of</span> 3
            </p>
            <p key={step} className="text-base font-bold text-foreground">{STEP_TITLES[step]}</p>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <SEO
        title="Sign up | Muzicalist"
        description="Create a free Muzicalist account: book musical artists for your events, or get booking requests as an artist."
        path="/register"
      />
      <AuthShell
        title={step === 0 ? "Create your free account" : ""}
        footer={
          step === 0 ? (
            <>
              <span>Already have an account?</span>{" "}
              <Link to="/login" className="font-medium text-foreground underline underline-offset-2 hover:text-accent">
                Log in here
              </Link>
            </>
          ) : undefined
        }
      >
        {stepHeader}

        {step === 0 && planIntent && (
          <p className="mb-6 rounded-lg bg-foreground/[0.07] px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            <span>{planIntent.plan === "Premium" ? "You chose the Premium plan." : "You chose the Standard plan."}</span>{" "}
            <span>After you create your artist profile, we'll take you to payment.</span>
          </p>
        )}

        {step === 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (emailValid) setStep(1);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-bold text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(authInputClass, emailTaken && "border-destructive hover:border-destructive")}
                aria-invalid={emailTaken}
              />
              {emailTaken && (
                <p className="text-sm text-destructive">
                  <span>This email already has an account.</span>{" "}
                  <Link to={`/login?email=${encodeURIComponent(email.trim())}`} className="font-medium underline underline-offset-2">
                    Log in
                  </Link>
                </p>
              )}
            </div>
            <Button type="submit" disabled={!emailValid} className={`${authButtonClass} !mt-6`}>
              Next
            </Button>

            <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground" aria-hidden="true">
              <span className="h-px flex-1 bg-[#292929]" />
              <span>or</span>
              <span className="h-px flex-1 bg-[#292929]" />
            </div>

            <GoogleSignInButton
              text="signup_with"
            onBeforeSignIn={() => {
              // Google can't carry the role: the welcome screen preselects it from here
              try {
                if (accountType) localStorage.setItem("signup_intent", accountType);
              } catch {
                /* storage unavailable */
              }
            }}
              onSignedIn={() => navigate("/")}
              onError={(message) => toast.error(message)}
              fallback={
                <button
                type="button"
                onClick={google}
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
              }
            />
          </form>
        )}

        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (passwordValid) setStep(2);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-bold text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${authInputClass} pr-11`}
                  autoFocus
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
              <PasswordStrengthIndicator password={password} />
            </div>
            <Button type="submit" disabled={!passwordValid} className={`${authButtonClass} !mt-6`}>
              Next
            </Button>
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (nameValid) setStep(3);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-bold text-foreground">Name</Label>
              <p className="text-sm text-muted-foreground">Your full name. Artists can add a stage name later.</p>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className={authInputClass}
                autoFocus
              />
            </div>
            <Button type="submit" disabled={!nameValid} className={`${authButtonClass} !mt-6`}>
              Next
            </Button>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <AccountTypeChoice value={accountType} onChange={setAccountType} />
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-foreground">
              <input
                type="checkbox"
                checked={adultConfirmed}
                onChange={(e) => setAdultConfirmed(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#f5b301]"
              />
              <span>I am at least 18 years old.</span>
            </label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span>By signing up you agree to the</span>{" "}
              <Link to="/terms-of-service" target="_blank" className="underline underline-offset-2 hover:text-foreground">Terms and Conditions</Link>{" "}
              <span>and the</span>{" "}
              <Link to="/privacy-policy" target="_blank" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>
              <span>.</span>
            </p>
            <Button type="button" onClick={createAccount} disabled={!typeValid || !adultConfirmed || submitting} className={authButtonClass}>
              {submitting ? "Creating your account…" : "Create account"}
            </Button>
          </div>
        )}
      </AuthShell>
    </>
  );
};

export default Register;
