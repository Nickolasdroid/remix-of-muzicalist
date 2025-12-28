import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MUSIC_GENRES = [
  "Pop",
  "Rock",
  "Jazz",
  "Blues",
  "Hip-Hop",
  "R&B",
  "Country",
  "Electronic",
  "Dance",
  "House",
  "Techno",
  "Classical",
  "Folk",
  "Reggae",
  "Metal",
  "Punk",
  "Soul",
  "Funk",
  "Latin",
  "Manele",
  "Muzică Populară",
  "Muzică de Petrecere",
  "Muzică Ușoară",
  "Etno",
  "Trap",
  "Disco",
];

interface MusicGenreComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function MusicGenreCombobox({ value, onChange }: MusicGenreComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const selectedGenres = value ? value.split(", ").filter(Boolean) : [];

  const handleSelect = (genre: string) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    onChange(newGenres.join(", "));
  };

  const handleAddCustom = () => {
    if (inputValue && !selectedGenres.includes(inputValue)) {
      onChange([...selectedGenres, inputValue].join(", "));
      setInputValue("");
    }
  };

  const filteredGenres = MUSIC_GENRES.filter((genre) =>
    genre.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showAddCustom =
    inputValue &&
    !MUSIC_GENRES.some((g) => g.toLowerCase() === inputValue.toLowerCase()) &&
    !selectedGenres.includes(inputValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-input border-border hover:bg-input/80 text-left font-normal"
        >
          <span className="truncate">
            {selectedGenres.length > 0
              ? selectedGenres.join(", ")
              : "Selectează genuri muzicale..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover border-border z-50" align="start">
        <Command className="bg-popover">
          <CommandInput
            placeholder="Caută sau scrie un gen..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {showAddCustom ? (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-accent/50 cursor-pointer"
                  onClick={handleAddCustom}
                >
                  Adaugă "{inputValue}"
                </button>
              ) : (
                "Niciun gen găsit."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredGenres.map((genre) => (
                <CommandItem
                  key={genre}
                  value={genre}
                  onSelect={() => handleSelect(genre)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedGenres.includes(genre) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {genre}
                </CommandItem>
              ))}
              {showAddCustom && filteredGenres.length > 0 && (
                <CommandItem
                  value={`add-${inputValue}`}
                  onSelect={handleAddCustom}
                  className="cursor-pointer border-t border-border"
                >
                  <span className="text-muted-foreground">Adaugă "</span>
                  {inputValue}
                  <span className="text-muted-foreground">"</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
