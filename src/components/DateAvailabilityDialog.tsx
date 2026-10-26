import { CalendarDays, CalendarPlus, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type DateAvailabilityState = "partial" | "full" | "blocked";

interface DateAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | undefined;
  artistName: string;
  artistAvatarUrl?: string | null;
  /** Under the artist's name, e.g. "DJ · Maramureș" */
  artistSubtitle?: string | null;
  state: DateAvailabilityState;
  slots: { startTime: string; endTime: string }[];
  /** Show "Request another time" (busy day with known slots, not the artist's own profile) */
  canRequest: boolean;
  onRequest: () => void;
}

const toneClass: Record<DateAvailabilityState, string> = {
  partial: "bg-amber-500/15 text-amber-400",
  full: "bg-destructive/15 text-destructive",
  blocked: "bg-muted text-muted-foreground",
};

const label: Record<DateAvailabilityState, string> = {
  partial: "Partially booked",
  full: "Fully booked",
  blocked: "Unavailable",
};

/** "23:59" is how a slot that runs until midnight is stored; show it as 00:00. */
const showTime = (t: string) => (t === "23:59" ? "00:00" : t);

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/**
 * What a visitor sees when tapping a busy or unavailable day in an artist's calendar.
 * Same visual language as the booking dialogs.
 */
const DateAvailabilityDialog = ({
  open,
  onOpenChange,
  date,
  artistName,
  artistAvatarUrl,
  artistSubtitle,
  state,
  slots,
  canRequest,
  onRequest,
}: DateAvailabilityDialogProps) => {
  const { i18n } = useTranslation();
  if (!date) return null;
  const lang = i18n.language || i18n.resolvedLanguage || "ro";
  const locale = lang.startsWith("ro") ? "ro-RO" : "en-GB";
  const longDate = (() => {
    const s = date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();
  const sorted = [...slots].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] w-[calc(100%-1.5rem)] p-0 gap-0 rounded-2xl overflow-hidden">
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
            {artistSubtitle && (
              <p className="text-sm text-muted-foreground truncate notranslate" translate="no">{artistSubtitle}</p>
            )}
            <DialogDescription className="sr-only">Availability for the selected day</DialogDescription>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass[state]}`}>
            {label[state]}
          </span>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div className="rounded-xl bg-card px-3.5 py-3 space-y-3">
            <div className="flex gap-3 items-center">
              <CalendarDays className="h-[18px] w-[18px] text-accent shrink-0" />
              <p className="text-[15px] text-foreground notranslate" translate="no">{longDate}</p>
            </div>

            {state === "partial" && sorted.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Booked hours</p>
                {sorted.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg bg-background/60 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-destructive/80 shrink-0" />
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground tabular-nums notranslate" translate="no">
                      {showTime(s.startTime)} – {showTime(s.endTime)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {state === "full" && (
              <p className="text-sm text-muted-foreground">The artist is booked for the whole day.</p>
            )}
            {state === "blocked" && (
              <p className="text-sm text-muted-foreground">The artist has marked this day as unavailable.</p>
            )}
          </div>

          {canRequest && (
            <>
              <p className="text-sm text-muted-foreground">
                The other hours of this day are free. You can send a request for a different time.
              </p>
              <Button
                className="w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                onClick={onRequest}
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Request another time
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateAvailabilityDialog;
