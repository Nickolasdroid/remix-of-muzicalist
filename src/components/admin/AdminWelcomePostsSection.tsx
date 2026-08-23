import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminWelcomePostsTab from "./AdminWelcomePostsTab";
import type { AdminProfile } from "./adminProfileTypes";

interface RoleRow {
  user_id: string;
  user_type: string;
}

/**
 * Self-contained wrapper around AdminWelcomePostsTab so the Welcome Posts
 * management UI can also be mounted from the Official Muzicalist dashboard.
 * Loads the admin profile list lazily (only when this section is mounted).
 */
const AdminWelcomePostsSection = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [profilesRes, { data: rolesData }] = await Promise.all([
        (supabase as any).rpc("admin_list_profiles"),
        supabase.from("user_roles").select("user_id, user_type"),
      ]);
      if (cancelled) return;
      setProfiles((profilesRes?.data as AdminProfile[]) ?? []);
      const map: Record<string, string> = {};
      ((rolesData as RoleRow[]) ?? []).forEach((r) => {
        map[r.user_id] = r.user_type;
      });
      setRoles(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminWelcomePostsTab
      profiles={profiles}
      roles={roles}
      loading={loading}
      adminProfile={profiles.find((p) => roles[p.id] === "admin") ?? null}
    />
  );
};

export default AdminWelcomePostsSection;
