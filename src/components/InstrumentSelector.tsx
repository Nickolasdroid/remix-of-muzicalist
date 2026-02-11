import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, X, Search, Music2 } from "lucide-react";
import { getInstrumentIcon } from "@/lib/instrumentIcons";

const INSTRUMENTS = [
  // Strings
  "Acoustic Guitar", "Electric Guitar", "Bass Guitar", "Classical Guitar", "Violin", "Viola", "Cello", "Double Bass", "Harp", "Ukulele", "Banjo", "Mandolin", "Balalaika", "Sitar", "Oud",
  // Keyboard
  "Piano", "Keyboard", "Synthesizer", "Organ", "Accordion", "Harpsichord", "Electric Piano",
  // Wind - Woodwind
  "Flute", "Clarinet", "Saxophone", "Oboe", "Bassoon", "Recorder", "Piccolo", "Pan Flute", "Harmonica",
  // Wind - Brass
  "Trumpet", "Trombone", "French Horn", "Tuba", "Cornet", "Euphonium", "Flugelhorn",
  // Percussion
  "Drums", "Percussion", "Cajon", "Congas", "Bongos", "Djembe", "Timpani", "Marimba", "Xylophone", "Vibraphone", "Tambourine", "Triangle",
  // Electronic
  "DJ Equipment", "Turntables", "Drum Machine", "Sampler", "MIDI Controller",
  // Traditional/Folk
  "Bagpipes", "Didgeridoo", "Tabla", "Nai", "Cimbalom", "Cobza", "Țambal"
].sort();

interface InstrumentSelectorProps {
  instruments: string;
  onInstrumentsChange: (instruments: string) => void;
  readOnly?: boolean;
}

const InstrumentSelector = ({ instruments, onInstrumentsChange, readOnly = false }: InstrumentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Only use first instrument (single selection)
  const selectedInstrument = instruments ? instruments.split(',')[0].trim() : "";

  const filteredInstruments = INSTRUMENTS.filter(
    instrument => 
      instrument.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectInstrument = (instrument: string) => {
    onInstrumentsChange(instrument);
    setOpen(false);
    setSearchQuery("");
  };

  const handleRemoveInstrument = () => {
    onInstrumentsChange("");
  };

  const handleAddCustom = () => {
    if (searchQuery.trim()) {
      handleSelectInstrument(searchQuery.trim());
    }
  };

  const SelectedIcon = selectedInstrument ? getInstrumentIcon(selectedInstrument) : Music2;

  if (readOnly) {
    return selectedInstrument ? (
      <Badge className="bg-muted/50 text-muted-foreground border border-accent/30 px-4 py-1.5 text-base font-medium">
        <SelectedIcon className="h-4 w-4 mr-1.5" />
        {selectedInstrument}
      </Badge>
    ) : null;
  }

  return (
    <div className="flex items-center gap-2">
      {selectedInstrument ? (
        <Badge 
          className="bg-muted/50 text-muted-foreground border border-accent/30 px-4 py-1.5 text-base font-medium cursor-pointer hover:border-accent/50 transition-colors group"
          onClick={handleRemoveInstrument}
        >
          <SelectedIcon className="h-4 w-4 mr-1.5" />
          {selectedInstrument}
          <X className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Badge>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 border-accent/30 text-muted-foreground hover:bg-accent/10 hover:text-accent hover:border-accent/50">
              <Plus className="h-4 w-4" />
              Add Instrument
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Music2 className="h-5 w-5 text-accent" />
                Select Your Instrument
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search or add custom instrument..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom();
                    }
                  }}
                />
              </div>

              {searchQuery && !INSTRUMENTS.some(i => i.toLowerCase() === searchQuery.toLowerCase()) && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 border-dashed"
                  onClick={handleAddCustom}
                >
                  <Plus className="h-4 w-4" />
                  Add "{searchQuery}" as custom instrument
                </Button>
              )}

              <ScrollArea className="h-64">
                <div className="grid grid-cols-2 gap-2">
                  {filteredInstruments.map(instrument => {
                    const ItemIcon = getInstrumentIcon(instrument);
                    return (
                      <Button
                        key={instrument}
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto py-2 px-3"
                        onClick={() => handleSelectInstrument(instrument)}
                      >
                        <ItemIcon className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{instrument}</span>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InstrumentSelector;
