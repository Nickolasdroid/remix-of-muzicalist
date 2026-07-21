import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AdminVerificationsTab from "@/components/AdminVerificationsTab";
import CommunicationsPanel from "@/components/admin/CommunicationsPanel";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminArtistsTab from "@/components/admin/AdminArtistsTab";
import type { AdminProfile } from "@/components/admin/adminProfileTypes";

interface RoleRow {
  user_id: string;
  user_type: string;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});

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

  const subscribers = profiles.filter((p) => !!p.stripe_subscription_id);
  const usersCount = profiles.filter((p) => roles[p.id] === "user").length;
  const artistsCount = profiles.filter(
    (p) => roles[p.id] === "artist" || !!p.specialization,
  ).length;

  return (
    <>
      <Navigation mobileTitle="Admin Dashboard" />
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage platform users, artist accounts, subscriptions and communications.
            </p>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="rounded-lg flex-wrap h-auto">
              <TabsTrigger value="users">Users ({usersCount})</TabsTrigger>
              <TabsTrigger value="artists">Artists ({artistsCount})</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions ({subscribers.length})</TabsTrigger>
              <TabsTrigger value="communications">Communications</TabsTrigger>
              <TabsTrigger value="verifications">Verifications</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4">
              <AdminUsersTab profiles={profiles} roles={roles} loading={loading} refresh={fetchAll} />
            </TabsContent>

            <TabsContent value="artists" className="mt-4">
              <AdminArtistsTab profiles={profiles} roles={roles} loading={loading} refresh={fetchAll} />
            </TabsContent>

            <TabsContent value="subscriptions" className="mt-4">
              <div className="border border-border rounded-lg overflow-x-auto bg-card">
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

            <TabsContent value="communications" className="mt-4">
              <CommunicationsPanel />
            </TabsContent>

            <TabsContent value="verifications" className="mt-4">
              <AdminVerificationsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default AdminDashboard;
