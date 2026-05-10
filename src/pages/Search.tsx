import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search as SearchIcon, User, Sparkles, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { getCountryName } from "@/lib/countryFlags";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { sortByPlanPriority } from "@/lib/planLimits";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface ArtistProfile {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  specialization: string | null;
  country: string | null;
  county: string;
  music_genres: string | null;
}

const Search = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ArtistProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiArtists, setAiArtists] = useState<any[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setIsAuthChecked(true);
    };
    checkAuth();
  }, [navigate]);

  if (!isAuthChecked) {
    return null;
  }

  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, stage_name, avatar_url, specialization, country, county, music_genres, plan')
      .not('specialization', 'is', null)
      .ilike('stage_name', `%${query.trim()}%`)
      .limit(10);

    if (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } else {
      const sorted = [...(data || [])].sort((a, b) => sortByPlanPriority(a, b));
      setSuggestions(sorted);
    }
    setIsLoading(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (!isAIMode) {
      const debounceTimeout = setTimeout(() => fetchSuggestions(value), 300);
      return () => clearTimeout(debounceTimeout);
    }
  };

  const handleAISearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsAILoading(true);
    setAiResponse(null);
    setAiArtists([]);

    try {
      const { data, error } = await supabase.functions.invoke("ai-search", {
        body: { query: searchQuery.trim() }
      });

      if (error) {
        console.error("Search error:", error);
        if (error.message.includes("429")) {
          toast.error("Too many requests. Please try again later.");
        } else if (error.message.includes("402")) {
          toast.error("Service temporarily unavailable. Please contact support.");
        } else {
          toast.error("Failed to process search. Please try again.");
        }
        return;
      }

      if (data?.response) setAiResponse(data.response);
      if (Array.isArray(data?.artists)) setAiArtists(data.artists);
      if (!data?.response && !(Array.isArray(data?.artists) && data.artists.length)) {
        toast.error("No results found. Please try a different search.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAIMode) {
      handleAISearch();
    }
  };

  const toggleAIMode = () => {
    setIsAIMode((prev) => !prev);
    setSearchQuery("");
    setSuggestions([]);
    setAiResponse(null);
    setAiArtists([]);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation hideMobileHeader={true} />

      {/* Mobile: Custom search header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background md:hidden">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 h-16 px-3">
            <button
              type="button"
              onClick={() => {
                setIsFocused(false);
                setSearchQuery("");
                setSuggestions([]);
                inputRef.current?.blur();
                navigate(-1);
              }}
              className="flex-shrink-0 h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center text-foreground hover:bg-zinc-800 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                type="search"
                placeholder={isAIMode ? "AI Search..." : "Search artists..."}
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsFocused(true)}
                className={`pl-10 ${isAIMode && searchQuery.trim() ? "pr-12" : "pr-3"} h-10 w-full text-base rounded-2xl border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-zinc-900 text-white`}
                disabled={isAILoading}
              />
              {isAIMode && searchQuery.trim() && (
                <Button
                  type="submit"
                  disabled={isAILoading}
                  size="icon"
                  variant="ghost"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {isAILoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
      
      <main className="pt-16 pb-20 md:pt-2 md:pb-8 md:pl-64">
        <div className="max-w-2xl mx-auto py-2 md:py-8 px-0">
          {/* Desktop Search Input */}
          {!isMobile && (
          <form onSubmit={handleSubmit}>
            <div className="relative mb-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder={isAIMode
                  ? "E.g., 'Jazz singers in București' or 'Rock bands for wedding'"
                  : "Type artist name..."}
                value={searchQuery}
                onChange={handleSearchChange}
                className={`pl-12 ${isAIMode && searchQuery.trim() ? "pr-14" : "pr-4"} h-14 w-full text-base rounded-2xl border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-zinc-900 text-white`}
                disabled={isAILoading}
              />
              {isAIMode && searchQuery.trim() && (
                <Button
                  type="submit"
                  disabled={isAILoading}
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {isAILoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </form>
          )}

          {/* AI Toggle */}
          <button
            onClick={toggleAIMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all mb-4 ${
              isAIMode
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Search {isAIMode ? "ON" : "OFF"}
          </button>

          {/* AI Response */}
          {isAIMode && (aiResponse || aiArtists.length > 0) && (
            <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border space-y-4">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-2">Search Results</h4>
                  {aiResponse && (
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {aiResponse}
                    </div>
                  )}
                </div>
              </div>

              {aiArtists.length > 0 && (
                <div className="space-y-2">
                  {aiArtists.map((artist: any) => (
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
                          {artist.stage_name || `${artist.first_name ?? ""} ${artist.last_name ?? ""}`.trim()}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {artist.specialization && (
                            <span>{getSpecializationLabel(artist.specialization)}</span>
                          )}
                          {artist.specialization && artist.country && <span>•</span>}
                          {artist.country && <span>{getCountryName(artist.country)}</span>}
                          {artist.country && artist.county && <span>•</span>}
                          {artist.county && <span>{artist.county}</span>}
                        </div>
                        {artist.music_genres && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {artist.music_genres}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Classic Suggestions */}
          {!isAIMode && (
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
                      {artist.specialization && artist.country && <span>•</span>}
                      {artist.country && <span>{getCountryName(artist.country)}</span>}
                      {artist.country && artist.county && <span>•</span>}
                      {artist.county && <span>{artist.county}</span>}
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
          )}

          {/* AI mode empty state */}
          {isAIMode && !aiResponse && aiArtists.length === 0 && !isAILoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Ask anything about artists or events</p>
              <p className="text-sm mt-1">Our AI will help you find exactly what you need</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Search;
