import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  Eye,
  History,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import {
  createVersion,
  deleteVersion,
  duplicateVersion,
  ensureTemplateRow,
  getActiveVersionId,
  listVersions,
  publishVersion,
  restoreVersion,
  type EmailTemplateVersion,
  type VersionStatus,
} from "@/lib/emailTemplateVersions";
import type { EmailTemplate } from "@/lib/emailTemplates";

const STATUS_STYLES: Record<VersionStatus, string> = {
  Draft: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Published: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Archived: "bg-muted text-muted-foreground border-border",
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

type Props = {
  template: EmailTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const EmailTemplateVersionsDialog = ({ template, open, onOpenChange }: Props) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<EmailTemplateVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<EmailTemplateVersion | null>(null);
  const [pendingPublish, setPendingPublish] = useState<EmailTemplateVersion | null>(null);
  const [pendingRestore, setPendingRestore] = useState<EmailTemplateVersion | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EmailTemplateVersion | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!template) return;
    setLoading(true);
    setError(null);
    try {
      await ensureTemplateRow(template);
      const [rows, activeId] = await Promise.all([
        listVersions(template.id),
        getActiveVersionId(template.id),
      ]);
      setVersions(rows);
      setActiveVersionId(activeId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load versions");
    } finally {
      setLoading(false);
    }
  }, [template]);

  useEffect(() => {
    if (open && template) load();
  }, [open, template, load]);

  const handleCreateInitial = async () => {
    if (!template) return;
    setBusy(true);
    try {
      await createVersion({
        templateId: template.id,
        subject: `${template.name} — subject`,
        html_content: "",
        text_content: "",
      });
      toast.success("Draft version created");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create version");
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async (v: EmailTemplateVersion) => {
    setBusy(true);
    try {
      await duplicateVersion(v);
      toast.success(`Duplicated v${v.version_number} as a new Draft`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not duplicate version");
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async (v: EmailTemplateVersion) => {
    setBusy(true);
    try {
      await publishVersion(v.id);
      toast.success(`v${v.version_number} is now published`);
      setPendingPublish(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not publish version");
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (v: EmailTemplateVersion) => {
    setBusy(true);
    try {
      const created = await restoreVersion(v.id);
      toast.success(`Restored v${v.version_number} into new Draft v${created.version_number}`);
      setPendingRestore(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not restore version");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (v: EmailTemplateVersion) => {
    setBusy(true);
    try {
      await deleteVersion(v.id);
      toast.success(`Deleted v${v.version_number}`);
      setPendingDelete(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete version");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-lg max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Version history
            </DialogTitle>
            <DialogDescription>
              {template ? (
                <>Every edit creates a new version. Publishing a version updates the template's active copy.</>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              {template?.name}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              onClick={handleCreateInitial}
              disabled={busy || loading || !template}
            >
              <Plus className="h-4 w-4 mr-1.5" /> New Draft
            </Button>
          </div>

          {error ? (
            <Card className="rounded-lg p-6 text-center border-border">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="rounded-lg mt-3" onClick={load}>
                <RotateCcw className="h-4 w-4 mr-1.5" /> Try again
              </Button>
            </Card>
          ) : loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <Card className="rounded-lg border-border p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <History className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-foreground">No versions yet</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Create the first draft to start building this template's history.
              </p>
            </Card>
          ) : (
            <Card className="rounded-lg border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((v) => {
                    const isActive = v.id === activeVersionId;
                    return (
                      <TableRow key={v.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">
                          v{v.version_number}
                          {isActive && (
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-emerald-600">
                              active
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {v.created_by ? v.created_by.slice(0, 8) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDateTime(v.created_at)}
                        </TableCell>
                        <TableCell>
                          <Pill label={v.status} className={STATUS_STYLES[v.status]} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-lg h-8 w-8"
                                disabled={busy}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-lg w-44">
                              <DropdownMenuItem onClick={() => setViewing(v)}>
                                <Eye className="h-4 w-4 mr-2" /> View Version
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={v.status === "Published"}
                                onClick={() => setPendingPublish(v)}
                              >
                                <Send className="h-4 w-4 mr-2" /> Publish Version
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPendingRestore(v)}>
                                <RotateCcw className="h-4 w-4 mr-2" /> Restore Version
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(v)}>
                                <Copy className="h-4 w-4 mr-2" /> Duplicate Version
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={isActive}
                                onClick={() => setPendingDelete(v)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </DialogContent>
      </Dialog>

      {/* View version */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="rounded-lg max-w-4xl">
          <DialogHeader>
            <DialogTitle>Version v{viewing?.version_number}</DialogTitle>
            <DialogDescription>
              {viewing ? formatDateTime(viewing.created_at) : null}
            </DialogDescription>
          </DialogHeader>
          {(() => {
            if (!viewing) return null;
            const combined = `${viewing.subject}\n${viewing.html_content ?? ""}\n${viewing.text_content ?? ""}`;
            const validation = validateTemplateContent(combined);
            return (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
                <div className="space-y-3 min-w-0">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Subject</div>
                    <div className="text-sm text-foreground bg-muted/40 rounded-lg px-3 py-2">
                      {viewing.subject || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">HTML</div>
                    <pre className="text-xs text-foreground bg-muted/40 rounded-lg px-3 py-2 max-h-64 overflow-auto whitespace-pre-wrap">
                      {viewing.html_content || "—"}
                    </pre>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Text</div>
                    <pre className="text-xs text-foreground bg-muted/40 rounded-lg px-3 py-2 max-h-40 overflow-auto whitespace-pre-wrap">
                      {viewing.text_content || "—"}
                    </pre>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">
                      Variable validation
                    </div>
                    {validation.ok ? (
                      <div className="text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                        {validation.used.length === 0
                          ? "No variables used."
                          : `${validation.used.length} variable${validation.used.length === 1 ? "" : "s"} used, all valid.`}
                      </div>
                    ) : (
                      <ul className="text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-3 py-2 space-y-1">
                        {validation.errors.map((err, i) => (
                          <li key={i}>
                            <span className="font-mono">{err.match}</span> — {err.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <EmailVariablesPanel className="h-fit" />
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>



      {/* Publish confirm */}
      <AlertDialog open={!!pendingPublish} onOpenChange={(o) => !o && setPendingPublish(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this version?</AlertDialogTitle>
            <AlertDialogDescription>
              This makes v{pendingPublish?.version_number} the active version. The
              previously published version will be archived. History is kept intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Keep</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg"
              onClick={() => pendingPublish && handlePublish(pendingPublish)}
            >
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore confirm */}
      <AlertDialog open={!!pendingRestore} onOpenChange={(o) => !o && setPendingRestore(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this version?</AlertDialogTitle>
            <AlertDialogDescription>
              This creates a new Draft copy of v{pendingRestore?.version_number}.
              Nothing in history is overwritten. Publish the new draft to make it active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg"
              onClick={() => pendingRestore && handleRestore(pendingRestore)}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this version?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes v{pendingDelete?.version_number} from history. The active
              version can't be deleted.
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
    </>
  );
};

export default EmailTemplateVersionsDialog;
