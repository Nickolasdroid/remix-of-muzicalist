import { useState } from "react";
import { BadgeCheck, Clock, Loader2, Pencil, Printer, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import i18n from "@/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import {
  BookingOfferFields,
  formatMoney,
  offerErrorText,
  printBookingConfirmation,
} from "@/lib/bookingOffers";

interface BookingOfferPanelProps {
  booking: BookingOfferFields;
  /** Who is looking at the booking */
  viewer: "artist" | "requester";
  /** Artist stage name, used on the printable confirmation */
  artistName: string;
  /** Artist only: open the offer dialog to edit the current offer */
  onEditOffer?: () => void;
  /** Called after the requester accepted or declined */
  onChanged?: () => void;
}

/**
 * Shows the offer attached to a booking request and the actions that go with it:
 * - requester: accept / decline an open offer
 * - artist: see the offer status, edit an open offer
 * - both: print the confirmation once the booking is confirmed
 */
const BookingOfferPanel = ({ booking, viewer, artistName, onEditOffer, onChanged }: BookingOfferPanelProps) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [confirmAcceptOpen, setConfirmAcceptOpen] = useState(false);
  const lang = i18n.language || "ro";
  const hasOffer = booking.offer_price != null;
  if (!hasOffer) return null;

  const price = formatMoney(booking.offer_price, booking.offer_currency, lang);
  const isOpen = booking.status === "offered";
  const isConfirmed = booking.status === "accepted";

  const respond = async (accept: boolean) => {
    setBusy(accept ? "accept" : "decline");
    const { error } = await (supabase as any).rpc("respond_to_booking_offer", {
      _booking_id: booking.id,
      _accept: accept,
    });
    setBusy(null);
    setConfirmAcceptOpen(false);
    if (error) {
      toast({ title: "Something went wrong", description: offerErrorText(error), variant: "destructive" });
      return;
    }
    toast(
      accept
        ? { title: "Booking confirmed", description: "The artist has been notified. Contact details are now visible." }
        : { title: "Offer declined", description: "The artist has been notified." }
    );
    onChanged?.();
  };

  const handlePrint = () => {
    const ok = printBookingConfirmation(booking, artistName, lang);
    if (!ok) {
      toast({
        title: "Pop-up blocked",
        description: "Allow pop-ups for this site to open the confirmation.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {isConfirmed ? "Agreed price" : "Offer"}
          </Label>
          <p className="text-xl font-semibold text-foreground mt-1 notranslate" translate="no">
            {price}
          </p>
        </div>
        {isConfirmed ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 mt-1">
            <BadgeCheck className="h-4 w-4" />
            Confirmed
          </span>
        ) : isOpen ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 mt-1">
            <Clock className="h-4 w-4" />
            {viewer === "artist" ? "Waiting for the organizer" : "Waiting for your answer"}
          </span>
        ) : null}
      </div>

      {booking.offer_note && (
        <p
          className="text-sm text-foreground whitespace-pre-wrap notranslate"
          translate="no"
          data-user-content="true"
        >
          {booking.offer_note}
        </p>
      )}

      {booking.status === "rejected" && booking.declined_by === "requester" && (
        <p className="text-sm text-muted-foreground">
          {viewer === "artist" ? "The organizer declined this offer." : "You declined this offer."}
        </p>
      )}

      {isOpen && viewer === "requester" && (
        <div className="flex gap-2">
          <Button
            className="flex-1 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => setConfirmAcceptOpen(true)}
            disabled={busy !== null}
          >
            {busy === "accept" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Accept offer
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-lg"
            onClick={() => respond(false)}
            disabled={busy !== null}
          >
            {busy === "decline" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Decline
          </Button>
        </div>
      )}

      {isOpen && viewer === "artist" && onEditOffer && (
        <Button variant="outline" size="sm" className="rounded-lg" onClick={onEditOffer}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit offer
        </Button>
      )}

      {isConfirmed && (
        <Button variant="outline" size="sm" className="rounded-lg" onClick={handlePrint}>
          <Printer className="h-3.5 w-3.5 mr-1.5" />
          Booking confirmation
        </Button>
      )}

      <AlertDialog open={confirmAcceptOpen} onOpenChange={setConfirmAcceptOpen}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Accept this offer?</AlertDialogTitle>
            <AlertDialogDescription>
              The booking will be confirmed at the agreed price and the artist's calendar will be marked as
              booked. Payment is arranged directly with the artist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={(e) => {
                e.preventDefault();
                respond(true);
              }}
              disabled={busy !== null}
            >
              Accept offer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookingOfferPanel;
