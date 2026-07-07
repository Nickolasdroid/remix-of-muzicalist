import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Mic, Search, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AuthHeader from "@/components/AuthHeader";

const Register = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/", { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  if (checking) return null;

  const options = [
    {
      icon: Mic,
      title: "Grow my presence as an artist",
      description: "Create your artist profile and connect with new opportunities.",
      onClick: () => navigate("/register/artist"),
    },
    {
      icon: Search,
      title: "Find artists for my events",
      description: "Discover, compare and connect with artists.",
      onClick: () => navigate("/register/user"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24 md:pb-4">
      <AuthHeader />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-14 md:mb-20">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 text-foreground">
              What brings you to Muzicalist?
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Choose what you'd like to do.
            </p>
          </div>

          <div className="space-y-4">
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.title}
                  onClick={opt.onClick}
                  className="group w-full text-left flex items-center gap-6 rounded-lg border border-border bg-card px-7 md:px-8 py-7 md:py-8 transition-all duration-300 hover:border-accent/60 hover:shadow-[0_0_24px_-4px_hsl(var(--accent)/0.35)]"
                >
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-accent/5 ring-1 ring-accent/15 transition-colors">
                    <Icon className="h-7 w-7 md:h-8 md:w-8 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">
                      {opt.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                  <ArrowRight className="flex-shrink-0 h-6 w-6 text-accent transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.25} />
                </button>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm md:text-base text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-accent hover:underline font-semibold"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
