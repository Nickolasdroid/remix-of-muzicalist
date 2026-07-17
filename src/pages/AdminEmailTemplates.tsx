import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Plus,
  Search as SearchIcon,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  Archive,
  Trash2,
  LayoutTemplate,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteTemplate as apiDeleteTemplate,
  duplicateTemplate as apiDuplicateTemplate,
  listTemplates,
  updateTemplate as apiUpdateTemplate,
  TEMPLATE_CATEGORIES,
  TEMPLATE_STATUSES,
  type EmailTemplate,
  type TemplateCategory,
  type TemplateStatus,
} from "@/lib/emailTemplates";

type CategoryFilter = "All" | TemplateCategory;
type StatusFilter = "All" | TemplateStatus;

const STATUS_STYLES: Record<TemplateStatus, string> = {
  Draft: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Archived: "bg-muted text-muted-foreground border-border",
};

const CATEGORY_STYLES: Record<TemplateCategory, string> = {
  Marketing: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20",
  Transactional: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  System: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const Pill = ({ label, className }: { label: string; className: string }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
  >
    {label}
  </span>
);

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

const AdminEmailTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [pendingDelete, setPendingDelete] = useState<EmailTemplate | null>(null);
  const [pendingArchive, setPendingArchive] = useState<EmailTemplate | null>(null);

  const load = async () => {
    setError(null);
    try {
      const rows = await listTemplates();
      setTemplates(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!templates) return [];
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (categoryFilter !== "All" && t.category !== categoryFilter) return false;
      if (statusFilter !== "All" && t.status !== statusFilter) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.type.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [templates, query, categoryFilter, statusFilter]);

  const hasAnyTemplate = (templates?.length ?? 0) > 0;
  const isFiltering =
    query.trim().length > 0 || categoryFilter !== "All" || statusFilter !== "All";

  const handleDuplicate = async (t: EmailTemplate) => {
    try {
      await apiDuplicateTemplate(t.id);
      toast.success("Template duplicated");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not duplicate template");
    }
  };

  const handleArchive = async (t: EmailTemplate) => {
    try {
      await apiUpdateTemplate(t.id, { status: "Archived" });
      toast.success("Template archived");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not archive template");
    } finally {
      setPendingArchive(null);
    }
  };

  const handleDelete = async (t: EmailTemplate) => {
    try {
      await apiDeleteTemplate(t.id);
      toast.success("Template deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete template");
    } finally {
      setPendingDelete(null);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setCategoryFilter("All");
    setStatusFilter("All");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/dashboard")}
              className="rounded-lg -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Admin
            </Button>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Email Templates
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage the reusable emails sent across the platform.
              </p>
            </div>
          </div>
          <Button
            className="rounded-lg self-start sm:self-auto"
            onClick={() => toast.info("Template editor coming soon.")}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Template
          </Button>
        </div>

        {/* Toolbar */}
        <Card className="rounded-lg border-border p-4 mb-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or type…"
                className="rounded-lg pl-9 h-11"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
            >
              <SelectTrigger className="rounded-lg h-11 md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="All">All Categories</SelectItem>
                {TEMPLATE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="rounded-lg h-11 md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="All">All Statuses</SelectItem>
                {TEMPLATE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Content */}
        {error ? (
          <Card className="rounded-lg border-border p-10 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              Could not load templates
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">{error}</p>
            <Button onClick={load} variant="outline" className="rounded-lg mt-5">
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Try Again
            </Button>
          </Card>
        ) : templates === null ? (
          <Card className="rounded-lg border-border overflow-hidden">
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_40px] gap-4 items-center"
                >
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              ))}
            </div>
          </Card>
        ) : !hasAnyTemplate ? (
          <Card className="rounded-lg border-border p-12 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <LayoutTemplate className="h-7 w-7" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              No email templates yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Templates power every automated email in the platform — from welcome
              messages to campaigns. Create your first one to get started.
            </p>
            <Button
              onClick={() => toast.info("Template editor coming soon.")}
              className="rounded-lg mt-5"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Template
            </Button>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="rounded-lg border-border p-10 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-4">
              <SearchIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              No matching templates
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Try adjusting your search or filters.
            </p>
            {isFiltering && (
              <Button
                onClick={clearFilters}
                variant="outline"
                className="rounded-lg mt-5"
              >
                Clear filters
              </Button>
            )}
          </Card>
        ) : (
          <Card className="rounded-lg border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead className="w-[60px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-foreground">
                        {t.name}
                      </TableCell>
                      <TableCell>
                        <Pill label={t.category} className={CATEGORY_STYLES[t.category]} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{t.type}</TableCell>
                      <TableCell>
                        <Pill label={t.status} className={STATUS_STYLES[t.status]} />
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDateTime(t.updated_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.updated_by ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-lg h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg w-40">
                            <DropdownMenuItem
                              onClick={() => toast.info("Template preview coming soon.")}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toast.info("Template editor coming soon.")}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(t)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {t.status !== "Archived" && (
                              <DropdownMenuItem onClick={() => setPendingArchive(t)}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setPendingDelete(t)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>

      {/* Archive confirm */}
      <AlertDialog
        open={!!pendingArchive}
        onOpenChange={(o) => !o && setPendingArchive(null)}
      >
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this template?</AlertDialogTitle>
            <AlertDialogDescription>
              Archived templates stay in the library but can't be used for new emails
              until restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Keep</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg"
              onClick={() => pendingArchive && handleArchive(pendingArchive)}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the template. This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Keep</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingDelete && handleDelete(pendingDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEmailTemplates;
