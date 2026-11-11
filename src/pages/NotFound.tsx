import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import GuestSidebar from "@/components/GuestSidebar";
import logo from "@/assets/logo.webp";

/** Page shown for links that lead nowhere, inside the usual app frame. */
const NotFound = () => {
  const location = useLocation();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(!!session?.user));
  }, []);

  return (
    <div
      className={`min-h-screen bg-black ${
        signedIn ? "md:ml-[316px] md:py-2 md:pr-2 lg:ml-[356px]" : "md:flex md:items-start md:gap-2 md:px-2 md:pb-2 md:pt-[72px]"
      }`}
    >
      <Navigation />
      {signedIn === false && <GuestSidebar />}
      <main className="flex min-h-screen min-w-0 flex-1 items-center justify-center bg-background px-6 pb-24 pt-14 md:min-h-[calc(100vh-80px)] md:rounded-lg md:pb-10 md:pt-10">
        <div className="flex max-w-md flex-col items-center text-center">
          <img src={logo} alt="" className="h-16 w-16 object-contain md:h-20 md:w-20" />
          <h1 className="mt-6 font-figtree text-3xl font-bold tracking-[-0.02em] text-foreground md:text-5xl">Page not found</h1>
          <p className="mt-3 text-base text-muted-foreground">The link may be wrong, or the page was removed.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex h-12 items-center rounded-full bg-accent px-8 text-sm font-bold text-accent-foreground transition-transform hover:scale-[1.03]"
            >
              Go to home page
            </Link>
            <Link
              to="/artists"
              className="inline-flex h-12 items-center rounded-full border border-foreground/40 px-8 text-sm font-bold text-foreground transition-colors hover:border-foreground"
            >
              Browse artists
            </Link>
          </div>
          <Link to="/help" className="mt-8 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Help
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
