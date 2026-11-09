import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Clock } from "lucide-react";
import {
  bookingStatusKey,
  bookingStatusLabel,
  bookingStatusTone,
  BOOKING_TONE_TEXT,
  isClosedBooking,
  formatBookingWhen,
} from "@/lib/bookingDisplay";
import { formatMoney } from "@/lib/bookingOffers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BookingLike {
  id: string;
  status: string;
  event_date: string;
  event_end_date?: string | null;
  event_type?: string | null;
  message?: string | null;
  offer_price?: number | string | null;
  offer_currency?: string | null;
  confirmed_at?: string | null;
  declined_by?: string | null;
  offer_sent_at?: string | null;
}

const parseYMD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Date tile (weekday · day · month), shared by the list card and the details dialog. */
export const BookingDateTile = ({ ymd, closed, large }: { ymd: string; closed?: boolean; large?: boolean }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || i18n.resolvedLanguage || "ro";
  const locale = lang.startsWith("ro") ? "ro-RO" : "en-GB";
  const date = parseYMD(ymd);
  const weekday = date.toLocaleDateString(locale, { weekday: "short" }).replace(".", "");
  const month = date.toLocaleDateString(locale, { month: "short" }).replace(".", "");
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center rounded-lg ${large ? "w-16 py-2" : "w-14 py-1.5"} ${
        closed ? "bg-foreground/[0.04] text-muted-foreground" : "bg-foreground/[0.08] text-foreground"
      }`}
      aria-hidden="true"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide leading-none notranslate" translate="no">{weekday}</span>
      <span className={`mt-1 font-bold leading-none tabular-nums ${large ? "text-2xl" : "text-xl"} ${closed ? "" : "text-foreground"}`}>
        {date.getDate()}
      </span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wide leading-none notranslate" translate="no">{month}</span>
    </div>
  );
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
  counterpartAvatarUrl,
  onClick,
  actions,
}: {
  booking: BookingLike;
  viewer: "artist" | "requester";
  counterpartName: string;
  /** Small photo next to the name, the same one the details dialog shows */
  counterpartAvatarUrl?: string | null;
  onClick: () => void;
  /** Optional buttons under the card body (e.g. Send offer / Decline). */
  actions?: ReactNode;
}) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || i18n.resolvedLanguage || "ro";

  const statusKey = bookingStatusKey(booking);
  const closed = isClosedBooking(statusKey);
  const when = formatBookingWhen(booking, lang);
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
      className={`group -mx-2 cursor-pointer rounded-md px-2 py-2.5 transition-colors hover:bg-foreground/[0.07] focus-visible:bg-foreground/[0.07] focus-visible:outline-none ${closed ? "opacity-60 hover:opacity-100" : ""}`}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <BookingDateTile ymd={booking.event_date} closed={closed} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{booking.event_type || "Event"}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            <span className="notranslate" translate="no">{counterpartName}</span>
            {when.time && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="tabular-nums">{when.time}</span>
                {when.endsOn && <span className="text-muted-foreground/70"> ({when.endsOn})</span>}
              </>
            )}
          </p>
        </div>

        {/* Price over status, right-aligned */}
        <div className="shrink-0 text-right">
          {hasPrice && (
            <p className="text-sm font-semibold tabular-nums text-foreground notranslate" translate="no">
              {formatMoney(booking.offer_price, booking.offer_currency, lang)}
            </p>
          )}
          <p className={`text-xs font-semibold ${BOOKING_TONE_TEXT[bookingStatusTone(statusKey)]}`}>
            {bookingStatusLabel(statusKey, viewer, booking)}
          </p>
        </div>
      </div>

      {actions && (
        <div className="mt-3 flex gap-2 pl-[3.75rem] md:pl-[4.5rem]" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default BookingRequestCard;
