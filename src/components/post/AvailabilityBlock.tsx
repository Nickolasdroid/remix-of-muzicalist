import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const parseYMD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * "Available on <date>" strip of an availability post, with a button that opens the
 * booking request for that date. Past dates show as no longer available.
 */
const AvailabilityBlock = ({
  profileId,
  date,
  place,
  isOwner,
}: {
  profileId: string;
  date: string;
  place?: string | null;
  isOwner?: boolean;
}) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const locale = (i18n.language || "ro").startsWith("ro") ? "ro-RO" : "en-GB";
  const d = parseYMD(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const past = d < today;
  const label = d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-3.5 mt-3 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
      <CalendarCheck className={`h-5 w-5 shrink-0 ${past ? "text-muted-foreground" : "text-accent"}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{past ? "Was available" : "Available"}</p>
        <p className="text-sm font-semibold leading-snug text-foreground first-letter:uppercase notranslate" translate="no">
          {label}
          {place ? ` · ${place}` : ""}
        </p>
      </div>
      {!past && !isOwner && (
        <Button
          size="sm"
          className="h-8 shrink-0 rounded-lg bg-accent px-3 text-accent-foreground hover:bg-accent/90"
          onClick={() => navigate(`/book/${profileId}?date=${date}`)}
        >
          Request offer
        </Button>
      )}
    </div>
  );
};

export default AvailabilityBlock;
