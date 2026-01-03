import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

// Generate time options in 10-minute intervals
const generateTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      options.push(`${h}:${m}`);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

const TimeSelector = ({ value, onChange, placeholder = "Select time", id }: TimeSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {timeOptions.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TimeSelector;
