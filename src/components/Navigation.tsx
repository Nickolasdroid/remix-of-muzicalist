import { Link } from "react-router-dom";
import { Users, Trophy, MapPin, Megaphone, Info, Mail, LogIn, Search, Home } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import logo from "@/assets/logo.png";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-accent/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="Muzicalist" className="h-12 w-12 transition-transform group-hover:scale-110" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/feed" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link to="/categories" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <Users className="h-4 w-4" />
              Categories
            </Link>
            <Link to="/leaderboard" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
            <Link to="/counties" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <MapPin className="h-4 w-4" />
              Counties
            </Link>
            <Link to="/announcements" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <Megaphone className="h-4 w-4" />
              Announcements
            </Link>
            <Link to="/about" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <Info className="h-4 w-4" />
              About
            </Link>
            <Link to="/contact" className="flex items-center gap-2 text-foreground/80 hover:text-accent transition-colors">
              <Mail className="h-4 w-4" />
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search"
                className="pl-9 w-64 bg-background/50 border-accent/20 focus:border-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-[var(--shadow-gold)]">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
