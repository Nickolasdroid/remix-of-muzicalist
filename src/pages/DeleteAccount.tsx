import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { knownUser } from "@/lib/knownUser";

/** Public page that explains how to delete a Muzicalist account (also required by Google Play). */
const DeleteAccount = () => {
  const [user, setUser] = useState<any>(knownUser);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className={`min-h-screen ${user ? "md:ml-[316px] lg:ml-[356px]" : ""}`}>
      <Navigation />
      <div className={`pt-16 ${user ? "md:pt-8" : "md:pt-24"} pb-12 px-4 md:px-8`}>
        <div className="container mx-auto max-w-3xl space-y-6 text-muted-foreground">
          <h1 className="text-2xl md:text-5xl font-display font-bold text-foreground">Delete your Muzicalist account</h1>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Delete it yourself</h2>
            <ol className="list-decimal space-y-2 pl-6">
              <li>Sign in to your account on muzicalist.com or in the Muzicalist app.</li>
              <li>Open <strong className="text-foreground">Settings</strong> and choose <strong className="text-foreground">Delete Account</strong>.</li>
              <li>Confirm. The deletion is immediate and cannot be undone.</li>
            </ol>
            {!user && (
              <Link
                to="/login"
                className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-bold text-accent-foreground"
              >
                Sign in
              </Link>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Can&apos;t sign in?</h2>
            <p>
              Email{" "}
              <a href="mailto:contact@muzicalist.com?subject=Delete%20my%20account" className="text-accent hover:underline">
                contact@muzicalist.com
              </a>{" "}
              from the address of your account and ask us to delete it. We confirm the request and complete the deletion within
              30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">What happens to your data</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Your subscription, if you have one, is cancelled so you are not billed again.</li>
              <li>Your profile, posts, announcements, photos, videos, messages, followers, notifications, calendar and verification documents are deleted.</li>
              <li>Reviews and booking requests you sent to other people stay visible to them, with your name, email and phone removed.</li>
              <li>Contracts already concluded through the platform and the related billing records are kept for as long as the law requires.</li>
            </ul>
            <p>
              More details are in our <Link to="/privacy-policy" className="text-accent hover:underline">Privacy Policy</Link>.
            </p>
          </section>
        </div>
      </div>
      {!user && <Footer />}
    </div>
  );
};

export default DeleteAccount;
