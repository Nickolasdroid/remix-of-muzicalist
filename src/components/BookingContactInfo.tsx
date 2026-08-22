import { useEffect, useState } from "react";
import { Lock, Mail, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface BookingContactInfoProps {
  bookingId: string;
  status?: string | null;
  /** Label shown above the block, e.g. "Requester" or "Artist" */
  className?: string;
}

interface ContactRow {
  email: string | null;
  phone: string | null;
  name: string | null;
  available: boolean;
}

/**
 * Contact details are private on Muzicalist.
 * They are only exchanged between the two participants of a booking
 * AFTER the artist has accepted the request. The check is enforced
 * server-side by the get_booking_contact RPC — this component only
 * renders whatever the backend allows.
 */
const BookingContactInfo = ({ bookingId, status, className }: BookingContactInfoProps) => {
  const [contact, setContact] = useState<ContactRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setContact(null);
    (async () => {
      const { data } = await (supabase as any).rpc("get_booking_contact", {
        _booking_id: bookingId,
      });
      if (cancelled) return;
      const row = Array.isArray(data) ? data[0] : data;
      setContact((row as ContactRow) || null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId, status]);

  if (loading) {
    return <div className={`h-14 rounded-lg bg-muted/50 animate-pulse ${className || ""}`} />;
  }

  if (!contact?.available) {
    return (
      <div
        className={`flex items-start gap-3 p-3 rounded-lg bg-secondary/50 ${className || ""}`}
      >
        <Lock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Contact details are hidden</p>
          <p className="text-xs text-muted-foreground">
            Email and phone become visible to both parties only after the booking request is
            accepted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className || ""}`}>
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
        <p className="text-sm text-foreground mt-1 flex items-center gap-1 break-all">
          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          {contact.email || "—"}
        </p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone</Label>
        <p className="text-sm text-foreground mt-1 flex items-center gap-1">
          <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          {contact.phone || "—"}
        </p>
      </div>
    </div>
  );
};

export default BookingContactInfo;
