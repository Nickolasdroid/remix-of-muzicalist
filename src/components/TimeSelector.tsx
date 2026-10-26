import { useEffect, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  triggerClassName?: string;
}

// Half-hour steps: 48 options instead of 144, easy to scroll on a phone
const generateTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
      options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

/** Where the list opens when nothing is chosen yet: most events start in the evening */
const OPEN_AT = "18:00";

const TimeSelector = ({ value, onChange, placeholder = "Select time", id, triggerClassName }: TimeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Times saved earlier with other minutes (e.g. 19:50) still show as chosen
  const options = value && !timeOptions.includes(value) ? [...timeOptions, value].sort() : timeOptions;

  useEffect(() => {
    if (!open || value) return;
    const t = window.setTimeout(() => {
      contentRef.current?.querySelector(`[data-time="${OPEN_AT}"]`)?.scrollIntoView({ block: "center" });
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, value]);

  return (
    <Select value={value} onValueChange={onChange} open={open} onOpenChange={setOpen}>
      <SelectTrigger id={id} className={triggerClassName ?? "w-full"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent ref={contentRef} className="max-h-60">
        {options.map((time) => (
          <SelectItem key={time} value={time} data-time={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TimeSelector;
