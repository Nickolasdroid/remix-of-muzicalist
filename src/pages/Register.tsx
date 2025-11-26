import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserCircle, Mic } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-foreground">
            Join Our Platform
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose how you want to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Artist Registration */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-secondary p-8 border-2 border-transparent hover:border-accent transition-all duration-500 hover:shadow-[var(--shadow-gold)] hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 text-center">
              <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent/20 group-hover:bg-accent group-hover:scale-110 transition-all duration-500">
                <Mic className="h-12 w-12 text-accent group-hover:text-accent-foreground transition-colors" />
              </div>
              
              <h2 className="text-2xl font-display font-bold mb-3 text-foreground group-hover:text-accent transition-colors">
                Register as Artist
              </h2>
              
              <p className="text-muted-foreground mb-6 group-hover:text-foreground/80 transition-colors">
                Showcase your talent, get discovered, and connect with clients looking for entertainment
              </p>

              <ul className="text-left space-y-2 mb-8 text-sm text-muted-foreground">
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
                className="w-full"
                size="lg"
              >
                Continue as Artist
              </Button>
            </div>
          </div>

          {/* User Registration */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-secondary p-8 border-2 border-transparent hover:border-accent transition-all duration-500 hover:shadow-[var(--shadow-gold)] hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 text-center">
              <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent/20 group-hover:bg-accent group-hover:scale-110 transition-all duration-500">
                <UserCircle className="h-12 w-12 text-accent group-hover:text-accent-foreground transition-colors" />
              </div>
              
              <h2 className="text-2xl font-display font-bold mb-3 text-foreground group-hover:text-accent transition-colors">
                Register as User
              </h2>
              
              <p className="text-muted-foreground mb-6 group-hover:text-foreground/80 transition-colors">
                Find the perfect entertainment for your event and post opportunities
              </p>

              <ul className="text-left space-y-2 mb-8 text-sm text-muted-foreground">
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
                size="lg"
              >
                Continue as User
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-muted-foreground">
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
  );
};

export default Register;
