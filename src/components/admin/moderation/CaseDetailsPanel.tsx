/**
 * CaseDetailsPanel — moderator investigation workspace.
 *
 * Rendered in the right rail of /admin/moderation on desktop, and inside a
 * full-screen Sheet on mobile. All writes go through ModerationService; the
 * timeline, notes, evidence and actions streams refresh live via
 * useRealtimeTable subscriptions filtered by case_id.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Flag,
  History,
  ImageIcon,
  Link2,
  Loader2,
  MessageSquarePlus,
  Paperclip,
  RefreshCw,
  Send,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Video as VideoIcon,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SectionCard,
  StatusBadge,
  type StatusTone,
} from "@/components/admin/platform";
import { useRealtimeTable } from "@/hooks/admin";
import { toast } from "@/hooks/use-toast";
import { ModerationService } from "@/lib/moderation/service";
import type {
  ModerationAction,
  ModerationCaseDetails,
  ModerationCaseEvent,
  ModerationCaseListRow,
  ModerationCaseNote,
  ModerationCaseStatus,
  ModerationEventType,
  ModerationEvidence,
  ModerationPriority,
} from "@/lib/moderation/types";
import { formatEventTitle } from "@/lib/moderation/timelineService";
import { isConflictError } from "@/lib/moderation/collab";
import { useCasePresence } from "@/hooks/moderation/useCasePresence";
import { CollaborationHeader } from "./CollaborationHeader";

// ---- Static option lists (mirror the queue) ------------------------------

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

function toneFor<T extends { value: string; tone: StatusTone }>(list: T[], v: string): StatusTone {
  return list.find((x) => x.value === v)?.tone ?? "neutral";
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(ms: number): string {
  if (ms < 60_000) return "under a minute";
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const rem = min % 60;
  if (h < 24) return rem ? `${h}h ${rem}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

const EVENT_ICON: Partial<Record<ModerationEventType, JSX.Element>> = {
  case_created: <Flag className="h-3.5 w-3.5" />,
  case_assigned: <UserCheck className="h-3.5 w-3.5" />,
  case_unassigned: <UserPlus className="h-3.5 w-3.5" />,
  status_changed: <RefreshCw className="h-3.5 w-3.5" />,
  priority_changed: <AlertCircle className="h-3.5 w-3.5" />,
  category_changed: <FileText className="h-3.5 w-3.5" />,
  report_added: <Flag className="h-3.5 w-3.5" />,
  evidence_added: <Paperclip className="h-3.5 w-3.5" />,
  note_added: <MessageSquarePlus className="h-3.5 w-3.5" />,
  action_applied: <ShieldCheck className="h-3.5 w-3.5" />,
  action_reversed: <X className="h-3.5 w-3.5" />,
  case_resolved: <CheckCircle2 className="h-3.5 w-3.5" />,
  case_closed: <CheckCircle2 className="h-3.5 w-3.5" />,
  case_reopened: <RefreshCw className="h-3.5 w-3.5" />,
  system_note: <FileText className="h-3.5 w-3.5" />,
  decision_changed: <FileText className="h-3.5 w-3.5" />,
  appeal_received: <Flag className="h-3.5 w-3.5" />,
};

// --------------------------------------------------------------------------

export interface CaseDetailsPanelProps {
  caseRow: ModerationCaseListRow;
  currentUserId: string | null;
  onChanged?: () => void;
  onClose?: () => void;
}

export function CaseDetailsPanel({
  caseRow,
  currentUserId,
  onChanged,
  onClose,
}: CaseDetailsPanelProps) {
  const caseId = caseRow.id;

  const [details, setDetails] = useState<ModerationCaseDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [tab, setTab] = useState("overview");
  const [selfProfile, setSelfProfile] = useState<{ name: string; avatar_url: string | null }>({
    name: "Moderator",
    avatar_url: null,
  });
  const [assignedProfile, setAssignedProfile] = useState<{ id: string; name: string } | null>(null);
  const [pendingChange, setPendingChange] = useState(false);
  const lastSeenUpdatedAt = useRef<string>(caseRow.updated_at);

  // -- Load self profile once so presence broadcasts a real name/avatar. --
  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;
    void supabase
      .from("profiles")
      .select("stage_name, avatar_url, email")
      .eq("id", currentUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setSelfProfile({
          name: (data.stage_name as string) || (data.email as string) || "Moderator",
          avatar_url: (data.avatar_url as string | null) ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const presence = useCasePresence({
    caseId,
    selfId: currentUserId,
    selfName: selfProfile.name,
    selfAvatar: selfProfile.avatar_url,
  });

  const loadDetails = useCallback(async () => {
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const data = await ModerationService.getCase(caseId);
      setDetails(data);
      setPendingChange(false);
    } catch (e) {
      setDetailsError(e instanceof Error ? e.message : "Failed to load case");
    } finally {
      setDetailsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    lastSeenUpdatedAt.current = caseRow.updated_at;
  }, [caseId, caseRow.updated_at]);

  // Live-refresh header. If the case changed since we last saw it, surface a
  // banner instead of stomping in-progress edits.
  useRealtimeTable<{ id: string; updated_at: string }>({
    table: "moderation_cases",
    filter: `id=eq.${caseId}`,
    event: "UPDATE",
    onChange: (payload) => {
      const remote = (payload.new as { updated_at?: string })?.updated_at;
      if (remote && remote > lastSeenUpdatedAt.current) {
        setPendingChange(true);
      }
    },
  });

  // Resolve the assigned moderator's name for the assignment warning.
  useEffect(() => {
    const id = caseRow.assigned_moderator_id;
    if (!id || id === currentUserId) {
      setAssignedProfile(null);
      return;
    }
    let cancelled = false;
    void supabase
      .from("profiles")
      .select("stage_name, email")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setAssignedProfile({
          id,
          name:
            (data?.stage_name as string | undefined) ||
            (data?.email as string | undefined) ||
            "another moderator",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [caseRow.assigned_moderator_id, currentUserId]);

  const status = caseRow.status;
  const priority = caseRow.priority;
  const isReadOnly = presence.isReadOnly;

  const notify = (title: string, description?: string, error = false) =>
    toast({ title, description, variant: error ? "destructive" : undefined });

  const runAction = async (fn: () => Promise<unknown>, ok: string, fail = "Action failed") => {
    if (isReadOnly) {
      notify("Read-only mode", "Take over the review to make changes.", true);
      return;
    }
    try {
      await fn();
      notify(ok);
      onChanged?.();
      void loadDetails();
    } catch (e) {
      if (isConflictError(e)) {
        notify(
          "This case has changed",
          "Someone else modified it. Latest state loaded.",
          true,
        );
        void loadDetails();
        onChanged?.();
      } else {
        notify(fail, e instanceof Error ? e.message : undefined, true);
      }
    }
  };

  const handleTakeOver = async () => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        `Take over review from ${presence.lockHolder?.name ?? "the current reviewer"}? They will drop to read-only.`,
      );
      if (!ok) return;
    }
    await presence.takeOver();
    notify("Review taken over");
  };


  const resolutionTime =
    caseRow.closed_at || caseRow.resolved_at
      ? fmtDuration(
          new Date(caseRow.closed_at ?? caseRow.resolved_at!).getTime() -
            new Date(caseRow.created_at).getTime(),
        )
      : null;

  return (
    <div className="flex h-full flex-col">
      {/* ---- Header ---------------------------------------------------- */}
      <div className="space-y-3 border-b border-border px-4 py-4 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-xs text-muted-foreground">
              {caseRow.case_number}
            </div>
            <h2 className="mt-1 truncate text-base font-semibold leading-snug">
              {caseRow.title}
            </h2>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <StatusBadge tone={toneFor(PRIORITY_OPTIONS, priority)} label={priority} />
          <StatusBadge
            tone={toneFor(STATUS_OPTIONS, status)}
            label={status.replaceAll("_", " ")}
          />
          <StatusBadge tone="neutral" label={caseRow.category_label} />
          <StatusBadge tone="muted" label={caseRow.target_type_key} />
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <div>
            <dt className="uppercase tracking-wide">Target ID</dt>
            <dd className="truncate font-mono text-foreground/80">{caseRow.target_id}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Reporter</dt>
            <dd className="truncate font-mono text-foreground/80">
              {caseRow.reporter_id ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Assigned</dt>
            <dd className="truncate font-mono text-foreground/80">
              {caseRow.assigned_moderator_id ?? "Unassigned"}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Created</dt>
            <dd className="text-foreground/80">{fmtDate(caseRow.created_at)}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Updated</dt>
            <dd className="text-foreground/80">{fmtDate(caseRow.updated_at)}</dd>
          </div>
          {resolutionTime && (
            <div>
              <dt className="uppercase tracking-wide">Resolution time</dt>
              <dd className="text-foreground/80">{resolutionTime}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* ---- Tabs ------------------------------------------------------ */}
      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border px-2 md:px-4">
          <TabsList className="h-9 w-full justify-start bg-transparent p-0">
            {[
              ["overview", "Overview"],
              ["timeline", "Timeline"],
              ["evidence", "Evidence"],
              ["notes", "Notes"],
              ["actions", "Actions"],
            ].map(([v, label]) => (
              <TabsTrigger
                key={v}
                value={v}
                className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
          <TabsContent value="overview" className="mt-0 space-y-4">
            <OverviewTab
              caseRow={caseRow}
              details={details}
              detailsLoading={detailsLoading}
              detailsError={detailsError}
              currentUserId={currentUserId}
              runAction={runAction}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <TimelineTab caseId={caseId} />
          </TabsContent>

          <TabsContent value="evidence" className="mt-0">
            <EvidenceTab caseId={caseId} />
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <NotesTab caseId={caseId} />
          </TabsContent>

          <TabsContent value="actions" className="mt-0">
            <ActionsTab caseId={caseId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// =========================================================================
// Overview
// =========================================================================

function OverviewTab({
  caseRow,
  details,
  detailsLoading,
  detailsError,
  currentUserId,
  runAction,
}: {
  caseRow: ModerationCaseListRow;
  details: ModerationCaseDetails | null;
  detailsLoading: boolean;
  detailsError: string | null;
  currentUserId: string | null;
  runAction: (fn: () => Promise<unknown>, ok: string, fail?: string) => Promise<void>;
}) {
  const closed = caseRow.status === "closed" || caseRow.status === "resolved";

  return (
    <div className="space-y-4">
      {caseRow.summary && (
        <SectionCard title="Summary">
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{caseRow.summary}</p>
        </SectionCard>
      )}

      <SectionCard title="Reporter">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field label="Reporter ID" value={caseRow.reporter_id ?? "Anonymous"} mono />
          <Field label="Reports on case" value={String(caseRow.reports_count)} />
        </div>
      </SectionCard>

      <SectionCard title="Target">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field label="Type" value={caseRow.target_type_key} />
          <Field label="ID" value={caseRow.target_id} mono />
          <Field label="Category" value={caseRow.category_label} />
        </div>
      </SectionCard>

      <SectionCard title="Assignment">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field
            label="Assigned moderator"
            value={caseRow.assigned_moderator_id ?? "Unassigned"}
            mono
          />
          <Field label="Status" value={caseRow.status.replaceAll("_", " ")} />
        </div>
      </SectionCard>

      {detailsLoading && <LoadingState label="Loading case details…" />}
      {detailsError && <ErrorState title="Couldn't load details" message={detailsError} />}

      {details && (
        <SectionCard title="Case metrics">
          <div className="grid grid-cols-4 gap-2 text-center">
            <Metric label="Evidence" value={details.evidence_count} />
            <Metric label="Notes" value={details.notes_count} />
            <Metric label="Actions" value={details.actions_count} />
            <Metric label="Events" value={details.events_count} />
          </div>
        </SectionCard>
      )}

      <SectionCard title="Quick actions">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!currentUserId || caseRow.assigned_moderator_id === currentUserId}
            onClick={() =>
              runAction(
                () =>
                  ModerationService.assignModerator(
                    caseRow.id,
                    currentUserId!,
                    caseRow.assigned_moderator_id,
                  ),
                "Assigned to you",
              )
            }
          >
            <UserCheck className="mr-1.5 h-3.5 w-3.5" />
            Assign to me
          </Button>

          {closed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                runAction(() => ModerationService.reopenCase(caseRow.id), "Case reopened")
              }
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Reopen case
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                runAction(() => ModerationService.closeCase(caseRow.id), "Case closed")
              }
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Close case
            </Button>
          )}

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
              Change status
            </label>
            <Select
              value={caseRow.status}
              onValueChange={(v) =>
                runAction(
                  () =>
                    ModerationService.changeStatus(
                      caseRow.id,
                      caseRow.status,
                      v as ModerationCaseStatus,
                    ),
                  "Status updated",
                  "Transition not allowed",
                )
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
              Change priority
            </label>
            <Select
              value={caseRow.priority}
              onValueChange={(v) =>
                runAction(
                  () => ModerationService.changePriority(caseRow.id, v as ModerationPriority),
                  "Priority updated",
                )
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={mono ? "truncate font-mono text-xs" : "truncate text-xs"}>{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-card px-2 py-2">
      <div className="text-lg font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

// =========================================================================
// Timeline
// =========================================================================

function TimelineTab({ caseId }: { caseId: string }) {
  const [events, setEvents] = useState<ModerationCaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ModerationService.getTimeline(caseId);
      setEvents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeTable({
    table: "moderation_case_events",
    filter: `case_id=eq.${caseId}`,
    event: "INSERT",
    onChange: () => void load(),
  });

  if (loading) return <LoadingState label="Loading timeline…" />;
  if (error) return <ErrorState title="Couldn't load timeline" message={error} />;
  if (!events.length)
    return (
      <EmptyState
        icon={<History className="h-6 w-6" />}
        title="No events yet"
        description="Every case action will be recorded here."
      />
    );

  const sorted = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {sorted.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[26px] flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
            {EVENT_ICON[e.event_type] ?? <Clock className="h-3 w-3" />}
          </span>
          <div className="text-xs font-medium">{formatEventTitle(e)}</div>
          {e.message && (
            <div className="mt-0.5 text-xs text-muted-foreground">{e.message}</div>
          )}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground">
            <span>{fmtDate(e.created_at)}</span>
            {e.actor_id && <span className="font-mono">· {e.actor_id.slice(0, 8)}…</span>}
            {e.actor_role && <span>· {e.actor_role}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

// =========================================================================
// Evidence
// =========================================================================

function EvidenceTab({ caseId }: { caseId: string }) {
  const [items, setItems] = useState<ModerationEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("moderation_evidence")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setItems((data ?? []) as ModerationEvidence[]);
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeTable({
    table: "moderation_evidence",
    filter: `case_id=eq.${caseId}`,
    event: "*",
    onChange: () => void load(),
  });

  if (loading) return <LoadingState label="Loading evidence…" />;
  if (error) return <ErrorState title="Couldn't load evidence" message={error} />;
  if (!items.length)
    return (
      <EmptyState
        icon={<Paperclip className="h-6 w-6" />}
        title="No evidence yet"
        description="Images, videos, links and text evidence will appear here."
      />
    );

  return (
    <ul className="space-y-2">
      {items.map((ev) => (
        <li key={ev.id} className="rounded-md border border-border bg-card p-3">
          <div className="mb-1 flex items-center gap-2 text-xs">
            <EvidenceIcon kind={ev.kind} />
            <span className="font-medium capitalize">{ev.kind}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              {fmtDate(ev.created_at)}
            </span>
          </div>
          {ev.kind === "image" && ev.url && (
            <img
              src={ev.url}
              alt="Evidence"
              className="mt-2 max-h-56 w-full rounded object-cover"
            />
          )}
          {ev.kind === "video" && ev.url && (
            <video src={ev.url} controls className="mt-2 max-h-56 w-full rounded" />
          )}
          {ev.kind === "link" && ev.url && (
            <a
              href={ev.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-xs text-primary underline"
            >
              {ev.url}
            </a>
          )}
          {ev.content && (
            <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
              {ev.content}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function EvidenceIcon({ kind }: { kind: string }) {
  const cls = "h-3.5 w-3.5 text-muted-foreground";
  if (kind === "image") return <ImageIcon className={cls} />;
  if (kind === "video") return <VideoIcon className={cls} />;
  if (kind === "link") return <Link2 className={cls} />;
  return <FileText className={cls} />;
}

// =========================================================================
// Notes
// =========================================================================

function NotesTab({ caseId }: { caseId: string }) {
  const [items, setItems] = useState<ModerationCaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("moderation_case_notes")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setItems((data ?? []) as ModerationCaseNote[]);
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeTable({
    table: "moderation_case_notes",
    filter: `case_id=eq.${caseId}`,
    event: "*",
    onChange: () => void load(),
  });

  const submit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await ModerationService.addNote(caseId, body, true);
      setBody("");
      toast({ title: "Note added" });
    } catch (e) {
      toast({
        title: "Couldn't add note",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card p-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add an internal note visible only to moderators…"
          className="min-h-[72px] resize-y text-xs"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={submit} disabled={submitting || !body.trim()}>
            {submitting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-3.5 w-3.5" />
            )}
            Add note
          </Button>
        </div>
      </div>

      <Separator />

      {loading ? (
        <LoadingState label="Loading notes…" />
      ) : error ? (
        <ErrorState title="Couldn't load notes" message={error} />
      ) : !items.length ? (
        <EmptyState
          icon={<MessageSquarePlus className="h-6 w-6" />}
          title="No notes yet"
          description="Add moderator context, findings or coordination notes."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} className="rounded-md border border-border bg-card p-3">
              <p className="whitespace-pre-wrap text-xs">{n.body}</p>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="font-mono">{n.author_id?.slice(0, 8) ?? "system"}…</span>
                <span>· {fmtDate(n.created_at)}</span>
                {n.is_internal && (
                  <StatusBadge tone="muted" label="internal" className="ml-auto py-0" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =========================================================================
// Actions
// =========================================================================

function ActionsTab({ caseId }: { caseId: string }) {
  const [items, setItems] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("moderation_actions")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setItems((data ?? []) as ModerationAction[]);
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeTable({
    table: "moderation_actions",
    filter: `case_id=eq.${caseId}`,
    event: "*",
    onChange: () => void load(),
  });

  if (loading) return <LoadingState label="Loading actions…" />;
  if (error) return <ErrorState title="Couldn't load actions" message={error} />;
  if (!items.length)
    return (
      <EmptyState
        icon={<ShieldCheck className="h-6 w-6" />}
        title="No actions taken"
        description="Warn, hide, remove and other moderation actions will appear here."
      />
    );

  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id} className="rounded-md border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono">{a.action_type_id.slice(0, 8)}…</span>
            {a.is_reversed && (
              <StatusBadge tone="danger" label="reversed" className="py-0" />
            )}
            <span className="ml-auto text-[10px] text-muted-foreground">
              {fmtDate(a.created_at)}
            </span>
          </div>
          {a.reason && (
            <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
              {a.reason}
            </p>
          )}
          <div className="mt-1 text-[10px] text-muted-foreground">
            by <span className="font-mono">{a.performed_by?.slice(0, 8) ?? "system"}…</span>
            {a.reversed_by && (
              <>
                {" · reversed by "}
                <span className="font-mono">{a.reversed_by.slice(0, 8)}…</span>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
