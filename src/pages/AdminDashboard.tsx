import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Loader2, Search } from "lucide-react";
import AdminVerificationsTab from "@/components/AdminVerificationsTab";

interface AdminProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  stage_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  county: string | null;
  plan: string | null;
  avatar_url: string | null;
  created_at: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  billing: string | null;
}

interface RoleRow {
  user_id: string;
  user_type: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminProfile | null>(null);
  const [deleting, setDeleting] = useState<AdminProfile | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingNow, setDeletingNow] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [profilesRes, { data: rolesData }] = await Promise.all([
      (supabase as any).rpc("admin_list_profiles"),
      supabase.from("user_roles").select("user_id, user_type"),
    ]);
    setProfiles((profilesRes?.data as AdminProfile[]) ?? []);
    const map: Record<string, string> = {};
    ((rolesData as RoleRow[]) ?? []).forEach((r) => {
      map[r.user_id] = r.user_type;
    });
    setRoles(map);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = profiles.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (p.stage_name ?? "").toLowerCase().includes(q) ||
      (p.first_name ?? "").toLowerCase().includes(q) ||
      (p.last_name ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q)
    );
  });

  const subscribers = profiles.filter((p) => !!p.stripe_subscription_id);

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
    fetchAll();
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
    fetchAll();
  };

  return (
    <>
      <Navigation mobileTitle="Admin Dashboard" />
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage users, view subscriptions, edit and delete accounts.
            </p>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="rounded-lg">
              <TabsTrigger value="users">Users ({profiles.length})</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions ({subscribers.length})</TabsTrigger>
              <TabsTrigger value="verifications">Verifications</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4">
              <div className="mb-4 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-lg"
                />
              </div>

              <div className="border border-border rounded-lg overflow-hidden bg-card">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={p.avatar_url ?? undefined} />
                                <AvatarFallback>
                                  {(p.stage_name ?? p.first_name ?? "?").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-foreground">
                                  {p.stage_name || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {p.first_name} {p.last_name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{p.email || "—"}</TableCell>
                          <TableCell className="text-sm">{p.country || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="rounded-lg">{p.plan || "Free"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-lg">
                              {roles[p.id] || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg"
                              onClick={() => setEditing({ ...p })}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="rounded-lg"
                              onClick={() => setDeleting(p)}
                              disabled={roles[p.id] === "admin"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No users found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            <TabsContent value="subscriptions" className="mt-4">
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Renews / Ends</TableHead>
                      <TableHead>Stripe ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.stage_name || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-lg">{p.plan || "—"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{p.billing || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={p.subscription_status === "active" ? "default" : "outline"}
                            className="rounded-lg"
                          >
                            {p.subscription_status || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.subscription_current_period_end
                            ? new Date(p.subscription_current_period_end).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[160px]">
                          {p.stripe_subscription_id}
                        </TableCell>
                      </TableRow>
                    ))}
                    {subscribers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No active subscriptions.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-lg max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update basic user information.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input
                  className="rounded-lg"
                  value={editing.first_name ?? ""}
                  onChange={(e) => setEditing({ ...editing, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input
                  className="rounded-lg"
                  value={editing.last_name ?? ""}
                  onChange={(e) => setEditing({ ...editing, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Stage name</Label>
                <Input
                  className="rounded-lg"
                  value={editing.stage_name ?? ""}
                  onChange={(e) => setEditing({ ...editing, stage_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  className="rounded-lg"
                  value={editing.email ?? ""}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  className="rounded-lg"
                  value={editing.phone ?? ""}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input
                  className="rounded-lg"
                  value={editing.country ?? ""}
                  onChange={(e) => setEditing({ ...editing, country: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Input
                  className="rounded-lg"
                  value={editing.plan ?? ""}
                  onChange={(e) => setEditing({ ...editing, plan: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-lg" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button className="rounded-lg" onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deletingNow}
            >
              {deletingNow && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminDashboard;
