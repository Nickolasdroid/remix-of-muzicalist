import type { ReactNode } from "react";
import { Calendar } from "@/components/ui/calendar";

interface ArtistAvailabilityCalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  /** Fully booked days */
  busyDates: Date[];
  blockedDates: Date[];
  /** Days with bookings but still some free hours */
  partialDates?: Date[];
  disablePastDates?: boolean;
}

export const calendarAvailabilityStyles = {
  availableSwatch: "bg-calendar-available",
  availableDay:
    "bg-calendar-available text-calendar-available-foreground hover:bg-calendar-available hover:text-calendar-available-foreground focus:bg-calendar-available focus:text-calendar-available-foreground",
  availableToday: "bg-calendar-available/30 text-foreground",
  availableBadge:
    "bg-calendar-available text-calendar-available-foreground hover:bg-calendar-available",
  availableText: "text-calendar-available",
  availableSurface:
    "bg-calendar-available/10 text-calendar-available border-calendar-available/30",
} as const;

const legendItems = [
  { label: "Booked", swatch: "bg-destructive/70" },
  { label: "Partially booked", swatch: "bg-amber-500/80" },
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
      <div className={desktop ? "flex flex-col gap-3" : "flex flex-wrap justify-between gap-x-3 gap-y-2"}>
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
  partialDates = [],
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
        modifiers={{ busy: busyDates, partial: partialDates, blocked: blockedDates }}
        modifiersClassNames={{
          busy:
            "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground opacity-70",
          partial:
            "bg-amber-500/80 text-black hover:bg-amber-500/80 hover:text-black",
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