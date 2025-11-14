import Navigation from "@/components/Navigation";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";

const CategoryArtists = () => {
  const { category } = useParams<{ category: string }>();

  // Mock data - in real app, this would be fetched based on category
  const artists = [
    { id: "1", name: "Maria Popescu", imageUrl: undefined },
    { id: "2", name: "Ion Ionescu", imageUrl: undefined },
    { id: "3", name: "Alex Gheorghe", imageUrl: undefined },
    { id: "4", name: "Mihai Dumitrescu", imageUrl: undefined },
    { id: "5", name: "Andrei Popa", imageUrl: undefined },
    { id: "6", name: "Elena Vasilescu", imageUrl: undefined },
    { id: "7", name: "George Marinescu", imageUrl: undefined },
    { id: "8", name: "Diana Constantinescu", imageUrl: undefined },
    { id: "9", name: "Radu Stoica", imageUrl: undefined },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <Link to="/categories">
          <Button variant="outline" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6">
            {category}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse through talented artists in this category
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {artists.map((artist) => (
            <Link 
              key={artist.id} 
              to={`/artist/${artist.id}`}
              className="group"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-accent transition-all duration-300 hover:shadow-[var(--shadow-gold)] hover:scale-105">
                {artist.imageUrl ? (
                  <img 
                    src={artist.imageUrl} 
                    alt={artist.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-card to-secondary flex items-center justify-center">
                    <User className="h-24 w-24 text-accent" />
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4">
                  <h3 className="text-lg font-display font-semibold text-foreground text-center group-hover:text-accent transition-colors">
                    {artist.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryArtists;