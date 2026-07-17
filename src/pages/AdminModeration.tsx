import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Filter, Inbox, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import {
  BulkActionBar,
  DataTable,
  FilterBar,
  PageHeader,
  RowActions,
  SearchBar,
  SectionCard,
  StatsCard,
  StatsGrid,
  StatusBadge,
  type StatusTone,
  ConfirmDialog,
} from "@/components/admin/platform";
import { StatsGrid as _StatsGridAlias } from "@/components/admin/platform/StatsCard";
import {
  useConfirmAction,
  useFiltering,
  usePagination,
  useRealtimeTable,
  useSelection,
  useSorting,
} from "@/hooks/admin";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import type { AdminAction } from "@/lib/adminActions";
import { ModerationService } from "@/lib/moderation/service";
import type {
  ModerationCaseListRow,
  ModerationCaseStatus,
  ModerationCategoryKey,
  ModerationPriority,
} from "@/lib/moderation/types";

// ---- Static option lists (mirror seeded DB taxonomy) ---------------------

const STATUS_OPTIONS: { value: ModerationCaseStatus; label: string; tone: StatusTone }[] = [
  { value: "open", label: "Open", tone: "info" },
  { value: "triaged", label: "Triaged", tone: "neutral" },
  { value: "in_review", label: "In Review", tone: "info" },
  { value: "waiting_for_response", label: "Waiting", tone: "warning" },
  { value: "resolved", label: "Resolved", tone: "success" },
  { value: "closed", label: "Closed", tone: "muted" },
  { value: "reopened", label: "Reopened", tone: "warning" },
];

const PRIORITY_OPTIONS: { value: ModerationPriority; label: string; tone: StatusTone }[] = [
  { value: "low", label: "Low", tone: "muted" },
  { value: "medium", label: "Medium", tone: "neutral" },
  { value: "high", label: "High", tone: "warning" },
  { value: "critical", label: "Critical", tone: "danger" },
];

const CATEGORY_OPTIONS: { value: ModerationCategoryKey; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "fake_profile", label: "Fake Profile" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "copyright", label: "Copyright" },
  { value: "impersonation", label: "Impersonation" },
  { value: "fraud", label: "Fraud" },
  { value: "other", label: "Other" },
];

const SAVED_VIEWS: { id: string; label: string; filters: Partial<Filters> }[] = [
  { id: "all", label: "All open work", filters: { statuses: ["open", "triaged", "in_review", "waiting_for_response"] } },
  { id: "critical", label: "Critical only", filters: { priorities: ["critical"] } },
  { id: "unassigned", label: "Unassigned", filters: { assignedTo: "unassigned" } },
  { id: "waiting", label: "Waiting on user", filters: { statuses: ["waiting_for_response"] } },
  { id: "closed_today", label: "Closed today", filters: { statuses: ["closed", "resolved"] } },
];

// ---- Types & helpers -----------------------------------------------------

interface Filters {
  search: string;
  statuses: ModerationCaseStatus[];
  priorities: ModerationPriority[];
  categories: ModerationCategoryKey[];
  assignedTo: "any" | "unassigned" | "me";
  [key: string]: unknown;
}

const INITIAL_FILTERS: Filters = {
  search: "",
  statuses: [],
  priorities: [],
  categories: [],
  assignedTo: "any",
};

function statusTone(status: ModerationCaseStatus): StatusTone {
  return STATUS_OPTIONS.find((s) => s.value === status)?.tone ?? "neutral";
}

function priorityTone(p: ModerationPriority): StatusTone {
  return PRIORITY_OPTIONS.find((x) => x.value === p)?.tone ?? "neutral";
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  return `${mo}mo`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const PAGE_SIZE = 25;

// ==========================================================================

export default function AdminModeration() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
    });
  }, []);

  // ---- Filter / sort / paginate state ------------------------------------
  const { filters, setFilter, setFilters, reset, activeCount } =
    useFiltering<Filters>(INITIAL_FILTERS);
  const pagination = usePagination({ pageSize: PAGE_SIZE });
  const sorting = useSorting<"case_number" | "priority" | "status" | "created_at">({
    initialKey: "created_at",
    initialDirection: "desc",
  });
  const selection = useSelection();

  // ---- Data --------------------------------------------------------------
  const [rows, setRows] = useState<ModerationCaseListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const assignedTo =
        filters.assignedTo === "me" && me
          ? me
          : filters.assignedTo === "unassigned"
            ? "unassigned"
            : undefined;

      const data = await ModerationService.listCases({
        statuses: filters.statuses.length ? filters.statuses : undefined,
        priorities: filters.priorities.length ? filters.priorities : undefined,
        categoryKeys: filters.categories.length ? filters.categories : undefined,
        search: filters.search.trim() || undefined,
        assignedTo,
        limit: pagination.pageSize,
        offset: (pagination.page - 1) * pagination.pageSize,
      });
      setRows(data);
      setTotal(data[0]?.total_count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cases");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize, me]);

  useEffect(() => {
    void load();
  }, [load]);

  // ---- Realtime ----------------------------------------------------------
  useRealtimeTable<Record<string, unknown>>({
    table: "moderation_cases",
    event: "*",
    onChange: () => {
      // Preserve filters & current page; just refresh data.
      void load();
    },
  });

  // ---- Overview counters (single lightweight fetch) ----------------------
  const [overview, setOverview] = useState({
    open: 0,
    inReview: 0,
    waiting: 0,
    critical: 0,
    closedToday: 0,
  });

  const loadOverview = useCallback(async () => {
    try {
      const [open, inReview, waiting, critical, closed] = await Promise.all([
        ModerationService.listCases({ statuses: ["open"], limit: 1 }),
        ModerationService.listCases({ statuses: ["in_review"], limit: 1 }),
        ModerationService.listCases({ statuses: ["waiting_for_response"], limit: 1 }),
        ModerationService.listCases({ priorities: ["critical"], limit: 1 }),
        ModerationService.listCases({ statuses: ["closed"], limit: 1 }),
      ]);
      setOverview({
        open: open[0]?.total_count ?? 0,
        inReview: inReview[0]?.total_count ?? 0,
        waiting: waiting[0]?.total_count ?? 0,
        critical: critical[0]?.total_count ?? 0,
        closedToday: closed[0]?.total_count ?? 0,
      });
    } catch {
      /* silent — cards default to 0 */
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview, rows]);

  // ---- Row actions -------------------------------------------------------
  const confirm = useConfirmAction();

  const actions = useMemo<AdminAction<ModerationCaseListRow>[]>(
    () => [
      {
        id: "view",
        label: "View",
        onSelect: (row) => setSelectedCase(row),
      },
      {
        id: "assign",
        label: "Assign to me",
        isDisabled: (row) => !me || row.assigned_moderator_id === me,
        onSelect: async (row) => {
          if (!me) return;
          try {
            await ModerationService.assignModerator(row.id, me, row.assigned_moderator_id);
            toast({ title: "Assigned to you" });
            void load();
          } catch (e) {
            toast({
              title: "Assignment failed",
              description: e instanceof Error ? e.message : undefined,
              variant: "destructive",
            });
          }
        },
      },
      {
        id: "close",
        label: "Close",
        confirm: {
          title: "Close this case?",
          description: "The case will be archived. You can reopen it later if needed.",
          confirmLabel: "Close case",
        },
        isAvailable: (row) => row.status !== "closed",
        onSelect: async (row) => {
          await ModerationService.closeCase(row.id);
          toast({ title: `Case ${row.case_number} closed` });
          void load();
        },
      },
      {
        id: "reopen",
        label: "Reopen",
        isAvailable: (row) => row.status === "closed" || row.status === "resolved",
        onSelect: async (row) => {
          await ModerationService.reopenCase(row.id);
          toast({ title: `Case ${row.case_number} reopened` });
          void load();
        },
      },
    ],
    [me, load],
  );

  // ---- Selected case (for the right rail placeholder) --------------------
  const [selectedCase, setSelectedCase] = useState<ModerationCaseListRow | null>(null);

  // ---- Sorting (client-side over current page) ---------------------------
  const sortedRows = useMemo(
    () =>
      sorting.compare(rows, (row, key) => {
        switch (key) {
          case "case_number":
            return row.case_number;
          case "priority":
            return ["low", "medium", "high", "critical"].indexOf(row.priority);
          case "status":
            return row.status;
          case "created_at":
          default:
            return row.created_at;
        }
      }),
    [rows, sorting],
  );

  // ---- Render ------------------------------------------------------------
  const filterPanel = (
    <FiltersPanel
      filters={filters}
      setFilter={setFilter}
      setFilters={setFilters}
      reset={reset}
      activeCount={activeCount}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6 md:py-8">
        <PageHeader
          title="Moderation Center"
          description="Triage reports, assign cases, and resolve incidents."
          actions={
            <>
              {/* Mobile filter drawer trigger */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-lg">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                      {activeCount > 0 && (
                        <span className="ml-2 rounded-full bg-primary/15 px-1.5 text-xs text-primary">
                          {activeCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">{filterPanel}</div>
                  </SheetContent>
                </Sheet>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/dashboard")}>
                Back to admin
              </Button>
            </>
          }
        />

        {/* Overview stats */}
        <div className="mt-6">
          <StatsGrid className="lg:grid-cols-5">
            <StatsCard label="Open Cases" value={overview.open} tone="info" />
            <StatsCard label="In Review" value={overview.inReview} tone="info" />
            <StatsCard label="Waiting" value={overview.waiting} tone="warning" />
            <StatsCard
              label="Critical"
              value={overview.critical}
              tone="danger"
              icon={<AlertTriangle className="h-5 w-5" />}
            />
            <StatsCard label="Closed" value={overview.closedToday} tone="success" />
          </StatsGrid>
        </div>

        {/* Three-panel workspace (desktop-first) */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)_20rem]">
          {/* LEFT — filters (desktop only; drawer on mobile via header trigger) */}
          <aside className="hidden lg:block">
            <SectionCard title="Filters">
              {filterPanel}
            </SectionCard>
          </aside>

          {/* CENTER — queue */}
          <section className="min-w-0 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SearchBar
                value={filters.search}
                onChange={(v) => {
                  setFilter("search", v);
                  pagination.setPage(1);
                }}
                placeholder="Search case number, title or target…"
              />
              <div className="text-xs text-muted-foreground">
                {total > 0 ? (
                  <>
                    Showing{" "}
                    <span className="font-medium text-foreground">
                      {(pagination.page - 1) * pagination.pageSize + 1}–
                      {Math.min(pagination.page * pagination.pageSize, total)}
                    </span>{" "}
                    of <span className="font-medium text-foreground">{total}</span>
                  </>
                ) : loading ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                  </span>
                ) : (
                  "No cases"
                )}
              </div>
            </div>

            <BulkActionBar
              selectedCount={selection.count}
              onClear={selection.clear}
              actions={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast({ title: "Bulk actions coming soon", description: `${selection.count} selected` })
                  }
                >
                  Bulk actions…
                </Button>
              }
            />

            <DataTable<ModerationCaseListRow>
              rows={sortedRows}
              getRowId={(r) => r.id}
              loading={loading}
              error={error}
              onRetry={load}
              emptyTitle="No cases match your filters"
              emptyDescription="Adjust filters or clear them to see more results."
              onRowClick={(row) => setSelectedCase(row)}
              selectedIds={selection.selected}
              onToggleSelect={selection.toggle}
              onToggleSelectAll={() => selection.toggleAll(rows.map((r) => r.id))}
              sortKey={sorting.sortKey}
              sortDirection={sorting.sortDirection}
              onSortChange={(k) => sorting.toggle(k as never)}
              columns={[
                {
                  id: "case_number",
                  header: "Case",
                  sortable: true,
                  cell: (r) => (
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-muted-foreground">{r.case_number}</div>
                      <div className="truncate text-sm font-medium">{r.title}</div>
                    </div>
                  ),
                },
                {
                  id: "priority",
                  header: "Priority",
                  sortable: true,
                  cell: (r) => (
                    <StatusBadge tone={priorityTone(r.priority)} label={r.priority} />
                  ),
                },
                {
                  id: "status",
                  header: "Status",
                  sortable: true,
                  cell: (r) => (
                    <StatusBadge
                      tone={statusTone(r.status)}
                      label={r.status.replaceAll("_", " ")}
                    />
                  ),
                },
                {
                  id: "category",
                  header: "Category",
                  cell: (r) => (
                    <span className="text-xs text-muted-foreground">{r.category_label}</span>
                  ),
                },
                {
                  id: "target",
                  header: "Target",
                  cell: (r) => (
                    <div className="min-w-0">
                      <div className="text-xs font-medium">{r.target_type_key}</div>
                      <div className="truncate font-mono text-[10px] text-muted-foreground">
                        {r.target_id.slice(0, 8)}
                      </div>
                    </div>
                  ),
                },
                {
                  id: "reporter",
                  header: "Reporter",
                  cell: (r) => (
                    <span className="font-mono text-xs text-muted-foreground">
                      {r.reporter_id ? r.reporter_id.slice(0, 8) : "—"}
                    </span>
                  ),
                },
                {
                  id: "assignee",
                  header: "Assignee",
                  cell: (r) =>
                    r.assigned_moderator_id ? (
                      <span className="font-mono text-xs">
                        {r.assigned_moderator_id.slice(0, 8)}
                        {r.assigned_moderator_id === me && (
                          <span className="ml-1 text-primary">(you)</span>
                        )}
                      </span>
                    ) : (
                      <StatusBadge tone="muted" label="Unassigned" />
                    ),
                },
                {
                  id: "created_at",
                  header: "Created",
                  sortable: true,
                  cell: (r) => (
                    <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                  ),
                },
                {
                  id: "age",
                  header: "Age",
                  cell: (r) => <span className="text-xs">{formatRelative(r.created_at)}</span>,
                },
                {
                  id: "actions",
                  header: "",
                  align: "right",
                  cell: (r) => (
                    <RowActions
                      row={r}
                      actions={actions}
                      onRequestConfirm={(action, row) =>
                        confirm.request(
                          {
                            title: action.confirm!.title,
                            description: action.confirm!.description,
                            confirmLabel: action.confirm!.confirmLabel,
                            tone: action.destructive ? "danger" : "default",
                          },
                          () => action.onSelect(row),
                        )
                      }
                    />
                  ),
                },
              ]}
            />

            {/* Pagination */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                Page {pagination.page} of {Math.max(1, Math.ceil(total / pagination.pageSize))}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={pagination.prev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page * pagination.pageSize >= total}
                  onClick={pagination.next}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>

          {/* RIGHT — case details placeholder */}
          <aside className="hidden lg:block">
            <SectionCard title="Case Details">
              {selectedCase ? (
                <div className="space-y-3">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {selectedCase.case_number}
                    </div>
                    <div className="mt-1 text-sm font-medium">{selectedCase.title}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={priorityTone(selectedCase.priority)} label={selectedCase.priority} />
                    <StatusBadge
                      tone={statusTone(selectedCase.status)}
                      label={selectedCase.status.replaceAll("_", " ")}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Full case detail panel coming soon.
                  </p>
                </div>
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-center">
                  <Inbox className="h-8 w-8 text-muted-foreground/60" />
                  <p className="text-sm font-medium">Select a case to review</p>
                  <p className="text-xs text-muted-foreground">
                    Click a row in the queue to load its details here.
                  </p>
                </div>
              )}
            </SectionCard>
          </aside>
        </div>
      </main>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.setOpen}
        title={confirm.config?.title ?? ""}
        description={confirm.config?.description}
        confirmLabel={confirm.config?.confirmLabel}
        tone={confirm.config?.tone}
        loading={confirm.loading}
        onConfirm={confirm.confirm}
        onCancel={confirm.cancel}
      />
    </div>
  );
}

// ---- Left panel ----------------------------------------------------------

interface FiltersPanelProps {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  setFilters: (values: Partial<Filters>) => void;
  reset: () => void;
  activeCount: number;
}

function FiltersPanel({ filters, setFilter, setFilters, reset, activeCount }: FiltersPanelProps) {
  const toggleIn = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <div className="space-y-5">
      {/* Saved views */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Saved views
        </h3>
        <div className="space-y-1">
          {SAVED_VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setFilters({ ...INITIAL_FILTERS, ...v.filters })}
              className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <FilterGroup title="Status">
        {STATUS_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            active={filters.statuses.includes(opt.value)}
            onClick={() =>
              setFilter("statuses", toggleIn(filters.statuses, opt.value))
            }
          />
        ))}
      </FilterGroup>

      {/* Priority */}
      <FilterGroup title="Priority">
        {PRIORITY_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            active={filters.priorities.includes(opt.value)}
            onClick={() =>
              setFilter("priorities", toggleIn(filters.priorities, opt.value))
            }
          />
        ))}
      </FilterGroup>

      {/* Category */}
      <FilterGroup title="Category">
        {CATEGORY_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            active={filters.categories.includes(opt.value)}
            onClick={() =>
              setFilter("categories", toggleIn(filters.categories, opt.value))
            }
          />
        ))}
      </FilterGroup>

      {/* Assigned moderator */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Assigned to
        </h3>
        <Select
          value={filters.assignedTo}
          onValueChange={(v) => setFilter("assignedTo", v as Filters["assignedTo"])}
        >
          <SelectTrigger className="rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="any">Anyone</SelectItem>
            <SelectItem value="me">Me</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" className="w-full" onClick={reset}>
          Reset filters ({activeCount})
        </Button>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );
}
