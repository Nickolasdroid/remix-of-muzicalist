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
          <div className="text-center mb-10 md:mb-14">
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
                  className="group w-full text-left flex items-center gap-5 rounded-lg border border-border bg-card px-5 md:px-6 py-5 md:py-6 transition-all duration-300 hover:border-accent hover:shadow-[var(--shadow-gold)]"
                >
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <Icon className="h-6 w-6 md:h-7 md:w-7 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">
                      {opt.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                  <ArrowRight className="flex-shrink-0 h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
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
