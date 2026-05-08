import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const PrivacyPolicy = () => {
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
    { title: t("privacyPolicy.sec1Title"), intro: t("privacyPolicy.sec1Intro"), items: [t("privacyPolicy.sec1Item1"), t("privacyPolicy.sec1Item2"), t("privacyPolicy.sec1Item3"), t("privacyPolicy.sec1Item4"), t("privacyPolicy.sec1Item5")] },
    { title: t("privacyPolicy.sec2Title"), intro: t("privacyPolicy.sec2Intro"), items: [t("privacyPolicy.sec2Item1"), t("privacyPolicy.sec2Item2"), t("privacyPolicy.sec2Item3"), t("privacyPolicy.sec2Item4"), t("privacyPolicy.sec2Item5")] },
    { title: t("privacyPolicy.sec3Title"), intro: t("privacyPolicy.sec3Intro"), items: [t("privacyPolicy.sec3Item1"), t("privacyPolicy.sec3Item2"), t("privacyPolicy.sec3Item3"), t("privacyPolicy.sec3Item4")] },
    { title: t("privacyPolicy.sec4Title"), body: t("privacyPolicy.sec4Body") },
    { title: t("privacyPolicy.sec5Title"), intro: t("privacyPolicy.sec5Intro"), items: [t("privacyPolicy.sec5Item1"), t("privacyPolicy.sec5Item2"), t("privacyPolicy.sec5Item3"), t("privacyPolicy.sec5Item4"), t("privacyPolicy.sec5Item5")] },
    { title: t("privacyPolicy.sec6Title"), body: t("privacyPolicy.sec6Body") },
    { title: t("privacyPolicy.sec7Title"), body: t("privacyPolicy.sec7Body") },
  ];

  return (
    <div className={`min-h-screen ${user ? 'md:ml-64' : ''}`}>
      <Navigation />

      <div className={`pt-20 ${user ? 'md:pt-8' : 'md:pt-24'} pb-12 px-4 md:px-8`}>
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-8 text-foreground">
            {t("privacyPolicy.title")}
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-muted-foreground">
            <p className="text-sm text-muted-foreground">{t("privacyPolicy.lastUpdated", { date })}</p>

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
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">{t("privacyPolicy.sec8Title")}</h2>
              <p>
                {t("privacyPolicy.sec8Body")}{" "}
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

export default PrivacyPolicy;
