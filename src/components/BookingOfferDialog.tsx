import { useEffect, useState } from "react";
import { FileText, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { opportunityErrorText } from "@/lib/opportunities";
import { isValidPhone } from "@/lib/contracts";

interface BookingOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingOfferFields | null;
  /** Answering an event announcement: the booking request is created with the offer */
  announcementId?: string | null;
  onSent?: () => void;
}

/**
 * Artist side: send (or update) a priced offer for a booking request.
 * The booking becomes confirmed only when the organizer accepts the offer.
 */
const BookingOfferDialog = ({ open, onOpenChange, booking, announcementId, onSent }: BookingOfferDialogProps) => {
  const { toast } = useToast();
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("RON");
  const [note, setNote] = useState("");
  // Optional advance: amount + due date (written into the contract)
  const [askAdvance, setAskAdvance] = useState(false);
  const [advance, setAdvance] = useState("");
  const [advanceDue, setAdvanceDue] = useState("");
  const [saving, setSaving] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [hasContractDetails, setHasContractDetails] = useState<boolean | null>(null);
  // The contract needs the artist's phone: asked here only when it's missing
  const [needsPhone, setNeedsPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [legalName, setLegalName] = useState("");

  useEffect(() => {
    if (!open || !booking) return;
    let cancelled = false;
    setNote(booking.offer_note || "");
    setAcceptTerms(false);
    (async () => {
      const { data } = await (supabase as any)
        .from("contract_profiles")
        .select("user_id, phone")
        .eq("user_id", booking.profile_id)
        .maybeSingle();
      if (cancelled) return;
      setHasContractDetails(!!data);
      if (data?.phone) {
        setNeedsPhone(false);
        return;
      }
      const { data: rows } = await (supabase as any).rpc("get_my_full_profile");
      const me = Array.isArray(rows) ? rows[0] : rows;
      if (cancelled) return;
      setNeedsPhone(true);
      setPhone(me?.phone || "");
      setLegalName([me?.first_name, me?.last_name].filter(Boolean).join(" ") || me?.stage_name || "");
    })();
    if (booking.offer_price != null) {
      setPrice(String(booking.offer_price));
      setCurrency(booking.offer_currency || "RON");
      return;
    }
    setAskAdvance(false);
    setAdvance("");
    setAdvanceDue("");
    setPrice("");
    setCurrency("RON");
    // A booking made from an accepted collaboration carries the proposed fee ("Fee: 800 RON")
    const fee = /(?:^|\n)Fee: ([\d.]+) ([A-Z]{3})/.exec((booking as any).message || "");
    if (fee) {
      setPrice(fee[1]);
      setCurrency(fee[2]);
      return () => {
        cancelled = true;
      };
    }
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
  const todayYmd = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const advanceNumber = Number(advance.replace(",", "."));
  const advanceValid =
    !askAdvance ||
    (Number.isFinite(advanceNumber) && advanceNumber > 0 && (!priceValid || advanceNumber <= priceNumber) &&
      !!advanceDue && advanceDue >= todayYmd && (!booking || advanceDue <= booking.event_date));
  const isUpdate = booking?.status === "offered";
  const phoneValid = !needsPhone || isValidPhone(phone);

  const handleSend = async () => {
    if (!booking || !priceValid || !acceptTerms || !advanceValid || !phoneValid || saving) return;
    setSaving(true);
    if (needsPhone) {
      const cleanPhone = phone.trim();
      const { error: phoneError } = hasContractDetails
        ? await (supabase as any).from("contract_profiles").update({ phone: cleanPhone }).eq("user_id", booking.profile_id)
        : await (supabase as any).from("contract_profiles").insert({
            user_id: booking.profile_id,
            legal_name: legalName.trim().length >= 2 ? legalName.trim() : "Artist",
            phone: cleanPhone,
          });
      if (phoneError) {
        setSaving(false);
        toast({ title: "Could not save", description: "Please check the phone number and try again.", variant: "destructive" });
        return;
      }
      setHasContractDetails(true);
      setNeedsPhone(false);
    }
    const offer = {
      _price: Math.round(priceNumber * 100) / 100,
      _currency: currency,
      _note: note.trim() || null,
      _accept_terms: true,
    };
    const { error } = announcementId
      ? await (supabase as any).rpc("send_announcement_offer", { _announcement_id: announcementId, ...offer })
      : await (supabase as any).rpc("send_booking_offer", { _booking_id: booking.id, ...offer });
    // The advance is saved right after the offer (same rules for direct and event offers)
    let advanceError: unknown = null;
    if (!error && askAdvance) {
      const res = await (supabase as any).rpc("set_offer_advance", {
        ...(announcementId ? { _announcement_id: announcementId } : { _booking_id: booking.id }),
        _amount: Math.round(advanceNumber * 100) / 100,
        _due_date: advanceDue,
      });
      advanceError = res.error;
    }
    setSaving(false);
    if (advanceError) {
      toast({ title: "Offer sent without the advance", description: offerErrorText(advanceError), variant: "destructive" });
    }
    if (error) {
      toast({
        title: "Offer not sent",
        description: opportunityErrorText(error) || offerErrorText(error),
        variant: "destructive",
      });
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

            <div className="space-y-2 rounded-lg border border-border p-3">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">Ask for an advance</span>
                <Checkbox
                  checked={askAdvance}
                  onCheckedChange={(v) => {
                    const on = v === true;
                    setAskAdvance(on);
                    if (on && !advance && priceValid) setAdvance(String(Math.round(priceNumber * 0.3)));
                    if (on && !advanceDue && booking) {
                      const in7 = new Date(Date.now() + 7 * 864e5 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
                      setAdvanceDue(in7 < booking.event_date ? in7 : booking.event_date);
                    }
                  }}
                />
              </label>
              {askAdvance && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="offer-advance" className="text-xs text-muted-foreground"><span>Amount</span> <span className="notranslate" translate="no">({currency})</span></Label>
                      <Input id="offer-advance" inputMode="decimal" value={advance} onChange={(e) => setAdvance(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="offer-advance-due" className="text-xs text-muted-foreground">Pay by</Label>
                      <Input
                        id="offer-advance-due"
                        type="date"
                        min={todayYmd}
                        max={booking?.event_date}
                        value={advanceDue}
                        onChange={(e) => setAdvanceDue(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    It goes into the contract. The organizer pays it by bank transfer; you mark it as received.
                  </p>
                  {!advanceValid && (
                    <p className="text-xs text-destructive">The advance must be at most the price, due between today and the event date.</p>
                  )}
                </>
              )}
            </div>

            {needsPhone && (
              <div className="space-y-1.5">
                <Label htmlFor="offer-phone">Your phone (for the contract)</Label>
                <Input
                  id="offer-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={30}
                  placeholder="07xx xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {phone.trim() !== "" && !phoneValid && (
                  <p className="text-xs text-destructive">Enter a valid phone number.</p>
                )}
              </div>
            )}

            {hasContractDetails === false && (
              <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Your contract details are not filled in, so the contract will use the name from your profile. You can
                  add your PFA or company details in Settings → Contract Details.
                </span>
              </div>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox
                checked={acceptTerms}
                onCheckedChange={(val) => setAcceptTerms(val === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-foreground leading-snug">
                I agree that, if the organizer accepts this offer, it becomes a contract between us at this price.
              </span>
            </label>

            <Button
              className="w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleSend}
              disabled={!priceValid || !acceptTerms || !advanceValid || !phoneValid || saving}
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
