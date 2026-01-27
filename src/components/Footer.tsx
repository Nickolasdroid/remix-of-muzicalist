import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const quickLinks = [{
    title: "Home",
    href: "/"
  }, {
    title: "Categories",
    href: "/categories"
  }, {
    title: "Regions",
    href: "/counties"
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
    title: "Contact",
    href: "/contact"
  }];
  const socialLinks = [{
    icon: Facebook,
    href: "#",
    label: "Facebook"
  }, {
    icon: Instagram,
    href: "#",
    label: "Instagram"
  }, {
    icon: Youtube,
    href: "#",
    label: "YouTube"
  }];
  return <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-12 w-auto" />
            </Link>
            
            <div className="flex gap-3">
              {socialLinks.map(social => <a key={social.label} href={social.href} aria-label={social.label} className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300">
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
                <span>contact@artistplatform.ro</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                
                
              </li>
              
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {currentYear} Muzicalist. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-muted-foreground hover:text-accent transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;