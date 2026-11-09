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

// Free days have no color (same as the booking page); the selected day is white
const legendItems = [
  { label: "Partially booked", swatch: "bg-orange-600/80" },
  { label: "Booked", swatch: "bg-destructive/70" },
  { label: "Unavailable", swatch: "bg-[#535353]" },
];

function CalendarLegend({ desktop = false }: { desktop?: boolean }) {
  return (
    <div
      className={
        desktop
          ? "hidden lg:block w-48 shrink-0 rounded-lg bg-card p-4"
          : "w-full lg:hidden"
      }
    >
      {desktop && <h4 className="mb-3 font-semibold text-foreground">Legend</h4>}
      {/* Phones: one compact row under the calendar */}
      <div className={desktop ? "flex flex-col gap-3" : "flex flex-wrap justify-center gap-x-4 gap-y-2"}>
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`${desktop ? "h-5 w-5" : "h-3 w-3"} shrink-0 rounded-full ${item.swatch}`}
            />
            <span className={`${desktop ? "text-sm" : "text-xs"} text-muted-foreground`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <p className={`${desktop ? "mt-3 text-xs" : "mt-2 text-center text-xs"} text-muted-foreground/80`}>Days without a color are free.</p>
    </div>
  );
}

/** Legend for the small calendars in the profile side panel: one compact row. */
export function CompactCalendarLegend() {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-full ${item.swatch}`} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/80">Days without a color are free.</p>
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
    <div className="flex w-full shrink-0 flex-col items-center gap-3 lg:w-auto lg:items-start">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        className="pointer-events-auto rounded-lg bg-card"
        classNames={{
          // Same as the booking page: selected day white, today only underlined
          day_selected:
            "bg-foreground text-background font-semibold hover:bg-foreground hover:text-background focus:bg-foreground focus:text-background",
          day_today: "font-bold underline decoration-foreground/70 decoration-2 underline-offset-4",
        }}
        modifiers={{ busy: busyDates, partial: partialDates, blocked: blockedDates }}
        modifiersClassNames={{
          busy:
            "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground opacity-70",
          partial:
            "bg-orange-600/80 text-white hover:bg-orange-600/80 hover:text-white",
          blocked:
            "bg-[#535353] text-foreground/80 hover:bg-[#535353] hover:text-foreground/80",
        }}
        disabled={disablePastDates ? (date) => date < startOfToday : undefined}
      />
      <CalendarLegend />
    </div>
  );
}

export function AvailabilityCalendarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 lg:grid lg:grid-cols-[auto_1fr_auto]">
      {children}
      <CalendarLegend desktop />
    </div>
  );
}