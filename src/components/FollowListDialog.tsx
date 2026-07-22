import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  mode: "followers" | "following";
}

interface ProfileRow {
  id: string;
  stage_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  slug: string | null;
  specialization: string | null;
}

const FollowListDialog = ({ open, onOpenChange, profileId, mode }: FollowListDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const col = mode === "followers" ? "follower_id" : "artist_id";
        const filterCol = mode === "followers" ? "artist_id" : "follower_id";
        const { data: rows } = await supabase
          .from("followers")
          .select(col)
          .eq(filterCol, profileId);
        const ids = (rows || []).map((r: any) => r[col]).filter(Boolean);
        if (ids.length === 0) {
          if (!cancelled) setProfiles([]);
          return;
        }
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, stage_name, first_name, last_name, avatar_url, slug, specialization")
          .in("id", ids);
        if (!cancelled) setProfiles((profs as any) || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, mode, profileId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle className="capitalize">{mode}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : profiles.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No {mode} yet.
            </div>
          ) : (
            <ul className="space-y-1">
              {profiles.map((p) => {
                const display = p.stage_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Artist";
                const to = `/artist/${p.slug || p.id}`;
                return (
                  <li key={p.id}>
                    <Link
                      to={to}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        {p.avatar_url ? (
                          <AvatarImage src={p.avatar_url} alt={display} />
                        ) : (
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">{display}</div>
                        {p.specialization && (
                          <div className="truncate text-xs text-muted-foreground">{p.specialization}</div>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowListDialog;
