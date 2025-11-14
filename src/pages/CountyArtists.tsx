import Navigation from "@/components/Navigation";
import CategoryCard from "@/components/CategoryCard";
import ArtistCard from "@/components/ArtistCard";
import { Music, Mic, Music2, Users, ArrowLeft } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CountyArtists = () => {
  const { county } = useParams<{ county: string }>();

  // Mock data - in real app, this would be fetched based on county
  const categories = [
    {
      icon: Mic,
      title: "Soloists",
      description: "Professional vocalists for any event",
      count: 12,
      href: `/counties/${county}/soloists`,
      artists: [
        { id: "1", name: "Maria Popescu", stageName: "Maria P.", specialization: "Soloist", county: county || "" },
        { id: "2", name: "Ion Ionescu", stageName: "Ionuț", specialization: "Soloist", county: county || "" },
      ]
    },
    {
      icon: Music,
      title: "Instrumentalists",
      description: "Skilled musicians with various instruments",
      count: 8,
      href: `/counties/${county}/instrumentalists`,
      artists: [
        { id: "3", name: "Alex Gheorghe", stageName: "Alex G.", specialization: "Instrumentalist", county: county || "" },
      ]
    },
    {
      icon: Music2,
      title: "DJs",
      description: "Expert DJs for parties and events",
      count: 15,
      href: `/counties/${county}/djs`,
      artists: [
        { id: "4", name: "Mihai Dumitrescu", stageName: "DJ Mike", specialization: "DJ", county: county || "" },
        { id: "5", name: "Andrei Popa", stageName: "DJ Andy", specialization: "DJ", county: county || "" },
      ]
    },
    {
      icon: Users,
      title: "Bands",
      description: "Complete musical groups for your events",
      count: 6,
      href: `/counties/${county}/bands`,
      artists: [
        { id: "6", name: "The Rockers", stageName: "The Rockers", specialization: "Band", county: county || "" },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <Link to="/counties">
          <Button variant="outline" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Counties
          </Button>
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6">
            Artists in {county}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse through talented artists by category
          </p>
        </div>

        <div className="space-y-16 max-w-7xl mx-auto">
          {categories.map((category) => (
            <div key={category.title} className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-accent uppercase inline-block border-b-2 border-accent pb-2">
                  {category.title} ({category.count})
                </h2>
              </div>
              
              {category.artists.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.artists.map((artist) => (
                      <ArtistCard key={artist.id} {...artist} />
                    ))}
                  </div>
                  
                  <div className="flex justify-center">
                    <Link to={category.href}>
                      <Button className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-lg font-semibold rounded-full">
                        Vezi lista
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountyArtists;
