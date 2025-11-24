import Navigation from "@/components/Navigation";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CategoryArtists = () => {
  const { category } = useParams<{ category: string }>();
  const [filterCounty, setFilterCounty] = useState<string>("all");
  const [filterExperience, setFilterExperience] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("none");

  // Mock data - in real app, this would be fetched based on category
  const artists = [
    { id: "1", name: "Maria Popescu", imageUrl: undefined, county: "Bucharest", experience: "senior", rating: 4.8, isPremium: true },
    { id: "2", name: "Ion Ionescu", imageUrl: undefined, county: "Cluj", experience: "intermediate", rating: 4.5, isPremium: false },
    { id: "3", name: "Alex Gheorghe", imageUrl: undefined, county: "Timișoara", experience: "beginner", rating: 4.2, isPremium: true },
    { id: "4", name: "Mihai Dumitrescu", imageUrl: undefined, county: "Bucharest", experience: "senior", rating: 4.9, isPremium: false },
    { id: "5", name: "Andrei Popa", imageUrl: undefined, county: "Iași", experience: "intermediate", rating: 4.6, isPremium: true },
    { id: "6", name: "Elena Vasilescu", imageUrl: undefined, county: "Cluj", experience: "senior", rating: 4.7, isPremium: false },
    { id: "7", name: "George Marinescu", imageUrl: undefined, county: "Timișoara", experience: "beginner", rating: 4.3, isPremium: true },
    { id: "8", name: "Diana Constantinescu", imageUrl: undefined, county: "Bucharest", experience: "intermediate", rating: 4.4, isPremium: false },
    { id: "9", name: "Radu Stoica", imageUrl: undefined, county: "Iași", experience: "senior", rating: 4.8, isPremium: true },
  ];

  // Filter and sort artists
  const filteredArtists = useMemo(() => {
    let result = [...artists];

    // Filter by county
    if (filterCounty !== "all") {
      result = result.filter(artist => artist.county === filterCounty);
    }

    // Filter by experience
    if (filterExperience !== "all") {
      result = result.filter(artist => artist.experience === filterExperience);
    }

    // Filter by rating
    if (filterRating !== "all") {
      const minRating = parseFloat(filterRating);
      result = result.filter(artist => artist.rating >= minRating);
    }

    // Sort alphabetically
    if (sortOrder === "a-z") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === "z-a") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [artists, filterCounty, filterExperience, filterRating, sortOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="flex items-center justify-between mb-8">
          <Link to="/categories">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Button>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Artists</SheetTitle>
                <SheetDescription>
                  Apply filters to find the perfect artist
                </SheetDescription>
              </SheetHeader>
              
              <div className="grid gap-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="county">County</Label>
                  <Select value={filterCounty} onValueChange={setFilterCounty}>
                    <SelectTrigger id="county">
                      <SelectValue placeholder="All Counties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Counties</SelectItem>
                      <SelectItem value="Bucharest">Bucharest</SelectItem>
                      <SelectItem value="Cluj">Cluj</SelectItem>
                      <SelectItem value="Timișoara">Timișoara</SelectItem>
                      <SelectItem value="Iași">Iași</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience Level</Label>
                  <Select value={filterExperience} onValueChange={setFilterExperience}>
                    <SelectTrigger id="experience">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Minimum Rating</Label>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger id="rating">
                      <SelectValue placeholder="All Ratings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="4.5">4.5+ Stars</SelectItem>
                      <SelectItem value="4.0">4.0+ Stars</SelectItem>
                      <SelectItem value="3.5">3.5+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort">Sort Alphabetically</Label>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger id="sort">
                      <SelectValue placeholder="No Sorting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Sorting</SelectItem>
                      <SelectItem value="a-z">A to Z</SelectItem>
                      <SelectItem value="z-a">Z to A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterCounty("all");
                    setFilterExperience("all");
                    setFilterRating("all");
                    setSortOrder("none");
                  }}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6">
            {category}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse through talented artists in this category
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredArtists.length > 0 ? (
            filteredArtists.map((artist) => {
              const borderColor = artist.isPremium ? "border-accent" : "border-burgundy";
              
              return (
            <Link 
              key={artist.id} 
              to={`/artist/${artist.id}`}
              className="group"
            >
              <div className={`relative aspect-square rounded-lg overflow-hidden border-2 ${borderColor} transition-all duration-300 hover:shadow-[var(--shadow-gold)] hover:scale-105`}>
                {artist.imageUrl ? (
                  <img 
                    src={artist.imageUrl} 
                    alt={artist.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-card to-secondary flex items-center justify-center">
                    <User className="h-16 w-16 text-accent" />
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-3">
                  <h3 className="text-base font-display font-semibold text-foreground text-center group-hover:text-accent transition-colors">
                    {artist.name}
                  </h3>
                </div>
              </div>
            </Link>
            );
            })
          ) : (
            <div className="col-span-full text-center py-16">
              <p className="text-xl text-muted-foreground">No artists found matching your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryArtists;