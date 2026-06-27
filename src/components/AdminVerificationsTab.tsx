import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, ExternalLink } from "lucide-react";

interface Row {
  id: string;
  profile_id: string;
  id_document_path: string;
  selfie_path: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  profiles?: { stage_name: string | null; email: string | null; avatar_url: string | null } | null;
}

const AdminVerificationsTab = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [previewUrls, setPreviewUrls] = useState<{ idUrl: string; selfieUrl: string } | null>(null);
  const [rejectRow, setRejectRow] = useState<Row | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [acting, setActing] = useState(false);

  const fetchRows = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("verification_requests" as any)
      .select("*")
      .order("created_at", { ascending: false });
    const list = (data as any[]) ?? [];
    const ids = Array.from(new Set(list.map((r) => r.profile_id)));
    let profMap: Record<string, any> = {};
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, stage_name, email, avatar_url")
        .in("id", ids);
      (profs ?? []).forEach((p: any) => { profMap[p.id] = p; });
    }
    setRows(list.map((r) => ({ ...r, profiles: profMap[r.profile_id] ?? null })));
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const openPreview = async (r: Row) => {
    const [a, b] = await Promise.all([
      supabase.storage.from("verification-docs").createSignedUrl(r.id_document_path, 600),
      supabase.storage.from("verification-docs").createSignedUrl(r.selfie_path, 600),
    ]);
    if (a.error || b.error) {
      toast({ title: "Could not load documents", variant: "destructive" });
      return;
    }
    setPreviewUrls({ idUrl: a.data!.signedUrl, selfieUrl: b.data!.signedUrl });
  };

  const approve = async (r: Row) => {
    setActing(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("verification_requests" as any)
      .update({ status: "approved", admin_notes: null, reviewed_by: user?.id, reviewed_at: new Date().toISOString() } as any)
      .eq("id", r.id);
    setActing(false);
    if (error) {
      toast({ title: "Approve failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Approved", description: "Artist marked as verified." });
    fetchRows();
  };

  const reject = async () => {
    if (!rejectRow) return;
    setActing(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("verification_requests" as any)
      .update({ status: "rejected", admin_notes: rejectNote.trim() || null, reviewed_by: user?.id, reviewed_at: new Date().toISOString() } as any)
      .eq("id", rejectRow.id);
    setActing(false);
    if (error) {
      toast({ title: "Reject failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Rejected" });
    setRejectRow(null);
    setRejectNote("");
    fetchRows();
  };

  const filtered = rows.filter(r => r.status === tab);

  return (
    <div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList className="rounded-lg">
          <TabsTrigger value="pending">Pending ({rows.filter(r => r.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({rows.filter(r => r.status === "approved").length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rows.filter(r => r.status === "rejected").length})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artist</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={r.profiles?.avatar_url ?? undefined} />
                            <AvatarFallback>{(r.profiles?.stage_name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{r.profiles?.stage_name ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">{r.profiles?.email ?? ""}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-lg capitalize">{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openPreview(r)}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        {r.status === "pending" && (
                          <>
                            <Button size="sm" className="rounded-lg" onClick={() => approve(r)} disabled={acting}>
                              <Check className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => { setRejectRow(r); setRejectNote(""); }} disabled={acting}>
                              <X className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {r.admin_notes && r.status === "rejected" && (
                          <span className="block text-xs text-muted-foreground mt-1 max-w-xs ml-auto truncate" title={r.admin_notes}>
                            Note: {r.admin_notes}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No requests.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview dialog */}
      <Dialog open={!!previewUrls} onOpenChange={(o) => !o && setPreviewUrls(null)}>
        <DialogContent className="rounded-lg max-w-3xl">
          <DialogHeader>
            <DialogTitle>Verification documents</DialogTitle>
            <DialogDescription>Signed URLs expire in 10 minutes.</DialogDescription>
          </DialogHeader>
          {previewUrls && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">ID document</p>
                <a href={previewUrls.idUrl} target="_blank" rel="noreferrer">
                  <img src={previewUrls.idUrl} alt="ID document" className="rounded-lg border border-border w-full object-contain bg-black/30 max-h-[60vh]" />
                </a>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Selfie</p>
                <a href={previewUrls.selfieUrl} target="_blank" rel="noreferrer">
                  <img src={previewUrls.selfieUrl} alt="Selfie" className="rounded-lg border border-border w-full object-contain bg-black/30 max-h-[60vh]" />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectRow} onOpenChange={(o) => !o && setRejectRow(null)}>
        <DialogContent className="rounded-lg max-w-md">
          <DialogHeader>
            <DialogTitle>Reject verification</DialogTitle>
            <DialogDescription>Add a short note the artist will see when they resubmit (optional).</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="e.g. Document is blurry. Please upload a clearer photo."
            className="rounded-lg"
            rows={4}
          />
          <DialogFooter className="flex-row justify-end gap-2 space-x-0">
            <Button variant="outline" className="rounded-lg" onClick={() => setRejectRow(null)} disabled={acting}>Cancel</Button>
            <Button variant="destructive" className="rounded-lg" onClick={reject} disabled={acting}>
              {acting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <X className="h-4 w-4 mr-1.5" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerificationsTab;
