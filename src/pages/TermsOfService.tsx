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
      
      <div className={`pt-20 ${user ? 'md:pt-8' : 'md:pt-24'} pb-12 px-4 md:px-8`}>
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
                By accessing or using Muzicalist, you agree to be bound by these Terms of Service.
                If you do not agree, please do not use the platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">2. Description of Service</h2>
              <p>
                Muzicalist is a platform that connects musical artists with users seeking entertainment
                services. We offer profiles, search, messaging, booking requests, calendar management,
                posts, announcements, reviews and subscription plans.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">3. Eligibility & Accounts</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old to create an account</li>
                <li>Accounts can be created with email/password or via Google sign-in</li>
                <li>You must provide accurate information and keep it up to date</li>
                <li>You are responsible for the security of your credentials and all activity under your account</li>
                <li>One account per person; you may not use another person's account without permission</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">4. Paid Activation & Subscriptions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All newly created accounts (Artist and User) require activation through a paid subscription plan before full access is granted</li>
                <li>Accounts created before this policy took effect are grandfathered and keep their previous access</li>
                <li>Available tiers (Free, Standard, Premium) and their feature limits are described on the Plans page and may be updated over time</li>
                <li>Subscriptions renew automatically until cancelled from the customer portal</li>
                <li>Except where required by law, fees already paid are non-refundable; cancelling stops future renewals but keeps your access until the end of the current billing period</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">5. Artist Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate information about your skills, experience and location</li>
                <li>Respond to booking requests in a timely manner — unanswered requests are auto-rejected before the event date</li>
                <li>Honor confirmed bookings and maintain professional conduct</li>
                <li>Only upload media (photos, videos, audio) you have the right to use</li>
                <li>Keep your calendar reasonably up to date so search results are accurate</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">6. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate event details in announcements and booking requests</li>
                <li>Communicate respectfully with artists and other users</li>
                <li>Honor agreements you make outside the platform with artists</li>
                <li>Do not use the platform for unlawful purposes</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">7. Posts, Announcements & Content Limits</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posts, announcements, media uploads and other content are subject to limits defined by your subscription plan</li>
                <li>Announcement slots remain consumed for 30 days from creation, even if the announcement is deleted earlier</li>
                <li>Announcements expire automatically shortly after their event date</li>
                <li>You may only post one review per artist (one review per email)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">8. Prohibited Conduct</h2>
              <p>You may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Harass, threaten, abuse or harm other users</li>
                <li>Post false, misleading, fraudulent, hateful or sexually explicit content</li>
                <li>Impersonate another person or misrepresent your affiliation</li>
                <li>Infringe intellectual property or privacy rights</li>
                <li>Spam, scrape, reverse-engineer or attempt to gain unauthorized access to the platform</li>
                <li>Use the platform to send unsolicited offers or off-platform scams</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">9. Reporting & Moderation</h2>
              <p>
                Users can report posts, announcements, profiles and reviews using the in-app report
                tool, selecting a reason or writing their own. We review reports and may remove
                content, restrict features, suspend or terminate accounts that violate these terms,
                at our sole discretion.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">10. Content Ownership & License</h2>
              <p>
                You retain ownership of the content you upload. By uploading, you grant Muzicalist a
                worldwide, non-exclusive, royalty-free license to host, display, reproduce and
                distribute that content as needed to operate and promote the platform. You can
                remove your content by deleting it or your account.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">11. Promotional Use of Profile Content</h2>
              <p>
                When an artist creates an account on Muzicalist, they grant Muzicalist a
                non-exclusive, worldwide, royalty-free right to use publicly available content
                from their profile, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>profile photos</li>
                <li>cover images</li>
                <li>artist name</li>
                <li>biography</li>
                <li>uploaded public media</li>
                <li>achievements, rankings and statistics displayed on the platform</li>
              </ul>
              <p>This content may be used by Muzicalist for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>social media posts</li>
                <li>promotional graphics</li>
                <li>advertisements</li>
                <li>artist spotlights</li>
                <li>rankings and featured artist campaigns</li>
                <li>marketing materials related to the Muzicalist platform</li>
              </ul>
              <p>
                Artists retain full ownership of their content at all times. Artists can disable
                participation in promotional campaigns at any time from the "Promotion" section
                of their account settings. Disabling this option will prevent any future
                promotional use of their profile content, but will not require the removal of
                promotional materials already published before the opt-out date.
              </p>
              <p>
                This processing is carried out on the basis of the artist's consent, given at
                registration and renewable at any time, in accordance with the EU General Data
                Protection Regulation (GDPR). Artists may exercise their rights of access,
                rectification, erasure, restriction and objection by contacting us at the
                address below.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">12. Bookings Between Users</h2>
              <p>
                Muzicalist facilitates introductions and communication between artists and users.
                Any contract, payment or performance arrangement is solely between the artist and
                the user. We are not a party to those agreements and are not responsible for
                disputes, no-shows, quality of performance or off-platform payments.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">13. Disclaimers & Limitation of Liability</h2>
              <p>
                The platform is provided "as is" without warranties of any kind. To the maximum
                extent permitted by law, Muzicalist is not liable for indirect, incidental or
                consequential damages arising from your use of the platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">14. Termination</h2>
              <p>
                We may suspend or terminate your account for violations of these terms or other
                conduct we reasonably consider harmful. You can delete your account at any time
                from your dashboard settings. Some data may be retained as described in the
                Privacy Policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">15. Changes to Terms</h2>
              <p>
                We may modify these terms from time to time. Continued use of the platform after
                changes constitutes acceptance of the updated terms. We will notify users of
                significant changes via email or in-app notification.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">16. Operator & Contact</h2>
              <p>
                Muzicalist is operated by the following legal entity:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Company:</strong> FUTURE CRAFT SRL</li>
                <li><strong className="text-foreground">CUI:</strong> 54307625</li>
                <li><strong className="text-foreground">Registered address:</strong> Str. Principală, Nr. 39, Sat Sohodol, Comuna Sohodol, Romania</li>
              </ul>
              <p>
                For questions about these Terms of Service, please contact us at{" "}
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

export default TermsOfService;
