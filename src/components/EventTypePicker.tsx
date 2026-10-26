import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
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
  /** Row look: icon and small label above the value */
  icon?: ReactNode;
  label?: string;
  triggerClassName?: string;
  otherInputClassName?: string;
}

/** Event type from the shared list ("Most booked" first), or a short description for "Other". */
const EventTypePicker = ({ id, value, onChange, icon, label, triggerClassName, otherInputClassName }: EventTypePickerProps) => {
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
        <SelectTrigger id={id} className={cn("h-10 rounded-lg", triggerClassName)}>
          {icon ? (
            <span className="flex min-w-0 items-center gap-3 text-left">
              {icon}
              <span className="min-w-0">
                {label && <span className="block text-[11.5px] leading-tight text-muted-foreground">{label}</span>}
                <span className="block truncate text-[14.5px] font-medium">
                  <SelectValue placeholder="Choose the type of event" />
                </span>
              </span>
            </span>
          ) : (
            <SelectValue placeholder="Choose the type of event" />
          )}
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
          className={cn("h-10 rounded-lg", otherInputClassName)}
        />
      )}
    </div>
  );
};

export default EventTypePicker;
