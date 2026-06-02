import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";
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
} from "lucide-react";


const faqSections = [
  {
    title: "Getting Started",
    icon: BookOpen,
    items: [
      {
        q: "How do I create an account?",
        a: "Go to the Register page and choose between an Artist account or a User account. You can sign up with email and password or continue with Google. All new accounts require activation via a paid subscription plan before you can fully use the platform.",
      },
      {
        q: "What's the difference between an Artist and a User account?",
        a: "Artists get a full public profile with gallery, bio, social links, booking calendar, reviews, and analytics (Premium). Users can browse and follow artists, post event announcements, send booking requests, and message artists.",
      },
      {
        q: "Do I need to pay to use Muzicalist?",
        a: "Yes. All new accounts (Artists and Users) must activate a subscription plan after registration. Existing accounts created before this change keep their previous access (grandfathered).",
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
        a: "Open your Dashboard → Profile tab. You can update bio, specialization, instruments (Instrumentalists), music genres (max 5), social links, avatar, gallery, pricing and more. Stage name, phone number and county are read-only once registered — contact support if they need to change.",
      },
      {
        q: "How do I add photos and videos to my gallery?",
        a: "From your Dashboard's Profile tab, scroll to the Gallery section. You can upload images and add YouTube links.",
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
        a: "Yes, you can add multiple pricing entries on your profile to give clients a clear idea of your rates.",
      },
    ],
  },
  {
    title: "Posts & Announcements",
    icon: Megaphone,
    items: [
      {
        q: "What's the difference between a Post and an Announcement?",
        a: "Posts are content shared by artists with their followers on the Feed. Announcements are event opportunities posted by users looking to hire an artist.",
      },
      {
        q: "How do I create a post or announcement?",
        a: "Artists create posts from the Feed page. Users create announcements from the User Dashboard. Limits depend on your subscription plan — see the Plans page for details.",
      },
      {
        q: "How does the announcement ad slot work?",
        a: "Each announcement consumes a slot from your plan. Slots remain consumed for 30 days from the creation date, even if you delete the announcement before then.",
      },
      {
        q: "How do likes work?",
        a: "Any logged-in user can like posts and announcements. Counts are visible on each card.",
      },
      {
        q: "How long are announcements visible?",
        a: "Announcements stay visible until shortly after their event date, then expire automatically. Expired items remain in your dashboard history.",
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
        a: "The Leaderboard ranks artists based on reviews and engagement. Artists with an average rating above 4.5 also display a Top Rated badge.",
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
        a: "Muzicalist offers Free, Standard and Premium tiers. Each plan unlocks more posts/announcements, additional features and priority placement. See the Plans page for current pricing.",
      },
      {
        q: "How do I upgrade or manage my plan?",
        a: "Go to My Plan in the sidebar. You can compare plans, upgrade, or open the customer portal to manage billing.",
      },
      {
        q: "What does Premium include?",
        a: "Premium artists get a verified badge, top placement in search and Leaderboard, advanced Analytics, higher content limits and access to exclusive features.",
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
];

const HelpSupport = () => {
  const { toast } = useToast();
  const [reportMessage, setReportMessage] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReportFile(e.target.files[0]);
    }
  };

  const handleReportSubmit = () => {
    if (!reportMessage.trim()) {
      toast({
        title: "Error",
        description: "Please write your report before sending.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Report Sent!",
      description: "Thank you for your feedback. We'll review it shortly.",
    });
    setReportMessage("");
    setReportFile(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation mobileTitle="Help & Support" mobileBackPath={-1} />

      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <div className="text-center mb-10 hidden md:block">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4">
              <HelpCircle className="h-7 w-7 text-accent" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Help & Support
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Find answers to common questions about using Muzicalist.
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-6">
            {faqSections.map((section) => (
              <div key={section.title} className="rounded-xl border border-border bg-card p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <section.icon className="h-5 w-5 text-accent flex-shrink-0" />
                  <h2 className="text-lg font-display font-bold text-foreground">
                    {section.title}
                  </h2>
                </div>
                <Accordion type="single" collapsible className="space-y-1">
                  {section.items.map((item, idx) => (
                    <AccordionItem key={idx} value={`${section.title}-${idx}`} className="border-border/50">
                      <AccordionTrigger className="text-sm font-medium text-foreground hover:text-accent py-3">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-3">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>




          {/* Useful Links */}
          <div className="mt-10 rounded-xl border border-border bg-card p-4 md:p-6">
            <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Useful Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/about"
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-colors"
              >
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">About Muzicalist</span>
              </Link>
              <Link
                to="/privacy-policy"
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-colors"
              >
                <Shield className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Privacy Policy</span>
              </Link>
              <Link
                to="/terms-of-service"
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-colors"
              >
                <FileText className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Terms of Service</span>
              </Link>
              <Link
                to="/plans"
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-colors"
              >
                <Crown className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Plans & Pricing</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpSupport;
