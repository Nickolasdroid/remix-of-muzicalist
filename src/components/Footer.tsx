import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";
import LanguageSwitcher from "./LanguageSwitcher";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const quickLinks = [
    { title: t("footer.links.home"), href: "/" },
    { title: t("footer.links.categories"), href: "/categories" },
    { title: t("footer.links.countries"), href: "/countries" },
    { title: t("footer.links.leaderboard"), href: "/leaderboard" },
  ];
  const artistLinks = [
    { title: t("footer.links.registerAsArtist"), href: "/register" },
    { title: t("footer.links.login"), href: "/login" },
    { title: t("footer.links.aboutUs"), href: "/about" },
    { title: t("footer.links.plansPricing"), href: "/plans" },
  ];
  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/p/Muzicalist-100091939989391/", label: "Facebook" },
    { icon: Instagram, href: "https://www.instagram.com/muzicalist_/", label: "Instagram" },
    { icon: Youtube, href: "https://www.youtube.com/@Muzicalist", label: "YouTube" },
  ];
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-12 w-auto" />
            </Link>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <div className="pt-2">
              <LanguageSwitcher variant="outline" showLabel />
            </div>
          </div>

          {/* Quick Links + For Artists - same row on mobile */}
          <div className="flex flex-row gap-8 md:contents">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground mb-4">
                {t("footer.quickLinks")}
              </h3>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.title}>
                    <Link to={link.href} className="text-muted-foreground hover:text-accent transition-colors duration-300">
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-foreground mb-4">
                {t("footer.forArtists")}
              </h3>
              <ul className="space-y-2">
                {artistLinks.map((link) => (
                  <li key={link.title}>
                    <Link to={link.href} className="text-muted-foreground hover:text-accent transition-colors duration-300">
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-display font-bold text-lg text-foreground mb-4">
              {t("footer.contactUs")}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-5 w-5 text-accent" />
                <span>contact@muzicalist.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {currentYear} Muzicalist. {t("footer.rightsReserved")}
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-accent transition-colors">
              {t("footer.privacyPolicy")}
            </Link>
            <Link to="/terms-of-service" className="text-muted-foreground hover:text-accent transition-colors">
              {t("footer.termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
