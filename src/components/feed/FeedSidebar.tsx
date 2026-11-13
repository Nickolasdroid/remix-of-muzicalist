import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isAdExpired } from "@/lib/adExpiration";
import { sortByPlanPriority } from "@/lib/planLimits";
import { useTranslation } from "react-i18next";
import { translateSpecialization } from "@/lib/specializationLabel";

/*
 * Right-hand column of the feed on wide screens (Instagram-style):
 *  1. the artist's next confirmed booking,
 *  2. artists to follow (same county or type first),
 *  3. collaboration posts near them,
 *  4. small footer links.
 */

type Viewer = { isArtist: boolean; specialization: string | null; county: string | null } | null;

type Suggestion = { id: string; stage_name: string; avatar_url: string | null; specialization: string | null; county: string | null; plan: string | null };

const Section = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <section>
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const ShowAll = ({ to }: { to: string }) => (
  <Link to={to} className="shrink-0 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground hover:underline">
    Show all
  </Link>
);

const FeedSidebar = ({ currentUserId, viewer }: { currentUserId: string | null; viewer: Viewer }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const locale = (i18n.language || "en").toLowerCase().startsWith("ro") ? "ro-RO" : "en-GB";

  const [booking, setBooking] = useState<{ id: string; event_date: string; event_type: string | null; requester_name: string } | null | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [collabs, setCollabs] = useState<any[]>([]);

  // 1. Next confirmed booking (artists only)
  useEffect(() => {
    if (!currentUserId || !viewer?.isArtist) return;
    (async () => {
      const { data } = await supabase
        .from("booking_requests")
        .select("id, event_date, event_type, requester_name")
        .eq("profile_id", currentUserId)
        .eq("status", "accepted")
        .gte("event_date", new Date().toISOString().slice(0, 10))
        .order("event_date", { ascending: true })
        .limit(1);
      setBooking((data as any[])?.[0] ?? null);
    })();
  }, [currentUserId, viewer?.isArtist]);

  // 2. Artists to follow: not followed yet, same county or same type first
  useEffect(() => {
    if (viewer === undefined) return;
    (async () => {
      const [{ data: artists }, { data: mine }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, stage_name, avatar_url, specialization, county, plan")
          .not("specialization", "is", null)
          .not("avatar_url", "is", null)
          .limit(120),
        currentUserId
          ? supabase.from("followers").select("artist_id").eq("follower_id", currentUserId)
          : Promise.resolve({ data: [] as { artist_id: string }[] }),
      ]);
      const already = new Set(((mine as any[]) || []).map((r) => r.artist_id));
      const near = (a: Suggestion) =>
        (viewer?.county && a.county === viewer.county ? 2 : 0) + (viewer?.specialization && a.specialization === viewer.specialization ? 1 : 0);
      const list = ((artists as Suggestion[]) || [])
        .filter((a) => a.id !== currentUserId && !already.has(a.id) && a.stage_name)
        .sort((a, b) => near(b) - near(a) || sortByPlanPriority(a as any, b as any))
        .slice(0, 5);
      setSuggestions(list);
    })();
  }, [currentUserId, viewer]);

  // 3. Collaboration posts near the viewer
  useEffect(() => {
    if (viewer === undefined) return;
    (async () => {
      let req = supabase
        .from("announcements")
        .select("id, title, county, city, event_date, expires_at, created_at, kind, profile_id, profiles!profile_id!inner (stage_name, avatar_url)")
        .eq("kind", "collab")
        .order("created_at", { ascending: false })
        .limit(12);
      if (currentUserId) req = req.neq("profile_id", currentUserId);
      const { data } = await req;
      const open = ((data as any[]) || []).filter((a) => !isAdExpired(a));
      const sorted = viewer?.county ? [...open].sort((a, b) => Number(b.county === viewer.county) - Number(a.county === viewer.county)) : open;
      setCollabs(sorted.slice(0, 3));
    })();
  }, [currentUserId, viewer]);

  const follow = async (artistId: string) => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    setFollowed((s) => new Set(s).add(artistId));
    const { error } = await supabase.from("followers").insert({ artist_id: artistId, follower_id: currentUserId });
    if (error) setFollowed((s) => { const n = new Set(s); n.delete(artistId); return n; });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });

  return (
    <aside className="space-y-8" aria-label="More on Muzicalist">
      {viewer?.isArtist && booking !== undefined && (
        <Section title="Your next booking" action={<ShowAll to="/calendar" />}>
          {booking ? (
            <Link to="/calendar" className="flex items-center gap-3 rounded-lg bg-foreground/[0.06] p-3 transition-colors hover:bg-foreground/[0.1]">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-foreground/[0.08]">
                <CalendarDays className="h-5 w-5 text-foreground" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground notranslate" translate="no">{formatDate(booking.event_date)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {booking.event_type ? <span>{booking.event_type}</span> : null}
                  {booking.event_type ? " · " : null}
                  <span className="notranslate" translate="no">{booking.requester_name}</span>
                </p>
              </div>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming bookings yet.</p>
          )}
        </Section>
      )}

      {suggestions.length > 0 && (
        <Section title="Artists you might follow">
          <ul className="space-y-3">
            {suggestions.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <Link to={`/artist/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={a.avatar_url ?? undefined} alt="" className="object-cover" />
                    <AvatarFallback>{a.stage_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground notranslate" translate="no">{a.stage_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      <span>{translateSpecialization(a.specialization)}</span>
                      {a.county ? <> · <span className="notranslate" translate="no">{a.county}</span></> : null}
                    </p>
                  </div>
                </Link>
                {followed.has(a.id) ? (
                  <span className="shrink-0 text-xs font-bold text-muted-foreground">Following</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => follow(a.id)}
                    className="h-8 shrink-0 rounded-full border border-foreground/30 px-3.5 text-xs font-bold text-foreground transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    Follow
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {collabs.length > 0 && (
        <Section title={viewer?.county ? "Collaborations near you" : "Collaborations"} action={<ShowAll to="/feed?f=collab" />}>
          <ul className="space-y-2">
            {collabs.map((c) => (
              <li key={c.id}>
                <Link to="/feed?f=collab" className="block rounded-lg bg-foreground/[0.06] p-3 transition-colors hover:bg-foreground/[0.1]">
                  <p className="line-clamp-2 text-sm font-bold text-foreground notranslate" translate="no">{c.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate notranslate" translate="no">{[c.city, c.county].filter(Boolean).join(", ") || c.profiles?.stage_name}</span>
                    {c.event_date ? <span className="shrink-0 notranslate" translate="no"> · {formatDate(c.event_date)}</span> : null}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-label="About Muzicalist">
        <Link to="/about" className="hover:text-foreground hover:underline">About us</Link>
        <Link to="/help" className="hover:text-foreground hover:underline">Help</Link>
        <Link to="/terms-of-service" className="hover:text-foreground hover:underline">Terms</Link>
        <Link to="/privacy-policy" className="hover:text-foreground hover:underline">Privacy</Link>
        <span className="w-full notranslate" translate="no">© {new Date().getFullYear()} Muzicalist</span>
      </nav>
    </aside>
  );
};

export default FeedSidebar;
