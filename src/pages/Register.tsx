import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserCircle, Mic } from "lucide-react";
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary pb-24 md:pb-4">
      <AuthHeader />

      <div className="flex-1 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3 md:mb-4 text-foreground">Join Muzicalist

            </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Choose how you want to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Artist Registration */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-secondary p-6 md:p-8 border-2 border-transparent hover:border-accent transition-all duration-500 hover:shadow-[var(--shadow-gold)] md:hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 text-center">
              <div className="mb-4 md:mb-6 inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full bg-accent/20 group-hover:bg-accent group-hover:scale-110 transition-all duration-500">
                <Mic className="h-8 w-8 md:h-12 md:w-12 text-accent group-hover:text-accent-foreground transition-colors" />
              </div>
              
              <h2 className="text-xl md:text-2xl font-display font-bold mb-2 md:mb-3 text-foreground group-hover:text-accent transition-colors">
                Register as Artist
              </h2>
              
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 group-hover:text-foreground/80 transition-colors">
                Showcase your talent, get discovered, and connect with clients looking for entertainment
              </p>

              <ul className="text-left space-y-2 mb-6 md:mb-8 text-xs md:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Create a professional profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Upload your media gallery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Receive booking requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Post announcements</span>
                </li>
              </ul>
              
              <Button
                  onClick={() => navigate("/register/artist")}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                  size="lg">
                  
                Continue as Artist
              </Button>
            </div>
          </div>

          {/* User Registration */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-secondary p-6 md:p-8 border-2 border-transparent hover:border-accent transition-all duration-500 hover:shadow-[var(--shadow-gold)] md:hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 text-center">
              <div className="mb-4 md:mb-6 inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full bg-accent/20 group-hover:bg-accent group-hover:scale-110 transition-all duration-500">
                <UserCircle className="h-8 w-8 md:h-12 md:w-12 text-accent group-hover:text-accent-foreground transition-colors" />
              </div>
              
              <h2 className="text-xl md:text-2xl font-display font-bold mb-2 md:mb-3 text-foreground group-hover:text-accent transition-colors">
                Register as User
              </h2>
              
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 group-hover:text-foreground/80 transition-colors">
                Find the perfect entertainment for your event and post opportunities
              </p>

              <ul className="text-left space-y-2 mb-6 md:mb-8 text-xs md:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Browse artist profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Contact artists directly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Post job opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Manage your requests</span>
                </li>
              </ul>
              
              <Button
                  onClick={() => navigate("/register/user")}
                  variant="secondary"
                  className="w-full"
                  size="lg">
                  
                Continue as User
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 md:mt-8">
          <p className="text-sm md:text-base text-muted-foreground">
            Already have an account?{" "}
            <button
                onClick={() => navigate("/login")}
                className="text-accent hover:underline font-semibold">
                
              Sign in
            </button>
          </p>
        </div>
      </div>
      </div>
    </div>);

};

export default Register;