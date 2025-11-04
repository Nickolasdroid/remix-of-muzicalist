import Navigation from "@/components/Navigation";
import { Music2, Users, Target, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";

const About = () => {
  const values = [
    {
      icon: Music2,
      title: "Excellence in Music",
      description: "We connect clients with the most talented musical artists across Romania, ensuring every event becomes unforgettable.",
    },
    {
      icon: Users,
      title: "Community First",
      description: "Building a vibrant community where artists can showcase their talents and clients can easily find the perfect match.",
    },
    {
      icon: Target,
      title: "Professional Platform",
      description: "A dedicated space for serious musicians and event organizers to connect and collaborate professionally.",
    },
    {
      icon: Heart,
      title: "Passion for Music",
      description: "We're driven by our love for music and our commitment to supporting artists in their careers.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6">
            About Muzicalist
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Romania's premier platform connecting talented musical artists with clients seeking exceptional entertainment
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-20">
          <Card className="p-8 md:p-12 bg-card/50 backdrop-blur border-accent/20">
            <h2 className="text-3xl font-display font-bold text-foreground mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Muzicalist was created to bridge the gap between talented musical artists and clients looking for the perfect entertainment for their events. Whether you're planning a wedding, corporate event, private party, or any special occasion, we make it easy to discover and connect with professional musicians across Romania.
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
          <h2 className="text-4xl font-display font-bold text-center text-foreground mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="p-8 bg-card/50 backdrop-blur border-accent/20 hover:border-accent/40 transition-all hover:shadow-[var(--shadow-gold)]">
                  <Icon className="h-12 w-12 text-accent mb-4" />
                  <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {value.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <Card className="p-8 md:p-12 bg-gradient-subtle border-accent/20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Join Our Community</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Whether you're an artist looking to grow your career or a client searching for the perfect entertainment, Muzicalist is here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="inline-block">
                <span className="inline-flex items-center justify-center px-8 py-3 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-[var(--shadow-gold)] transition-all rounded-md font-semibold">
                  Register as Artist
                </span>
              </a>
              <a href="/categories" className="inline-block">
                <span className="inline-flex items-center justify-center px-8 py-3 border border-accent text-accent hover:bg-accent/10 transition-all rounded-md font-semibold">
                  Find Artists
                </span>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
