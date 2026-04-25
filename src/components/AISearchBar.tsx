import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SimpleArtistCard from "@/components/SimpleArtistCard";

interface ArtistResult {
  id: string;
  stage_name: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  specialization?: string;
  country?: string;
  county?: string;
  plan?: string;
}

const AISearchBar = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [artists, setArtists] = useState<ArtistResult[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsLoading(true);
    setResponse(null);
    setArtists([]);

    try {
      const { data, error } = await supabase.functions.invoke("ai-search", {
        body: { query: query.trim() }
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

      if (data?.response) setResponse(data.response);
      if (Array.isArray(data?.artists)) setArtists(data.artists);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="border-2 border-accent/30 shadow-[var(--shadow-gold)]">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-display font-bold text-foreground">
                AI-Powered Search
              </h3>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="E.g., 'Find jazz singers in București' or 'Rock bands for wedding'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-12"
                disabled={isLoading} />
              <Button
                type="submit"
                disabled={isLoading}
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {(response || artists.length > 0) && (
            <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border space-y-4">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">Search Results</h4>
                  {response && (
                    <p className="text-sm text-muted-foreground">{response}</p>
                  )}
                </div>
              </div>

              {artists.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {artists.map((a) => (
                    <SimpleArtistCard
                      key={a.id}
                      id={a.id}
                      name={`${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()}
                      stageName={a.stage_name || `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()}
                      imageUrl={a.avatar_url}
                      isPremium={a.plan !== "Free"}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>);

};

export default AISearchBar;
