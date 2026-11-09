import { useRef, useState } from "react";
import { closedReason } from "@/lib/bookingDisplay";
import { FileSignature, Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
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
import { BookingContract, openContractWindow } from "@/lib/contracts";

interface BookingOfferPanelProps {
  booking: BookingOfferFields;
  viewer: "artist" | "requester";
  /** Artist stage name (contract preview + confirmation for older bookings) */
  artistName: string;
  contract: BookingContract | null;
  contractLoaded: boolean;
  /** Artist: open the offer dialog (send or edit) */
  onOffer?: () => void;
  /** Artist: decline a pending request (asks for confirmation) */
  onArtistDecline?: () => void;
  /** Artist: withdraw an open offer */
  onArtistWithdraw?: () => void;
  /** Reload after the organizer accepted or declined */
  onChanged?: () => void;
}

const goldBtn = "h-11 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold";
const outlineBtn = "h-11 rounded-full border-foreground/25 bg-transparent font-bold hover:border-foreground hover:bg-transparent";
const ghostBtn = `flex-1 ${outlineBtn}`;

/**
 * The price card in the booking dialog: the offer and the one or two actions that fit
 * the current state, for whoever is looking.
 */
const BookingOfferPanel = ({
  booking,
  viewer,
  artistName,
  contract,
  contractLoaded,
  onOffer,
  onArtistDecline,
  onArtistWithdraw,
  onChanged,
}: BookingOfferPanelProps) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<"accept" | "decline" | "withdraw" | "advance" | null>(null);
  const [advanceReceivedLocal, setAdvanceReceivedLocal] = useState<string | null>(null);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [agree, setAgree] = useState(false);
  const detailsRef = useRef<ContractDetailsFormHandle>(null);
  const { i18n } = useTranslation();
  const lang = i18n.language || i18n.resolvedLanguage || "ro";

  const status = booking.status;
  const hasPrice = booking.offer_price != null;
  const price = hasPrice ? formatMoney(booking.offer_price, booking.offer_currency, lang) : null;

  const popupBlocked = () =>
    toast({ title: "Pop-up blocked", description: "Allow pop-ups for this site to open the document.", variant: "destructive" });

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

  const withdraw = async () => {
    setBusy("withdraw");
    try {
      await onArtistWithdraw?.();
    } finally {
      setBusy(null);
    }
  };

  const openContract = () => {
    if (contract) {
      if (!openContractWindow(contract)) popupBlocked();
    } else if (!printBookingConfirmation(booking, artistName, lang)) {
      popupBlocked();
    }
  };

  const previewContract = () => {
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
        advance_amount: booking.advance_amount ?? null,
        advance_due_date: booking.advance_due_date ?? null,
      },
      artist_accepted_at: booking.offer_sent_at || now,
      organizer_accepted_at: now,
      created_at: now,
    };
    if (!openContractWindow(draft, { preview: true })) popupBlocked();
  };

  // Pending request, no price yet
  if (status === "pending") {
    if (viewer === "requester") {
      return (
        <div className="text-sm text-muted-foreground">
          The artist hasn't sent an offer yet. You'll get a notification when they do.
        </div>
      );
    }
    return (
      <div>
        <p className="text-sm text-muted-foreground">
          Send a price offer. The booking is confirmed when the organizer accepts it.
        </p>
        <div className="mt-3 flex gap-2">
          <Button className={`flex-1 ${goldBtn}`} onClick={onOffer}>
            Send offer
          </Button>
          <Button variant="outline" className={ghostBtn} onClick={onArtistDecline}>
            Decline
          </Button>
        </div>
      </div>
    );
  }

  // Older confirmed bookings without a price: nothing to show
  if (!hasPrice) return null;

  const cancelled = status === "rejected";
  const caption =
    status === "accepted"
      ? "Agreed price"
      : status === "offered"
        ? viewer === "artist"
          ? "Your offer"
          : "Offer from the artist"
        : "Offer";

  let cancelledLine: string | null = null;
  if (cancelled) {
    const why = closedReason(booking);
    const byMe = (booking.declined_by === "requester") === (viewer === "requester");
    if (booking.confirmed_at) {
      cancelledLine = byMe
        ? "You cancelled this booking."
        : viewer === "artist"
          ? "Cancelled by the organizer."
          : "Cancelled by the artist.";
    } else if (why === "offer_declined") {
      cancelledLine = viewer === "artist" ? "The organizer declined your offer." : "You declined the offer.";
    } else if (why === "cancelled") {
      cancelledLine = viewer === "artist" ? "The organizer cancelled the request." : "You cancelled this request.";
    } else {
      cancelledLine = viewer === "artist" ? "You declined this request." : "The artist declined your request.";
    }
  }

  return (
    <>
      <div>
        <p className="text-xs text-muted-foreground">
          <span>{caption}</span>
          {status === "offered" && viewer === "artist" && (
            <>
              <span> · </span>
              <span>waiting for the organizer's answer</span>
            </>
          )}
        </p>
        <p
          className={`mt-0.5 text-3xl font-bold leading-tight tracking-tight tabular-nums notranslate ${cancelled ? "text-muted-foreground" : "text-foreground"}`}
          translate="no"
        >
          {price}
        </p>
        {booking.offer_note && (
          <p className="mt-1.5 text-sm text-foreground/85 whitespace-pre-wrap notranslate" translate="no" data-user-content="true">
            {booking.offer_note}
          </p>
        )}
        {cancelledLine && <p className="mt-2 text-sm text-muted-foreground">{cancelledLine}</p>}

        {/* Advance: asked in the offer, paid by bank transfer, confirmed by the artist */}
        {booking.advance_amount != null && !cancelled && (() => {
          const amount = formatMoney(booking.advance_amount, booking.offer_currency, lang);
          const due = booking.advance_due_date
            ? new Date(booking.advance_due_date + "T00:00:00").toLocaleDateString(lang.startsWith("ro") ? "ro-RO" : "en-GB", { day: "numeric", month: "long" })
            : null;
          const received = booking.advance_received_at || advanceReceivedLocal;
          const iban = contract?.artist_party?.iban;
          return (
            <div className="mt-3 text-sm">
              <p className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-muted-foreground">Advance</span>
                <b className="text-foreground notranslate tabular-nums" translate="no">{amount}</b>
                {due && !received && (
                  <>
                    <span className="text-muted-foreground">· by</span>
                    <span className="text-foreground notranslate" translate="no">{due}</span>
                  </>
                )}
              </p>
              {status === "accepted" && (
                received ? (
                  <p className="mt-1 text-xs font-semibold text-green-500">✓ <span>Advance received</span></p>
                ) : viewer === "requester" ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span>Pay it by bank transfer</span>
                    {iban ? (
                      <>
                        <span> · IBAN </span>
                        <span className="font-medium text-foreground notranslate" translate="no">{iban}</span>
                      </>
                    ) : (
                      <span>, details in the contract.</span>
                    )}
                  </p>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-9 rounded-full border-foreground/25 bg-transparent font-bold hover:border-foreground hover:bg-transparent"
                    disabled={busy !== null}
                    onClick={async () => {
                      setBusy("advance");
                      const { error } = await (supabase as any).rpc("mark_advance_received", { _booking_id: booking.id });
                      setBusy(null);
                      if (error) {
                        toast({ title: "Error", description: offerErrorText(error), variant: "destructive" });
                        return;
                      }
                      setAdvanceReceivedLocal(new Date().toISOString());
                      toast({ title: "Advance marked as received" });
                      onChanged?.();
                    }}
                  >
                    {busy === "advance" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    I received the advance
                  </Button>
                )
              )}
            </div>
          );
        })()}

        {status === "offered" && viewer === "requester" && (
          <div className="mt-3 flex gap-2">
            <Button
              className={`flex-1 ${goldBtn}`}
              onClick={() => {
                setAgree(false);
                setLocation("");
                setAcceptOpen(true);
              }}
              disabled={busy !== null}
            >
              Accept offer
            </Button>
            <Button variant="outline" className={ghostBtn} onClick={() => respond(false)} disabled={busy !== null}>
              {busy === "decline" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Decline
            </Button>
          </div>
        )}

        {status === "offered" && viewer === "artist" && (
          <div className="mt-3 flex gap-2">
            {/* A sent offer can't be edited; it can only be withdrawn */}
            <Button variant="outline" className={ghostBtn} onClick={withdraw} disabled={busy !== null}>
              {busy === "withdraw" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Withdraw offer
            </Button>
          </div>
        )}

        {status === "accepted" && contractLoaded && (
          <Button variant="outline" className={`${outlineBtn} mt-4 w-full`} onClick={openContract}>
            {contract ? <FileSignature className="h-4 w-4 mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
            {contract ? (
              <>
                <span>View contract</span>
                <span className="ml-2 font-normal text-muted-foreground notranslate" translate="no">
                  {contract.contract_number}
                </span>
              </>
            ) : (
              <span>Booking confirmation</span>
            )}
          </Button>
        )}
      </div>

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

            <Button variant="outline" size="sm" className="h-9 rounded-full border-foreground/25 bg-transparent font-bold hover:border-foreground hover:bg-transparent" type="button" onClick={previewContract}>
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
              className={`w-full ${goldBtn}`}
              onClick={() => respond(true)}
              disabled={!agree || !location.trim() || busy !== null}
            >
              {busy === "accept" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Accept and sign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingOfferPanel;
