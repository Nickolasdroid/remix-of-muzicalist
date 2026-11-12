import Navigation from "@/components/Navigation";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  BookOpen,
  Shield,
  FileText,
  MessageSquare,
  Users,
  Megaphone,
  Crown,
  Search,
  Star,
  Calendar,
  Flag,
  Sparkles,
  Receipt,
  Building2,
  Globe,
  BookOpenCheck,
  Mail,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import GuestSidebar from "@/components/GuestSidebar";
import { RO_TEXT } from "@/i18n/roText";



const faqSections = [
  {
    title: "Getting Started",
    icon: BookOpen,
    items: [
      {
        q: "How do I create an account?",
        a: "Tap Sign up, enter your email (or continue with Google), choose a password and your name, then say whether you're looking for artists or you are an artist. Every account starts free. Artists then fill in their profile (stage name and type, location, photo and phone) and appear in the lists once it's complete.",
      },
      {
        q: "What's the difference between an Artist and a User account?",
        a: "Artists get a full public profile with gallery, bio, booking calendar, reviews, and analytics (Premium). Users can browse and follow artists, post events, send booking requests, and message artists.",
      },
      {
        q: "Do I need to pay to use Muzicalist?",
        a: "No. Creating an account and using Muzicalist is free. Artists start on the Free plan and can choose Standard or Premium for more posts, a bigger gallery, stories and better placement. Booking an artist doesn't need a plan.",
      },
      {
        q: "How do I log in?",
        a: "Click Login and enter your email and password, or use Continue with Google. Make sure to verify your email if you signed up with email/password.",
      },
      {
        q: "I forgot my password — what do I do?",
        a: "On the Login page, click 'Forgot password?' and enter your email. We'll send you a reset link.",
      },
    ],
  },
  {
    title: "Artist Profiles",
    icon: Users,
    items: [
      {
        q: "How do I edit my artist profile?",
        a: "Open your Dashboard → Profile tab. You can update bio, specialization, instruments (Instrumentalists), music genres (max 5), avatar, gallery, pricing and more. Stage name, phone number and county are read-only once registered — contact support if they need to change.",
      },
      {
        q: "How do I add photos and videos to my gallery?",
        a: "In your Dashboard's Profile, open the Gallery tab. You can upload images and add YouTube links.",
      },
      {
        q: "What specializations are available?",
        a: "Singer, Instrumentalist, DJ, or Band. Instrumentalists can also select specific instruments they play.",
      },
      {
        q: "Can I hide my contact information?",
        a: "Yes — in Dashboard → Settings you can independently toggle phone and email visibility on your public profile.",
      },
    ],
  },
  {
    title: "Bookings & Calendar",
    icon: Calendar,
    items: [
      {
        q: "How do booking requests work?",
        a: "A user sends a booking request from your profile with event date, time and details. You'll be notified and can accept or decline from your Dashboard. Booking requests that aren't answered before the event date are auto-rejected by the system.",
      },
      {
        q: "How do I manage my calendar?",
        a: "Dashboard → Calendar shows your booked events and lets you mark dates unavailable. Past dates are read-only.",
      },
      {
        q: "Will my profile show in search if I'm unavailable?",
        a: "Search filters check your calendar — if you're booked or marked unavailable for the requested date, you won't appear in those results.",
      },
      {
        q: "Can I set my pricing?",
        a: "On the Standard and Premium plans you can show up to 3 estimated prices on your profile, so organizers get a clear idea of your rates. On Free, visitors see “Prices on request”.",
      },
    ],
  },
  {
    title: "Posts, events & collaborations",
    icon: Megaphone,
    items: [
      {
        q: "What's the difference between a post, an event and a collaboration?",
        a: "A post is what artists share in the feed: text, photos, a video or a free date. An event is published by an organizer looking for an artist; artists answer with a priced offer. A collaboration is published by an artist looking for musicians to play with; others answer by message, and the author accepts or declines each reply. Accepting opens a booking between the two: the chosen artist sends an offer and, once accepted, the contract is generated.",
      },
      {
        q: "How do I create a post, an event or a collaboration?",
        a: "Artists tap + in the feed and choose Post, Story or Collaboration. Organizers tap + to add a new event. Collaborations and stories are available on the Standard and Premium plans.",
      },
      {
        q: "How do the monthly limits work?",
        a: "Posts, availability posts and collaborations share one monthly allowance: 3 on Free, 15 on Standard and 30 on Premium. A slot frees up 30 days after publishing. Upgrading increases your allowance immediately.",
      },
      {
        q: "Can I ask for an advance?",
        a: "Yes. When you send an offer, tick “Ask for an advance” and set the amount and the date it must be paid by. The advance goes into the contract; the organizer pays it by bank transfer to the IBAN from your contract details, and you mark it as received in the booking. Payments don't go through Muzicalist.",
      },
      {
        q: "How do I get more visibility?",
        a: "There is nothing to buy per post: posts from Standard artists appear higher in the feed, and posts from Premium artists appear highest.",
      },
      {
        q: "How long are events and collaborations visible?",
        a: "They stay visible until their event date, then end automatically. Ended ones remain in your dashboard history.",
      },
    ],
  },

  {
    title: "Messages & Notifications",
    icon: MessageSquare,
    items: [
      {
        q: "How do I message someone?",
        a: "Open an artist profile or an announcement and click the message button. A conversation thread is created — but it's only saved on both sides once you send the first message.",
      },
      {
        q: "Are ad and regular conversations separate?",
        a: "Yes. Each announcement gets its own dedicated thread per user, separate from any regular conversation you already have with that person.",
      },
      {
        q: "How do notifications work?",
        a: "You'll get notifications for new messages, booking requests and status updates, new followers, reviews and more. Check the bell icon to see them.",
      },
      {
        q: "Can I delete a conversation?",
        a: "Yes — deleting hides it from your view. If new messages arrive later, the conversation will reappear with full history restored.",
      },
    ],
  },
  {
    title: "Search & Discovery",
    icon: Search,
    items: [
      {
        q: "How do I find artists?",
        a: "Use the Search page to find artists by stage name, specialization, country, region, date and event type. You can also browse Categories, Countries and Regions.",
      },
      {
        q: "What is the Leaderboard?",
        a: "The Leaderboard has three rankings: Top rated (reviews, counting both the rating and how many reviews there are), Most booked (bookings confirmed through Muzicalist in the last 30 days) and Most followed. Artists with an average rating above 4.5 also display a Top Rated badge.",
      },
      {
        q: "Can I filter artists by location?",
        a: "Yes — use Countries or Regions pages, or apply location filters in Search. On a country page, search is restricted to stage name within that country.",
      },
    ],
  },
  {
    title: "Reviews & Ratings",
    icon: Star,
    items: [
      {
        q: "How do I leave a review?",
        a: "Open the artist's profile, scroll to the Reviews section and submit your rating (1–5) with a comment. One review per email is allowed per artist.",
      },
      {
        q: "Can reviews be removed?",
        a: "If a review violates our guidelines, use the report button. Our team will investigate and take action where appropriate.",
      },
    ],
  },
  {
    title: "Subscription Plans",
    icon: Crown,
    items: [
      {
        q: "What plans are available?",
        a: "Muzicalist offers Free, Standard and Premium. Higher plans give you more posts, a bigger gallery, stories and better placement in the feed and in search. See the Plans page for the full list and pricing.",
      },
      {
        q: "How do I upgrade or manage my plan?",
        a: "Go to My Plan in the sidebar. You can compare plans, upgrade, or open the customer portal to manage billing.",
      },
      {
        q: "What does Premium include?",
        a: "Premium gives you up to 30 posts a month, the biggest gallery, the top spot in search and artist lists, your posts highest in the feed, and statistics from profile views to requests and bookings.",
      },
      {
        q: "What happens when I downgrade my plan?",
        a: "Before any downgrade, we show a confirmation dialog listing the features you will lose. Existing content stays visible, but the new limits apply to future creations and future billing follows the new plan.",
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes — open My Plan → Manage subscription to access the customer portal. Cancelling stops future renewals; access continues until the end of the current billing period.",
      },
    ],
  },
  {
    title: "Billing & Invoicing",
    icon: Receipt,
    items: [
      {
        q: "How are payments processed?",
        a: "All payments are processed securely via our payment provider (Stripe). We never store full card numbers on our servers.",
      },
      {
        q: "Will I receive an invoice?",
        a: "Yes. Invoices are generated automatically for every payment and are compliant with Romanian tax requirements through our integrated invoicing system.",
      },
      {
        q: "Why do I need to provide my address at checkout?",
        a: "Romanian invoicing law requires a complete billing address (city, county/state, country) on every invoice. At checkout you'll be asked to fill in those fields so the invoice is legally valid.",
      },
      {
        q: "I get an error trying to upgrade — what should I check?",
        a: "Most checkout errors come from currency mismatches on an existing subscription. If you previously had a subscription in a different currency, cancel it from the customer portal first, then retry the upgrade. If the issue persists, contact support.",
      },
      {
        q: "Are refunds available?",
        a: "Except where required by law, fees already paid are non-refundable. Cancelling stops future renewals but you keep access until the end of the current billing period.",
      },
    ],
  },
  {
    title: "Language & Localization",
    icon: Globe,
    items: [
      {
        q: "What languages does Muzicalist support?",
        a: "The interface is available in multiple languages. We auto-detect your language based on your country/browser at first visit, and you can switch it manually anytime.",
      },
      {
        q: "How do I change the language?",
        a: "Use the language switcher in the navigation. Your preference is remembered across sessions.",
      },
    ],
  },
  {
    title: "Reporting & Safety",
    icon: Flag,
    items: [
      {
        q: "How do I report a post, announcement, profile or review?",
        a: "Open the item's menu and choose Report. You can pick a predefined reason (spam, harassment, inappropriate content, scam, copyright, etc.) or write your own. Reports are sent to our moderation team for review.",
      },
      {
        q: "What happens after I submit a report?",
        a: "Our team reviews every report. If the content violates our policies, we may remove it and take action on the offending account. You won't always receive an individual reply, but every report is read.",
      },
      {
        q: "Is my personal information safe?",
        a: "Yes. You control phone and email visibility from Settings, and we never expose your account credentials. Read our Privacy Policy for full details.",
      },
    ],
  },
  {
    title: "Company & Contact",
    icon: Building2,
    items: [
      {
        q: "Who operates Muzicalist?",
        a: "Muzicalist is operated by FUTURE CRAFT SRL (CUI 54307625), with registered address at Str. Principală, Nr. 39, Sat Sohodol, Comuna Sohodol, Romania.",
      },
      {
        q: "How can I contact support?",
        a: "Email us at contact@muzicalist.com for any account, billing or platform issue. We typically respond within a few business days.",
      },
      {
        q: "Where can I read the legal documents?",
        a: "The Privacy Policy and Terms of Service are linked at the bottom of every page and from the Useful Links section below.",
      },
    ],
  },
];

const normalize = (v: string) => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const HelpSupport = () => {
  const { t, i18n } = useTranslation();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(!!session));
  }, []);

  // Questions are written in English and translated on screen, so search both versions
  const isRo = (i18n.language || "ro").startsWith("ro");
  const matches = (text: string, q: string) => normalize(text).includes(q) || (isRo && normalize(RO_TEXT[text] || "").includes(q));

  const visibleSections = useMemo(() => {
    const q = normalize(query.trim());
    return faqSections
      .filter((s) => !section || s.title === section)
      .map((s) => ({ ...s, items: q ? s.items.filter((it) => matches(it.q, q) || matches(it.a, q)) : s.items }))
      .filter((s) => s.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, section, isRo]);

  const panel = (
    <div
      className="min-w-0 flex-1 bg-background px-4 pb-16 pt-16 md:rounded-lg md:px-8 md:pt-10"
      style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.16) 0px, #121212 320px)" }}
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="hidden text-5xl font-bold leading-tight tracking-[-0.02em] text-foreground md:block">Help & Support</h1>
        <p className="text-sm text-muted-foreground md:mt-2 md:text-base">Find answers to common questions about using Muzicalist.</p>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a question"
            aria-label="Search for a question"
            className="h-12 w-full rounded-full border-0 bg-foreground/[0.08] pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:bg-foreground/[0.12] focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </div>

        {/* Topics */}
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Topics">
          {[null, ...faqSections.map((s) => s.title)].map((title) => {
            const selected = section === title;
            return (
              <button
                key={title ?? "all"}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setSection(title)}
                className={`h-8 shrink-0 rounded-full px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                  selected ? "bg-foreground/[0.24] font-medium text-foreground" : "bg-foreground/[0.07] text-foreground hover:bg-foreground/[0.12]"
                }`}
              >
                {title ?? <span>All</span>}
              </button>
            );
          })}
        </div>

        {/* Questions */}
        <div className="mt-10 space-y-10">
          {visibleSections.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground md:text-2xl">{s.title}</h2>
              <Accordion type="single" collapsible className="mt-2">
                {s.items.map((item, idx) => (
                  <AccordionItem key={item.q} value={`${s.title}-${idx}`} className="border-foreground/10">
                    <AccordionTrigger className="py-4 text-left text-base font-medium text-foreground hover:no-underline hover:text-foreground/80">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
          {visibleSections.length === 0 && (
            <div className="py-2">
              <p className="text-base font-bold text-foreground">No questions match your search</p>
              <p className="mt-1 text-sm text-muted-foreground">Try other words, or write to us below.</p>
            </div>
          )}
        </div>

        {/* Still need help */}
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground md:text-2xl">Still need help?</h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">Write to us and we'll get back to you within a few business days.</p>
          <a
            href="mailto:contact@muzicalist.com"
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-base font-bold text-background transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            <span className="notranslate" translate="no">contact@muzicalist.com</span>
          </a>

          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { to: "/rules", label: t("navigation.rules") },
              { to: "/plans", label: "Plans & Pricing" },
              { to: "/terms-of-service", label: "Terms of Service" },
              { to: "/privacy-policy", label: "Privacy Policy" },
              { to: "/about", label: "About Muzicalist" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="inline-flex h-9 items-center rounded-full border border-foreground/25 px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <SEO
        title="Help & Support — FAQ | Muzicalist"
        description="Answers to common questions about Muzicalist: accounts, plans, bookings, messaging, payments, privacy and more."
        path="/help"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqSections.flatMap((section) =>
            section.items.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            }))
          ),
        }}
      />
      <Navigation mobileTitle="Help & Support" mobileBackPath={-1} />

      {signedIn ? (
        <main className="md:ml-[316px] md:py-2 md:pr-2 lg:ml-[356px]">{panel}</main>
      ) : (
        <main className="md:flex md:items-start md:gap-2 md:px-2 md:pb-2 md:pt-[72px]">
          {signedIn === false && <GuestSidebar />}
          {panel}
        </main>
      )}
    </div>
  );
};

export default HelpSupport;
