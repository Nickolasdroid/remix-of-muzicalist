import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search } from "lucide-react";

interface GenrePickerDialogProps {
  availableGenres: string[];
  onSelect: (genre: string) => void;
  isAtLimit?: boolean;
}

export default function GenrePickerDialog({ availableGenres, onSelect, isAtLimit }: GenrePickerDialogProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = availableGenres.filter(g =>
    g.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Badge variant="outline" className="border-accent/50 text-accent px-3 py-1 cursor-pointer hover:bg-accent/10 transition-colors">
          <Plus className="h-3 w-3 mr-1" />
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
            className="pl-9"
          />
        </div>
        <ScrollArea className="h-[300px] pr-2">
          <div className="flex flex-wrap gap-2 py-1">
            {filtered.map(genre => (
              <Badge
                key={genre}
                variant="outline"
                className="border-muted-foreground/30 text-muted-foreground px-3 py-1 cursor-pointer hover:border-accent hover:text-accent transition-colors"
                onClick={() => {
                  onSelect(genre);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                {genre}
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
