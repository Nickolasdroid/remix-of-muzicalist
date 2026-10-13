import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard, StatsGrid } from "@/components/admin/platform/StatsCard";
import { SectionCard } from "@/components/admin/platform/SectionCard";
import { DataTable, type DataTableColumn } from "@/components/admin/platform/DataTable";
import { DetailsDrawer } from "@/components/admin/platform/DetailsDrawer";
import { SearchBar } from "@/components/admin/platform/SearchBar";
import { FilterBar } from "@/components/admin/platform/FilterBar";
import { EmptyState } from "@/components/admin/platform/EmptyState";
import { LoadingState } from "@/components/admin/platform/LoadingState";
import { ErrorState } from "@/components/admin/platform/ErrorState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Repeat, Users, CalendarDays, Timer } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend,
} from "recharts";

type RangeKey = "7" | "30" | "90" | "custom";

interface Overview {
  tracking_started: string | null;
  active_users: number;
  active_by_type: Record<string, number> | null;
  avg_dau: number | null;
  mau: number;
  sessions: number;
  active_seconds: number;
  seconds_by_type: Record<string, number> | null;
  returning_users: number;
  new_users: number;
  series: { day: string; users: number; artists: number; active_seconds: number; new_users: number; returning_users: number }[];
}

interface AccountRow {
  id: string;
  name: string;
  account_type: "artist" | "user";
  plan: string | null;
  last_active: string | null;
  active_seconds: number;
  sessions: number;
  active_days: number;
  profile_views: number;
  searches: number;
}

interface Detail {
  series: { day: string; active_seconds: number; sessions: number }[];
  last_active: string | null;
  sessions: number;
  avg_session_seconds: number | null;
  events: Record<string, number>;
  completed: Record<string, number>;
}

const PAGE = 25;
const iso = (d: Date) => d.toISOString().slice(0, 10);

export const formatDuration = (secs: number | null | undefined) => {
  const s = Math.max(0, Math.round(secs ?? 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const EVENT_LABELS: Record<string, string> = {
  artist_profile_view: "Artist profile views",
  search_performed: "Searches",
  search_result_click: "Search result clicks",
  post_view: "Post views",
  announcements_view: "Announcements page views",
  booking_started: "Booking forms opened",
  gallery_media_open: "Gallery media opened",
};
const COMPLETED_LABELS: Record<string, string> = {
  booking_requests_sent: "Booking requests sent",
  follows: "Follows",
  posts_created: "Posts created",
  announcements_created: "Announcements created",
  reviews_written: "Reviews written",
  gallery_uploads: "Gallery uploads",
};

const AdminActivityTab = () => {
  const [range, setRange] = useState<RangeKey>("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { from, to } = useMemo(() => {
    const today = new Date();
    if (range === "custom" && customFrom && customTo && customFrom <= customTo) return { from: customFrom, to: customTo };
    const days = range === "custom" ? 30 : Number(range);
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    return { from: iso(start), to: iso(today) };
  }, [range, customFrom, customTo]);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [ovLoading, setOvLoading] = useState(true);
  const [ovError, setOvError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setOvLoading(true);
    setOvError(null);
    const { data, error } = await (supabase as any).rpc("admin_activity_overview", { _from: from, _to: to });
    if (error) setOvError(error.message);
    else setOverview(data as Overview);
    setOvLoading(false);
  }, [from, to]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  // Accounts table
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("active_seconds");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [total, setTotal] = useState(0);
  const [tLoading, setTLoading] = useState(true);
  const [tError, setTError] = useState<string | null>(null);

  useEffect(() => { setPage(0); }, [search, type, plan, status, sort, from, to]);

  const loadAccounts = useCallback(async () => {
    setTLoading(true);
    setTError(null);
    const { data, error } = await (supabase as any).rpc("admin_activity_accounts", {
      _from: from, _to: to, _search: search.trim() || null,
      _type: type === "all" ? null : type, _plan: plan === "all" ? null : plan,
      _status: status === "all" ? null : status, _sort: sort, _limit: PAGE, _offset: page * PAGE,
    });
    if (error) setTError(error.message);
    else { setRows((data?.rows ?? []) as AccountRow[]); setTotal(data?.total ?? 0); }
    setTLoading(false);
  }, [from, to, search, type, plan, status, sort, page]);

  useEffect(() => {
    const h = window.setTimeout(loadAccounts, 250);
    return () => window.clearTimeout(h);
  }, [loadAccounts]);

  // Detail drawer
  const [selected, setSelected] = useState<AccountRow | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [dLoading, setDLoading] = useState(false);
  useEffect(() => {
    if (!selected) return;
    setDLoading(true);
    setDetail(null);
    (supabase as any).rpc("admin_activity_account_detail", { _user: selected.id, _from: from, _to: to })
      .then(({ data }: { data: Detail }) => { setDetail(data); setDLoading(false); });
  }, [selected, from, to]);

  const columns: DataTableColumn<AccountRow>[] = [
    { id: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name || "—"}</span> },
    { id: "type", header: "Type", cell: (r) => <Badge variant="secondary" className="rounded-lg">{r.account_type === "artist" ? "Artist" : "User"}</Badge> },
    { id: "plan", header: "Plan", cell: (r) => r.plan ?? "—" },
    { id: "last_active", header: "Last active", sortable: true, cell: (r) => r.last_active ? new Date(r.last_active).toLocaleString() : "Never" },
    { id: "active_seconds", header: "Active time", sortable: true, align: "right", cell: (r) => formatDuration(r.active_seconds) },
    { id: "sessions", header: "Sessions", sortable: true, align: "right", cell: (r) => r.sessions },
    { id: "active_days", header: "Active days", sortable: true, align: "right", cell: (r) => r.active_days },
    { id: "profile_views", header: "Profile views", align: "right", cell: (r) => r.profile_views },
    { id: "searches", header: "Searches", align: "right", cell: (r) => r.searches },
  ];

  const series = (overview?.series ?? []).map((d) => ({
    ...d,
    label: d.day.slice(5),
    minutes: Math.round(d.active_seconds / 60),
  }));
  const hasData = !!overview && overview.active_users > 0;
  const avgPerSession = overview && overview.sessions > 0 ? overview.active_seconds / overview.sessions : 0;
  const avgPerUser = overview && overview.active_users > 0 ? overview.active_seconds / overview.active_users : 0;
  const retention = overview && overview.active_users > 0 ? Math.round((overview.returning_users / overview.active_users) * 100) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="flex flex-col gap-6">
      <FilterBar>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="w-[160px] rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
        {range === "custom" && (
          <>
            <Input type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} className="w-[160px] rounded-lg" aria-label="From" />
            <Input type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} className="w-[160px] rounded-lg" aria-label="To" />
          </>
        )}
        <span className="text-xs text-muted-foreground">{from} → {to} (UTC)</span>
      </FilterBar>

      {ovLoading ? <LoadingState label="Loading activity…" /> : ovError ? <ErrorState message={ovError} onRetry={loadOverview} /> : !hasData ? (
        <EmptyState
          title="No activity recorded for this period"
          description={overview?.tracking_started
            ? `Activity tracking started on ${overview.tracking_started}. Earlier activity was not recorded.`
            : "Activity tracking was just enabled. Data appears as signed-in users and artists use Muzicalist; no earlier history exists."}
        />
      ) : (
        <>
          <StatsGrid>
            <StatsCard label="Avg. daily active" value={overview!.avg_dau ?? 0} icon={<Activity className="h-4 w-4" />} hint="Average accounts active per day" />
            <StatsCard label="Monthly active (30d)" value={overview!.mau} icon={<Users className="h-4 w-4" />} hint="Distinct accounts active in the 30 days ending on the last day" />
            <StatsCard label="Sessions" value={overview!.sessions} icon={<CalendarDays className="h-4 w-4" />} hint="A session ends after 30 min without activity" />
            <StatsCard label="Avg. time / session" value={formatDuration(avgPerSession)} icon={<Timer className="h-4 w-4" />} />
            <StatsCard label="Avg. time / active account" value={formatDuration(avgPerUser)} icon={<Clock className="h-4 w-4" />} />
            <StatsCard label="Returning" value={`${retention}%`} icon={<Repeat className="h-4 w-4" />} hint={`${overview!.returning_users} of ${overview!.active_users} active accounts were also active on an earlier day`} />
          </StatsGrid>

          <div className="grid gap-4 md:grid-cols-2">
            <StatsCard label="Active users" value={overview!.active_by_type?.user ?? 0} hint={`Active time ${formatDuration(overview!.seconds_by_type?.user)}`} />
            <StatsCard label="Active artists" value={overview!.active_by_type?.artist ?? 0} hint={`Active time ${formatDuration(overview!.seconds_by_type?.artist)}`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Active accounts per day">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="users" name="Users" stroke="hsl(var(--muted-foreground))" dot={false} />
                    <Line type="monotone" dataKey="artists" name="Artists" stroke="hsl(var(--accent))" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
            <SectionCard title="Active time per day (minutes)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="minutes" name="Minutes" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
            <SectionCard title="New vs returning accounts per day" className="lg:col-span-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="new_users" name="New" stackId="a" fill="hsl(var(--accent))" />
                    <Bar dataKey="returning_users" name="Returning" stackId="a" fill="hsl(var(--muted-foreground))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
        </>
      )}

      <SectionCard title="User and artist activity">
        <FilterBar>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name" className="w-full sm:w-56" />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[130px] rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="artist">Artists</SelectItem>
            </SelectContent>
          </Select>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger className="w-[130px] rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              <SelectItem value="Free">Free</SelectItem>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Premium">Premium</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px] rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Active & inactive</SelectItem>
              <SelectItem value="active">Active in period</SelectItem>
              <SelectItem value="inactive">Inactive in period</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>
        <div className="overflow-x-auto">
          <DataTable<AccountRow>
            columns={columns}
            rows={rows}
            getRowId={(r: AccountRow) => r.id}
            loading={tLoading}
            error={tError}
            onRetry={loadAccounts}
            emptyTitle="No accounts match these filters"
            onRowClick={(r: AccountRow) => setSelected(r)}
            sortKey={sort}
            sortDirection="desc"
            onSortChange={setSort}
          />
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} accounts</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-lg" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span>{page + 1} / {pages}</span>
            <Button variant="outline" size="sm" className="rounded-lg" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </SectionCard>

      <DetailsDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.name ?? ""}
        description={selected ? `${selected.account_type === "artist" ? "Artist" : "User"}${selected.plan ? ` · ${selected.plan}` : ""} · ${from} → ${to}` : undefined}
      >
        {dLoading || !detail ? <LoadingState label="Loading…" /> : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <StatsCard label="Last active" value={detail.last_active ? new Date(detail.last_active).toLocaleDateString() : "Never"} />
              <StatsCard label="Sessions" value={detail.sessions} />
              <StatsCard label="Avg. session" value={formatDuration(detail.avg_session_seconds)} />
              <StatsCard label="Active days" value={detail.series.filter((d) => d.active_seconds > 0).length} />
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={detail.series.map((d) => ({ label: d.day.slice(5), minutes: Math.round(d.active_seconds / 60) }))}>
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="minutes" name="Active minutes" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Feature usage</p>
              <ul className="space-y-1 text-sm">
                {Object.entries(EVENT_LABELS).map(([k, label]) => (
                  <li key={k} className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="tabular-nums">{detail.events?.[k] ?? 0}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Completed actions</p>
              <ul className="space-y-1 text-sm">
                {Object.entries(COMPLETED_LABELS).map(([k, label]) => (
                  <li key={k} className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="tabular-nums">{detail.completed?.[k] ?? 0}</span></li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </DetailsDrawer>
    </div>
  );
};

export default AdminActivityTab;
