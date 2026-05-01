import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [state, setState] = useState<"loading" | "allowed" | "forbidden">("loading");

  useEffect(() => {
    let active = true;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (active) setState("forbidden");
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("user_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!active) return;
      setState((data?.user_type as string) === "admin" ? "allowed" : "forbidden");
    };

    check();
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") return null;

  if (state === "forbidden") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full text-center space-y-4 border border-border rounded-lg p-8 bg-card">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">403 — Forbidden</h1>
          <p className="text-muted-foreground">
            You do not have permission to access this area.
          </p>
          <Link to="/">
            <Button className="rounded-lg">Go back home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
