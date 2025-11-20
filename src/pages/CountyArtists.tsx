import Navigation from "@/components/Navigation";
import SimpleArtistCard from "@/components/SimpleArtistCard";
import { ArrowLeft, Grid, List } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const CountyArtists = () => {
  const { county } = useParams<{ county: string }>();
  const [viewModes, setViewModes] = useState<Record<string, 'carousel' | 'list'>>({
    Singers: 'carousel',
    Instrumentalists: 'carousel',
    DJs: 'carousel',
    Bands: 'carousel',
  });

  const toggleViewMode = (category: string) => {
    setViewModes(prev => ({
      ...prev,
      [category]: prev[category] === 'carousel' ? 'list' : 'carousel'
    }));
  };

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
              <div className="flex items-center justify-center gap-4">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-accent uppercase border-b-2 border-accent pb-2">
                  {category.displayTitle} ({category.count})
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleViewMode(category.title)}
                  className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                >
                  {viewModes[category.title] === 'carousel' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
                </Button>
              </div>
              
              {viewModes[category.title] === 'carousel' ? (
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full max-w-7xl mx-auto"
                >
                  <CarouselContent>
                    {category.artists.map((artist) => (
                      <CarouselItem key={artist.id} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-3">
                          <SimpleArtistCard 
                            id={artist.id}
                            name={artist.stageName}
                            stageName={artist.stageName}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0" />
                  <CarouselNext className="right-0" />
                </Carousel>
              ) : (
                <div className="space-y-3 max-w-4xl mx-auto">
                  {category.artists.map((artist) => (
                    <Link key={artist.id} to={`/artist/${artist.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-lg border border-accent/30 hover:border-accent hover:bg-accent/5 transition-all duration-300">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent flex-shrink-0">
                          {artist.stageName ? (
                            <div className="w-full h-full bg-gradient-to-br from-accent/30 to-accent/10" />
                          ) : (
                            <img src="" alt={artist.stageName} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <p className="text-lg font-semibold text-foreground">{artist.stageName}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              
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
