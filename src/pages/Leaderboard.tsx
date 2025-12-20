import Navigation from "@/components/Navigation";
import ArtistCard from "@/components/ArtistCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trophy, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Artist {
  id: string;
  stage_name: string;
  specialization: string | null;
  county: string;
  plan: string;
  avatar_url: string | null;
  number_of_events: number;
}

const Leaderboard = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>("All Regions");
  const [selectedCounty, setSelectedCounty] = useState<string>("All Counties");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  const regions = ["All Regions", "Transylvania", "Banat", "Moldova", "Oltenia", "Muntenia"];
  const counties = [
    "All Counties",
    "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani",
    "Brașov", "Brăila", "București", "Buzău", "Caraș-Severin", "Călărași",
    "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu",
    "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș",
    "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova", "Satu Mare", "Sălaj",
    "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vaslui", "Vâlcea", "Vrancea"
  ];

  useEffect(() => {
    const fetchArtists = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, stage_name, specialization, county, plan, avatar_url, number_of_events')
        .order('number_of_events', { ascending: false });

      if (error) {
        console.error('Error fetching artists:', error);
      } else {
        setArtists(data || []);
      }
      setLoading(false);
    };

    fetchArtists();
  }, []);

  const getArtistsBySpecialization = (specialization: string) => {
    let filtered = artists.filter(artist => 
      artist.specialization?.toLowerCase() === specialization.toLowerCase()
    );

    if (selectedCounty !== "All Counties") {
      filtered = filtered.filter(artist => artist.county === selectedCounty);
    }

    return filtered;
  };

  const categories = {
    singers: getArtistsBySpecialization('Singer'),
    instrumentalists: getArtistsBySpecialization('Instrumentalist'),
    djs: getArtistsBySpecialization('DJ'),
    bands: getArtistsBySpecialization('Band')
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent mb-6 shadow-[var(--shadow-gold)]">
              <Trophy className="h-10 w-10 text-accent-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-4 text-foreground">
              Top Artists
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the highest-rated musical talents on our platform
            </p>

            <div className="flex gap-4 justify-center mt-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[180px] justify-between">
                    {selectedRegion}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="min-w-[180px] max-h-[300px] overflow-y-auto">
                  {regions.map((region) => (
                    <DropdownMenuItem
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className="cursor-pointer"
                    >
                      {region}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[180px] justify-between">
                    {selectedCounty}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="min-w-[180px] max-h-[300px] overflow-y-auto">
                  {counties.map((county) => (
                    <DropdownMenuItem
                      key={county}
                      onClick={() => setSelectedCounty(county)}
                      className="cursor-pointer"
                    >
                      {county}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs defaultValue="singers" className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-12 bg-card/50 p-2 rounded-xl border-2 border-accent/30">
              <TabsTrigger 
                value="singers"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg transition-all duration-300"
              >
                Singers
              </TabsTrigger>
              <TabsTrigger 
                value="instrumentalists"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg transition-all duration-300"
              >
                Instrumentalists
              </TabsTrigger>
              <TabsTrigger 
                value="djs"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg transition-all duration-300"
              >
                DJs
              </TabsTrigger>
              <TabsTrigger 
                value="bands"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg transition-all duration-300"
              >
                Bands
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">Loading artists...</p>
              </div>
            ) : (
              Object.entries(categories).map(([key, categoryArtists]) => (
                <TabsContent key={key} value={key} className="space-y-6">
                  <div className="grid gap-6 max-w-2xl mx-auto">
                    {categoryArtists.length > 0 ? (
                      categoryArtists.map((artist, index) => (
                        <ArtistCard 
                          key={artist.id} 
                          id={artist.id}
                          name={artist.stage_name}
                          stageName={artist.stage_name}
                          specialization={artist.specialization || ''}
                          county={artist.county}
                          isPremium={artist.plan === 'Premium'}
                          imageUrl={artist.avatar_url || undefined}
                          rank={index + 1} 
                        />
                      ))
                    ) : (
                      <div className="text-center py-16">
                        <p className="text-xl text-muted-foreground">No artists found in this category</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;