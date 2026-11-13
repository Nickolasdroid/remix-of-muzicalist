import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { knownUser } from "@/lib/knownUser";

const PrivacyPolicy = () => {
  const [user, setUser] = useState<any>(knownUser);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className={`min-h-screen ${user ? 'md:ml-[316px] lg:ml-[356px]' : ''}`}>
      <Navigation />
      
      <div className={`pt-16 ${user ? 'md:pt-8' : 'md:pt-24'} pb-12 px-4 md:px-8`}>
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-2xl md:text-5xl font-display font-bold mb-6 md:mb-8 text-foreground">
            Privacy Policy
          </h1>
          
          <div className="prose prose-sm md:prose-lg dark:prose-invert max-w-none space-y-6 md:space-y-8 text-muted-foreground">
            <p className="text-sm text-muted-foreground">
              Last updated: November 13, 2026
            </p>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account,
                update your profile, post content, send messages, or contact support. This may include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account details: name, email, phone number, password (stored encrypted)</li>
                <li>Profile information: stage name, biography, avatar, gallery photos and videos, social links, pricing</li>
                <li>Professional information: specialization, instruments, music genres, career details</li>
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
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">11. Data Controller & Contact</h2>
              <p>
                Muzicalist is operated by <strong className="text-foreground">FUTURE CRAFT SRL</strong>,
                the data controller responsible for the processing of your personal data under this policy.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Company:</strong> FUTURE CRAFT SRL</li>
                <li><strong className="text-foreground">CUI:</strong> 54307625</li>
                <li><strong className="text-foreground">Registered address:</strong> Str. Principală, Nr. 39, Sat Sohodol, Comuna Sohodol, Romania</li>
              </ul>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:contact@muzicalist.com" className="text-accent hover:underline">
                  contact@muzicalist.com
                </a>
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">12. Why We Process Your Data (Legal Bases)</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Contract:</strong> to create and run your account, show your profile, handle booking requests, offers and contracts, and process subscription payments.</li>
                <li><strong className="text-foreground">Legitimate interest:</strong> to keep the platform secure, prevent abuse and fraud, moderate content, and measure how the platform is used with our own first-party statistics.</li>
                <li><strong className="text-foreground">Consent:</strong> for marketing cookies (Meta Pixel) and for marketing emails. You can decline cookies in the banner and withdraw consent at any time.</li>
                <li><strong className="text-foreground">Legal obligation:</strong> to keep contracts and billing records as required by accounting and tax law.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">13. Service Providers and Where Data Is Stored</h2>
              <p>We use the following providers to run Muzicalist. They process data only on our instructions:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Supabase</strong>: database, authentication, file storage and server functions. Our project is hosted in the European Union (Paris).</li>
                <li><strong className="text-foreground">Stripe</strong>: subscription payments. Card details go directly to Stripe and are never stored by us.</li>
                <li><strong className="text-foreground">Vercel</strong>: hosting of the website.</li>
                <li><strong className="text-foreground">Hostico</strong>: our email mailboxes and the sending of service emails (account confirmation, password reset, notifications).</li>
                <li><strong className="text-foreground">Google</strong>: optional sign-in with your Google account.</li>
                <li><strong className="text-foreground">Meta Platforms</strong>: advertising measurement (Meta Pixel), only if you accept marketing cookies.</li>
              </ul>
              <p>
                Some of these providers (for example Stripe, Vercel, Google and Meta) may process data outside the European
                Economic Area. Such transfers rely on safeguards such as the European Commission&apos;s standard contractual clauses.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">14. How Long We Keep Data</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account and profile data: until you delete your account.</li>
                <li>Usage statistics: detailed sessions for up to 180 days, daily aggregates for up to 24 months.</li>
                <li>Email delivery logs: up to 180 days.</li>
                <li>Contracts generated through the platform and the billing records linked to them: kept as long as the law requires, even after account deletion.</li>
                <li>Identity verification documents and selfies: stored in a private area visible only to you and our administrators, and deleted together with your account.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">15. Deleting Your Account and Your Rights</h2>
              <p>
                You can delete your account at any time from Settings, or follow the steps on our{" "}
                <a href="/delete-account" className="text-accent hover:underline">account deletion page</a>. Deleting your account
                cancels your subscription, removes your profile, content, messages and files, and anonymises what you wrote
                that remains visible to others (for example reviews and booking requests).
              </p>
              <p>
                You also have the right to access, correct, export and restrict the processing of your data, and to object to it.
                Write to{" "}
                <a href="mailto:contact@muzicalist.com" className="text-accent hover:underline">contact@muzicalist.com</a>{" "}
                and we will answer within one month. You can also lodge a complaint with the Romanian data protection authority
                (ANSPDCP, <a href="https://www.dataprotection.ro" className="text-accent hover:underline" target="_blank" rel="noreferrer">dataprotection.ro</a>).
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
