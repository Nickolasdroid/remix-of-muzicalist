import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES } from "@/lib/currencies";
import { BookingOfferFields, OFFER_NOTE_MAX, offerErrorText } from "@/lib/bookingOffers";

interface BookingOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingOfferFields | null;
  onSent?: () => void;
}

/**
 * Artist side: send (or update) a priced offer for a booking request.
 * The booking becomes confirmed only when the organizer accepts the offer.
 */
const BookingOfferDialog = ({ open, onOpenChange, booking, onSent }: BookingOfferDialogProps) => {
  const { toast } = useToast();
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("RON");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !booking) return;
    let cancelled = false;
    setNote(booking.offer_note || "");
    if (booking.offer_price != null) {
      setPrice(String(booking.offer_price));
      setCurrency(booking.offer_currency || "RON");
      return;
    }
    setPrice("");
    setCurrency("RON");
    // Pre-fill from the artist's price list (same event type first)
    (async () => {
      const { data } = await supabase
        .from("pricing_entries")
        .select("amount, currency, event_type")
        .eq("profile_id", booking.profile_id);
      if (cancelled || !data || data.length === 0) return;
      const match =
        data.find((p) => booking.event_type && p.event_type?.toLowerCase() === booking.event_type.toLowerCase()) ||
        data[0];
      setCurrency(match.currency || "RON");
      if (booking.event_type && match.event_type?.toLowerCase() === booking.event_type.toLowerCase()) {
        setPrice(String(match.amount));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, booking]);

  const priceNumber = Number(price.replace(",", "."));
  const priceValid = Number.isFinite(priceNumber) && priceNumber > 0;
  const isUpdate = booking?.status === "offered";

  const handleSend = async () => {
    if (!booking || !priceValid || saving) return;
    setSaving(true);
    const { error } = await (supabase as any).rpc("send_booking_offer", {
      _booking_id: booking.id,
      _price: Math.round(priceNumber * 100) / 100,
      _currency: currency,
      _note: note.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Offer not sent", description: offerErrorText(error), variant: "destructive" });
      return;
    }
    toast({
      title: isUpdate ? "Offer updated" : "Offer sent",
      description: "The booking is confirmed when the organizer accepts your offer.",
    });
    onOpenChange(false);
    onSent?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>{isUpdate ? "Update offer" : "Send an offer"}</DialogTitle>
          <DialogDescription>
            Set your price for this event. The booking is confirmed when the organizer accepts your offer.
          </DialogDescription>
        </DialogHeader>

        {booking && (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              <span className="notranslate" translate="no" data-user-content="true">
                {booking.requester_name}
              </span>
              {booking.event_type ? (
                <>
                  {" · "}
                  <span>{booking.event_type}</span>
                </>
              ) : null}
            </p>

            <div className="grid grid-cols-[1fr_120px] gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="offer-price">Price</Label>
                <Input
                  id="offer-price"
                  inputMode="decimal"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ""))}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="offer-note">What is included (optional)</Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {note.length}/{OFFER_NOTE_MAX}
                </span>
              </div>
              <Textarea
                id="offer-note"
                rows={3}
                maxLength={OFFER_NOTE_MAX}
                placeholder="e.g. 4 hours of live music, sound system included"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button
              className="w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleSend}
              disabled={!priceValid || saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {isUpdate ? "Update offer" : "Send offer"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingOfferDialog;
