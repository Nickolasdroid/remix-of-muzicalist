import { useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, User, Sparkles, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import Navigation from "@/components/Navigation";
import AISearchBar from "@/components/AISearchBar";
import ArtistSearchBar from "@/components/ArtistSearchBar";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    // First get artist user IDs from user_roles
    const { data: artistRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('user_type', 'artist');

    if (rolesError) {
      console.error('Error fetching artist roles:', rolesError);
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const artistIds = artistRoles?.map(r => r.user_id) || [];

    if (artistIds.length === 0) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, stage_name, avatar_url, specialization, county, music_genres')
      .in('id', artistIds)
      .ilike('stage_name', `%${query.trim()}%`)
      .limit(10);

    if (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } else {
      setSuggestions(data || []);
    }
    
    setIsLoading(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    const debounceTimeout = setTimeout(() => fetchSuggestions(value), 300);
    return () => clearTimeout(debounceTimeout);
  };

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

  const ProSearchContent = () => (
    <div className="p-4">
      <ArtistSearchBar />
    </div>
  );

  const AISearchContent = () => (
    <div className="p-2 md:p-0">
      <AISearchBar />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Main content */}
      <main className="pt-14 pb-20 md:pt-16 md:pb-8 md:pl-64">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
          {/* Search Type Buttons */}
          <div className="flex gap-2 mb-4">
            {/* Pro Search Button */}
            {isMobile ? (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 border-accent/50 text-accent hover:bg-accent/10"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Pro Search
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <ProSearchContent />
                </DrawerContent>
              </Drawer>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 border-accent/50 text-accent hover:bg-accent/10"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Pro Search
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                  <ProSearchContent />
                </DialogContent>
              </Dialog>
            )}


            {/* AI Search Button */}
            {isMobile ? (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Search
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <AISearchContent />
                </DrawerContent>
              </Drawer>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Search
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                  <AISearchContent />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Type artist name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-12 h-12 text-base rounded-xl border-2 border-border focus:border-border focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
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
    </div>
  );
};

export default Search;
