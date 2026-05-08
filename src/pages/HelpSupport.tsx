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
  Flag,
  Paperclip,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

const HelpSupport = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [reportMessage, setReportMessage] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const faqSections = [
    {
      title: t("helpSupport.sections.gettingStarted"),
      icon: BookOpen,
      items: [
        { q: t("helpSupport.faq.gs1q"), a: t("helpSupport.faq.gs1a") },
        { q: t("helpSupport.faq.gs2q"), a: t("helpSupport.faq.gs2a") },
        { q: t("helpSupport.faq.gs3q"), a: t("helpSupport.faq.gs3a") },
      ],
    },
    {
      title: t("helpSupport.sections.artistProfiles"),
      icon: Users,
      items: [
        { q: t("helpSupport.faq.ap1q"), a: t("helpSupport.faq.ap1a") },
        { q: t("helpSupport.faq.ap2q"), a: t("helpSupport.faq.ap2a") },
        { q: t("helpSupport.faq.ap3q"), a: t("helpSupport.faq.ap3a") },
        { q: t("helpSupport.faq.ap4q"), a: t("helpSupport.faq.ap4a") },
      ],
    },
    {
      title: t("helpSupport.sections.bookings"),
      icon: Calendar,
      items: [
        { q: t("helpSupport.faq.bk1q"), a: t("helpSupport.faq.bk1a") },
        { q: t("helpSupport.faq.bk2q"), a: t("helpSupport.faq.bk2a") },
        { q: t("helpSupport.faq.bk3q"), a: t("helpSupport.faq.bk3a") },
      ],
    },
    {
      title: t("helpSupport.sections.posts"),
      icon: Megaphone,
      items: [
        { q: t("helpSupport.faq.po1q"), a: t("helpSupport.faq.po1a") },
        { q: t("helpSupport.faq.po2q"), a: t("helpSupport.faq.po2a") },
        { q: t("helpSupport.faq.po3q"), a: t("helpSupport.faq.po3a") },
      ],
    },
    {
      title: t("helpSupport.sections.messages"),
      icon: MessageSquare,
      items: [
        { q: t("helpSupport.faq.ms1q"), a: t("helpSupport.faq.ms1a") },
        { q: t("helpSupport.faq.ms2q"), a: t("helpSupport.faq.ms2a") },
        { q: t("helpSupport.faq.ms3q"), a: t("helpSupport.faq.ms3a") },
      ],
    },
    {
      title: t("helpSupport.sections.search"),
      icon: Search,
      items: [
        { q: t("helpSupport.faq.se1q"), a: t("helpSupport.faq.se1a") },
        { q: t("helpSupport.faq.se2q"), a: t("helpSupport.faq.se2a") },
        { q: t("helpSupport.faq.se3q"), a: t("helpSupport.faq.se3a") },
      ],
    },
    {
      title: t("helpSupport.sections.reviews"),
      icon: Star,
      items: [
        { q: t("helpSupport.faq.rv1q"), a: t("helpSupport.faq.rv1a") },
        { q: t("helpSupport.faq.rv2q"), a: t("helpSupport.faq.rv2a") },
      ],
    },
    {
      title: t("helpSupport.sections.subscription"),
      icon: Crown,
      items: [
        { q: t("helpSupport.faq.sb1q"), a: t("helpSupport.faq.sb1a") },
        { q: t("helpSupport.faq.sb2q"), a: t("helpSupport.faq.sb2a") },
        { q: t("helpSupport.faq.sb3q"), a: t("helpSupport.faq.sb3a") },
      ],
    },
    {
      title: t("helpSupport.sections.safety"),
      icon: Flag,
      items: [
        { q: t("helpSupport.faq.sf1q"), a: t("helpSupport.faq.sf1a") },
        { q: t("helpSupport.faq.sf2q"), a: t("helpSupport.faq.sf2a") },
      ],
    },
  ];

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setReportFile(e.target.files[0]);
  };

  const handleReportSubmit = () => {
    if (!reportMessage.trim()) {
      toast({ title: t("common.error"), description: t("helpSupport.errorEmpty"), variant: "destructive" });
      return;
    }
    toast({ title: t("helpSupport.reportSent"), description: t("helpSupport.reportThanks") });
    setReportMessage("");
    setReportFile(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation mobileTitle={t("helpSupport.title")} mobileBackPath={-1} />

      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-10 hidden md:block">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4">
              <HelpCircle className="h-7 w-7 text-accent" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">{t("helpSupport.title")}</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">{t("helpSupport.subtitle")}</p>
          </div>

          <div className="space-y-6">
            {faqSections.map((section) => (
              <div key={section.title} className="rounded-xl border border-border bg-card p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <section.icon className="h-5 w-5 text-accent flex-shrink-0" />
                  <h2 className="text-lg font-display font-bold text-foreground">{section.title}</h2>
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

          <div className="rounded-xl border border-border bg-card p-4 md:p-6 mt-6">
            <h2 className="text-lg font-display font-bold text-foreground mb-2 flex items-center gap-2">
              <Flag className="h-5 w-5 text-accent" />
              {t("helpSupport.reportTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{t("helpSupport.reportSubtitle")}</p>
            <Textarea
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              placeholder={t("helpSupport.reportPlaceholder")}
              className="min-h-[120px] resize-none mb-3"
            />
            {reportFile && (
              <p className="text-sm text-muted-foreground mb-3">{t("helpSupport.attached", { name: reportFile.name })}</p>
            )}
            <div className="flex items-center gap-3">
              <Button onClick={handleReportSubmit} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {t("helpSupport.sendReport")}
              </Button>
              <Button type="button" variant="outline" onClick={() => reportFileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4 mr-2" />
                {t("helpSupport.attachFile")}
              </Button>
              <input ref={reportFileInputRef} type="file" onChange={handleReportFileChange} className="hidden" />
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-border bg-card p-4 md:p-6">
            <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              {t("helpSupport.usefulLinks")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to="/about" className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-colors">
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">{t("helpSupport.links.about")}</span>
              </Link>
              <Link to="/privacy-policy" className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-colors">
                <Shield className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">{t("helpSupport.links.privacy")}</span>
              </Link>
              <Link to="/terms-of-service" className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-colors">
                <FileText className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">{t("helpSupport.links.terms")}</span>
              </Link>
              <Link to="/plans" className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-colors">
                <Crown className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">{t("helpSupport.links.plans")}</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpSupport;
