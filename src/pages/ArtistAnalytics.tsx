import { useState, useEffect, useMemo } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { goBack } from "@/lib/backNavigation";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown } from "lucide-react";
import { fetchMyProfileViews, viewsChangePct, type ProfileViewStats } from "@/lib/profileViews";
import { isPremium } from "@/lib/planLimits";

type Period = "30d" | "all";

interface RequestRow {
  status: string;
  created_at: string;
}

interface CalendarRow {
  status: string;
  event_date: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Share of `part` in `whole` as a whole percentage, or null when there is no base. */
const pct = (part: number, whole: number): number | null =>
  whole > 0 ? Math.round((part / whole) * 100) : null;

const REQUEST_SEGMENTS = [
  { key: "pending", label: "Awaiting your offer", bar: "bg-amber-500" },
  { key: "offered", label: "Offer sent", bar: "bg-blue-500" },
  { key: "booked", label: "Booked", bar: "bg-green-500" },
  { key: "rejected", label: "Declined", bar: "bg-muted-foreground/40" },
] as const;

type SegmentKey = (typeof REQUEST_SEGMENTS)[number]["key"];

const segmentOf = (status: string): SegmentKey | null => {
  if (status === "pending") return "pending";
  if (status === "offered") return "offered";
  if (status === "accepted" || status === "completed") return "booked";
  if (status === "rejected") return "rejected";
  return null;
};

const ArtistAnalytics = () => {
  usePageTitle("Statistics");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [views, setViews] = useState<ProfileViewStats | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [calendar, setCalendar] = useState<CalendarRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }
        const userId = session.user.id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", userId)
          .single();

        if (!isPremium(profile?.plan)) {
          navigate("/dashboard");
          return;
        }

        const [viewStats, { data: requestRows }, { data: calendarRows }] = await Promise.all([
          fetchMyProfileViews(),
          supabase.from("booking_requests").select("status, created_at").eq("profile_id", userId),
          supabase.from("calendar_events").select("status, event_date").eq("profile_id", userId),
        ]);

        setViews(viewStats);
        setRequests((requestRows as RequestRow[]) ?? []);
        setCalendar((calendarRows as CalendarRow[]) ?? []);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [navigate]);

  const stats = useMemo(() => {
    const since = period === "30d" ? Date.now() - 30 * DAY_MS : 0;
    const inPeriod = requests.filter((r) => new Date(r.created_at).getTime() >= since);

    const counts: Record<SegmentKey, number> = { pending: 0, offered: 0, booked: 0, rejected: 0 };
    inPeriod.forEach((r) => {
      const seg = segmentOf(r.status);
      if (seg) counts[seg] += 1;
    });

    const totalRequests = inPeriod.length;
    const profileViews = views ? (period === "30d" ? views.last30 : views.total) : 0;
    const viewsChange = period === "30d" && views ? viewsChangePct(views) : null;

    const todayIso = new Date().toISOString().slice(0, 10);
    const upcomingBooked = calendar.filter((e) => e.status === "booked" && e.event_date >= todayIso).length;
    const upcomingBlocked = calendar.filter((e) => e.status === "blocked" && e.event_date >= todayIso).length;

    return {
      counts,
      totalRequests,
      profileViews,
      viewsChange,
      requestRate: pct(totalRequests, profileViews),
      bookingRate: pct(counts.booked, totalRequests),
      responseRate: pct(totalRequests - counts.pending, totalRequests),
      upcomingBooked,
      upcomingBlocked,
    };
  }, [period, requests, calendar, views]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background md:ml-[316px] lg:ml-[356px]">
        <Navigation mobileTitle="Statistics" mobileBackPath={-1} />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  const tile = "rounded-lg bg-foreground/[0.05] p-4 md:p-5";
  const heading = "text-xl font-bold tracking-[-0.01em] text-foreground md:text-2xl";
  const rateLine = (rate: number | null, of: string) =>
    rate === null ? null : (
      <p className="mt-1 text-xs text-muted-foreground md:text-sm">
        <span className="font-semibold tabular-nums text-foreground">{rate}%</span> <span>{of}</span>
      </p>
    );

  return (
    <div className="min-h-screen bg-black md:ml-[316px] md:py-2 md:pr-2 lg:ml-[356px]">
      <Navigation mobileTitle="Statistics" mobileBackPath={-1} />
      <div
        className="min-h-screen px-4 pb-24 pt-16 md:min-h-[calc(100vh-16px)] md:rounded-lg md:px-8 md:pb-12 md:pt-10"
        style={{ background: "linear-gradient(180deg, rgba(212,175,55,0.16) 0px, #121212 320px)" }}
      >
        <div className="mx-auto max-w-4xl">
          <h1 className="hidden text-5xl font-bold leading-tight tracking-[-0.02em] text-foreground md:block">Statistics</h1>
          <p className="text-sm text-muted-foreground md:mt-2 md:text-base">How your profile turns visits into bookings.</p>

          {/* Period: grey chips like the other filters */}
          <div role="tablist" aria-label="Period" className="mt-5 flex gap-2">
            {([
              { id: "30d", label: "Last 30 days" },
              { id: "all", label: "All time" },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={period === opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`h-8 rounded-full px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                  period === opt.id ? "bg-foreground/[0.24] font-medium text-foreground" : "bg-foreground/[0.07] text-foreground hover:bg-foreground/[0.12]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* From views to bookings */}
          <section className="mt-10">
            <h2 className={heading}>From views to bookings</h2>
            <div className="mt-4 grid grid-cols-3 gap-2 md:gap-4">
              <div className={tile}>
                <p className="text-xs text-muted-foreground md:text-sm">Profile views</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground md:text-5xl">{stats.profileViews}</p>
                {stats.viewsChange !== null && (
                  <p className={`mt-1 flex items-center gap-1 text-xs md:text-sm ${stats.viewsChange >= 0 ? "text-green-500" : "text-destructive"}`}>
                    {stats.viewsChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
                    <span className="tabular-nums">{stats.viewsChange > 0 ? `+${stats.viewsChange}` : stats.viewsChange}%</span>
                  </p>
                )}
              </div>
              <div className={tile}>
                <p className="text-xs text-muted-foreground md:text-sm">Requests</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground md:text-5xl">{stats.totalRequests}</p>
                {rateLine(stats.requestRate, "of views")}
              </div>
              <div className={tile}>
                <p className="text-xs text-muted-foreground md:text-sm">Bookings</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground md:text-5xl">{stats.counts.booked}</p>
                {rateLine(stats.bookingRate, "of requests")}
              </div>
            </div>
            {stats.profileViews === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">No profile views yet in this period. Share your profile link to get discovered.</p>
            )}
          </section>

          {/* Requests by status */}
          <section className="mt-10">
            <div className="flex items-end justify-between gap-3">
              <h2 className={heading}>Booking requests</h2>
              {stats.responseRate !== null && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold tabular-nums text-foreground">{stats.responseRate}%</span> <span>response rate</span>
                </p>
              )}
            </div>
            <div className={`${tile} mt-4`}>
              {stats.totalRequests > 0 ? (
                <>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
                    {REQUEST_SEGMENTS.map((seg) =>
                      stats.counts[seg.key] > 0 ? (
                        <div key={seg.key} className={seg.bar} style={{ width: `${(stats.counts[seg.key] / stats.totalRequests) * 100}%` }} />
                      ) : null,
                    )}
                  </div>
                  <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
                    {REQUEST_SEGMENTS.map((seg) => (
                      <li key={seg.key} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${seg.bar}`} aria-hidden="true" />
                          <span className="truncate">{seg.label}</span>
                        </span>
                        <span className="font-semibold tabular-nums text-foreground">{stats.counts[seg.key]}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No booking requests in this period.</p>
              )}
            </div>
          </section>

          {/* Upcoming calendar */}
          <section className="mt-10">
            <h2 className={heading}>Upcoming</h2>
            <div className="mt-4 grid grid-cols-2 gap-2 md:gap-4">
              <div className={tile}>
                <p className="text-xs text-muted-foreground md:text-sm">Booked events</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground md:text-4xl">{stats.upcomingBooked}</p>
              </div>
              <div className={tile}>
                <p className="text-xs text-muted-foreground md:text-sm">Unavailable dates</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground md:text-4xl">{stats.upcomingBlocked}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ArtistAnalytics;
