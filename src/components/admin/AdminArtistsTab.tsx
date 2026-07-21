import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Search, Eye, Ban, RotateCcw, ArrowUpDown, Star, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminProfile } from "./adminProfileTypes";
import { EditProfileDialog, DeleteProfileDialog } from "./AdminProfileDialogs";
import { AccountStatusBadge } from "./AccountStatusBadge";
import { SuspendAccountDialog, ReactivateAccountDialog } from "./SuspendAccountDialog";
import { SuspensionHistoryDialog } from "./SuspensionHistoryDialog";

interface Props {
  profiles: AdminProfile[];
  roles: Record<string, string>;
  loading: boolean;
  refresh: () => void;
}

type SortKey = "created_at" | "stage_name" | "avg_rating" | "reviews_count";

const PAGE_SIZE = 20;

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="rounded-lg">
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminArtistsTab({ profiles, roles, loading, refresh }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const artists = useMemo(
    () => profiles.filter((p) => roles[p.id] === "artist" || !!p.specialization),
    [profiles, roles],
  );

  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState<string>("all");
  const [spec, setSpec] = useState<string>("all");
  const [verif, setVerif] = useState<string>("all");
  const [country, setCountry] = useState<string>("all");
  const [county, setCounty] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<AdminProfile | null>(null);
  const [deleting, setDeleting] = useState<AdminProfile | null>(null);
  const [suspending, setSuspending] = useState<AdminProfile | null>(null);
  const [reactivating, setReactivating] = useState<AdminProfile | null>(null);
  const [historyTarget, setHistoryTarget] = useState<AdminProfile | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingNow, setDeletingNow] = useState(false);

  const countries = useMemo(() => {
    const s = new Set<string>();
    artists.forEach((a) => a.country && s.add(a.country));
    return Array.from(s).sort();
  }, [artists]);

  const counties = useMemo(() => {
    const s = new Set<string>();
    artists.forEach((a) => {
      if (a.county && (country === "all" || a.country === country)) s.add(a.county);
    });
    return Array.from(s).sort();
  }, [artists, country]);

  const specializations = useMemo(() => {
    const s = new Set<string>();
    artists.forEach((a) => a.specialization && s.add(a.specialization));
    return Array.from(s).sort();
  }, [artists]);

  const now = Date.now();
  const monthAgo = now - 30 * 24 * 3600 * 1000;

  const stats = useMemo(() => {
    const total = artists.length;
    const free = artists.filter((a) => (a.plan ?? "Free") === "Free").length;
    const standard = artists.filter((a) => a.plan === "Standard").length;
    const premium = artists.filter((a) => a.plan === "Premium").length;
    const verified = artists.filter((a) => a.is_verified).length;
    const pending = artists.filter((a) => a.verification_status === "pending").length;
    const withReviews = artists.filter((a) => (a.reviews_count ?? 0) > 0);
    const avgRating = withReviews.length
      ? (
          withReviews.reduce((acc, a) => acc + Number(a.avg_rating ?? 0), 0) /
          withReviews.length
        ).toFixed(2)
      : "—";
    const newThisMonth = artists.filter(
      (a) => a.created_at && new Date(a.created_at).getTime() >= monthAgo,
    ).length;
    return { total, free, standard, premium, verified, pending, avgRating, newThisMonth };
  }, [artists, monthAgo]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return artists.filter((a) => {
      if (plan !== "all" && (a.plan ?? "Free") !== plan) return false;
      if (spec !== "all" && a.specialization !== spec) return false;
      if (verif !== "all") {
        if (verif === "verified" && !a.is_verified) return false;
        if (verif === "pending" && a.verification_status !== "pending") return false;
        if (verif === "unverified" && (a.is_verified || a.verification_status === "pending")) return false;
        if (verif === "rejected" && a.verification_status !== "rejected") return false;
      }
      if (country !== "all" && a.country !== country) return false;
      if (county !== "all" && a.county !== county) return false;
      if (dateRange !== "all" && a.created_at) {
        const ts = new Date(a.created_at).getTime();
        const days = dateRange === "7" ? 7 : dateRange === "30" ? 30 : 90;
        if (ts < now - days * 24 * 3600 * 1000) return false;
      }
      if (q) {
        const hay = [a.stage_name, a.first_name, a.last_name, a.email]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [artists, search, plan, spec, verif, country, county, dateRange, now]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      if (sortKey === "stage_name") {
        av = (a.stage_name ?? "").toLowerCase();
        bv = (b.stage_name ?? "").toLowerCase();
      } else if (sortKey === "avg_rating") {
        av = Number(a.avg_rating ?? 0);
        bv = Number(b.avg_rating ?? 0);
      } else if (sortKey === "reviews_count") {
        av = a.reviews_count ?? 0;
        bv = b.reviews_count ?? 0;
      } else {
        av = a.created_at ? new Date(a.created_at).getTime() : 0;
        bv = b.created_at ? new Date(b.created_at).getTime() : 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };


  const handleSaveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: editing.first_name,
        last_name: editing.last_name,
        stage_name: editing.stage_name,
        email: editing.email,
        phone: editing.phone,
        country: editing.country,
        plan: editing.plan,
      })
      .eq("id", editing.id);
    setSavingEdit(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Artist updated" });
    setEditing(null);
    refresh();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingNow(true);
    const { data, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { user_id: deleting.id },
    });
    setDeletingNow(false);
    if (error || (data && (data as any).error)) {
      toast({
        title: "Delete failed",
        description: error?.message || (data as any)?.error || "Unknown error",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Artist deleted" });
    setDeleting(null);
    refresh();
  };

  const viewProfile = (a: AdminProfile) => {
    navigate(`/artist/${a.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total artists" value={stats.total} />
        <StatCard label="Free plan" value={stats.free} />
        <StatCard label="Standard plan" value={stats.standard} />
        <StatCard label="Premium plan" value={stats.premium} />
        <StatCard label="Verified" value={stats.verified} />
        <StatCard label="Pending verification" value={stats.pending} />
        <StatCard label="Average rating" value={stats.avgRating} />
        <StatCard label="New this month" value={stats.newThisMonth} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="relative md:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by stage name, real name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 rounded-lg"
          />
        </div>
        <Select value={plan} onValueChange={(v) => { setPlan(v); setPage(1); }}>
          <SelectTrigger className="rounded-lg"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="Free">Free</SelectItem>
            <SelectItem value="Standard">Standard</SelectItem>
            <SelectItem value="Premium">Premium</SelectItem>
          </SelectContent>
        </Select>
        <Select value={spec} onValueChange={(v) => { setSpec(v); setPage(1); }}>
          <SelectTrigger className="rounded-lg"><SelectValue placeholder="Specialization" /></SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All specializations</SelectItem>
            {specializations.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={verif} onValueChange={(v) => { setVerif(v); setPage(1); }}>
          <SelectTrigger className="rounded-lg"><SelectValue placeholder="Verification" /></SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">Any verification</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={(v) => { setCountry(v); setCounty("all"); setPage(1); }}>
          <SelectTrigger className="rounded-lg"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent className="rounded-lg max-h-72">
            <SelectItem value="all">All countries</SelectItem>
            {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={county} onValueChange={(v) => { setCounty(v); setPage(1); }}>
          <SelectTrigger className="rounded-lg"><SelectValue placeholder="County / Region" /></SelectTrigger>
          <SelectContent className="rounded-lg max-h-72">
            <SelectItem value="all">All regions</SelectItem>
            {counties.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }}>
          <SelectTrigger className="rounded-lg"><SelectValue placeholder="Registered" /></SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">Any date</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort("stage_name")}>
                  Artist <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Real name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort("avg_rating")}>
                  Rating <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort("created_at")}>
                  Registered <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No artists found.</TableCell></TableRow>
            ) : paged.map((p) => {
              const active = p.is_active !== false;
              const rating = Number(p.avg_rating ?? 0);
              const rc = p.reviews_count ?? 0;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={p.avatar_url ?? undefined} />
                        <AvatarFallback>{(p.stage_name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium text-foreground">{p.stage_name || "—"}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{p.email || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {[p.county, p.country].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{p.specialization || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-lg">{p.plan || "Free"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={p.is_verified ? "default" : p.verification_status === "pending" ? "outline" : "secondary"}
                      className="rounded-lg"
                    >
                      {p.is_verified ? "Verified" : (p.verification_status || "—")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                      {rc > 0 ? rating.toFixed(1) : "—"}
                      <span className="text-muted-foreground">({rc})</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <AccountStatusBadge profile={p} />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap space-x-1">
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => viewProfile(p)} title="View profile">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditing({ ...p })} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setHistoryTarget(p)} title="Suspension history">
                      <History className="h-3.5 w-3.5" />
                    </Button>
                    {active ? (
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setSuspending(p)} title="Suspend" disabled={roles[p.id] === "admin"}>
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setReactivating(p)} title="Reactivate">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => setDeleting(p)} disabled={roles[p.id] === "admin"} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {currentPage} of {totalPages} · {sorted.length} results
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-lg" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
            <Button size="sm" variant="outline" className="rounded-lg" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button>
          </div>
        </div>
      )}

      <EditProfileDialog editing={editing} setEditing={setEditing} saving={savingEdit} onSave={handleSaveEdit} />
      <DeleteProfileDialog target={deleting} setTarget={setDeleting} deleting={deletingNow} onConfirm={handleDelete} />
      <SuspendAccountDialog target={suspending} onOpenChange={(o) => !o && setSuspending(null)} onSuccess={refresh} />
      <ReactivateAccountDialog target={reactivating} onOpenChange={(o) => !o && setReactivating(null)} onSuccess={refresh} />
      <SuspensionHistoryDialog target={historyTarget} onOpenChange={(o) => !o && setHistoryTarget(null)} />
    </div>
  );
}
