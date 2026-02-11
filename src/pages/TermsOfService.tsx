import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const TermsOfService = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className={`min-h-screen ${user ? 'md:ml-64' : ''}`}>
      <Navigation />
      
      <div className="pt-20 md:pt-24 pb-12 px-4 md:px-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-8 text-foreground">
            Terms of Service
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-muted-foreground">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Muzicalist, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">2. Description of Service</h2>
              <p>
                Muzicalist is a platform that connects musical artists with clients seeking entertainment 
                services. We provide tools for artists to showcase their talents and for clients to 
                discover and book performers for events.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">3. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old to create an account</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must provide accurate and complete information</li>
                <li>You may not use another person's account without permission</li>
                <li>You are responsible for all activities under your account</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">4. Artist Responsibilities</h2>
              <p>As an artist on our platform, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate information about your skills and experience</li>
                <li>Respond promptly to booking inquiries</li>
                <li>Honor confirmed bookings and commitments</li>
                <li>Maintain professional conduct with clients</li>
                <li>Only upload content you have rights to use</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">5. User Responsibilities</h2>
              <p>As a user of our platform, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate event details when making inquiries</li>
                <li>Communicate respectfully with artists</li>
                <li>Honor booking agreements and payment terms</li>
                <li>Not use the platform for unlawful purposes</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">6. Prohibited Conduct</h2>
              <p>You may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Post false, misleading, or fraudulent content</li>
                <li>Infringe on intellectual property rights</li>
                <li>Attempt to gain unauthorized access to the platform</li>
                <li>Use automated systems to access the service without permission</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">7. Content Ownership</h2>
              <p>
                You retain ownership of content you upload to the platform. By uploading content, 
                you grant us a non-exclusive license to use, display, and distribute your content 
                in connection with our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">8. Limitation of Liability</h2>
              <p>
                Muzicalist acts as a platform connecting artists and clients. We are not responsible 
                for the quality of services provided by artists or the conduct of users. We do not 
                guarantee any specific outcomes from using our platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">9. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for violations 
                of these terms or for any other reason at our discretion. You may also delete your 
                account at any time through your account settings.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">10. Changes to Terms</h2>
              <p>
                We may modify these terms at any time. Continued use of the platform after changes 
                constitutes acceptance of the modified terms. We will notify users of significant 
                changes via email or platform notification.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">11. Contact</h2>
              <p>
                For questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:contact@artistplatform.ro" className="text-accent hover:underline">
                  contact@artistplatform.ro
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsOfService;
