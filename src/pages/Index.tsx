import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Home from "./Home";
import About from "./About";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session?.user);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show nothing while checking auth status to prevent flash
  if (isAuthenticated === null) {
    return null;
  }

  return isAuthenticated ? <Home /> : <About />;
};

export default Index;
