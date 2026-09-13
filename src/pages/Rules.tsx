import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  BadgeCheck,
  Ban,
  Camera,
  Check,
  CircleAlert,
  Eye,
  Music2,
  ShieldCheck,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

type RuleSectionProps = {
  icon: typeof Camera;
  title: string;
  children: ReactNode;
  emphasized?: boolean;
};

const RuleSection = ({ icon: Icon, title, children, emphasized = false }: RuleSectionProps) => (
  <section
    className={`rounded-lg border p-5 sm:p-6 ${
      emphasized ? "border-accent/50 bg-accent/5" : "border-border bg-card"
    }`}
  >
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="pt-1.5 text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
    </div>
    {children}
  </section>
);

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

  const recommendations = ["singer", "dj", "instrumentalist", "band", "other"] as const;
  const avoidItems = ["blurry", "distant", "unrelated", "promotional", "edited", "group"] as const;
  const visibilityItems = ["search", "categories", "countries", "rankings", "feeds", "profile"] as const;

  return (
    <div className={`min-h-screen bg-background ${isAuthenticated ? "md:ml-64" : ""}`}>
      <SEO
        title={t("rules.seoTitle")}
        description={t("rules.seoDescription")}
        path="/rules"
      />
      <Navigation mobileTitle={t("navigation.rules")} mobileBackPath={-1} />

      <main className={`px-4 pb-16 pt-20 sm:px-6 ${isAuthenticated ? "md:pt-10" : "md:pt-24"}`}>
        <div className="mx-auto max-w-5xl" data-no-translate={currentLanguage === "ro" ? true : undefined}>
          <header className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
              {t("rules.title")}
            </h1>
            <p className="text-lg font-medium leading-relaxed text-foreground sm:text-xl">
              {t("rules.intro")}
            </p>
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              {t("rules.explanation")}
            </p>
          </header>

          <div className="space-y-5">
            <RuleSection icon={Camera} title={t("rules.photo.title")} emphasized>
              <p className="leading-relaxed text-muted-foreground">{t("rules.photo.description")}</p>
              <blockquote className="mt-5 border-l-2 border-accent pl-4 text-base font-medium leading-relaxed text-foreground sm:text-lg">
                {t("rules.photo.principle")}
              </blockquote>
            </RuleSection>

            <RuleSection icon={BadgeCheck} title={t("rules.recommended.title")}>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                {t("rules.recommended.intro")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((category) => (
                  <div key={category} className="rounded-lg border border-border bg-secondary/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-foreground">
                      <Music2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      <h3 className="font-semibold">{t(`rules.recommended.${category}.label`)}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(`rules.recommended.${category}.text`)}
                    </p>
                  </div>
                ))}
              </div>
            </RuleSection>

            <RuleSection icon={Ban} title={t("rules.avoid.title")}>
              <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {avoidItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span>{t(`rules.avoid.${item}`)}</span>
                  </div>
                ))}
              </div>
            </RuleSection>

            <RuleSection icon={Eye} title={t("rules.why.title")}>
              <p className="mb-5 leading-relaxed text-muted-foreground">{t("rules.why.intro")}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibilityItems.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-4 py-3">
                    <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">{t(`rules.why.${item}`)}</span>
                  </div>
                ))}
              </div>
            </RuleSection>

            <aside className="rounded-lg border border-accent/30 bg-accent/5 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <h2 className="font-semibold text-foreground">{t("rules.standards.title")}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("rules.standards.description")}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {!isAuthenticated && <Footer />}
    </div>
  );
};

export default Rules;