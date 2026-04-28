import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuestContentGateProps {
  title?: string;
  description?: string;
}

/**
 * Overlay shown to unauthenticated users after a short preview of content.
 * Provides a fading blur effect on the content above and a centered CTA
 * card prompting the user to log in or create an account.
 */
const GuestContentGate = ({
  title = "Sign in to keep exploring",
  description = "Create a free account or log in to see the full feed, contact artists, and discover more opportunities.",
}: GuestContentGateProps) => {
  return (
    <div className="relative -mt-24 md:-mt-32 pointer-events-none">
      {/* Fading gradient that softens the content above */}
      <div className="h-24 md:h-32 bg-gradient-to-b from-transparent to-background" />

      {/* Solid background section that hosts the CTA */}
      <div className="bg-background pointer-events-auto px-4 pt-8 pb-16 md:pb-24">
        <div className="max-w-md mx-auto text-center rounded-2xl border border-accent/30 bg-card/80 backdrop-blur-sm p-6 md:p-8 shadow-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/15 mb-4">
            <Lock className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-lg md:text-2xl font-display font-bold text-foreground mb-2">
            {title}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Log in
              </Button>
            </Link>
            <Link to="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-accent/50 text-accent hover:bg-accent/10"
              >
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestContentGate;
