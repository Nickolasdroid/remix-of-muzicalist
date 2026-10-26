import { useEffect, useState } from "react";
import { CalendarDays, Lock, Mail, MoreHorizontal, PartyPopper, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  bookingStatusKey,
  bookingStatusLabel,
  bookingStatusTone,
  formatBookingWhen,
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

const toneClass: Record<string, string> = {
  amber: "bg-amber-500/15 text-amber-400",
  green: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-sky-500/15 text-sky-400",
  red: "bg-destructive/15 text-destructive",
};

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

  // ••• menu
  const menu: { key: PendingAction; label: string }[] = [];
  if (viewer === "artist") {
    if (status === "accepted" && isFuture) menu.push({ key: "artist_cancel", label: "Cancel booking" });
    if (contractLoaded && !contract && status !== "accepted") menu.push({ key: "delete", label: "Delete request" });
  } else if (status === "pending" || status === "offered" || (status === "accepted" && isFuture)) {
    menu.push({ key: "requester_cancel", label: status === "accepted" ? "Cancel booking" : "Cancel request" });
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
        <DialogContent className="max-w-[440px] w-[calc(100%-1.5rem)] p-0 gap-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 pr-12">
            <Avatar className="h-11 w-11 border border-accent/60">
              {counterpartAvatarUrl && <AvatarImage src={counterpartAvatarUrl} alt={counterpartName} />}
              <AvatarFallback className="bg-accent/10 text-accent font-semibold">
                {(counterpartName || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-[17px] font-semibold leading-tight truncate notranslate" translate="no">
                {counterpartName}
              </DialogTitle>
              {viewer === "artist" ? (
                <p className="text-sm text-muted-foreground truncate">Organizer</p>
              ) : counterpartSubtitle ? (
                <p className="text-sm text-muted-foreground truncate notranslate" translate="no">{counterpartSubtitle}</p>
              ) : null}
              <DialogDescription className="sr-only">Booking details</DialogDescription>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass[bookingStatusTone(statusKey)]}`}
            >
              {bookingStatusLabel(statusKey, viewer)}
            </span>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
            <div className="rounded-xl bg-card px-3.5 py-3 space-y-2.5">
            {booking.event_type && (
              <div className="flex gap-3 items-center">
                <PartyPopper className="h-[18px] w-[18px] text-accent shrink-0" />
                <p className="text-[15px] font-medium text-foreground truncate notranslate" translate="no" data-user-content="true">
                  {booking.event_type}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <CalendarDays className="h-[18px] w-[18px] text-accent mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[15px] text-foreground notranslate" translate="no">{when.date}</p>
                {(when.time || when.endsOn) && (
                  <p className="text-sm text-muted-foreground">
                    {when.time && <span className="notranslate" translate="no">{when.time}</span>}
                    {when.time && when.endsOn && <span> · </span>}
                    {when.endsOn && (
                      <>
                        <span>ends on</span> <span className="notranslate" translate="no">{when.endsOn}</span>
                      </>
                    )}
                  </p>
                )}
              </div>
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
                    <div className="flex items-center gap-3 rounded-lg bg-card px-3 py-2.5 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 min-w-0 truncate notranslate" translate="no">{contact.email}</span>
                      <button
                        type="button"
                        onClick={() => copyEmail(contact.email!)}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-3 rounded-lg bg-card px-3 py-2.5 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 min-w-0 truncate notranslate" translate="no">{contact.phone}</span>
                      <a
                        href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground"
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
                  className="rounded-lg bg-card px-3 py-2.5 text-sm text-foreground/90 whitespace-pre-wrap notranslate"
                  translate="no"
                  data-user-content="true"
                >
                  {message}
                </p>
              </div>
            )}

            {(status === "pending" || status === "offered") && (
              <div className="flex items-start gap-2.5 rounded-lg bg-card px-3 py-2.5 text-sm text-muted-foreground">
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
            {menu.length > 0 && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="More actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-lg">
                  {menu.map((m) => (
                    <DropdownMenuItem
                      key={m.key}
                      className="text-destructive focus:text-destructive"
                      onSelect={() => setConfirmAction(m.key)}
                    >
                      {m.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
              <AlertDialogCancel className="rounded-lg" disabled={working}>
                Back
              </AlertDialogCancel>
              <AlertDialogAction
                className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
