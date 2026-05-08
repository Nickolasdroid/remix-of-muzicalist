import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const TermsOfService = () => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const dateLocale = i18n.language?.startsWith("ro") ? "ro-RO" : "en-US";
  const date = new Date().toLocaleDateString(dateLocale, { month: "long", day: "numeric", year: "numeric" });

  const sections: Array<{ title: string; body?: string; intro?: string; items?: string[] }> = [
    { title: t("termsOfService.sec1Title"), body: t("termsOfService.sec1Body") },
    { title: t("termsOfService.sec2Title"), body: t("termsOfService.sec2Body") },
    { title: t("termsOfService.sec3Title"), items: [t("termsOfService.sec3Item1"), t("termsOfService.sec3Item2"), t("termsOfService.sec3Item3"), t("termsOfService.sec3Item4"), t("termsOfService.sec3Item5")] },
    { title: t("termsOfService.sec4Title"), intro: t("termsOfService.sec4Intro"), items: [t("termsOfService.sec4Item1"), t("termsOfService.sec4Item2"), t("termsOfService.sec4Item3"), t("termsOfService.sec4Item4"), t("termsOfService.sec4Item5")] },
    { title: t("termsOfService.sec5Title"), intro: t("termsOfService.sec5Intro"), items: [t("termsOfService.sec5Item1"), t("termsOfService.sec5Item2"), t("termsOfService.sec5Item3"), t("termsOfService.sec5Item4")] },
    { title: t("termsOfService.sec6Title"), intro: t("termsOfService.sec6Intro"), items: [t("termsOfService.sec6Item1"), t("termsOfService.sec6Item2"), t("termsOfService.sec6Item3"), t("termsOfService.sec6Item4"), t("termsOfService.sec6Item5"), t("termsOfService.sec6Item6")] },
    { title: t("termsOfService.sec7Title"), body: t("termsOfService.sec7Body") },
    { title: t("termsOfService.sec8Title"), body: t("termsOfService.sec8Body") },
    { title: t("termsOfService.sec9Title"), body: t("termsOfService.sec9Body") },
    { title: t("termsOfService.sec10Title"), body: t("termsOfService.sec10Body") },
  ];

  return (
    <div className={`min-h-screen ${user ? 'md:ml-64' : ''}`}>
      <Navigation />

      <div className={`pt-20 ${user ? 'md:pt-8' : 'md:pt-24'} pb-12 px-4 md:px-8`}>
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-8 text-foreground">{t("termsOfService.title")}</h1>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-muted-foreground">
            <p className="text-sm text-muted-foreground">{t("termsOfService.lastUpdated", { date })}</p>

            {sections.map((sec) => (
              <section key={sec.title} className="space-y-4">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">{sec.title}</h2>
                {sec.body && <p>{sec.body}</p>}
                {sec.intro && <p>{sec.intro}</p>}
                {sec.items && (
                  <ul className="list-disc pl-6 space-y-2">
                    {sec.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )}
              </section>
            ))}

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">{t("termsOfService.sec11Title")}</h2>
              <p>
                {t("termsOfService.sec11Body")}{" "}
                <a href="mailto:contact@muzicalist.com" className="text-accent hover:underline">contact@muzicalist.com</a>
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
