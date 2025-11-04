import Navigation from "@/components/Navigation";
import ArtistCard from "@/components/ArtistCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";

const Leaderboard = () => {
  // Mock data for demonstration
  const mockArtists = {
    singers: [
      { id: "1", name: "Maria Popescu", stageName: "Maria P.", specialization: "Singer", county: "București", rating: 4.9 },
      { id: "2", name: "Ion Georgescu", stageName: "Johnny G", specialization: "Singer", county: "Cluj", rating: 4.8 },
      { id: "3", name: "Ana Marin", stageName: "Ana M", specialization: "Singer", county: "Timiș", rating: 4.7 },
    ],
    instrumentalists: [
      { id: "4", name: "Andrei Violin", stageName: "Master Andrei", specialization: "Instrumentalist", county: "Brașov", rating: 4.9 },
      { id: "5", name: "Elena Piano", stageName: "Elena P", specialization: "Instrumentalist", county: "Iași", rating: 4.8 },
      { id: "6", name: "Mihai Guitar", stageName: "Mike G", specialization: "Instrumentalist", county: "Constanța", rating: 4.7 },
    ],
    djs: [
      { id: "7", name: "Alex Beats", stageName: "DJ Alex", specialization: "DJ", county: "București", rating: 4.9 },
      { id: "8", name: "Cristian Mix", stageName: "DJ Cris", specialization: "DJ", county: "Cluj", rating: 4.8 },
      { id: "9", name: "David Sound", stageName: "DJ Dave", specialization: "DJ", county: "Timiș", rating: 4.7 },
    ],
    bands: [
      { id: "10", name: "Rock Masters", stageName: "Rock Masters", specialization: "Band", county: "București", rating: 4.9 },
      { id: "11", name: "Jazz Collective", stageName: "Jazz Collective", specialization: "Band", county: "Cluj", rating: 4.8 },
      { id: "12", name: "Pop Stars", stageName: "Pop Stars", specialization: "Band", county: "Brașov", rating: 4.7 },
    ]
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

            {Object.entries(mockArtists).map(([key, artists]) => (
              <TabsContent key={key} value={key} className="space-y-6">
                <div className="grid gap-6">
                  {artists.map((artist, index) => (
                    <ArtistCard key={artist.id} {...artist} rank={index + 1} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
