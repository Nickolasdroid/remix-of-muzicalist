import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarCheck, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { availabilityState, fetchPublicCalendar, formatInterval } from "@/lib/availability";

const parseYMD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * "Available on <date> · <hours>" strip (no place: the artist can mention it in the text) of an availability post, with a button that opens
 * the booking request for that date and time. It checks the artist's calendar: when the
 * day (or the announced hours) got booked or blocked, it shows "Booked" and hides the button.
 */
const AvailabilityBlock = ({
  profileId,
  date,
  from,
  until,
  isOwner,
}: {
  profileId: string;
  date: string;
  from?: string | null;
  until?: string | null;
  isOwner?: boolean;
}) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const locale = (i18n.language || "ro").startsWith("ro") ? "ro-RO" : "en-GB";
  const d = parseYMD(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const past = d < today;
  const [taken, setTaken] = useState(false);

  useEffect(() => {
    if (past) return;
    let active = true;
    fetchPublicCalendar(profileId).then((cal) => {
      if (active) setTaken(availabilityState(cal.get(date), from, until) === "taken");
    });
    return () => {
      active = false;
    };
  }, [profileId, date, from, until, past]);

  const label = d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
  const hours = formatInterval(from, until);
  const closed = past || taken;
  const Icon = taken ? CalendarX : CalendarCheck;

  const bookUrl = () => {
    const q = new URLSearchParams({ date });
    if (from && until) {
      q.set("from", from.slice(0, 5));
      q.set("until", until.slice(0, 5));
    }
    return `/book/${profileId}?${q}`;
  };

  return (
    <div
      className={`mx-3.5 mt-3 flex items-center gap-3 rounded-xl border px-3 py-2.5 ${closed ? "border-border bg-muted/40" : "border-accent/30 bg-accent/10"}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Icon className={`h-5 w-5 shrink-0 ${closed ? "text-muted-foreground" : "text-accent"}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {taken ? "Booked" : past ? "Was available" : "Available"}
        </p>
        <p className={`text-sm font-semibold leading-snug first-letter:uppercase notranslate ${closed ? "text-muted-foreground" : "text-foreground"}`} translate="no">
          {label}
          {hours ? ` · ${hours}` : ""}
        </p>
      </div>
      {!closed && !isOwner && (
        <Button
          size="sm"
          className="h-8 shrink-0 rounded-lg bg-accent px-3 text-accent-foreground hover:bg-accent/90"
          onClick={() => navigate(bookUrl())}
        >
          Request offer
        </Button>
      )}
    </div>
  );
};

export default AvailabilityBlock;
