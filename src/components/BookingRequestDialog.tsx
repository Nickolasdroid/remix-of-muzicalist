import { useState } from "react";
import { AlertCircle, CalendarDays, CalendarRange, Clock, Info, Loader2, Moon, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import TimeSelector from "@/components/TimeSelector";

export interface BookingRequestForm {
  name: string;
  email: string;
  phone: string;
  startTime: string;
  endTime: string;
  endDate: Date | null;
  eventType: string;
  message: string;
}

export type AvailabilityTone = "green" | "amber" | "red" | "muted";

interface BookingRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | undefined;
  artistName: string;
  artistAvatarUrl?: string | null;
  availability: { label: string; tone: AvailabilityTone };
  /** Time intervals are a plan feature of the artist */
  allowTimes: boolean;
  form: BookingRequestForm;
  setForm: (f: BookingRequestForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  /** Hours already booked on this day (shown, and checked live against the chosen time) */
  busySlots?: { startTime: string; endTime: string }[];
}

const toneClass: Record<AvailabilityTone, string> = {
  green: "bg-emerald-500/15 text-emerald-400",
  amber: "bg-amber-500/15 text-amber-400",
  red: "bg-destructive/15 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

/** Suggestions shown under the event type field (English keys, shown translated). */
const QUICK_EVENT_TYPES = ["Wedding", "Baptism", "18th Birthday", "Birthday Party", "Corporate Event", "Private Party"];

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** "23:59" is how "until midnight" is stored; show it as 00:00. */
const showTime = (t: string) => (t === "23:59" ? "00:00" : t);

/** Do two intervals on the same day overlap? An end at or before the start runs past midnight. */
export const timeSlotsOverlap = (start1: string, end1: string, start2: string, end2: string) => {
  const s1 = toMinutes(start1);
  let e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  let e2 = toMinutes(end2);
  if (e1 <= s1) e1 += 24 * 60;
  if (e2 <= s2) e2 += 24 * 60;
  return s1 < e2 && e1 > s2;
};

/** The booked slot the requested time clashes with on the selected day, if any. */
export const findSlotClash = (
  date: Date,
  form: Pick<BookingRequestForm, "startTime" | "endTime" | "endDate">,
  busySlots: { startTime: string; endTime: string }[]
) => {
  if (!form.startTime || !form.endTime || busySlots.length === 0) return null;
  const sameDay = resolveBookingEndDate(date, form).toDateString() === date.toDateString();
  // Only the part of the request that falls on this day can clash with this day's bookings
  const end = sameDay ? form.endTime : "23:59";
  return busySlots.find((s) => timeSlotsOverlap(form.startTime, end, s.startTime, s.endTime)) || null;
};

/** The day the event ends: the chosen end date, or the next day when it runs past midnight. */
export const resolveBookingEndDate = (date: Date, form: Pick<BookingRequestForm, "startTime" | "endTime" | "endDate">) => {
  if (form.endDate && form.endDate.toDateString() !== date.toDateString()) return form.endDate;
  if (form.startTime && form.endTime && toMinutes(form.endTime) <= toMinutes(form.startTime)) {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return next;
  }
  return date;
};

/**
 * Booking request form opened from an artist's calendar. Same visual language as the
 * booking details dialog: artist header, date card, then the few fields that matter.
 */
const BookingRequestDialog = ({
  open,
  onOpenChange,
  date,
  artistName,
  artistAvatarUrl,
  availability,
  allowTimes,
  form,
  setForm,
  onSubmit,
  submitting = false,
  busySlots = [],
}: BookingRequestDialogProps) => {
  const [multiDayOpen, setMultiDayOpen] = useState(false);
  const [pickedType, setPickedType] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const lang = i18n.language || i18n.resolvedLanguage || "ro";
  const locale = lang.startsWith("ro") ? "ro-RO" : "en-GB";

  if (!date) return null;

  const longDate = (() => {
    const s = date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();
  const shortDate = (d: Date) => d.toLocaleDateString(locale, { day: "numeric", month: "short" });

  const end = resolveBookingEndDate(date, form);
  const multiDay = !!form.endDate && form.endDate.toDateString() !== date.toDateString();
  const overnight = !multiDay && end.toDateString() !== date.toDateString();
  const timesIncomplete = allowTimes && (!!form.startTime !== !!form.endTime);
  const clash = allowTimes ? findSlotClash(date, form, busySlots) : null;
  const sortedBusy = [...busySlots].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px] w-[calc(100%-1.5rem)] p-0 gap-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 pr-12">
          <Avatar className="h-11 w-11 border border-accent/60">
            {artistAvatarUrl && <AvatarImage src={artistAvatarUrl} alt={artistName} />}
            <AvatarFallback className="bg-accent/10 text-accent font-semibold">
              {(artistName || "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-[17px] font-semibold leading-tight truncate notranslate" translate="no">
              {artistName}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Booking request</p>
            <DialogDescription className="sr-only">Send a booking request to this artist</DialogDescription>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass[availability.tone]}`}>
            {availability.label}
          </span>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {/* When */}
          <div className="rounded-xl bg-card px-3.5 py-3 space-y-3">
            <div className="flex gap-3 items-center">
              <CalendarDays className="h-[18px] w-[18px] text-accent shrink-0" />
              <p className="text-[15px] text-foreground notranslate" translate="no">
                {longDate}
                {multiDay && <> – {form.endDate!.toLocaleDateString(locale, { day: "numeric", month: "long" })}</>}
              </p>
            </div>

            {allowTimes && sortedBusy.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Already booked:</span>
                {sortedBusy.map((s, i) => (
                  <span key={i} className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-destructive/90 tabular-nums notranslate" translate="no">
                    {showTime(s.startTime)} – {showTime(s.endTime)}
                  </span>
                ))}
              </div>
            )}

            {allowTimes && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="startTime" className="text-xs text-muted-foreground font-normal">From</Label>
                  <TimeSelector
                    id="startTime"
                    value={form.startTime}
                    onChange={(v) => setForm({ ...form, startTime: v })}
                    placeholder="--:--"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endTime" className="text-xs text-muted-foreground font-normal">Until</Label>
                  <TimeSelector
                    id="endTime"
                    value={form.endTime}
                    onChange={(v) => setForm({ ...form, endTime: v })}
                    placeholder="--:--"
                  />
                </div>
              </div>
            )}

            {clash && (
              <p className="flex items-start gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 mt-px shrink-0" />
                <span>
                  <span>This time overlaps with a booking</span>{" "}
                  <span className="notranslate tabular-nums" translate="no">
                    ({showTime(clash.startTime)} – {showTime(clash.endTime)})
                  </span>
                  . <span>Choose another time.</span>
                </span>
              </p>
            )}

            {overnight && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Moon className="h-3.5 w-3.5 shrink-0" />
                <span>Ends the next day</span>
                <span className="notranslate" translate="no">({shortDate(end)})</span>
              </p>
            )}

            {multiDay ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarRange className="h-3.5 w-3.5 shrink-0" />
                <span>Multi-day event</span>
                <button
                  type="button"
                  className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() => setForm({ ...form, endDate: null })}
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            ) : (
              <Popover open={multiDayOpen} onOpenChange={setMultiDayOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className="flex items-center gap-2 text-xs text-accent hover:underline">
                    <CalendarRange className="h-3.5 w-3.5" />
                    <span>The event lasts several days</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.endDate || undefined}
                    onSelect={(d) => {
                      setForm({ ...form, endDate: d || null });
                      setMultiDayOpen(false);
                    }}
                    disabled={(d) => d <= date}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Event type */}
          <div className="space-y-1.5">
            <Label htmlFor="eventType">Event type</Label>
            <Input
              id="eventType"
              placeholder="e.g., Wedding, Corporate Event, Birthday"
              value={form.eventType}
              onChange={(e) => {
                setPickedType(null);
                setForm({ ...form, eventType: e.target.value });
              }}
              required
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  // The label is translated on the page; store exactly what the visitor sees
                  onClick={(e) => {
                    setPickedType(t);
                    setForm({ ...form, eventType: (e.currentTarget.textContent || t).trim() });
                  }}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    pickedType === t
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            <Label htmlFor="message">Details (optional)</Label>
            <Textarea
              id="message"
              rows={3}
              maxLength={1000}
              placeholder="Location, number of guests, music you'd like, budget…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="resize-none"
            />
          </div>

          <div className="flex items-start gap-2.5 rounded-lg bg-card px-3 py-2.5 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>The artist replies with a price offer. Contact details are shared only after you accept it.</span>
          </div>

          <Button
            type="submit"
            disabled={submitting || timesIncomplete || !!clash || !form.eventType.trim()}
            className="w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send booking request
          </Button>
          {timesIncomplete && (
            <p className="-mt-2 text-center text-xs text-muted-foreground">Choose both the start and the end time.</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingRequestDialog;
