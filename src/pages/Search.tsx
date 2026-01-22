import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, User, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AISearchBar from "@/components/AISearchBar";
import { supabase } from "@/integrations/supabase/client";

interface ArtistProfile {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  specialization: string | null;
  county: string;
  music_genres: string | null;
}

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ArtistProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, specialization, county, music_genres')
        .ilike('stage_name', `%${searchQuery.trim()}%`)
        .limit(10);

      if (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } else {
        setSuggestions(data || []);
      }
      
      setIsLoading(false);
    };

    const debounceTimeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const getSpecializationLabel = (spec: string | null) => {
    if (!spec) return '';
    const labels: Record<string, string> = {
      singer: 'Singer',
      instrumentalist: 'Instrumentalist',
      dj: 'DJ',
      band: 'Band',
    };
    return labels[spec] || spec;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Main content */}
      <main className="pt-14 pb-20 md:pt-16 md:pb-8 md:pl-64">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Search Input */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Type artist name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-12 text-base rounded-xl border-2 border-border focus:border-accent"
              autoFocus
            />
            <Dialog>
              <DialogTrigger asChild>
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg hover:bg-accent/10 transition-colors">
                  <Sparkles className="h-5 w-5 text-accent" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <AISearchBar />
              </DialogContent>
            </Dialog>
          </div>

          {/* Suggestions List */}
          <div className="space-y-2">
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Searching...
              </div>
            )}
            
            {!isLoading && searchQuery.trim().length >= 2 && suggestions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No artists found matching "{searchQuery}"
              </div>
            )}

            {!isLoading && suggestions.map((artist) => (
              <Link
                key={artist.id}
                to={`/artist/${artist.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent/50 hover:bg-accent/5 transition-all"
              >
                <Avatar className="h-12 w-12 border-2 border-border">
                  <AvatarImage src={artist.avatar_url || undefined} alt={artist.stage_name} />
                  <AvatarFallback className="bg-accent/10 text-accent">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {artist.stage_name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {artist.specialization && (
                      <span>{getSpecializationLabel(artist.specialization)}</span>
                    )}
                    {artist.specialization && artist.county && (
                      <span>•</span>
                    )}
                    {artist.county && (
                      <span>{artist.county}</span>
                    )}
                  </div>
                  {artist.music_genres && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {artist.music_genres}
                    </p>
                  )}
                </div>
              </Link>
            ))}

            {!isLoading && searchQuery.trim().length < 2 && (
              <div className="text-center py-12 text-muted-foreground">
                <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Start typing to search for artists</p>
                <p className="text-sm mt-1">Minimum 2 characters required</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="hidden md:block md:pl-64">
        <Footer />
      </div>
    </div>
  );
};

export default Search;
