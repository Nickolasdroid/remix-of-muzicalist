import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const ArtistSearchBar = () => {
  const [priceRange, setPriceRange] = useState([0, 10000]);

  const categories = ["Singer", "Instrumentalist", "DJ", "Band"];
  const counties = [
    "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", 
    "Brașov", "Brăila", "Buzău", "Caraș-Severin", "Călărași", "Cluj", "Constanța",
    "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", "Gorj", "Harghita",
    "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș",
    "Neamț", "Olt", "Prahova", "Satu Mare", "Sălaj", "Sibiu", "Suceava",
    "Teleorman", "Timiș", "Tulcea", "Vaslui", "Vâlcea", "Vrancea", "București"
  ];
  const genres = [
    "Pop", "Rock", "Jazz", "Classical", "Electronic", "Hip Hop", "Folk", 
    "R&B", "Country", "Reggae", "Blues", "Metal"
  ];
  const experienceLevels = ["Beginner", "Intermediate", "Advanced"];

  return (
    <div className="bg-card rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border-2 border-border shadow-[var(--shadow-elegant)]">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <Search className="h-5 w-5 md:h-6 md:w-6 text-accent" />
        <h3 className="text-xl md:text-2xl font-display font-bold text-foreground">
          Search Artists
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat.toLowerCase()}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* County */}
        <div className="space-y-2">
          <Label htmlFor="county">County</Label>
          <Select>
            <SelectTrigger id="county">
              <SelectValue placeholder="Select county" />
            </SelectTrigger>
            <SelectContent>
              {counties.map((county) => (
                <SelectItem key={county} value={county.toLowerCase()}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Musical Genre */}
        <div className="space-y-2">
          <Label htmlFor="genre">Musical Genre</Label>
          <Select>
            <SelectTrigger id="genre">
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              {genres.map((genre) => (
                <SelectItem key={genre} value={genre.toLowerCase()}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <Label htmlFor="experience">Experience</Label>
          <Select>
            <SelectTrigger id="experience">
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              {experienceLevels.map((level) => (
                <SelectItem key={level} value={level.toLowerCase()}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter age"
            min="18"
            max="100"
          />
        </div>

        {/* Number of Reviews */}
        <div className="space-y-2">
          <Label htmlFor="reviews">Minimum Reviews</Label>
          <Input
            id="reviews"
            type="number"
            placeholder="Min. reviews"
            min="0"
          />
        </div>

        {/* Accumulated Events */}
        <div className="space-y-2">
          <Label htmlFor="events">Minimum Events</Label>
          <Input
            id="events"
            type="number"
            placeholder="Min. events"
            min="0"
          />
        </div>

        {/* Price Range */}
        <div className="space-y-4 sm:col-span-2 lg:col-span-2">
          <Label>Price Range (RON)</Label>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
            <Input
              type="number"
              placeholder="From"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
              className="w-full sm:w-32"
            />
            <span className="text-muted-foreground hidden sm:block">-</span>
            <Input
              type="number"
              placeholder="To"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
              className="w-full sm:w-32"
            />
          </div>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={10000}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{priceRange[0]} RON</span>
            <span>{priceRange[1]} RON</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-6 md:mt-8">
        <Button 
          size="lg"
          className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 px-8 md:px-12"
        >
          <Search className="mr-2 h-5 w-5" />
          Search Artists
        </Button>
      </div>
    </div>
  );
};

export default ArtistSearchBar;