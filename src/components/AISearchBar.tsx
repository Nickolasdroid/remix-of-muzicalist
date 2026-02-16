import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AISearchBar = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsLoading(true);
    setResponse(null);

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

      if (data?.response) {
        setResponse(data.response);
      } else {
        toast.error("No results found. Please try a different search.");
      }
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

          {response &&
          <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-2">Search Results</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {response}
                  </div>
                </div>
              </div>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

};

export default AISearchBar;