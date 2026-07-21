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
import { Pencil, Trash2, Search, Eye, PauseCircle, PlayCircle, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminProfile } from "./adminProfileTypes";
import { EditProfileDialog, DeleteProfileDialog } from "./AdminProfileDialogs";

interface Props {
  profiles: AdminProfile[];
  roles: Record<string, string>;
  loading: boolean;
  refresh: () => void;
}

type SortKey = "created_at" | "name" | "last_sign_in_at";

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

export default function AdminUsersTab({ profiles, roles, loading, refresh }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const users = useMemo(
    () => profiles.filter((p) => roles[p.id] === "user"),
    [profiles, roles],
  );

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<AdminProfile | null>(null);
  const [deleting, setDeleting] = useState<AdminProfile | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingNow, setDeletingNow] = useState(false);

  const countries = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.country && set.add(u.country));
    return Array.from(set).sort();
  }, [users]);

  const now = Date.now();
  const monthAgo = now - 30 * 24 * 3600 * 1000;

  const stats = useMemo(() => {
    const total = users.length;
    const newThisMonth = users.filter(
      (u) => u.created_at && new Date(u.created_at).getTime() >= monthAgo,
    ).length;
    const active30d = users.filter(
      (u) => u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() >= monthAgo,
    ).length;
    const countriesCount = new Set(
      users.map((u) => u.country).filter(Boolean) as string[],
    ).size;
    return { total, newThisMonth, active30d, countriesCount };
  }, [users, monthAgo]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (country !== "all" && u.country !== country) return false;
      if (status === "active" && u.is_active === false) return false;
      if (status === "suspended" && u.is_active !== false) return false;
      if (dateRange !== "all" && u.created_at) {
        const ts = new Date(u.created_at).getTime();
        const days = dateRange === "7" ? 7 : dateRange === "30" ? 30 : 90;
        if (ts < now - days * 24 * 3600 * 1000) return false;
      }
      if (q) {
        const hay = [
          u.first_name,
          u.last_name,
          u.stage_name,
          u.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, search, country, status, dateRange, now]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      if (sortKey === "name") {
        av = (a.first_name ?? a.stage_name ?? "").toLowerCase();
        bv = (b.first_name ?? b.stage_name ?? "").toLowerCase();
      } else if (sortKey === "last_sign_in_at") {
        av = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
        bv = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
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

  const handleToggleSuspend = async (u: AdminProfile) => {
    const nextActive = !(u.is_active !== false);
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: nextActive })
      .eq("id", u.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: nextActive ? "User reactivated" : "User suspended" });
    refresh();
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
    toast({ title: "User updated" });
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
    toast({ title: "User deleted" });
    setDeleting(null);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total users" value={stats.total} />
        <StatCard label="New this month" value={stats.newThisMonth} />
        <StatCard label="Active (30d)" value={stats.active30d} />
        <StatCard label="Countries" value={stats.countriesCount} />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 rounded-lg"
          />
        </div>
        <Select value={country} onValueChange={(v) => { setCountry(v); setPage(1); }}>
          <SelectTrigger className="rounded-lg sm:w-44"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent className="rounded-lg max-h-72">
            <SelectItem value="all">All countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="rounded-lg sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }}>
          <SelectTrigger className="rounded-lg sm:w-40"><SelectValue placeholder="Registered" /></SelectTrigger>
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
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort("name")}>
                  User <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort("created_at")}>
                  Registered <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort("last_sign_in_at")}>
                  Last login <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>
            ) : paged.map((p) => {
              const fullName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.stage_name || "—";
              const active = p.is_active !== false;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={p.avatar_url ?? undefined} />
                        <AvatarFallback>{fullName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium text-foreground">{fullName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.email || "—"}</TableCell>
                  <TableCell className="text-sm">{p.country || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.last_sign_in_at ? new Date(p.last_sign_in_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={active ? "default" : "destructive"} className="rounded-lg">
                      {active ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap space-x-1">
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditing({ ...p })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => handleToggleSuspend(p)} title={active ? "Suspend" : "Reactivate"}>
                      {active ? <PauseCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => setDeleting(p)} disabled={roles[p.id] === "admin"}>
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
    </div>
  );
}
