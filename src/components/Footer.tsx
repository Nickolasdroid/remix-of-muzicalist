import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Facebook, Instagram, Youtube, Mail } from "lucide-react";
import { getCurrentLanguage } from "@/i18n";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.68 2.87 2.87 0 01-2.1-5.11 2.87 2.87 0 012.1-.87h.3V9.6a6.33 6.33 0 00-.3 0A6.24 6.24 0 003.91 16a6.24 6.24 0 006.24 6.24 6.24 6.24 0 006.24-6.24V8.91a8.17 8.17 0 004.77 1.52V7a4.81 4.81 0 01-1.57-.31z" />
  </svg>
);
/** Site footer, Spotify style. `embedded`: drawn inside a page panel (no own border or container). */
const Footer = ({ embedded = false }: { embedded?: boolean }) => {
  const { t } = useTranslation();
  const skipAutoTranslate = getCurrentLanguage() === "ro";
  const currentYear = new Date().getFullYear();
  const quickLinks = [{
    title: t("navigation.home"),
    href: "/"
  }, {
    title: t("navigation.categories"),
    href: "/categories"
  }, {
    title: t("navigation.countries", "Countries"),
    href: "/countries"
  }, {
    title: t("navigation.leaderboard"),
    href: "/leaderboard"
  }, {
    title: t("footer.faq", "FAQ"),
    href: "/help"
  }, {
    title: t("navigation.rules", "Rules"),
    href: "/rules"
  }];
  const artistLinks = [{
    title: t("footer.registerAsArtist", "Register as Artist"),
    href: "/register?type=artist"
  }, {
    title: t("navigation.login"),
    href: "/login"
  }, {
    title: t("footer.aboutUs", "About Us"),
    href: "/about"
  }, {
    title: t("footer.plansPricing", "Plans & Pricing"),
    href: "/plans"
  }];

  const socialLinks = [{
    icon: Facebook,
    href: "https://www.facebook.com/p/Muzicalist-100091939989391/",
    label: "Facebook"
  }, {
    icon: Instagram,
    href: "https://www.instagram.com/muzicalist_/",
    label: "Instagram"
  }, {
    icon: Youtube,
    href: "https://www.youtube.com/@Muzicalist",
    label: "YouTube"
  }, {
    icon: TikTokIcon,
    href: "https://www.tiktok.com/@muzicalist",
    label: "TikTok"
  }];
  const linkClass = "text-muted-foreground hover:text-foreground hover:underline";
  const column = (title: string, links: { title: string; href: string }[]) => (
    <div>
      <h3 className="mb-2 text-base font-bold text-foreground">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link to={link.href} className={linkClass}>
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return <footer data-no-translate={skipAutoTranslate ? true : undefined} className={embedded ? "px-4 pb-10 md:px-8" : "bg-background"}>
      <div className={embedded ? "border-t border-border pt-10" : "container mx-auto px-4 py-12"}>
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:gap-16">
            {column(t("footer.quickLinks", "Quick Links"), quickLinks)}
            {column(t("footer.forArtists", "For Artists"), artistLinks)}
            <div>
              <h3 className="mb-2 text-base font-bold text-foreground">{t("footer.contactUs", "Contact Us")}</h3>
              <a href="mailto:contact@muzicalist.com" className={`inline-flex items-center gap-2 ${linkClass}`}>
                <Mail className="h-4 w-4" />
                <span>contact@muzicalist.com</span>
              </a>
            </div>
          </div>

          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#292929] text-foreground transition-colors hover:bg-[#727272]"
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col-reverse items-start justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row md:items-center">
          <p>
            © {currentYear} Muzicalist. {t("footer.allRightsReserved", "All rights reserved.")}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className={linkClass}>
              {t("footer.privacyPolicy", "Privacy & Policy")}
            </Link>
            <Link to="/terms-of-service" className={linkClass}>
              {t("footer.termsConditions", "Terms & Conditions")}
            </Link>
            <Link to="/delete-account" className={linkClass}>
              {t("footer.deleteAccount", "Delete account")}
            </Link>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;