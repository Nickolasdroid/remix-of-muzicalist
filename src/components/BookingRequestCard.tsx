import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Clock } from "lucide-react";
import {
  bookingStatusKey,
  bookingStatusLabel,
  bookingStatusTone,
  BOOKING_TONE_CLASS,
  isClosedBooking,
  formatBookingWhen,
} from "@/lib/bookingDisplay";
import { formatMoney } from "@/lib/bookingOffers";

interface BookingLike {
  id: string;
  status: string;
  event_date: string;
  event_end_date?: string | null;
  event_type?: string | null;
  message?: string | null;
  offer_price?: number | string | null;
  offer_currency?: string | null;
}

const parseYMD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * One booking in a list (artist dashboard and the Booking Requests page).
 * Date tile on the left, event + who + time/price in the middle, status on the right.
 * Uses the same status rules and colors as BookingDetailsDialog.
 */
const BookingRequestCard = ({
  booking,
  viewer,
  counterpartName,
  onClick,
  actions,
}: {
  booking: BookingLike;
  viewer: "artist" | "requester";
  counterpartName: string;
  onClick: () => void;
  /** Optional buttons under the card body (e.g. Send offer / Decline). */
  actions?: ReactNode;
}) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || i18n.resolvedLanguage || "ro";
  const locale = lang.startsWith("ro") ? "ro-RO" : "en-GB";

  const statusKey = bookingStatusKey(booking);
  const closed = isClosedBooking(statusKey);
  const when = formatBookingWhen(booking, lang);
  const date = parseYMD(booking.event_date);
  const weekday = date.toLocaleDateString(locale, { weekday: "short" }).replace(".", "");
  const month = date.toLocaleDateString(locale, { month: "short" }).replace(".", "");
  const hasPrice = booking.offer_price != null && booking.offer_price !== "" && statusKey !== "pending";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group rounded-xl border border-border/50 bg-card p-3 md:p-4 cursor-pointer transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div
          className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-lg py-1.5 ${
            closed ? "bg-muted/60 text-muted-foreground" : "bg-accent/10 text-accent"
          }`}
          aria-hidden="true"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide leading-none">{weekday}</span>
          <span className={`mt-1 text-xl font-bold leading-none tabular-nums ${closed ? "" : "text-foreground"}`}>
            {date.getDate()}
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wide leading-none">{month}</span>
        </div>

        <div className={`min-w-0 flex-1 ${closed ? "opacity-70" : ""}`}>
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold text-foreground">{booking.event_type || "Event"}</p>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BOOKING_TONE_CLASS[bookingStatusTone(statusKey)]}`}>
              {bookingStatusLabel(statusKey, viewer)}
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground notranslate" translate="no">{counterpartName}</p>
          {(when.time || hasPrice) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {when.time && (
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {when.time}
                  {when.endsOn && <span className="text-muted-foreground/70">({when.endsOn})</span>}
                </span>
              )}
              {hasPrice && (
                <span className="font-semibold text-foreground tabular-nums">
                  {formatMoney(booking.offer_price, booking.offer_currency, lang)}
                </span>
              )}
            </div>
          )}
        </div>

        <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-accent md:block" aria-hidden="true" />
      </div>

      {actions && (
        <div className="mt-3 flex gap-2 border-t border-border/50 pt-3" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default BookingRequestCard;
