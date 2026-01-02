import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Counties = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const allCounties = [
    "Alba", "Argeș", "Arad", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", 
    "Brașov", "Brăila", "București", "Buzău", "Caraș-Severin", "Călărași", 
    "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", 
    "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", 
    "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova", "Satu Mare", "Sălaj", 
    "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vaslui", "Vâlcea", "Vrancea"
  ];

  const filteredCounties = allCounties.filter(county =>
    county.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen ml-64 bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6">
            Find Artists by Region
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover talented artists in your area across all Romanian regions
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for a region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-lg bg-card/50 backdrop-blur border-accent/20"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCounties.map((county) => (
              <Link key={county} to={`/counties/${county}`}>
                <Button
                  variant="outline"
                  className="h-auto py-6 w-full flex items-center justify-start gap-3 hover:bg-accent/10 hover:border-accent transition-all group"
                >
                  <MapPin className="h-5 w-5 text-accent group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-medium">{county}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {filteredCounties.length === 0 && (
          <div className="text-center mt-12">
            <p className="text-muted-foreground text-lg">No regions found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Counties;
