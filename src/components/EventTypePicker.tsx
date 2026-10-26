import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMON_EVENT_TYPES, EVENT_TYPES, isKnownEventType } from "@/lib/eventTypes";

const OTHER_EVENT_TYPES = EVENT_TYPES.filter(
  (t) => t !== "Other" && !(COMMON_EVENT_TYPES as readonly string[]).includes(t),
);

interface EventTypePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}

/** Event type from the shared list ("Most booked" first), or a short description for "Other". */
const EventTypePicker = ({ id, value, onChange }: EventTypePickerProps) => {
  const [other, setOther] = useState(!!value && !isKnownEventType(value));
  const selected = other ? "Other" : value || undefined;

  return (
    <div className="space-y-2">
      <Select
        value={selected}
        onValueChange={(v) => {
          if (v === "Other") {
            setOther(true);
            onChange("");
          } else {
            setOther(false);
            onChange(v);
          }
        }}
      >
        <SelectTrigger id={id} className="h-10 rounded-lg">
          <SelectValue placeholder="Choose the type of event" />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <SelectGroup>
            <SelectLabel className="text-xs font-normal text-muted-foreground">Most booked</SelectLabel>
            {COMMON_EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel className="text-xs font-normal text-muted-foreground">All event types</SelectLabel>
            {OTHER_EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
            <SelectItem value="Other">Other</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      {other && (
        <Input
          autoFocus
          maxLength={80}
          placeholder="Describe the event (e.g. Company anniversary)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 rounded-lg"
        />
      )}
    </div>
  );
};

export default EventTypePicker;
