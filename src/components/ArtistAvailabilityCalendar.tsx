import type { ReactNode } from "react";
import { Calendar } from "@/components/ui/calendar";

interface ArtistAvailabilityCalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  busyDates: Date[];
  blockedDates: Date[];
  disablePastDates?: boolean;
}

export const calendarAvailabilityStyles = {
  availableSwatch: "bg-emerald-500",
  availableDay:
    "bg-emerald-500 text-background hover:bg-emerald-500 hover:text-background focus:bg-emerald-500 focus:text-background",
  availableToday: "bg-emerald-500/30 text-foreground",
  availableBadge: "bg-emerald-500 text-background hover:bg-emerald-500",
  availableText: "text-emerald-500",
  availableSurface: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
} as const;

const legendItems = [
  { label: "Booked", swatch: "bg-destructive/70" },
  { label: "Unavailable", swatch: "bg-muted/80" },
  { label: "Available", swatch: calendarAvailabilityStyles.availableSwatch },
];

function CalendarLegend({ desktop = false }: { desktop?: boolean }) {
  return (
    <div
      className={
        desktop
          ? "hidden lg:block w-48 shrink-0 rounded-lg bg-secondary/50 p-4"
          : "w-full rounded-lg bg-secondary/50 p-3 lg:hidden"
      }
    >
      {desktop && <h4 className="mb-3 font-semibold text-foreground">Legend</h4>}
      <div className={desktop ? "flex flex-col gap-3" : "flex justify-between gap-2"}>
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`${desktop ? "h-6 w-6" : "h-5 w-5"} shrink-0 rounded ${item.swatch}`}
            />
            <span className={`${desktop ? "text-sm" : "text-xs"} text-muted-foreground`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArtistAvailabilityCalendar({
  selected,
  onSelect,
  busyDates,
  blockedDates,
  disablePastDates = false,
}: ArtistAvailabilityCalendarProps) {
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="flex w-full shrink-0 justify-center lg:w-auto lg:justify-start">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        className="pointer-events-auto rounded-lg border border-border shadow-sm"
        classNames={{
          day_selected: calendarAvailabilityStyles.availableDay,
          day_today: calendarAvailabilityStyles.availableToday,
        }}
        modifiers={{ busy: busyDates, blocked: blockedDates }}
        modifiersClassNames={{
          busy:
            "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground opacity-70",
          blocked:
            "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground opacity-80",
        }}
        disabled={disablePastDates ? (date) => date < startOfToday : undefined}
      />
    </div>
  );
}

export function AvailabilityCalendarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 lg:grid lg:grid-cols-[auto_1fr_auto]">
      <CalendarLegend />
      {children}
      <CalendarLegend desktop />
    </div>
  );
}