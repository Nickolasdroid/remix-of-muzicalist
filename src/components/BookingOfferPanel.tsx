import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Clock, FileSignature, Loader2, Pencil, Printer, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import i18n from "@/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ContractDetailsForm, { ContractDetailsFormHandle } from "@/components/ContractDetailsForm";
import {
  BookingOfferFields,
  extractTimeInterval,
  formatMoney,
  offerErrorText,
  printBookingConfirmation,
} from "@/lib/bookingOffers";
import { BookingContract, CONTRACT_COLUMNS, openContractWindow } from "@/lib/contracts";

interface BookingOfferPanelProps {
  booking: BookingOfferFields;
  /** Who is looking at the booking */
  viewer: "artist" | "requester";
  /** Artist stage name, used on the printable confirmation (older bookings without a contract) */
  artistName: string;
  /** Artist only: open the offer dialog to edit the current offer */
  onEditOffer?: () => void;
  /** Called after the requester accepted or declined */
  onChanged?: () => void;
}

/**
 * Shows the offer attached to a booking request and the actions that go with it:
 * - requester: accept (contract details + event location + agreement checkbox) / decline
 * - artist: see the offer status, edit an open offer
 * - both: open the contract once the booking is confirmed
 */
const BookingOfferPanel = ({ booking, viewer, artistName, onEditOffer, onChanged }: BookingOfferPanelProps) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [agree, setAgree] = useState(false);
  const [contract, setContract] = useState<BookingContract | null>(null);
  const [contractChecked, setContractChecked] = useState(false);
  const detailsRef = useRef<ContractDetailsFormHandle>(null);
  const lang = i18n.language || "ro";

  const isOpen = booking.status === "offered";
  const isConfirmed = booking.status === "accepted";

  useEffect(() => {
    let cancelled = false;
    setContract(null);
    setContractChecked(false);
    if (!isConfirmed) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("booking_contracts")
        .select(CONTRACT_COLUMNS)
        .eq("booking_request_id", booking.id)
        .maybeSingle();
      if (cancelled) return;
      setContract((data as BookingContract) || null);
      setContractChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [booking.id, isConfirmed]);

  if (booking.offer_price == null) return null;
  const price = formatMoney(booking.offer_price, booking.offer_currency, lang);

  const openAccept = () => {
    setAgree(false);
    setLocation("");
    setAcceptOpen(true);
  };

  const respond = async (accept: boolean) => {
    if (accept) {
      if (!location.trim()) {
        toast({ title: "Event location missing", description: "Please enter where the event takes place.", variant: "destructive" });
        return;
      }
      if (!agree) return;
    }
    setBusy(accept ? "accept" : "decline");
    if (accept) {
      const saved = await detailsRef.current?.save();
      if (!saved) {
        setBusy(null);
        return;
      }
    }
    const { error } = await (supabase as any).rpc("respond_to_booking_offer", {
      _booking_id: booking.id,
      _accept: accept,
      ...(accept ? { _accept_terms: true, _event_location: location.trim() } : {}),
    });
    setBusy(null);
    if (error) {
      toast({ title: "Something went wrong", description: offerErrorText(error), variant: "destructive" });
      return;
    }
    setAcceptOpen(false);
    toast(
      accept
        ? { title: "Booking confirmed", description: "The contract has been generated and the artist has been notified." }
        : { title: "Offer declined", description: "The artist has been notified." }
    );
    onChanged?.();
  };

  const popupBlocked = () =>
    toast({
      title: "Pop-up blocked",
      description: "Allow pop-ups for this site to open the document.",
      variant: "destructive",
    });

  const handlePreviewContract = () => {
    const now = new Date().toISOString();
    const draft: BookingContract = {
      id: "—",
      booking_request_id: booking.id,
      contract_number: "—",
      template_version: "v1",
      artist_party: { legal_name: artistName, stage_name: artistName, entity_type: "individual", complete: false },
      organizer_party: { legal_name: booking.requester_name, entity_type: "individual", complete: false },
      terms: {
        price: booking.offer_price ?? 0,
        currency: booking.offer_currency || "RON",
        offer_note: booking.offer_note,
        event_date: booking.event_date,
        event_end_date: booking.event_end_date,
        event_type: booking.event_type,
        time: extractTimeInterval(booking.message),
        location: location.trim() || null,
      },
      artist_accepted_at: booking.offer_sent_at || now,
      organizer_accepted_at: now,
      created_at: now,
    };
    if (!openContractWindow(draft, { preview: true })) popupBlocked();
  };

  const handleOpenContract = () => {
    if (contract) {
      if (!openContractWindow(contract)) popupBlocked();
      return;
    }
    // Bookings confirmed before contracts existed: simple confirmation
    if (!printBookingConfirmation(booking, artistName, lang)) popupBlocked();
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
        <p className="text-sm text-foreground whitespace-pre-wrap notranslate" translate="no" data-user-content="true">
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
            onClick={openAccept}
            disabled={busy !== null}
          >
            Accept offer
          </Button>
          <Button variant="outline" className="flex-1 rounded-lg" onClick={() => respond(false)} disabled={busy !== null}>
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

      {isConfirmed && contractChecked && (
        <Button variant="outline" size="sm" className="rounded-lg" onClick={handleOpenContract}>
          {contract ? <FileSignature className="h-3.5 w-3.5 mr-1.5" /> : <Printer className="h-3.5 w-3.5 mr-1.5" />}
          {contract ? (
            <>
              Contract <span className="ml-1 notranslate" translate="no">{contract.contract_number}</span>
            </>
          ) : (
            "Booking confirmation"
          )}
        </Button>
      )}

      <Dialog open={acceptOpen} onOpenChange={(o) => busy === null && setAcceptOpen(o)}>
        <DialogContent className="max-w-lg rounded-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Accept offer and sign the contract</DialogTitle>
            <DialogDescription>
              <span>A contract between you and the artist is generated automatically at the agreed price of</span>{" "}
              <span className="notranslate font-medium text-foreground" translate="no">{price}</span>.{" "}
              <span>Your details are saved for next time.</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="event-location">Event location</Label>
              <Input
                id="event-location"
                value={location}
                maxLength={300}
                placeholder="Venue name and address"
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Your contract details</p>
              <ContractDetailsForm ref={detailsRef} variant="organizer" />
            </div>

            <Separator />

            <Button variant="outline" size="sm" className="rounded-lg" type="button" onClick={handlePreviewContract}>
              <FileSignature className="h-3.5 w-3.5 mr-1.5" />
              Read the contract
            </Button>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
              <span className="text-sm text-foreground leading-snug">
                I have read and agree to the terms of the service contract with this artist. Checking this box counts as
                my electronic signature.
              </span>
            </label>

            <p className="text-xs text-muted-foreground">
              Payment is arranged directly with the artist. The artist's calendar is marked as booked once you accept.
            </p>

            <Button
              className="w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => respond(true)}
              disabled={!agree || !location.trim() || busy !== null}
            >
              {busy === "accept" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Accept and sign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingOfferPanel;
