import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserX, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface BlockedProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  specialization: string | null;
}

/**
 * Settings → Blocked Users.
 * Reads/writes the exact same `user_blocks` relationship used by ProfileActionsMenu.
 * RLS restricts rows to the authenticated user's own blocks.
 */
const BlockedUsersPanel = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<BlockedProfile[]>([]);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setRows([]);
        return;
      }
      const { data: blocks, error } = await (supabase as any)
        .from("user_blocks")
        .select("blocked_user_id, created_at")
        .eq("blocker_user_id", uid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (blocks || []).map((b: any) => b.blocked_user_id);
      if (!ids.length) {
        setRows([]);
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, stage_name, first_name, last_name, avatar_url, specialization")
        .in("id", ids);
      const byId = new Map((profiles || []).map((p: any) => [p.id, p]));
      setRows(
        ids
          .map((id: string) => {
            const p: any = byId.get(id);
            if (!p) return null;
            return {
              id,
              name:
                p.stage_name ||
                [p.first_name, p.last_name].filter(Boolean).join(" ") ||
                "Muzicalist",
              avatar_url: p.avatar_url,
              specialization: p.specialization,
            } as BlockedProfile;
          })
          .filter(Boolean) as BlockedProfile[]
      );
    } catch (e: any) {
      toast({
        title: t("settings.blocked.loadFailed", "Could not load blocked profiles"),
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (id: string) => {
    setWorking(id);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const { error } = await (supabase as any)
        .from("user_blocks")
        .delete()
        .eq("blocker_user_id", uid)
        .eq("blocked_user_id", id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast({ title: t("profileMenu.unblocked", "Profile unblocked") });
    } catch (e: any) {
      toast({
        title: t("profileMenu.blockFailed", "Action failed"),
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setWorking(null);
    }
  };

  const typeLabel = (spec: string | null) => {
    if (!spec) return t("accountType.user", "User");
    return t(`accountType.${spec.toLowerCase()}`, spec);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <UserX className="h-5 w-5 text-accent" />
          {t("settings.blocked.title", "Blocked Users")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t(
            "settings.blocked.description",
            "Manage the users and artists you've blocked. Blocked profiles can't view your profile, message you, or interact with your content."
          )}
        </p>
      </div>

      <Separator />

      <div className="max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-border bg-card/40 py-12 px-6 text-center">
            <UserX className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-foreground">
              {t("settings.blocked.emptyTitle", "You're not blocking anyone")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t(
                "settings.blocked.emptyDesc",
                "You haven't blocked any users or artists yet."
              )}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 sm:p-4">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={r.avatar_url || undefined} alt={r.name} />
                  <AvatarFallback>{r.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {typeLabel(r.specialization)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={working === r.id}
                  onClick={() => unblock(r.id)}
                >
                  {working === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("profileMenu.unblock", "Unblock")
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedUsersPanel;
