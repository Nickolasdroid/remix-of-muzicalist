import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const PrivacyPolicy = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className={`min-h-screen ${user ? 'md:ml-64' : ''}`}>
      <Navigation />
      
      <div className={`pt-20 ${user ? 'md:pt-8' : 'md:pt-24'} pb-12 px-4 md:px-8`}>
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-8 text-foreground">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-muted-foreground">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">Data Controller</h2>
              <p>
                Muzicalist is operated by <strong className="text-foreground">FUTURE CRAFT SRL</strong>,
                the data controller responsible for the processing of your personal data under this policy.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Company:</strong> FUTURE CRAFT SRL</li>
                <li><strong className="text-foreground">CUI:</strong> 54307625</li>
                <li><strong className="text-foreground">Registered address:</strong> Str. Principală, Nr. 39, Sat Sohodol, Comuna Sohodol, Romania</li>
                <li><strong className="text-foreground">Email:</strong> <a href="mailto:contact@muzicalist.com" className="text-accent hover:underline">contact@muzicalist.com</a></li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account,
                update your profile, post content, send messages, or contact support. This may include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account details: name, email, phone number, password (stored encrypted)</li>
                <li>Profile information: stage name, biography, avatar, gallery photos and videos, social links, pricing</li>
                <li>Professional information: specialization, instruments, music genres, experience level, career details</li>
                <li>Location data: country and region (auto-detected from IP at signup, editable in profile)</li>
                <li>Content you post: posts, announcements, comments, reviews, booking requests and messages</li>
                <li>Reports you submit about other users or content (reason and optional description)</li>
                <li>Billing information processed by our payment provider (we never store full card details)</li>
                <li>Technical data: device, browser, IP address, and basic usage analytics</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Operate and improve the platform and its features</li>
                <li>Connect artists with users and process bookings, messages and notifications</li>
                <li>Activate and manage your paid subscription plan</li>
                <li>Review reports and enforce our community guidelines</li>
                <li>Send transactional emails (account, bookings, password resets, billing)</li>
                <li>Detect, prevent and respond to fraud, abuse and security incidents</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">3. Information Sharing</h2>
              <p>
                We do not sell your personal information. We may share data in limited cases:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Publicly on your profile (only fields you choose to make visible — phone and email visibility are toggleable)</li>
                <li>With service providers that power the platform (managed cloud backend, payment processor, email delivery, authentication providers such as Google)</li>
                <li>With moderators reviewing reports you or others submit</li>
                <li>To comply with legal requests or protect the rights and safety of our users</li>
                <li>With your explicit consent or at your direction</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">4. Payments</h2>
              <p>
                Subscription payments are processed by our third-party payment provider. We receive
                billing status and plan information but do not store full card numbers on our servers.
                Their privacy policy also applies when you make a payment.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">5. Data Security</h2>
              <p>
                Data is stored on our managed cloud backend with row-level security, encrypted in
                transit (HTTPS) and at rest. Authentication is handled with industry-standard tokens.
                Despite our safeguards, no system is 100% secure — please use a strong, unique password.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify or update your personal information</li>
                <li>Request deletion of your account and associated data</li>
                <li>Control which contact details are publicly visible on your profile</li>
                <li>Object to or restrict certain processing of your data</li>
                <li>Withdraw consent at any time (this may limit access to the platform)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">7. Cookies & Local Storage</h2>
              <p>
                We use cookies and local storage to keep you signed in, remember language and UI
                preferences, and analyze usage. You can control cookies through your browser settings.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">8. Data Retention</h2>
              <p>
                We keep your data while your account is active. If you delete your account, we remove
                or anonymize your personal data within a reasonable period, except where retention is
                required by law (e.g. billing records) or needed to resolve disputes or enforce our terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">9. Children</h2>
              <p>
                Muzicalist is not intended for users under 18. We do not knowingly collect personal
                information from minors. If you believe a minor has registered, please contact us.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">10. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes 
                by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:contact@muzicalist.com" className="text-accent hover:underline">
                  contact@muzicalist.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>

      {!user && <Footer />}
    </div>
  );
};

export default PrivacyPolicy;
