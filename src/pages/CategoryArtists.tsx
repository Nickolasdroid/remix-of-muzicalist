import Navigation from "@/components/Navigation";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter } from "lucide-react";
import ArtistProfileCard from "@/components/ArtistProfileCard";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

  const counties = [
    "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani",
    "Brăila", "Brașov", "București", "Buzău", "Călărași", "Caraș-Severin",
    "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu",
    "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș",
    "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova", "Sălaj", "Satu Mare",
    "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vâlcea", "Vaslui", "Vrancea"
  ];

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
    <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 md:pt-32 pb-24 md:pb-20">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <Link to="/categories">
            <Button variant="outline" size="sm" className="text-xs md:text-sm">
              <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Back
            </Button>
          </Link>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-card border border-border z-50">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Filter Artists</h4>
                  <p className="text-sm text-muted-foreground">Apply filters to find the perfect artist</p>
                </div>
                
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
            </PopoverContent>
          </Popover>
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
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {filteredArtists.length > 0 ? (
              filteredArtists.map((artist) => (
                <ArtistProfileCard
                  key={artist.id}
                  id={artist.id}
                  stageName={artist.stage_name}
                  imageUrl={artist.avatar_url}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <p className="text-xl text-muted-foreground">No artists found matching your filters</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryArtists;