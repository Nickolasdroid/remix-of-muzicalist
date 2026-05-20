import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatSmartDate } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "post" | "announcement";
  targetId: string | null;
  currentUserId: string | null;
  isAdmin?: boolean;
  onCountChange?: (newCount: number) => void;
}

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: {
    stage_name: string | null;
    avatar_url: string | null;
  } | null;
}

const MAX_LENGTH = 500;

const CommentsDialog = ({
  open,
  onOpenChange,
  targetType,
  targetId,
  currentUserId,
  isAdmin,
  onCountChange,
}: CommentsDialogProps) => {
  const navigate = useNavigate();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const column = targetType === "post" ? "post_id" : "announcement_id";
      const { data, error } = await (supabase as any)
        .from("comments")
        .select("id, content, created_at, user_id")
        .eq(column, targetId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const rows = (data || []) as CommentRow[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      let profileMap = new Map<string, { stage_name: string | null; avatar_url: string | null }>();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, stage_name, avatar_url")
          .in("id", userIds);
        (profs || []).forEach((p: any) => profileMap.set(p.id, { stage_name: p.stage_name, avatar_url: p.avatar_url }));
      }
      const withProfiles = rows.map((r) => ({ ...r, profile: profileMap.get(r.user_id) || null }));
      setComments(withProfiles);
      onCountChange?.(withProfiles.length);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType, onCountChange]);

  useEffect(() => {
    if (open && targetId) {
      setText("");
      fetchComments();
    }
  }, [open, targetId, fetchComments]);

  const handlePost = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || !targetId) return;
    setPosting(true);
    try {
      const payload: any = {
        user_id: currentUserId,
        content: trimmed,
        [targetType === "post" ? "post_id" : "announcement_id"]: targetId,
      };
      const { data, error } = await (supabase as any)
        .from("comments")
        .insert(payload)
        .select("id, content, created_at, user_id")
        .single();
      if (error) throw error;

      const { data: prof } = await supabase
        .from("profiles")
        .select("stage_name, avatar_url")
        .eq("id", currentUserId)
        .maybeSingle();

      const newComment: CommentRow = { ...(data as CommentRow), profile: prof as any };
      setComments((prev) => {
        const next = [...prev, newComment];
        onCountChange?.(next.length);
        return next;
      });
      setText("");
    } catch (err) {
      console.error("Error posting comment:", err);
      toast({ title: "Error", description: "Failed to post comment.", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any).from("comments").delete().eq("id", id);
      if (error) throw error;
      setComments((prev) => {
        const next = prev.filter((c) => c.id !== id);
        onCountChange?.(next.length);
        return next;
      });
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast({ title: "Error", description: "Failed to delete comment.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg max-w-md p-0 flex flex-col max-h-[80vh]">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle>Comments</DialogTitle>
          <DialogDescription className="sr-only">View and add comments</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((c) => {
              const canDelete = currentUserId === c.user_id || isAdmin;
              return (
                <div key={c.id} className="flex gap-2 group">
                  <Link to={`/artist/${c.user_id}`} className="flex-shrink-0">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={c.profile?.avatar_url || ""} alt={c.profile?.stage_name || "User"} />
                      <AvatarFallback className="text-xs bg-muted">
                        {(c.profile?.stage_name || "U").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <Link to={`/artist/${c.user_id}`} className="text-xs font-semibold hover:underline">
                        {c.profile?.stage_name || "User"}
                      </Link>
                      <p className="text-sm break-words whitespace-pre-wrap">{c.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[11px] text-muted-foreground">{formatSmartDate(c.created_at)}</span>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-[11px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t p-3">
          {currentUserId ? (
            <div className="flex gap-2 items-end">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                placeholder="Write a comment..."
                rows={1}
                maxLength={MAX_LENGTH}
                className="rounded-lg resize-none min-h-[40px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePost();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handlePost}
                disabled={posting || !text.trim()}
                aria-label="Send comment"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={() => navigate("/login")}>
              Sign in to comment
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsDialog;
