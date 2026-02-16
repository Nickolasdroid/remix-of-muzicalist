import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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
  "Traditional",
  "Party Music",
  "Easy Listening",
  "Ethno",
  "Trap",
  "Disco",
  "Afrobeat",
  "Amapiano",
  "Bachata",
  "Baile Funk",
  "Bhangra",
  "Bolero",
  "Bossa Nova",
  "Cajun",
  "Calypso",
  "Celtic",
  "Chanson",
  "Cumbia",
  "Dancehall",
  "Drill",
  "Drum and Bass",
  "Dub",
  "Dubstep",
  "EDM",
  "Fado",
  "Flamenco",
  "Garage",
  "Gospel",
  "Grime",
  "Grunge",
  "Highlife",
  "Indie",
  "J-Pop",
  "K-Pop",
  "Klezmer",
  "Kizomba",
  "Kompa",
  "Lo-fi",
  "Mariachi",
  "Merengue",
  "Motown",
  "New Wave",
  "Opera",
  "Polka",
  "Progressive Rock",
  "Qawwali",
  "Ranchera",
  "Reggaeton",
  "Rumba",
  "Salsa",
  "Samba",
  "Schlager",
  "Semba",
  "Ska",
  "Soca",
  "Synthwave",
  "Tango",
  "Trance",
  "Turbo-Folk",
  "Vallenato",
  "Zouk",
];

interface MusicGenreComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function MusicGenreCombobox({ value, onChange }: MusicGenreComboboxProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const selectedGenres = value ? value.split(", ").filter(Boolean) : [];

  const handleSelect = (genre: string) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    onChange(newGenres.join(", "));
  };

  const handleRemove = (genre: string) => {
    const newGenres = selectedGenres.filter((g) => g !== genre);
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
    <div className="space-y-2">
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
                ? t("musicGenres.genresSelected", { count: selectedGenres.length })
                : t("artistRegistration.placeholders.selectGenres")}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-popover border-border z-50" align="start">
          <Command className="bg-popover">
            <CommandInput
              placeholder={t("artistRegistration.placeholders.searchGenres")}
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
                    {t("musicGenres.addGenre", { genre: inputValue })}
                  </button>
                ) : (
                  t("musicGenres.noGenreFound")
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
                    <span className="text-muted-foreground">{t("musicGenres.addGenre", { genre: inputValue }).split(`"${inputValue}"`)[0]}"</span>
                    {inputValue}
                    <span className="text-muted-foreground">"</span>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedGenres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedGenres.map((genre) => (
            <Badge
              key={genre}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {genre}
              <button
                type="button"
                onClick={() => handleRemove(genre)}
                className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
