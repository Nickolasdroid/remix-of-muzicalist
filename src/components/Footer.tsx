import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.68 2.87 2.87 0 01-2.1-5.11 2.87 2.87 0 012.1-.87h.3V9.6a6.33 6.33 0 00-.3 0A6.24 6.24 0 003.91 16a6.24 6.24 0 006.24 6.24 6.24 6.24 0 006.24-6.24V8.91a8.17 8.17 0 004.77 1.52V7a4.81 4.81 0 01-1.57-.31z" />
  </svg>
);
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const quickLinks = [{
    title: "Home",
    href: "/"
  }, {
    title: "Categories",
    href: "/categories"
  }, {
    title: "Countries",
    href: "/countries"
  }, {
    title: "Leaderboard",
    href: "/leaderboard"
  }];
  const artistLinks = [{
    title: "Register as Artist",
    href: "/register"
  }, {
    title: "Login",
    href: "/login"
  }, {
    title: "About Us",
    href: "/about"
  }, {
    title: "Plans & Pricing",
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
  return <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-12 w-auto" />
            </Link>
            
            <div className="flex gap-3">
              {socialLinks.map(social => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300">
                  <social.icon className="h-5 w-5" />
                </a>)}
            </div>
          </div>

          {/* Quick Links + For Artists - same row on mobile */}
          <div className="flex flex-row gap-8 md:contents">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2">
                {quickLinks.map(link => <li key={link.title}>
                    <Link to={link.href} className="text-muted-foreground hover:text-accent transition-colors duration-300">
                      {link.title}
                    </Link>
                  </li>)}
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-foreground mb-4">
                For Artists
              </h3>
              <ul className="space-y-2">
                {artistLinks.map(link => <li key={link.title}>
                    <Link to={link.href} className="text-muted-foreground hover:text-accent transition-colors duration-300">
                      {link.title}
                    </Link>
                  </li>)}
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-display font-bold text-lg text-foreground mb-4">
              Contact Us
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
            © {currentYear} Muzicalist. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacy-policy" className="hover:text-accent transition-colors duration-300">
              Privacy & Policy
            </Link>
            <span className="text-border">|</span>
            <Link to="/terms-of-service" className="hover:text-accent transition-colors duration-300">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;