import Navigation from "@/components/Navigation";
import SimpleArtistCard from "@/components/SimpleArtistCard";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Grid, List } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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

interface Artist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  county: string;
  experience_level: string | null;
  plan: string;
}

const CategoryArtists = () => {
  const { category } = useParams<{ category: string }>();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCounty, setFilterCounty] = useState<string>("all");
  const [filterExperience, setFilterExperience] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("none");
  const [viewMode, setViewMode] = useState<'carousel' | 'list'>('carousel');

  useEffect(() => {
    const fetchArtists = async () => {
      if (!category) return;

      // Map URL category to database specialization value
      const categoryMap: Record<string, string> = {
        'Singers': 'Singer',
        'Instrumentalists': 'Instrumentalist',
        'DJs': 'DJ',
        'Bands': 'Band',
      };
      
      const specialization = categoryMap[category] || category;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, county, experience_level, plan')
        .eq('specialization', specialization as "Singer" | "Instrumentalist" | "DJ" | "Band");

      if (error) {
        console.error('Error fetching artists:', error);
      } else {
        setArtists(data || []);
      }
      setLoading(false);
    };

    fetchArtists();
  }, [category]);

  const counties = useMemo(() => {
    const uniqueCounties = [...new Set(artists.map(a => a.county))];
    return uniqueCounties.sort();
  }, [artists]);

  const filteredArtists = useMemo(() => {
    let result = [...artists];

    if (filterCounty !== "all") {
      result = result.filter(artist => artist.county === filterCounty);
    }

    if (filterExperience !== "all") {
      result = result.filter(artist => artist.experience_level?.toLowerCase() === filterExperience.toLowerCase());
    }

    if (sortOrder === "a-z") {
      result.sort((a, b) => a.stage_name.localeCompare(b.stage_name));
    } else if (sortOrder === "z-a") {
      result.sort((a, b) => b.stage_name.localeCompare(a.stage_name));
    }

    return result;
  }, [artists, filterCounty, filterExperience, sortOrder]);

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
                      {counties.map(county => (
                        <SelectItem key={county} value={county}>{county}</SelectItem>
                      ))}
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
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
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

        {loading ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">Loading artists...</p>
          </div>
        ) : filteredArtists.length > 0 ? (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-4">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-accent uppercase border-b-2 border-accent pb-2">
                {category} ({filteredArtists.length})
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === 'carousel' ? 'list' : 'carousel')}
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                {viewMode === 'carousel' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
              </Button>
            </div>

            {viewMode === 'carousel' ? (
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full max-w-7xl mx-auto"
              >
                <CarouselContent>
                  {filteredArtists.map((artist) => (
                    <CarouselItem key={artist.id} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-3">
                        <SimpleArtistCard 
                          id={artist.id}
                          name={artist.stage_name}
                          stageName={artist.stage_name}
                          isPremium={artist.plan === 'Premium'}
                          imageUrl={artist.avatar_url || undefined}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0" />
                <CarouselNext className="right-0" />
              </Carousel>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                {filteredArtists.map((artist) => {
                  const isPremium = artist.plan === 'Premium';
                  const borderColor = isPremium ? "border-accent/30" : "border-burgundy/30";
                  const hoverBorderColor = isPremium ? "hover:border-accent" : "hover:border-burgundy";
                  const hoverBgColor = isPremium ? "hover:bg-accent/5" : "hover:bg-burgundy/5";
                  const avatarBorderColor = isPremium ? "border-accent" : "border-burgundy";
                  
                  return (
                    <Link key={artist.id} to={`/artist/${artist.id}`}>
                      <div className={`flex items-center gap-4 p-3 rounded-lg border ${borderColor} ${hoverBorderColor} ${hoverBgColor} transition-all duration-300`}>
                        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${avatarBorderColor} flex-shrink-0`}>
                          {artist.avatar_url ? (
                            <img src={artist.avatar_url} alt={artist.stage_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-accent/30 to-accent/10" />
                          )}
                        </div>
                        <p className="text-lg font-semibold text-foreground">{artist.stage_name}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No artists found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryArtists;