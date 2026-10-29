import { useState, useEffect, useMemo } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { goBack } from "@/lib/backNavigation";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, ChevronRight, Eye, Inbox, CalendarCheck, CalendarX, TrendingUp, TrendingDown } from "lucide-react";
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
      <div className="min-h-screen bg-background md:ml-64">
        <Navigation mobileTitle="Statistics" mobileBackPath={-1} />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  const funnel = [
    { label: "Profile views", value: stats.profileViews, icon: Eye },
    { label: "Requests", value: stats.totalRequests, icon: Inbox },
    { label: "Bookings", value: stats.counts.booked, icon: CalendarCheck },
  ];
  const funnelRates = [stats.requestRate, stats.bookingRate];

  return (
    <div className="min-h-screen bg-background md:ml-64">
      <Navigation mobileTitle="Statistics" mobileBackPath={-1} />
      <div className="container mx-auto px-4 pt-20 md:pt-8 pb-24 md:pb-8 max-w-4xl space-y-4 md:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => goBack(navigate, "/dashboard")} className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-accent" />
              Statistics
            </h1>
          </div>

          <div role="tablist" aria-label="Period" className="inline-flex rounded-full bg-muted p-1 md:ml-auto">
            {([
              { id: "30d", label: "Last 30 days" },
              { id: "all", label: "All time" },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                role="tab"
                aria-selected={period === opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors ${
                  period === opt.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* From views to bookings */}
        <Card className="border-border/50">
          <CardContent className="p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-foreground">From views to bookings</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">How many visitors send a request, and how many requests become bookings.</p>

            <div className="mt-5 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-1 md:gap-3">
              {funnel.map((step, i) => (
                <div key={step.label} className="contents">
                  <div className="flex flex-col items-center text-center min-w-0">
                    <div className="p-2 md:p-2.5 rounded-xl bg-accent/10">
                      <step.icon className="h-4 w-4 md:h-5 md:w-5 text-accent" aria-hidden="true" />
                    </div>
                    <p className="mt-2 text-2xl md:text-4xl font-bold tabular-nums text-foreground">{step.value}</p>
                    <p className="text-[11px] md:text-sm text-muted-foreground leading-tight">{step.label}</p>
                  </div>
                  {i < funnelRates.length && (
                    <div className="flex flex-col items-center pt-3 md:pt-4 text-muted-foreground">
                      <ChevronRight className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                      <span className="text-xs md:text-sm font-semibold tabular-nums text-foreground">
                        {funnelRates[i] === null ? "–" : `${funnelRates[i]}%`}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {stats.viewsChange !== null && (
              <p className={`mt-4 flex items-center justify-center gap-1 text-xs ${stats.viewsChange >= 0 ? "text-green-500" : "text-destructive"}`}>
                {stats.viewsChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
                <span className="tabular-nums">{stats.viewsChange > 0 ? `+${stats.viewsChange}` : stats.viewsChange}%</span>
                <span className="text-muted-foreground">profile views vs. the previous 30 days</span>
              </p>
            )}
            {stats.profileViews === 0 && (
              <p className="mt-4 text-center text-xs text-muted-foreground">No profile views yet in this period. Share your profile link to get discovered.</p>
            )}
          </CardContent>
        </Card>

        {/* Requests by status */}
        <Card className="border-border/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-foreground">Booking requests</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Where each request stands right now.</p>
              </div>
              {stats.responseRate !== null && (
                <div className="text-right shrink-0">
                  <p className="text-xl md:text-2xl font-bold tabular-nums text-foreground">{stats.responseRate}%</p>
                  <p className="text-[11px] md:text-xs text-muted-foreground">Response rate</p>
                </div>
              )}
            </div>

            {stats.totalRequests > 0 ? (
              <>
                <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  {REQUEST_SEGMENTS.map((seg) =>
                    stats.counts[seg.key] > 0 ? (
                      <div key={seg.key} className={seg.bar} style={{ width: `${(stats.counts[seg.key] / stats.totalRequests) * 100}%` }} />
                    ) : null,
                  )}
                </div>
                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {REQUEST_SEGMENTS.map((seg) => (
                    <li key={seg.key} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 min-w-0 text-muted-foreground">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${seg.bar}`} aria-hidden="true" />
                        <span className="truncate">{seg.label}</span>
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">{stats.counts[seg.key]}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No booking requests in this period.</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming calendar */}
        <Card className="border-border/50">
          <CardContent className="p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-foreground">Upcoming</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3">
                <CalendarCheck className="h-5 w-5 text-green-500 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xl font-bold tabular-nums text-foreground">{stats.upcomingBooked}</p>
                  <p className="text-xs text-muted-foreground">Booked events</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarX className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xl font-bold tabular-nums text-foreground">{stats.upcomingBlocked}</p>
                  <p className="text-xs text-muted-foreground">Unavailable dates</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArtistAnalytics;
