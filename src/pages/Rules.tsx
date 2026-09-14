import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpenCheck,
  CalendarDays,
  Megaphone,
  Music2,
  ShieldAlert,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type RuleDefinition = {
  id: string;
  contentKeys: readonly string[];
};

type RuleCategory = {
  id: string;
  icon: LucideIcon;
  rules: readonly RuleDefinition[];
};

const ruleCategories: readonly RuleCategory[] = [
  {
    id: "profile",
    icon: UserRound,
    rules: [
      { id: "photo", contentKeys: ["body", "examples", "avoid", "visibility", "notice"] },
      { id: "realInfo", contentKeys: ["body"] },
      { id: "representativePhoto", contentKeys: ["body"] },
      { id: "recognizablePhoto", contentKeys: ["body"] },
    ],
  },
  {
    id: "artisticContent",
    icon: Music2,
    rules: [
      { id: "relevant", contentKeys: ["body"] },
      { id: "copyright", contentKeys: ["body"] },
      { id: "attribution", contentKeys: ["body"] },
      { id: "qualityMedia", contentKeys: ["body"] },
    ],
  },
  {
    id: "posts",
    icon: Megaphone,
    rules: [
      { id: "postRules", contentKeys: ["body"] },
      { id: "announcementRules", contentKeys: ["body"] },
      { id: "promotionRules", contentKeys: ["body"] },
      { id: "avoidContent", contentKeys: ["body"] },
    ],
  },
  {
    id: "interaction",
    icon: UsersRound,
    rules: [
      { id: "respect", contentKeys: ["body"] },
      { id: "harassment", contentKeys: ["body"] },
      { id: "spam", contentKeys: ["body"] },
      { id: "misleading", contentKeys: ["body"] },
    ],
  },
  {
    id: "bookings",
    icon: CalendarDays,
    rules: [
      { id: "confirmed", contentKeys: ["body"] },
      { id: "intent", contentKeys: ["body"] },
      { id: "eventInfo", contentKeys: ["body"] },
      { id: "agreements", contentKeys: ["body"] },
    ],
  },
  {
    id: "safety",
    icon: ShieldAlert,
    rules: [
      { id: "prohibited", contentKeys: ["body"] },
      { id: "abuse", contentKeys: ["body"] },
      { id: "impersonation", contentKeys: ["body"] },
      { id: "fraud", contentKeys: ["body"] },
    ],
  },
] as const;

const Rules = () => {
  const { t, i18n } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const currentLanguage = i18n.resolvedLanguage?.split("-")[0] === "ro" ? "ro" : "en";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsAuthenticated(Boolean(data.session)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(Boolean(session));
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className={`min-h-screen bg-background ${isAuthenticated ? "md:ml-64" : ""}`}>
      <SEO
        title={t("rules.seoTitle")}
        description={t("rules.seoDescription")}
        path="/rules"
      />
      <Navigation mobileTitle={t("navigation.rules")} mobileBackPath={-1} />

      <main className={`pb-20 pt-14 md:pb-8 ${isAuthenticated ? "md:pt-0" : "md:pt-16"}`}>
        <div className="mx-auto max-w-3xl px-4 py-8 md:py-12" data-no-translate={currentLanguage === "ro" ? true : undefined}>
          <header className="mb-10 hidden text-center md:block">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <BookOpenCheck className="h-7 w-7 text-accent" aria-hidden="true" />
            </div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground md:text-4xl">
              {t("rules.title")}
            </h1>
            <p className="mx-auto max-w-lg text-muted-foreground">
              {t("rules.intro")}
            </p>
          </header>

          <div className="space-y-6">
            {ruleCategories.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <section key={category.id} className="rounded-xl border border-border bg-card p-4 md:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <CategoryIcon className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                    <h2 className="font-display text-lg font-bold text-foreground">
                      {t(`rules.categories.${category.id}.title`)}
                    </h2>
                  </div>
                  <Accordion type="single" collapsible className="space-y-1">
                    {category.rules.map((rule) => (
                      <AccordionItem
                        key={rule.id}
                        value={`${category.id}-${rule.id}`}
                        className="border-border/50"
                      >
                        <AccordionTrigger className="py-3 text-left text-sm font-medium text-foreground hover:text-accent">
                          {t(`rules.categories.${category.id}.rules.${rule.id}.title`)}
                        </AccordionTrigger>
                        <AccordionContent className="pb-3 text-sm leading-relaxed text-muted-foreground">
                          <div className="space-y-3">
                            {rule.contentKeys.map((contentKey) => (
                              <p key={contentKey}>
                                {t(`rules.categories.${category.id}.rules.${rule.id}.${contentKey}`)}
                              </p>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              );
            })}
          </div>
        </div>
      </main>

      {!isAuthenticated && <Footer />}
    </div>
  );
};

export default Rules;