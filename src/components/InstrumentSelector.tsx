import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, X, Search, Music2 } from "lucide-react";

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

  const selectedInstruments = instruments ? instruments.split(',').map(i => i.trim()).filter(i => i) : [];

  const filteredInstruments = INSTRUMENTS.filter(
    instrument => 
      instrument.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedInstruments.includes(instrument)
  );

  const handleAddInstrument = (instrument: string) => {
    const newInstruments = [...selectedInstruments, instrument];
    onInstrumentsChange(newInstruments.join(', '));
  };

  const handleRemoveInstrument = (instrument: string) => {
    const newInstruments = selectedInstruments.filter(i => i !== instrument);
    onInstrumentsChange(newInstruments.join(', '));
  };

  const handleAddCustom = () => {
    if (searchQuery.trim() && !selectedInstruments.includes(searchQuery.trim())) {
      handleAddInstrument(searchQuery.trim());
      setSearchQuery("");
    }
  };

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-2">
        {selectedInstruments.length > 0 ? (
          selectedInstruments.map(instrument => (
            <Badge 
              key={instrument} 
              variant="outline" 
              className="border-accent/50 text-accent px-3 py-1"
            >
              <Music2 className="h-3 w-3 mr-1" />
              {instrument}
            </Badge>
          ))
        ) : (
          <p className="text-muted-foreground">No instruments specified</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedInstruments.map(instrument => (
        <Badge 
          key={instrument} 
          variant="default" 
          className="bg-accent text-accent-foreground px-3 py-1 cursor-pointer hover:bg-accent/80"
          onClick={() => handleRemoveInstrument(instrument)}
        >
          <Music2 className="h-3 w-3 mr-1" />
          {instrument}
          <X className="h-3 w-3 ml-1" />
        </Badge>
      ))}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            <Plus className="h-4 w-4" />
            Add Instrument
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music2 className="h-5 w-5 text-accent" />
              Select Instruments
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
                {filteredInstruments.map(instrument => (
                  <Button
                    key={instrument}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-2 px-3"
                    onClick={() => {
                      handleAddInstrument(instrument);
                      setSearchQuery("");
                    }}
                  >
                    <Music2 className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{instrument}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstrumentSelector;
