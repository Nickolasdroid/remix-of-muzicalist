import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PastEvent {
  event_type: string | null;
  event_month: string;
}

const SHOWN = 5;

/**
 * Events the artist has played through Muzicalist (like Spotify's discography): the type
 * and the month only. Hidden until there is at least one.
 */
const PastEvents = ({ profileId, title }: { profileId: string; title: React.ReactNode }) => {
  const { i18n } = useTranslation();
  const [events, setEvents] = useState<PastEvent[]>([]);
  const [all, setAll] = useState(false);

  useEffect(() => {
    let active = true;
    (supabase as any)
      .rpc("get_public_past_events", { _profile_id: profileId })
      .then(({ data }: { data: PastEvent[] | null }) => active && setEvents(Array.isArray(data) ? data : []));
    return () => {
      active = false;
    };
  }, [profileId]);

  if (events.length === 0) return null;
  const locale = (i18n.language || "ro").startsWith("ro") ? "ro-RO" : "en-GB";
  const month = (ymd: string) => {
    const [y, m] = ymd.split("-").map(Number);
    const s = new Date(y, m - 1, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <div>
      {title}
      <ul className="space-y-1">
        {(all ? events : events.slice(0, SHOWN)).map((e, i) => (
          <li key={i} className="flex items-center gap-3 rounded-md py-1.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-foreground/[0.07]">
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-medium text-foreground">{e.event_type || "Event"}</span>
              <span className="block truncate text-sm text-muted-foreground notranslate" translate="no">
                {month(e.event_month)}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {events.length > SHOWN && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <span key={all ? "less" : "more"}>{all ? "Show less" : "Show all"}</span>
        </button>
      )}
    </div>
  );
};

export default PastEvents;
