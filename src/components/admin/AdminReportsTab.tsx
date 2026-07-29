import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DetailsDrawer, StatusBadge, ConfirmDialog } from "@/components/admin/platform";
import {
  REPORT_PRIORITIES,
  REPORT_STATUSES,
  REPORT_TYPES,
  reportPriorityMeta,
  reportStatusMeta,
  reportTypeLabel,
  type ReportRow,
} from "@/lib/reports";

interface NoteRow {
  id: string;
  body: string;
  author_name: string | null;
  created_at: string;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-lg">
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground break-words">{value || "—"}</div>
    </div>
  );
}

export default function AdminReportsTab({ onUnreadChange }: { onUnreadChange?: () => void }) {
  const { toast } = useToast();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [type, setType] = useState("all");
  const [role, setRole] = useState("all");
  const [country, setCountry] = useState("all");
  const [dateFrom, setDateFrom] = useState("");

  const [selected, setSelected] = useState<ReportRow | null>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<{ name: string; url: string }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ReportRow | null>(null);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setReports(((data as any) ?? []) as ReportRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
    const channel = supabase
      .channel("admin-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        fetchReports();
        onUnreadChange?.();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countries = useMemo(
    () => Array.from(new Set(reports.map((r) => r.country).filter(Boolean) as string[])).sort(),
    [reports],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (priority !== "all" && r.priority !== priority) return false;
      if (type !== "all" && r.type !== type) return false;
      if (role !== "all" && r.role !== role) return false;
      if (country !== "all" && r.country !== country) return false;
      if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
      if (
        q &&
        ![r.title, r.description, r.reporter_name, r.reporter_email, r.id]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      )
        return false;
      return true;
    });
  }, [reports, search, status, priority, type, role, country, dateFrom]);

  const count = (s: string) => reports.filter((r) => r.status === s).length;

  const openReport = async (report: ReportRow) => {
    setSelected(report);
    setNotes([]);
    setAttachmentUrls([]);

    if (!report.is_read) {
      await supabase.from("reports").update({ is_read: true } as any).eq("id", report.id);
      onUnreadChange?.();
    }

    const { data: noteData } = await supabase
      .from("report_notes")
      .select("id, body, author_name, created_at")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true });
    setNotes(((noteData as any) ?? []) as NoteRow[]);

    const files = report.attachments ?? [];
    if (files.length) {
      const signed = await Promise.all(
        files.map(async (f) => {
          const { data } = await supabase.storage
            .from("report-attachments")
            .createSignedUrl(f.path, 3600);
          return { name: f.name, url: data?.signedUrl ?? "" };
        }),
      );
      setAttachmentUrls(signed.filter((s) => s.url));
    }
  };

  const updateReport = async (id: string, patch: Partial<ReportRow>) => {
    const { error } = await supabase.from("reports").update(patch as any).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
    toast({ title: "Updated", description: "Report updated." });
  };

  const addNote = async () => {
    if (!selected || !noteBody.trim()) return;
    setSavingNote(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let authorName: string | null = null;
    if (user) {
      const { data: p } = await supabase
        .from("profiles")
        .select("stage_name")
        .eq("id", user.id)
        .maybeSingle();
      authorName = (p as any)?.stage_name ?? user.email ?? null;
    }
    const { data, error } = await supabase
      .from("report_notes")
      .insert({
        report_id: selected.id,
        author_id: user?.id ?? null,
        author_name: authorName,
        body: noteBody.trim(),
      } as any)
      .select("id, body, author_name, created_at")
      .single();
    setSavingNote(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setNotes((prev) => [...prev, data as any]);
    setNoteBody("");
  };

  const deleteReport = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("reports").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setReports((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
    toast({ title: "Deleted", description: "Report removed." });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Reports" value={reports.length} />
        <StatCard label="New" value={count("new")} />
        <StatCard label="In Progress" value={count("in_progress")} />
        <StatCard label="Resolved" value={count("resolved")} />
        <StatCard label="Closed" value={count("closed")} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 p-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports…"
            className="pl-9 rounded-lg"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px] rounded-lg"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All statuses</SelectItem>
            {REPORT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[140px] rounded-lg"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All priorities</SelectItem>
            {REPORT_PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[160px] rounded-lg"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All types</SelectItem>
            {REPORT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[130px] rounded-lg"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="artist">Artist</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-[150px] rounded-lg"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-[160px] rounded-lg"
        />
      </div>

      <div className="border border-border rounded-lg overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Report Type</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Reporter Name</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              filtered.map((r) => (
                <TableRow key={r.id} className={r.is_read ? undefined : "bg-accent/5"}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-sm">{reportTypeLabel(r.type)}</TableCell>
                  <TableCell className="text-sm capitalize">{r.role}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {r.reporter_name || r.reporter_email || "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={reportPriorityMeta(r.priority).tone}
                      label={reportPriorityMeta(r.priority).label}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={reportStatusMeta(r.status).tone}
                      label={reportStatusMeta(r.status).label}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openReport(r)} aria-label="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Select value={r.status} onValueChange={(v) => updateReport(r.id, { status: v })}>
                        <SelectTrigger className="h-8 w-[140px] rounded-lg text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          {REPORT_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(r)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DetailsDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.title || "Report"}
        description={selected ? `${reportTypeLabel(selected.type)} · ${new Date(selected.created_at).toLocaleString()}` : undefined}
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Report ID" value={<span className="font-mono text-xs">{selected.id}</span>} />
              <Field label="Type" value={reportTypeLabel(selected.type)} />
              <Field label="Reporter role" value={<span className="capitalize">{selected.role}</span>} />
              <Field label="Reporter name" value={selected.reporter_name} />
              <Field label="Reporter email" value={selected.reporter_email} />
              <Field label="Submitted" value={new Date(selected.created_at).toLocaleString()} />
              <Field label="Country" value={selected.country} />
              <Field label="Resolved at" value={selected.resolved_at ? new Date(selected.resolved_at).toLocaleString() : "—"} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <Select value={selected.status} onValueChange={(v) => updateReport(selected.id, { status: v })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {REPORT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Priority</p>
                <Select value={selected.priority} onValueChange={(v) => updateReport(selected.id, { priority: v })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {REPORT_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Field
              label="Page URL"
              value={
                selected.page_url ? (
                  <a
                    href={selected.page_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline break-all"
                  >
                    {selected.page_url}
                  </a>
                ) : null
              }
            />

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{selected.description}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Attachments</p>
              {attachmentUrls.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attachments.</p>
              ) : (
                <ul className="space-y-1">
                  {attachmentUrls.map((a) => (
                    <li key={a.url}>
                      <a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-accent underline">
                        {a.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-3">
              <Field label="Browser" value={selected.browser} />
              <Field label="Operating system" value={selected.os} />
              <Field label="Device" value={selected.device} />
              <Field label="Language" value={selected.language} />
              <Field label="App version" value={selected.app_version} />
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Internal notes (never visible to users)
              </p>
              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="rounded-lg border border-border bg-card/60 p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{n.author_name || "Admin"}</span>
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
              </div>
              <Textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Add an internal note…"
                className="min-h-[80px] rounded-lg"
              />
              <Button
                onClick={addNote}
                disabled={savingNote || !noteBody.trim()}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {savingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add note
              </Button>
            </div>
          </div>
        )}
      </DetailsDrawer>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete report?"
        description="This permanently removes the report and its internal notes."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={deleteReport}
      />
    </div>
  );
}
