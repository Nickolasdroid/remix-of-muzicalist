import {
  Guitar,
  Piano,
  Drum,
  Drumstick,
  Mic,
  MicVocal,
  KeyboardMusic,
  Music2,
  Music,
  Wind,
  type LucideIcon,
} from "lucide-react";

const instrumentIconMap: Record<string, LucideIcon> = {
  // Strings
  "acoustic guitar": Guitar,
  "electric guitar": Guitar,
  "bass guitar": Guitar,
  "classical guitar": Guitar,
  "ukulele": Guitar,
  "banjo": Guitar,
  "mandolin": Guitar,
  "balalaika": Guitar,
  "sitar": Guitar,
  "oud": Guitar,
  // Bowed strings
  "violin": Music,
  "viola": Music,
  "cello": Music,
  "double bass": Music,
  "harp": Music,
  // Keyboard
  "piano": Piano,
  "keyboard": KeyboardMusic,
  "synthesizer": KeyboardMusic,
  "organ": KeyboardMusic,
  "accordion": KeyboardMusic,
  "harpsichord": Piano,
  "electric piano": Piano,
  // Woodwind
  "flute": Wind,
  "clarinet": Wind,
  "saxophone": Wind,
  "oboe": Wind,
  "bassoon": Wind,
  "recorder": Wind,
  "piccolo": Wind,
  "pan flute": Wind,
  "harmonica": Wind,
  // Brass
  "trumpet": Wind,
  "trombone": Wind,
  "french horn": Wind,
  "tuba": Wind,
  "cornet": Wind,
  "euphonium": Wind,
  "flugelhorn": Wind,
  // Percussion
  "drums": Drum,
  "percussion": Drumstick,
  "cajon": Drum,
  "congas": Drum,
  "bongos": Drum,
  "djembe": Drum,
  "timpani": Drum,
  "marimba": Drumstick,
  "xylophone": Drumstick,
  "vibraphone": Drumstick,
  "tambourine": Drumstick,
  "triangle": Drumstick,
  // Electronic
  "dj equipment": Music2,
  "turntables": Music2,
  "drum machine": Drum,
  "sampler": Music2,
  "midi controller": KeyboardMusic,
  // Traditional/Folk
  "bagpipes": Wind,
  "didgeridoo": Wind,
  "tabla": Drum,
  "nai": Wind,
  "cimbalom": Drumstick,
  "cobza": Guitar,
  "țambal": Drumstick,
  // Vocal
  "vocals": MicVocal,
  "voice": MicVocal,
  "singing": Mic,
};

export function getInstrumentIcon(instrument: string): LucideIcon {
  return instrumentIconMap[instrument.toLowerCase().trim()] || Music2;
}
