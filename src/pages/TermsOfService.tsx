import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

type TermsSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
  afterItems?: string[];
};

type TermsCopy = {
  title: string;
  updated: string;
  locale: string;
  contactIntro: string;
  sections: TermsSection[];
};

const TERMS_COPY: Record<"en" | "ro", TermsCopy> = {
  en: {
    title: "Terms of Service",
    updated: "Last updated",
    locale: "en-US",
    contactIntro: "For questions about these Terms of Service, please contact us at",
    sections: [
      {
        title: "1. Acceptance of Terms",
        paragraphs: [
          "By accessing or using Muzicalist, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.",
        ],
      },
      {
        title: "2. Description of Service",
        paragraphs: [
          "Muzicalist is a platform that connects musical artists with users seeking entertainment services. We offer profiles, search, messaging, booking requests, calendar management, posts, announcements, reviews and subscription plans.",
        ],
      },
      {
        title: "3. Eligibility & Accounts",
        items: [
          "You must be at least 18 years old to create an account",
          "Accounts can be created with email/password or via Google sign-in",
          "You must provide accurate information and keep it up to date",
          "You are responsible for the security of your credentials and all activity under your account",
          "One account per person; you may not use another person's account without permission",
        ],
      },
      {
        title: "4. Paid Activation & Subscriptions",
        items: [
          "All newly created accounts (Artist and User) require activation through a paid subscription plan before full access is granted",
          "Accounts created before this policy took effect are grandfathered and keep their previous access",
          "Available tiers (Free, Standard, Premium) and their feature limits are described on the Plans page and may be updated over time",
          "Subscriptions renew automatically until cancelled from the customer portal",
          "Except where required by law, fees already paid are non-refundable; cancelling stops future renewals but keeps your access until the end of the current billing period",
        ],
      },
      {
        title: "5. Artist Responsibilities",
        items: [
          "Provide accurate information about your skills, experience and location",
          "Respond to booking requests in a timely manner — unanswered requests are auto-rejected before the event date",
          "Honor confirmed bookings and maintain professional conduct",
          "Only upload media (photos, videos, audio) you have the right to use",
          "Keep your calendar reasonably up to date so search results are accurate",
        ],
      },
      {
        title: "6. User Responsibilities",
        items: [
          "Provide accurate event details in announcements and booking requests",
          "Communicate respectfully with artists and other users",
          "Honor agreements you make outside the platform with artists",
          "Do not use the platform for unlawful purposes",
        ],
      },
      {
        title: "7. Posts, Announcements & Content Limits",
        items: [
          "Posts, announcements, media uploads and other content are subject to limits defined by your subscription plan",
          "Posts, announcements and promotions counters reset automatically at the start of each new billing cycle",
          "Announcements expire automatically shortly after their event date",
          "You may only post one review per artist (one review per email)",
        ],
      },
      {
        title: "8. Prohibited Conduct",
        paragraphs: ["You may not:"],
        items: [
          "Violate any applicable laws or regulations",
          "Harass, threaten, abuse or harm other users",
          "Post false, misleading, fraudulent, hateful or sexually explicit content",
          "Impersonate another person or misrepresent your affiliation",
          "Infringe intellectual property or privacy rights",
          "Spam, scrape, reverse-engineer or attempt to gain unauthorized access to the platform",
          "Use the platform to send unsolicited offers or off-platform scams",
        ],
      },
      {
        title: "9. Reporting & Moderation",
        paragraphs: [
          "Users can report posts, announcements, profiles and reviews using the in-app report tool, selecting a reason or writing their own. We review reports and may remove content, restrict features, suspend or terminate accounts that violate these terms, at our sole discretion.",
        ],
      },
      {
        title: "10. Content Ownership & License",
        paragraphs: [
          "You retain ownership of the content you upload. By uploading, you grant Muzicalist a worldwide, non-exclusive, royalty-free license to host, display, reproduce and distribute that content as needed to operate and promote the platform. You can remove your content by deleting it or your account.",
        ],
      },
      {
        title: "11. Promotional Use of Profile Content",
        paragraphs: [
          "When an artist creates an account on Muzicalist, they grant Muzicalist a non-exclusive, worldwide, royalty-free right to use publicly available content from their profile, including:",
        ],
        items: ["profile photos", "cover images", "artist name", "biography", "uploaded public media", "achievements, rankings and statistics displayed on the platform"],
        afterItems: [
          "This content may be used by Muzicalist for: social media posts, promotional graphics, advertisements, artist spotlights, rankings and featured artist campaigns, and marketing materials related to the Muzicalist platform.",
          "Artists retain full ownership of their content at all times. Artists can disable participation in promotional campaigns at any time from the Promotion section of their account settings. Disabling this option will prevent any future promotional use of their profile content, but will not require the removal of promotional materials already published before the opt-out date.",
          "This processing is carried out on the basis of the artist's consent, given at registration and renewable at any time, in accordance with the EU General Data Protection Regulation (GDPR). Artists may exercise their rights of access, rectification, erasure, restriction and objection by contacting us at the address below.",
        ],
      },
      {
        title: "12. Bookings Between Users",
        paragraphs: [
          "Muzicalist facilitates introductions and communication between artists and users. Any contract, payment or performance arrangement is solely between the artist and the user. We are not a party to those agreements and are not responsible for disputes, no-shows, quality of performance or off-platform payments.",
        ],
      },
      {
        title: "13. Disclaimers & Limitation of Liability",
        paragraphs: [
          "The platform is provided \"as is\" without warranties of any kind. To the maximum extent permitted by law, Muzicalist is not liable for indirect, incidental or consequential damages arising from your use of the platform.",
        ],
      },
      {
        title: "14. Termination",
        paragraphs: [
          "We may suspend or terminate your account for violations of these terms or other conduct we reasonably consider harmful. You can delete your account at any time from your dashboard settings. Some data may be retained as described in the Privacy Policy.",
        ],
      },
      {
        title: "15. Changes to Terms",
        paragraphs: [
          "We may modify these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms. We will notify users of significant changes via email or in-app notification.",
        ],
      },
    ],
  },
  ro: {
    title: "Termeni și condiții",
    updated: "Ultima actualizare",
    locale: "ro-RO",
    contactIntro: "Pentru întrebări despre acești Termeni și condiții, ne poți contacta la",
    sections: [
      {
        title: "1. Acceptarea termenilor",
        paragraphs: [
          "Prin accesarea sau utilizarea Muzicalist, ești de acord să respecți acești Termeni și condiții. Dacă nu ești de acord, te rugăm să nu folosești platforma.",
        ],
      },
      {
        title: "2. Descrierea serviciului",
        paragraphs: [
          "Muzicalist este o platformă care conectează artiști muzicali cu utilizatori care caută servicii de divertisment. Oferim profiluri, căutare, mesagerie, cereri de rezervare, administrarea calendarului, postări, anunțuri, recenzii și planuri de abonament.",
        ],
      },
      {
        title: "3. Eligibilitate și conturi",
        items: [
          "Trebuie să ai cel puțin 18 ani pentru a crea un cont",
          "Conturile pot fi create cu email/parolă sau prin autentificare Google",
          "Trebuie să furnizezi informații corecte și să le menții actualizate",
          "Ești responsabil pentru securitatea datelor tale de autentificare și pentru toată activitatea din cont",
          "Este permis un singur cont per persoană; nu poți folosi contul altei persoane fără permisiune",
        ],
      },
      {
        title: "4. Activare plătită și abonamente",
        items: [
          "Toate conturile nou create (Artist și Utilizator) necesită activare printr-un plan de abonament plătit înainte de acordarea accesului complet",
          "Conturile create înainte ca această politică să intre în vigoare sunt păstrate cu accesul anterior",
          "Planurile disponibile (Free, Standard, Premium) și limitele aferente sunt descrise pe pagina Planuri și pot fi actualizate în timp",
          "Abonamentele se reînnoiesc automat până la anularea lor din portalul pentru clienți",
          "Cu excepția cazurilor cerute de lege, taxele deja plătite nu sunt rambursabile; anularea oprește reînnoirile viitoare, dar păstrează accesul până la finalul perioadei curente de facturare",
        ],
      },
      {
        title: "5. Responsabilitățile artiștilor",
        items: [
          "Furnizează informații corecte despre abilități, experiență și locație",
          "Răspunde la cererile de rezervare în timp util — cererile fără răspuns sunt respinse automat înainte de data evenimentului",
          "Respectă rezervările confirmate și menține o conduită profesională",
          "Încarcă doar materiale media (fotografii, video, audio) pentru care ai dreptul de utilizare",
          "Menține calendarul actualizat rezonabil, astfel încât rezultatele căutării să fie corecte",
        ],
      },
      {
        title: "6. Responsabilitățile utilizatorilor",
        items: [
          "Furnizează detalii corecte despre eveniment în anunțuri și cereri de rezervare",
          "Comunică respectuos cu artiștii și cu ceilalți utilizatori",
          "Respectă înțelegerile făcute în afara platformei cu artiștii",
          "Nu folosi platforma în scopuri ilegale",
        ],
      },
      {
        title: "7. Postări, anunțuri și limite de conținut",
        items: [
          "Postările, anunțurile, încărcările media și alt conținut sunt supuse limitelor definite de planul tău de abonament",
          "Contoarele pentru postări, anunțuri și promovări se resetează automat la începutul fiecărui ciclu nou de facturare",
          "Anunțurile expiră automat la scurt timp după data evenimentului",
          "Poți publica o singură recenzie pentru fiecare artist (o recenzie per email)",
        ],
      },
      {
        title: "8. Conduită interzisă",
        paragraphs: ["Nu ai voie să:"],
        items: [
          "Încalci legile sau reglementările aplicabile",
          "Hărțuiești, ameninți, abuzezi sau rănești alți utilizatori",
          "Publici conținut fals, înșelător, fraudulos, instigator la ură sau explicit sexual",
          "Impersonifici o altă persoană sau îți prezinți fals afilierea",
          "Încalci drepturi de proprietate intelectuală sau drepturi la viață privată",
          "Trimiți spam, extragi date, faci reverse-engineering sau încerci să obții acces neautorizat la platformă",
          "Folosești platforma pentru oferte nesolicitate sau fraude desfășurate în afara platformei",
        ],
      },
      {
        title: "9. Raportare și moderare",
        paragraphs: [
          "Utilizatorii pot raporta postări, anunțuri, profiluri și recenzii folosind instrumentul de raportare din aplicație, alegând un motiv sau scriind propriul motiv. Analizăm raportările și putem elimina conținut, restricționa funcții, suspenda sau închide conturi care încalcă acești termeni, la discreția noastră.",
        ],
      },
      {
        title: "10. Proprietatea conținutului și licență",
        paragraphs: [
          "Păstrezi proprietatea asupra conținutului pe care îl încarci. Prin încărcare, acorzi Muzicalist o licență mondială, neexclusivă și fără redevențe pentru găzduirea, afișarea, reproducerea și distribuirea conținutului în măsura necesară pentru operarea și promovarea platformei. Îți poți elimina conținutul prin ștergerea acestuia sau a contului.",
        ],
      },
      {
        title: "11. Utilizarea promoțională a conținutului de profil",
        paragraphs: [
          "Când un artist creează un cont pe Muzicalist, acordă Muzicalist un drept neexclusiv, mondial și fără redevențe de a folosi conținut public disponibil din profil, inclusiv:",
        ],
        items: ["fotografii de profil", "imagini de copertă", "numele artistului", "biografia", "materiale media publice încărcate", "realizări, clasamente și statistici afișate pe platformă"],
        afterItems: [
          "Acest conținut poate fi folosit de Muzicalist pentru: postări pe rețele sociale, materiale promoționale, reclame, prezentări ale artiștilor, clasamente, campanii cu artiști recomandați și materiale de marketing legate de platforma Muzicalist.",
          "Artiștii păstrează în orice moment proprietatea deplină asupra conținutului lor. Participarea la campaniile promoționale poate fi dezactivată oricând din secțiunea Promovare a setărilor contului. Dezactivarea va preveni utilizările promoționale viitoare ale conținutului de profil, dar nu impune eliminarea materialelor promoționale publicate anterior datei de retragere.",
          "Această prelucrare se bazează pe consimțământul artistului, acordat la înregistrare și reînnoibil oricând, în conformitate cu Regulamentul general privind protecția datelor (GDPR). Artiștii își pot exercita drepturile de acces, rectificare, ștergere, restricționare și opoziție contactându-ne la adresa de mai jos.",
        ],
      },
      {
        title: "12. Rezervări între utilizatori",
        paragraphs: [
          "Muzicalist facilitează prezentarea și comunicarea între artiști și utilizatori. Orice contract, plată sau aranjament de prestație se încheie exclusiv între artist și utilizator. Nu suntem parte la aceste înțelegeri și nu suntem responsabili pentru dispute, neprezentări, calitatea prestației sau plăți realizate în afara platformei.",
        ],
      },
      {
        title: "13. Declinări de răspundere și limitarea răspunderii",
        paragraphs: [
          "Platforma este furnizată „ca atare”, fără garanții de niciun fel. În măsura maximă permisă de lege, Muzicalist nu răspunde pentru daune indirecte, incidentale sau consecvente rezultate din utilizarea platformei.",
        ],
      },
      {
        title: "14. Încetare",
        paragraphs: [
          "Putem suspenda sau închide contul tău pentru încălcarea acestor termeni sau pentru alt comportament pe care îl considerăm în mod rezonabil dăunător. Îți poți șterge contul oricând din setările dashboard-ului. Unele date pot fi păstrate conform Politicii de confidențialitate.",
        ],
      },
      {
        title: "15. Modificarea termenilor",
        paragraphs: [
          "Putem modifica acești termeni periodic. Continuarea utilizării platformei după modificări reprezintă acceptarea termenilor actualizați. Vom notifica utilizatorii cu privire la modificările importante prin email sau notificare în aplicație.",
        ],
      },
    ],
  },
};

const getStoredTermsLanguage = () => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("i18nextManualLang_v2") ||
    localStorage.getItem("i18nextCountryLang_v2") ||
    localStorage.getItem("i18nextLng")
  );
};

const TermsOfService = () => {
  const [user, setUser] = useState<any>(null);
  const { i18n } = useTranslation();
  const activeLanguage = getStoredTermsLanguage() || i18n.language;
  const lang = activeLanguage?.split("-")[0]?.toLowerCase() === "ro" ? "ro" : "en";
  const copy = TERMS_COPY[lang];

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
          <h1 data-no-translate={lang === "ro" ? true : undefined} className="text-3xl md:text-5xl font-display font-bold mb-8 text-foreground">
            {copy.title}
          </h1>
          
          <div data-no-translate={lang === "ro" ? true : undefined} className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-muted-foreground">
            <p className="text-sm text-muted-foreground">
              {copy.updated}: {new Date().toLocaleDateString(copy.locale, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            {copy.sections.map((section) => (
              <section key={section.title} className="space-y-4">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">{section.title}</h2>
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items && (
                  <ul className="list-disc pl-6 space-y-2">
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
                {section.afterItems?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">{lang === "ro" ? "16. Operator și contact" : "16. Operator & Contact"}</h2>
              <p>
                {lang === "ro" ? "Muzicalist este operat de următoarea entitate juridică:" : "Muzicalist is operated by the following legal entity:"}
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">{lang === "ro" ? "Companie:" : "Company:"}</strong> FUTURE CRAFT SRL</li>
                <li><strong className="text-foreground">CUI:</strong> 54307625</li>
                <li><strong className="text-foreground">{lang === "ro" ? "Adresă înregistrată:" : "Registered address:"}</strong> Str. Principală, Nr. 39, Sat Sohodol, Comuna Sohodol, Romania</li>
              </ul>
              <p>
                {copy.contactIntro}{" "}
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
