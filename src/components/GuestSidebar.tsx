import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { getCurrentLanguage, setManualLanguage } from "@/i18n";

const CARDS = [
  {
    title: "Are you an artist?",
    text: "Create your profile for free and get booking requests.",
    cta: "Create artist profile",
    to: "/register?type=artist",
  },
  {
    title: "Planning an event?",
    text: "Find the right artist and book with a contract.",
    cta: "Browse artists",
    to: "/artists",
  },
];

const LEGAL = [
  { to: "/terms-of-service", label: "Terms and Conditions" },
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/rules", label: "Rules" },
  { to: "/help", label: "Help" },
];

/** Left column for visitors without an account (desktop), like Spotify's library panel. */
const GuestSidebar = () => {
  const ro = getCurrentLanguage() === "ro";
  return (
    <aside className="sticky top-[72px] hidden h-[calc(100vh-80px)] w-[300px] shrink-0 flex-col rounded-lg bg-background p-2 md:flex lg:w-[340px]">
      <div className="space-y-2 overflow-y-auto">
        {CARDS.map((c) => (
          <div key={c.to} className="rounded-lg bg-[#1f1f1f] px-5 py-4">
            <p className="text-base font-bold text-foreground">{c.title}</p>
            <p className="mt-2 text-sm text-foreground/90">{c.text}</p>
            <Link
              to={c.to}
              className="mt-5 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-bold text-black transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {c.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-auto px-4 pb-4">
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
          {LEGAL.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-foreground hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setManualLanguage(ro ? "en" : "ro")}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/60 px-3 py-1.5 text-sm font-bold text-foreground transition-transform hover:scale-[1.04] hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <Globe className="h-4 w-4" />
          <span className="notranslate" translate="no">{ro ? "English" : "Română"}</span>
        </button>
      </div>
    </aside>
  );
};

export default GuestSidebar;
