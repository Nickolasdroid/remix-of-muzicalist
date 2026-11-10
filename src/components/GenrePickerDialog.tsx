import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { genreLabel } from "@/lib/genreLabel";

interface GenrePickerDialogProps {
  availableGenres: string[];
  onSelect: (genre: string) => void;
  isAtLimit?: boolean;
}

export default function GenrePickerDialog({ availableGenres, onSelect, isAtLimit }: GenrePickerDialogProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = availableGenres.filter(g =>
    g.toLowerCase().includes(search.toLowerCase()) ||
    genreLabel(g).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Badge variant="outline" className="h-8 cursor-pointer rounded-full border border-foreground/25 bg-transparent px-3.5 text-sm font-medium text-foreground transition-colors hover:border-foreground">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Show all ({availableGenres.length})
        </Badge>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Music Genres</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search genres..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 rounded-full border-0 bg-foreground/[0.07] pl-9 focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:ring-offset-0"
          />
        </div>
        <ScrollArea className="h-[300px] pr-2">
          <div className="flex flex-wrap gap-2 py-1">
            {filtered.map(genre => (
              <Badge
                key={genre}
                variant="outline"
                className={cn(
                  "h-8 rounded-full border-0 bg-foreground/[0.07] px-3.5 text-sm font-normal text-foreground transition-colors",
                  isAtLimit ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-foreground/[0.12]"
                )}
                onClick={() => {
                  if (!isAtLimit) onSelect(genre);
                }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {genreLabel(genre)}
              </Badge>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 w-full text-center">No genres found</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
