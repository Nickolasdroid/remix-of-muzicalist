import Navigation from "@/components/Navigation";
import SimpleArtistCard from "@/components/SimpleArtistCard";
import { ArrowLeft } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CountyArtists = () => {
  const { county } = useParams<{ county: string }>();

  // Mock data - in real app, this would be fetched based on county
  const categories = [
    {
      title: "Singers",
      displayTitle: "SINGERS",
      count: 12,
      href: `/counties/${county}/soloists`,
      artists: [
        { id: "1", stageName: "Maria P." },
        { id: "2", stageName: "Ionuț" },
        { id: "3", stageName: "Elena V." },
      ]
    },
    {
      title: "Instrumentalists",
      displayTitle: "INSTRUMENTALISTS",
      count: 8,
      href: `/counties/${county}/instrumentalists`,
      artists: [
        { id: "4", stageName: "Alex G." },
        { id: "5", stageName: "Victor M." },
        { id: "6", stageName: "Diana S." },
      ]
    },
    {
      title: "DJs",
      displayTitle: "DJS",
      count: 15,
      href: `/counties/${county}/djs`,
      artists: [
        { id: "7", stageName: "DJ Mike" },
        { id: "8", stageName: "DJ Andy" },
        { id: "9", stageName: "DJ Alex" },
      ]
    },
    {
      title: "Bands",
      displayTitle: "BANDS",
      count: 6,
      href: `/counties/${county}/bands`,
      artists: [
        { id: "10", stageName: "The Rockers" },
        { id: "11", stageName: "Night Vibes" },
        { id: "12", stageName: "Echo Band" },
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
                  {category.displayTitle} ({category.count})
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {category.artists.map((artist) => (
                  <SimpleArtistCard 
                    key={artist.id} 
                    id={artist.id}
                    name={artist.stageName}
                    stageName={artist.stageName}
                  />
                ))}
              </div>
              
              <div className="flex justify-center">
                <Link to={category.href}>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-lg font-semibold rounded-full">
                    Vezi lista
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountyArtists;
