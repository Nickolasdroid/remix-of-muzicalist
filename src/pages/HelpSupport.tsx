import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Bell,
  Flag,
  Paperclip,
} from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const faqSections = [
  {
    title: "Getting Started",
    icon: BookOpen,
    items: [
      {
        q: "How do I create an account?",
        a: "Go to the Register page and choose between an Artist account or a User account. Artists can create profiles, showcase their work, and receive bookings. Users can browse artists, follow them, and post event announcements.",
      },
      {
        q: "What's the difference between an Artist and a User account?",
        a: "Artists get a full profile with gallery, bio, social links, booking calendar, and analytics. Users can browse artists, follow their favorites, post event announcements, and send messages to artists.",
      },
      {
        q: "How do I log in?",
        a: "Click the Login button and enter the email and password you used during registration. Make sure to verify your email first if you haven't already.",
      },
    ],
  },
  {
    title: "Artist Profiles",
    icon: Users,
    items: [
      {
        q: "How do I edit my artist profile?",
        a: "Navigate to your Dashboard and go to the Profile tab. There you can update your stage name, bio, specialization, instruments, music genres, social media links, avatar, gallery, and more.",
      },
      {
        q: "How do I add photos and videos to my gallery?",
        a: "From your Dashboard's Profile tab, scroll down to the Gallery section. You can upload images and add YouTube video links to showcase your performances.",
      },
      {
        q: "What specializations are available?",
        a: "You can choose from Singer, Instrumentalist, DJ, or Band as your specialization.",
      },
      {
        q: "Can I hide my contact information?",
        a: "Yes, from your Dashboard Settings you can toggle the visibility of your email and phone number on your public profile.",
      },
    ],
  },
  {
    title: "Bookings & Calendar",
    icon: Calendar,
    items: [
      {
        q: "How do booking requests work?",
        a: "Users or event organizers can send you a booking request through your artist profile. You'll receive a notification and can accept or decline the request from your Dashboard.",
      },
      {
        q: "How do I manage my calendar?",
        a: "From your Dashboard, access the Calendar tab to view and manage your booked events, mark dates as unavailable, and keep track of upcoming performances.",
      },
      {
        q: "Can I set my pricing?",
        a: "Yes, you can set an estimated price range on your profile to give potential clients an idea of your rates.",
      },
    ],
  },
  {
    title: "Posts",
    icon: Megaphone,
    items: [
      {
        q: "How do I create a post?",
        a: "Go to the Posts page and use the post creation form at the top. You can write text content and attach images or videos to share with your followers.",
      },
      {
        q: "How do likes work?",
        a: "Any logged-in user can like posts on the Posts page. The total like count is displayed on each post.",
      },
      {
        q: "What are Announcements?",
        a: "Announcements are event opportunities posted by users looking for artists. Browse the Announcements page to find gigs, apply to events, and connect with organizers.",
      },
    ],
  },
  {
    title: "Messages & Notifications",
    icon: MessageSquare,
    items: [
      {
        q: "How do I message an artist?",
        a: "Visit an artist's profile and click the message button. This creates a conversation where you can discuss event details, pricing, and availability. You can also contact organizers regarding their announcements.",
      },
      {
        q: "How do notifications work?",
        a: "You receive notifications for new messages, booking requests, followers, reviews, and other interactions. Check the bell icon in the navigation to view your notifications.",
      },
      {
        q: "Can I delete a conversation?",
        a: "Yes, you can delete conversations from your Messages page. The conversation will be hidden from your view. This also applies to conversations regarding announcements.",
      },
    ],
  },
  {
    title: "Search & Discovery",
    icon: Search,
    items: [
      {
        q: "How do I find artists?",
        a: "Use the Search page to find artists by name, specialization, or location. You can also browse by Categories, Countries, or Regions from the sidebar navigation.",
      },
      {
        q: "What is the Leaderboard?",
        a: "The Leaderboard ranks artists based on their activity, reviews, and engagement. It's a great way to discover top-performing artists on the platform.",
      },
      {
        q: "Can I filter artists by country or region?",
        a: "Yes, use the Countries or Regions pages to browse artists filtered by their location.",
      },
    ],
  },
  {
    title: "Reviews & Ratings",
    icon: Star,
    items: [
      {
        q: "How do I leave a review?",
        a: "Visit an artist's profile and scroll to the Reviews section. You can rate the artist from 1 to 5 stars and leave a written comment about your experience.",
      },
      {
        q: "Can reviews be removed?",
        a: "If you believe a review violates our guidelines, you can report it using the report button. Our team will review the report and take appropriate action.",
      },
    ],
  },
  {
    title: "Subscription Plans",
    icon: Crown,
    items: [
      {
        q: "What plans are available?",
        a: "Muzicalist offers Free, Standard, and Premium plans. Each tier unlocks additional features like priority placement, advanced analytics, and premium badges.",
      },
      {
        q: "How do I upgrade my plan?",
        a: "Go to the My Plan page from the sidebar navigation. There you can compare plans and upgrade to Standard or Premium.",
      },
      {
        q: "What benefits does Premium offer?",
        a: "Premium artists get a verified badge, top placement in search results, advanced analytics, priority in the Leaderboard, and access to exclusive features on the Posts page.",
      },
    ],
  },
  {
    title: "Safety & Reporting",
    icon: Flag,
    items: [
      {
        q: "How do I report inappropriate content?",
        a: "Use the report button available on profiles, posts, and reviews. Describe the issue and our team will investigate.",
      },
      {
        q: "Is my personal information safe?",
        a: "We take privacy seriously. You can control what information is visible on your profile through your Settings. Read our Privacy Policy for full details.",
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

          {/* Report an Issue */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-6">
            <h2 className="text-lg font-display font-bold text-foreground mb-2 flex items-center gap-2">
              <Flag className="h-5 w-5 text-accent" />
              Report an Issue
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Send us feedback or report a problem
            </p>
            <Textarea
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              placeholder="Describe your issue or feedback..."
              className="min-h-[120px] resize-none mb-3"
            />
            {reportFile && (
              <p className="text-sm text-muted-foreground mb-3">
                Attached: {reportFile.name}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleReportSubmit}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Send report
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => reportFileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Attach file
              </Button>
              <input
                ref={reportFileInputRef}
                type="file"
                onChange={handleReportFileChange}
                className="hidden"
              />
            </div>
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
