import { useEffect, useState } from "react";
import { Clock, Lock, Mail, Phone } from "lucide-react";
import { BookingDateTile } from "@/components/BookingRequestCard";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import BookingOfferPanel from "@/components/BookingOfferPanel";
import { BookingOfferFields, offerErrorText } from "@/lib/bookingOffers";
import { BookingContract, CONTRACT_COLUMNS } from "@/lib/contracts";
import { isKnownEventType } from "@/lib/eventTypes";
import {
  bookingStatusKey,
  bookingStatusLabel,
  bookingStatusTone,
  BOOKING_TONE_CLASS,
  BOOKING_TONE_TEXT,
  formatBookingWhen,
  isClosedBooking,
  messageWithoutTime,
} from "@/lib/bookingDisplay";

export interface BookingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: (BookingOfferFields & { created_at?: string }) | null;
  /** Who is looking: the artist who received the request, or the organizer who sent it */
  viewer: "artist" | "requester";
  /** The other party */
  counterpartName: string;
  counterpartAvatarUrl?: string | null;
  /** Shown under the artist's name when the organizer is looking, e.g. "DJ · Maramureș" */
  counterpartSubtitle?: string | null;
  /** Artist stage name (contract fallback for older bookings) */
  artistName: string;
  /** Artist: open the offer dialog (new offer or edit) */
  onOffer?: () => void;
  /** Artist: decline a request / withdraw an offer / cancel a confirmed booking */
  onArtistDecline?: (bookingId: string) => Promise<void> | void;
  /** Artist: delete a request that has no contract */
  onDelete?: (bookingId: string) => Promise<void> | void;
  /** Reload after any change */
  onChanged?: () => void;
}

type PendingAction = "artist_decline" | "artist_cancel" | "delete" | "requester_cancel" | null;


/**
 * One booking, both sides. Used by the Booking Requests page and the artist Dashboard.
 * Contact details come from get_booking_contact and only once the booking is confirmed.
 */
const BookingDetailsDialog = ({
  open,
  onOpenChange,
  booking,
  viewer,
  counterpartName,
  counterpartAvatarUrl,
  counterpartSubtitle,
  artistName,
  onOffer,
  onArtistDecline,
  onDelete,
  onChanged,
}: BookingDetailsDialogProps) => {
  const { toast } = useToast();
  const [contract, setContract] = useState<BookingContract | null>(null);
  const [contractLoaded, setContractLoaded] = useState(false);
  const [contact, setContact] = useState<{ email: string | null; phone: string | null } | null>(null);
  const [confirmAction, setConfirmAction] = useState<PendingAction>(null);
  const [working, setWorking] = useState(false);
  const { i18n } = useTranslation();
  const lang = i18n.language || i18n.resolvedLanguage || "ro";

  const status = booking?.status;
  const statusKey = booking ? bookingStatusKey(booking) : "pending";
  const isConfirmed = status === "accepted";

  useEffect(() => {
    let cancelled = false;
    setContract(null);
    setContractLoaded(false);
    setContact(null);
    if (!open || !booking) return;
    (async () => {
      const [{ data: c }, contactRes] = await Promise.all([
        (supabase as any)
          .from("booking_contracts")
          .select(CONTRACT_COLUMNS)
          .eq("booking_request_id", booking.id)
          .maybeSingle(),
        booking.status === "accepted"
          ? (supabase as any).rpc("get_booking_contact", { _booking_id: booking.id })
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setContract((c as BookingContract) || null);
      setContractLoaded(true);
      const row = Array.isArray(contactRes?.data) ? contactRes.data[0] : contactRes?.data;
      if (row?.available) setContact({ email: row.email, phone: row.phone });
    })();
    return () => {
      cancelled = true;
    };
  }, [open, booking?.id, booking?.status]);

  if (!booking) return null;

  const when = formatBookingWhen(booking, lang);
  const message = messageWithoutTime(booking.message);
  const isFuture = (() => {
    const last = booking.event_end_date || booking.event_date;
    const [y, m, d] = last.split("-").map(Number);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(y, m - 1, d) >= today;
  })();

  // Footer action: at most one (cancel or delete), shown as a plain text button, confirmed in a dialog.
  let secondaryAction: { key: Exclude<PendingAction, null>; label: string } | null = null;
  if (viewer === "artist") {
    if (status === "accepted" && isFuture) secondaryAction = { key: "artist_cancel", label: "Cancel booking" };
    else if (contractLoaded && !contract && status !== "accepted") secondaryAction = { key: "delete", label: "Delete request" };
  } else if (status === "pending" || status === "offered" || (status === "accepted" && isFuture)) {
    secondaryAction = { key: "requester_cancel", label: status === "accepted" ? "Cancel booking" : "Cancel request" };
  }

  const confirmCopy: Record<Exclude<PendingAction, null>, { title: string; body: string; cta: string }> = {
    artist_decline: { title: "Decline this request?", body: "The organizer will see the request as declined.", cta: "Decline" },
    artist_cancel: {
      title: "Cancel this booking?",
      body: "The organizer is notified that you are no longer available. The contract stays saved as a record.",
      cta: "Cancel booking",
    },
    delete: { title: "Delete this request?", body: "The request is removed permanently. This cannot be undone.", cta: "Delete" },
    requester_cancel: {
      title: status === "accepted" ? "Cancel this booking?" : "Cancel this request?",
      body:
        status === "accepted"
          ? "The artist is notified. The contract stays saved as a record."
          : "The artist is notified and the request is closed.",
      cta: status === "accepted" ? "Cancel booking" : "Cancel request",
    },
  };

  const runConfirmed = async () => {
    if (!confirmAction) return;
    setWorking(true);
    try {
      if (confirmAction === "artist_decline" || confirmAction === "artist_cancel") {
        await onArtistDecline?.(booking.id);
      } else if (confirmAction === "delete") {
        await onDelete?.(booking.id);
        onOpenChange(false);
      } else if (confirmAction === "requester_cancel") {
        const { error } = await (supabase as any).rpc("cancel_booking_request", { _booking_id: booking.id });
        if (error) {
          toast({ title: "Something went wrong", description: offerErrorText(error), variant: "destructive" });
          return;
        }
        toast({ title: "Cancelled", description: "The artist has been notified." });
        onChanged?.();
      }
    } finally {
      setWorking(false);
      setConfirmAction(null);
    }
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast({ title: "Email copied" });
    } catch {
      /* clipboard unavailable: nothing to do */
    }
  };

  const createdAt = booking.created_at
    ? new Date(booking.created_at).toLocaleString(lang.startsWith("ro") ? "ro-RO" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[440px] w-[calc(100%-1.5rem)] p-0 gap-0 rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header: same order as the list card — date tile, event, time, status */}
          <div className="flex items-start gap-3.5 px-5 pt-5 pb-4 pr-12">
            <BookingDateTile ymd={booking.event_date} closed={isClosedBooking(statusKey)} large />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold leading-tight">
                {booking.event_type ? (
                  isKnownEventType(booking.event_type) ? (
                    <span className="block truncate">{booking.event_type}</span>
                  ) : (
                    <span className="block truncate notranslate" translate="no" data-user-content="true">{booking.event_type}</span>
                  )
                ) : (
                  <span>Event</span>
                )}
              </DialogTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                <span className="notranslate" translate="no">{when.date}</span>
              </p>
              {(when.time || when.endsOn) && (
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {when.time && <span className="notranslate tabular-nums" translate="no">{when.time}</span>}
                  {when.endsOn && (
                    <span>
                      (<span>ends on</span> <span className="notranslate" translate="no">{when.endsOn}</span>)
                    </span>
                  )}
                </p>
              )}
              <span
                className={`mt-1.5 inline-flex w-fit text-sm font-semibold ${BOOKING_TONE_TEXT[bookingStatusTone(statusKey)]}`}
              >
                {bookingStatusLabel(statusKey, viewer, booking ?? undefined)}
              </span>
              <DialogDescription className="sr-only">Booking details</DialogDescription>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
            {/* Who: the same photo and name as on the card */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {counterpartAvatarUrl && <AvatarImage src={counterpartAvatarUrl} alt={counterpartName} />}
                <AvatarFallback className="bg-foreground/10 text-foreground font-semibold">
                  {(counterpartName || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-foreground notranslate" translate="no">{counterpartName}</p>
                {viewer === "artist" ? (
                  <p className="truncate text-sm text-muted-foreground">Organizer</p>
                ) : counterpartSubtitle ? (
                  <p className="truncate text-sm text-muted-foreground notranslate" translate="no">{counterpartSubtitle}</p>
                ) : null}
              </div>
            </div>

            <BookingOfferPanel
              booking={booking}
              viewer={viewer}
              artistName={artistName}
              contract={contract}
              contractLoaded={contractLoaded}
              onOffer={onOffer}
              onArtistDecline={() => setConfirmAction("artist_decline")}
              onArtistWithdraw={() => onArtistDecline?.(booking.id)}
              onChanged={onChanged}
            />

            {isConfirmed && contact && (contact.email || contact.phone) && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  {viewer === "artist" ? "Organizer contact" : "Artist contact"}
                </p>
                <div className="space-y-1.5">
                  {contact.email && (
                    <div className="flex items-center gap-3 py-1 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 min-w-0 truncate notranslate" translate="no">{contact.email}</span>
                      <button
                        type="button"
                        onClick={() => copyEmail(contact.email!)}
                        className="text-sm font-bold text-foreground hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-3 py-1 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 min-w-0 truncate notranslate" translate="no">{contact.phone}</span>
                      <a
                        href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                        className="text-sm font-bold text-foreground hover:underline"
                      >
                        Call
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {message && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  {viewer === "artist" ? "Organizer's message" : "Your message"}
                </p>
                <p
                  className="text-sm text-foreground/90 whitespace-pre-wrap notranslate"
                  translate="no"
                  data-user-content="true"
                >
                  {message}
                </p>
              </div>
            )}

            {(status === "pending" || status === "offered") && (
              <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Contact details become visible once the booking is confirmed.</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
            <span>
              {createdAt && (
                <>
                  <span>{viewer === "artist" ? "Received on" : "Sent on"}</span>{" "}
                  <span className="notranslate" translate="no">{createdAt}</span>
                </>
              )}
            </span>
            {secondaryAction && (
              <button
                type="button"
                onClick={() => setConfirmAction(secondaryAction.key)}
                className="shrink-0 rounded-full px-2 py-1 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmAction !== null} onOpenChange={(o) => !o && !working && setConfirmAction(null)}>
        {confirmAction && (
          <AlertDialogContent className="rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmCopy[confirmAction].title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmCopy[confirmAction].body}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={working}>
                Back
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={working}
                onClick={(e) => {
                  e.preventDefault();
                  runConfirmed();
                }}
              >
                {confirmCopy[confirmAction].cta}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  );
};

export default BookingDetailsDialog;
