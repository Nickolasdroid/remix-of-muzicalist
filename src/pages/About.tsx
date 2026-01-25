import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import CategoryCard from "@/components/CategoryCard";
import ArtistSearchBar from "@/components/ArtistSearchBar";
import AISearchBar from "@/components/AISearchBar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import { Music2, Users, Target, Heart, Mic, Guitar, Headphones } from "lucide-react";
import { Card } from "@/components/ui/card";
const About = () => {
  const [counts, setCounts] = useState({
    Singer: 0,
    Instrumentalist: 0,
    DJ: 0,
    Band: 0
  });
  useEffect(() => {
    const fetchCounts = async () => {
      const {
        data
      } = await supabase.from("profiles").select("specialization");
      if (data) {
        const newCounts = {
          Singer: 0,
          Instrumentalist: 0,
          DJ: 0,
          Band: 0
        };
        data.forEach(profile => {
          if (profile.specialization && newCounts[profile.specialization as keyof typeof newCounts] !== undefined) {
            newCounts[profile.specialization as keyof typeof newCounts]++;
          }
        });
        setCounts(newCounts);
      }
    };
    fetchCounts();
  }, []);
  const categories = [{
    icon: Mic,
    title: "Singer",
    description: "Professional vocalists for any event",
    count: counts.Singer,
    href: "/categories/Singers"
  }, {
    icon: Guitar,
    title: "Instrumentalist",
    description: "Skilled musicians with various instruments",
    count: counts.Instrumentalist,
    href: "/categories/Instrumentalists"
  }, {
    icon: Headphones,
    title: "DJ",
    description: "Expert DJs for parties and events",
    count: counts.DJ,
    href: "/categories/DJs"
  }, {
    icon: Users,
    title: "Band",
    description: "Complete musical groups for your events",
    count: counts.Band,
    href: "/categories/Bands"
  }];
  const values = [{
    icon: Music2,
    title: "Excellence in Music",
    description: "We connect clients with the most talented musical artists, ensuring every event becomes unforgettable."
  }, {
    icon: Users,
    title: "Community First",
    description: "Building a vibrant community where artists can showcase their talents and clients can easily find the perfect match."
  }, {
    icon: Target,
    title: "Professional Platform",
    description: "A dedicated space for serious musicians and event organizers to connect and collaborate professionally."
  }, {
    icon: Heart,
    title: "Passion for Music",
    description: "We're driven by our love for music and our commitment to supporting artists in their careers."
  }];
  return <div className="min-h-screen md:ml-64">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 md:pt-32 pb-12 md:pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-4 md:mb-6 text-foreground">
            Find Your Perfect
            <span className="text-accent block mt-2">Musical Artist</span>
          </h1>
          
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
            The premier platform connecting talented musicians with clients. 
            Search, discover, and book professional artists for your events.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300">
                Create Account
              </Button>
            </Link>
            <Link to="/categories">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground text-base md:text-lg px-6 md:px-8 py-5 md:py-6 hover:scale-105 transition-all duration-300">
                Find Artists
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Search Section */}
      

      {/* Advanced Search Section */}
      

      {/* Categories Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-4 text-foreground">
            Browse by Category
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Discover talented artists in every musical discipline
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map(category => <CategoryCard key={category.title} {...category} />)}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              About Muzicalist
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The premier platform connecting talented musical artists with clients seeking exceptional entertainment
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-20">
            <Card className="p-8 md:p-12 bg-card/50 backdrop-blur border-accent/20">
              <h3 className="text-3xl font-display font-bold text-foreground mb-6">Our Mission</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Muzicalist was created to bridge the gap between talented musical artists and clients looking for the perfect entertainment for their events. Whether you're planning a wedding, corporate event, private party, or any special occasion, we make it easy to discover and connect with professional musicians.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                For artists, we provide a professional platform to showcase your talents, build your reputation, and grow your career. Our ranking system highlights the most talented and reliable artists, helping you stand out in a competitive industry.
              </p>
              <p className="text-lg text-muted-foreground">
                We believe that great music transforms events into memories, and we're committed to making those connections happen seamlessly.
              </p>
            </Card>
          </div>

          <div className="mb-16">
            <h3 className="text-4xl font-display font-bold text-center text-foreground mb-12">Our Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {values.map(value => {
              const Icon = value.icon;
              return <Card key={value.title} className="p-8 bg-card/50 backdrop-blur border-accent/20 hover:border-accent/40 transition-all hover:shadow-[var(--shadow-gold)]">
                    <Icon className="h-12 w-12 text-accent mb-4" />
                    <h4 className="text-2xl font-display font-bold text-foreground mb-3">
                      {value.title}
                    </h4>
                    <p className="text-muted-foreground">
                      {value.description}
                    </p>
                  </Card>;
            })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-card to-secondary p-12 border-2 border-accent/30 shadow-[var(--shadow-elegant)] text-center">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">
              Are You a Musical Artist?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our platform and connect with clients looking for your talent. 
              Build your profile and grow your career.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-10 py-6 shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300">
                Register as Artist
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default About;