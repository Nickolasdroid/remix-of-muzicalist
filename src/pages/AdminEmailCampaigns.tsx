import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  MailPlus,
  ArrowLeft,
  Inbox,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Ban,
  Copy,
  Trash2,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CampaignDbStatusBadge from "@/components/admin/CampaignDbStatusBadge";
import {
  cancelCampaign,
  deleteCampaign,
  duplicateCampaign,
  fetchCampaignRecipients,
  fetchCampaigns,
  formatDateTime,
  formatDuration,
  retryFailedRecipients,
  type DbCampaign,
  type DbCampaignRecipient,
} from "@/lib/campaignsApi";
import { toast } from "sonner";
import {
  combineRealtimeStatus,
  useRealtimeTable,
  type RealtimeStatus,
} from "@/hooks/useRealtimeTable";

const RECIPIENTS_PAGE_SIZE = 25;

const FINAL_STATUSES = new Set([
  "Completed",
  "CompletedWithErrors",
  "Failed",
  "Cancelled",
]);

const RECIPIENT_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Sending: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  Sent: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Failed: "bg-destructive/10 text-destructive border-destructive/20",
};

const RecipientStatusPill = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
      RECIPIENT_STATUS_COLORS[status] ??
      "bg-muted text-muted-foreground border-border"
    }`}
  >
    {status}
  </span>
);

const progressPercent = (c: DbCampaign) => {
  const total = c.valid_recipients ?? 0;
  const done = (c.sent_count ?? 0) + (c.failed_count ?? 0);
  if (!total) return 0;
  return Math.min(100, Math.round((done / total) * 100));
};

const AdminEmailCampaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<DbCampaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Drawer state
  const [openId, setOpenId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<DbCampaignRecipient[]>([]);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [recipientsPage, setRecipientsPage] = useState(0);
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  // Confirm dialogs
  const [pendingDelete, setPendingDelete] = useState<DbCampaign | null>(null);
  const [pendingCancel, setPendingCancel] = useState<DbCampaign | null>(null);
  const [pendingRetry, setPendingRetry] = useState<DbCampaign | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const load = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setRefreshing(true);
    try {
      const data = await fetchCampaigns();
      if (!isMounted.current) return;
      setCampaigns(data);
      setError(null);
    } catch (e) {
      console.error("Failed to load campaigns", e);
      if (!isMounted.current) return;
      setError(e instanceof Error ? e.message : "Failed to load campaigns");
    } finally {
      if (isMounted.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCampaign = campaigns?.find((c) => c.id === openId) ?? null;

  // ── Realtime: campaigns table (always on) ───────────────────────────────
  const campaignsRtStatus = useRealtimeTable<DbCampaign>({
    table: "email_campaigns",
    event: "*",
    onChange: (payload) => {
      setCampaigns((prev) => {
        const list = prev ?? [];
        if (payload.eventType === "INSERT") {
          const row = payload.new as DbCampaign;
          if (list.some((c) => c.id === row.id)) return list;
          return [row, ...list];
        }
        if (payload.eventType === "UPDATE") {
          const row = payload.new as DbCampaign;
          return list.map((c) => (c.id === row.id ? { ...c, ...row } : c));
        }
        if (payload.eventType === "DELETE") {
          const oldRow = payload.old as Partial<DbCampaign>;
          return list.filter((c) => c.id !== oldRow.id);
        }
        return list;
      });
    },
  });

  const loadRecipients = useCallback(
    async (campaignId: string, page: number) => {
      setRecipientsLoading(true);
      try {
        const { rows, total } = await fetchCampaignRecipients(
          campaignId,
          page,
          RECIPIENTS_PAGE_SIZE,
        );
        if (!isMounted.current) return;
        setRecipients(rows);
        setRecipientsTotal(total);
      } catch (e) {
        console.error("Failed to load recipients", e);
        toast.error("Could not load recipients");
      } finally {
        if (isMounted.current) setRecipientsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!openId) return;
    loadRecipients(openId, recipientsPage);
  }, [openId, recipientsPage, loadRecipients]);

  // ── Realtime: recipients for the opened campaign (only while Sending) ──
  // Auto-unsubscribes when the drawer closes OR the campaign reaches a
  // final status (Completed / CompletedWithErrors / Failed / Cancelled).
  const recipientsRtEnabled =
    !!openCampaign && !FINAL_STATUSES.has(openCampaign.status);
  const refetchTimer = useRef<number | null>(null);
  const recipientsRtStatus = useRealtimeTable<DbCampaignRecipient>({
    table: "email_campaign_recipients",
    filter: openId ? `campaign_id=eq.${openId}` : undefined,
    event: "*",
    enabled: recipientsRtEnabled,
    channelKey: openId ? `rt:recipients:${openId}` : undefined,
    onChange: () => {
      // Coalesce bursts of per-recipient updates into a single page refetch.
      if (refetchTimer.current) window.clearTimeout(refetchTimer.current);
      refetchTimer.current = window.setTimeout(() => {
        if (openId) loadRecipients(openId, recipientsPage);
      }, 400);
    },
  });
  useEffect(() => () => {
    if (refetchTimer.current) window.clearTimeout(refetchTimer.current);
  }, []);

  const liveStatus: RealtimeStatus = recipientsRtEnabled
    ? combineRealtimeStatus(campaignsRtStatus, recipientsRtStatus)
    : campaignsRtStatus;

  const handleCancel = async (c: DbCampaign) => {
    try {
      await cancelCampaign(c.id);
      toast.success("Campaign cancelled");
      load({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel campaign");
    } finally {
      setPendingCancel(null);
    }
  };

  const handleDelete = async (c: DbCampaign) => {
    try {
      await deleteCampaign(c.id);
      toast.success("Campaign deleted");
      if (openId === c.id) setOpenId(null);
      load({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete campaign");
    } finally {
      setPendingDelete(null);
    }
  };

  const handleRetry = async (c: DbCampaign) => {
    setRetryLoading(true);
    try {
      await retryFailedRecipients(c.id);
      toast.success("Retry started successfully.");
      // Realtime will refresh progress; no manual reload needed.
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not retry campaign");
    } finally {
      setRetryLoading(false);
      setPendingRetry(null);
    }
  };


  const handleDuplicate = async (c: DbCampaign) => {
    try {
      await duplicateCampaign(c);
      toast.success("Campaign duplicated");
      load({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not duplicate campaign");
    }
  };

  const isLoading = campaigns === null && !error;
  const hasCampaigns = !!campaigns && campaigns.length > 0;

  return (
    <>
      <Navigation mobileTitle="Email Campaigns" />
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                Email Campaigns
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Monitor campaign delivery in real time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LiveIndicator status={liveStatus} />
              <Button
                variant="outline"
                onClick={() => load()}
                className="rounded-lg h-11"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={() => navigate("/admin/communications/campaigns/new")}
                className="rounded-lg h-11"
              >
                <MailPlus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Could not load campaigns</p>
                <p className="text-xs mt-0.5 opacity-80">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => load()} className="rounded-lg">
                Try again
              </Button>
            </div>
          )}

          {isLoading ? (
            <Card className="rounded-lg border-border p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </Card>
          ) : hasCampaigns ? (
            <Card className="rounded-lg border-border overflow-hidden animate-in fade-in duration-300">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="min-w-[200px]">Progress</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Finished</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns!.map((c) => {
                      const percent = progressPercent(c);
                      const total = c.valid_recipients ?? 0;
                      const done = (c.sent_count ?? 0) + (c.failed_count ?? 0);
                      const canRetry =
                        (c.status === "CompletedWithErrors" || (c.failed_count ?? 0) > 0) &&
                        c.status !== "Sending" &&
                        c.status !== "Pending";
                      const canCancel = c.status === "Sending";
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium text-foreground max-w-[240px]">
                            <div className="truncate" title={c.name}>{c.name}</div>
                            {c.template && (
                              <div className="text-xs text-muted-foreground truncate">
                                {c.template}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <CampaignDbStatusBadge status={c.status} />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5 min-w-[180px]">
                              <Progress value={percent} className="h-2" />
                              <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                                <span>{done.toLocaleString()} / {total.toLocaleString()}</span>
                                <span>{percent}%</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600 font-medium">
                            {(c.sent_count ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-destructive font-medium">
                            {(c.failed_count ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {(c.total_recipients ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(c.started_at)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(c.finished_at)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDuration(c.started_at, c.finished_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-lg"
                                onClick={() => {
                                  setRecipientsPage(0);
                                  setOpenId(c.id);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1.5" />
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="rounded-lg h-9 w-9 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">More actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-lg">
                                  {canRetry && (
                                    <DropdownMenuItem onClick={() => setPendingRetry(c)}>
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Retry Failed
                                    </DropdownMenuItem>
                                  )}
                                  {canCancel && (
                                    <DropdownMenuItem onClick={() => setPendingCancel(c)}>
                                      <Ban className="h-4 w-4 mr-2" />
                                      Cancel Campaign
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleDuplicate(c)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate Campaign
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setPendingDelete(c)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="border border-dashed border-border rounded-lg bg-card/50 p-10 sm:p-16 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
                <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Inbox className="h-9 w-9" />
                </div>
              </div>
              <h2 className="text-lg font-display font-semibold text-foreground mb-2">
                No email campaigns yet.
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Launch your first campaign to reach artists and users directly in their inbox.
              </p>
              <Button
                onClick={() => navigate("/admin/communications/campaigns/new")}
                className="rounded-lg h-11"
              >
                <MailPlus className="h-4 w-4 mr-2" />
                Create First Campaign
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Details drawer */}
      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {openCampaign && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-xl">{openCampaign.name}</SheetTitle>
                  <CampaignDbStatusBadge status={openCampaign.status} />
                </div>
                <SheetDescription>
                  {openCampaign.template || "No template"} · Created {formatDateTime(openCampaign.created_at)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Progress */}
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">Progress</span>
                    <span className="text-muted-foreground tabular-nums">
                      {((openCampaign.sent_count ?? 0) + (openCampaign.failed_count ?? 0)).toLocaleString()} / {(openCampaign.valid_recipients ?? 0).toLocaleString()} ({progressPercent(openCampaign)}%)
                    </span>
                  </div>
                  <Progress value={progressPercent(openCampaign)} className="h-2" />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCell label="Sent" value={(openCampaign.sent_count ?? 0).toLocaleString()} tone="success" />
                  <StatCell label="Failed" value={(openCampaign.failed_count ?? 0).toLocaleString()} tone="destructive" />
                  <StatCell
                    label="Remaining"
                    value={Math.max(
                      0,
                      (openCampaign.valid_recipients ?? 0) -
                        (openCampaign.sent_count ?? 0) -
                        (openCampaign.failed_count ?? 0),
                    ).toLocaleString()}
                  />
                  <StatCell label="Total recipients" value={(openCampaign.total_recipients ?? 0).toLocaleString()} />
                  <StatCell label="Valid" value={(openCampaign.valid_recipients ?? 0).toLocaleString()} />
                  <StatCell label="Invalid" value={(openCampaign.invalid_recipients ?? 0).toLocaleString()} />
                </div>

                {/* Timing */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <StatCell label="Started" value={formatDateTime(openCampaign.started_at)} small />
                  <StatCell label="Finished" value={formatDateTime(openCampaign.finished_at)} small />
                  <StatCell label="Duration" value={formatDuration(openCampaign.started_at, openCampaign.finished_at)} small />
                </div>

                {openCampaign.last_error && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    <div className="flex items-center gap-2 font-medium mb-1">
                      <AlertCircle className="h-4 w-4" />
                      Last error
                    </div>
                    <p className="text-xs opacity-90 whitespace-pre-wrap break-words">
                      {openCampaign.last_error}
                    </p>
                  </div>
                )}

                {/* Recipients */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      Recipients ({recipientsTotal.toLocaleString()})
                    </h3>
                  </div>
                  <Card className="rounded-lg border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Attempts</TableHead>
                            <TableHead>Sent At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recipientsLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                              <TableRow key={i}>
                                <TableCell colSpan={5}>
                                  <Skeleton className="h-4 w-full" />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : recipients.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                                No recipients yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            recipients.map((r) => (
                              <Fragment key={r.id}>
                                <TableRow>
                                  <TableCell className="text-sm">{r.recipient_name || "—"}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]" title={r.recipient_email}>
                                    {r.recipient_email}
                                  </TableCell>
                                  <TableCell>
                                    <RecipientStatusPill status={r.status} />
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums text-sm">
                                    {r.attempts}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDateTime(r.sent_at)}
                                  </TableCell>
                                </TableRow>
                                {r.error_message && (
                                  <TableRow className="bg-destructive/5 hover:bg-destructive/5">
                                    <TableCell colSpan={5} className="text-xs text-destructive py-2">
                                      <span className="font-medium">Error:</span> {r.error_message}
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Fragment>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>

                  {recipientsTotal > RECIPIENTS_PAGE_SIZE && (
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className="text-muted-foreground text-xs">
                        Page {recipientsPage + 1} of {Math.max(1, Math.ceil(recipientsTotal / RECIPIENTS_PAGE_SIZE))}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          disabled={recipientsPage === 0}
                          onClick={() => setRecipientsPage((p) => Math.max(0, p - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Prev
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          disabled={(recipientsPage + 1) * RECIPIENTS_PAGE_SIZE >= recipientsTotal}
                          onClick={() => setRecipientsPage((p) => p + 1)}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm cancel */}
      <AlertDialog open={!!pendingCancel} onOpenChange={(o) => !o && setPendingCancel(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Stop this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              The current batch will finish, but no additional recipients will be processed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Keep Running</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingCancel && handleCancel(pendingCancel)}
              className="rounded-lg"
            >
              Cancel Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm retry failed */}
      <AlertDialog
        open={!!pendingRetry}
        onOpenChange={(o) => {
          if (!o && !retryLoading) setPendingRetry(null);
        }}
      >
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Retry delivery for all failed recipients?</AlertDialogTitle>
            <AlertDialogDescription>
              Only recipients with attempts &lt; 3 will be retried.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg" disabled={retryLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingRetry) handleRetry(pendingRetry);
              }}
              disabled={retryLoading}
              className="rounded-lg"
            >
              {retryLoading ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  Retrying…
                </>
              ) : (
                "Retry"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the campaign and its recipient records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && handleDelete(pendingDelete)}
              className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const StatCell = ({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: string;
  tone?: "success" | "destructive";
  small?: boolean;
}) => (
  <div className="rounded-lg border border-border bg-card p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div
      className={`mt-1 font-semibold tabular-nums ${
        small ? "text-sm" : "text-lg"
      } ${
        tone === "success"
          ? "text-emerald-600"
          : tone === "destructive"
            ? "text-destructive"
            : "text-foreground"
      }`}
    >
      {value}
    </div>
  </div>
);

const LiveIndicator = ({ status }: { status: RealtimeStatus }) => {
  const isLive = status === "connected";
  const isConnecting = status === "connecting";
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        isLive
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
          : isConnecting
            ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
            : "border-border bg-muted text-muted-foreground"
      }`}
      title={
        isLive
          ? "Realtime connected"
          : isConnecting
            ? "Reconnecting to realtime…"
            : "Realtime offline"
      }
    >
      <span className="relative flex h-2 w-2">
        {isLive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            isLive
              ? "bg-emerald-500"
              : isConnecting
                ? "bg-amber-500 animate-pulse"
                : "bg-muted-foreground"
          }`}
        />
      </span>
      {isLive ? "Live" : isConnecting ? "Reconnecting…" : "Offline"}
    </div>
  );
};

export default AdminEmailCampaigns;
