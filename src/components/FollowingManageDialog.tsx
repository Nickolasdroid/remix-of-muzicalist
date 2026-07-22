import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Heart } from "lucide-react";

interface FollowingManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onChanged?: (count: number) => void;
}

interface ArtistRow {
  id: string;
  stage_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  slug: string | null;
  specialization: string | null;
  country: string | null;
  county: string | null;
}

const FollowingManageDialog = ({ open, onOpenChange, userId, onChanged }: FollowingManageDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: rows } = await supabase
        .from("followers")
        .select("artist_id")
        .eq("follower_id", userId);
      const ids = (rows || []).map((r: any) => r.artist_id).filter(Boolean);
      if (ids.length === 0) {
        setArtists([]);
        onChanged?.(0);
        return;
      }
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, stage_name, first_name, last_name, avatar_url, slug, specialization, country, county")
        .in("id", ids);
      const list = (profs as any as ArtistRow[]) || [];
      setArtists(list);
      onChanged?.(list.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const unfollow = async (artistId: string) => {
    setRemoving(artistId);
    try {
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", userId)
        .eq("artist_id", artistId);
      if (error) throw error;
      const next = artists.filter((a) => a.id !== artistId);
      setArtists(next);
      onChanged?.(next.length);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to unfollow.", variant: "destructive" });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-lg">
        <DialogHeader>
          <DialogTitle>Following</DialogTitle>
        </DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto -mx-2 px-2">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : artists.length === 0 ? (
            <div className="py-10 rounded-lg border border-dashed border-border/60 bg-background/20 text-center">
              <Heart className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
              <p className="text-sm text-foreground font-medium">You're not following anyone yet</p>
              <p className="text-xs text-muted-foreground mt-1">Discover artists and follow the ones you love.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {artists.map((a) => {
                const display = a.stage_name || [a.first_name, a.last_name].filter(Boolean).join(" ") || "Artist";
                const to = `/artist/${a.slug || a.id}`;
                const region = [a.county, a.country].filter(Boolean).join(", ");
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3"
                  >
                    <Link to={to} onClick={() => onOpenChange(false)} className="flex items-center gap-3 min-w-0 flex-1 group">
                      <Avatar className="h-11 w-11">
                        {a.avatar_url ? (
                          <AvatarImage src={a.avatar_url} alt={display} />
                        ) : (
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                          {display}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {[a.specialization, region].filter(Boolean).join(" · ") || "Artist"}
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                      >
                        <Link to={to} onClick={() => onOpenChange(false)}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Open
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={removing === a.id}
                        onClick={() => unfollow(a.id)}
                        className="h-8 rounded-lg text-xs"
                      >
                        {removing === a.id ? "…" : "Unfollow"}
                      </Button>
                    </div>
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

export default FollowingManageDialog;
