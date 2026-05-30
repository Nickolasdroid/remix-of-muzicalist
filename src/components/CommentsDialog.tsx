import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Loader2, Send, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
  parent_id: string | null;
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
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const onCountChangeRef = useRef(onCountChange);
  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  }, [onCountChange]);

  const fetchComments = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const column = targetType === "post" ? "post_id" : "announcement_id";
      const { data, error } = await (supabase as any)
        .from("comments")
        .select("id, content, created_at, user_id, parent_id")
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
      onCountChangeRef.current?.(withProfiles.length);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    if (open && targetId) {
      setText("");
      setReplyTo(null);
      setExpandedThreads(new Set());
      fetchComments();
    }
  }, [open, targetId, fetchComments]);

  const { topLevel, repliesByParent } = useMemo(() => {
    const top: CommentRow[] = [];
    const map = new Map<string, CommentRow[]>();
    comments.forEach((c) => {
      if (c.parent_id) {
        const arr = map.get(c.parent_id) || [];
        arr.push(c);
        map.set(c.parent_id, arr);
      } else {
        top.push(c);
      }
    });
    return { topLevel: top, repliesByParent: map };
  }, [comments]);

  const handlePost = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || !targetId) return;
    setPosting(true);
    try {
      // If replying to a reply, attach to the root comment instead (flat threading like IG/FB)
      let parentId: string | null = null;
      if (replyTo) {
        parentId = replyTo.parent_id ?? replyTo.id;
      }
      const payload: any = {
        user_id: currentUserId,
        content: trimmed,
        parent_id: parentId,
        [targetType === "post" ? "post_id" : "announcement_id"]: targetId,
      };
      const { data, error } = await (supabase as any)
        .from("comments")
        .insert(payload)
        .select("id, content, created_at, user_id, parent_id")
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
      if (parentId) {
        setExpandedThreads((prev) => new Set(prev).add(parentId!));
      }
      setText("");
      setReplyTo(null);
    } catch (err) {
      console.error("Error posting comment:", err);
      toast({ title: "Error", description: "Failed to post comment.", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const { error } = await (supabase as any).from("comments").delete().eq("id", deleteConfirmId);
      if (error) throw error;
      setComments((prev) => {
        // Remove the comment and any of its replies (cascade in DB, mirror in UI)
        const next = prev.filter((c) => c.id !== deleteConfirmId && c.parent_id !== deleteConfirmId);
        onCountChange?.(next.length);
        return next;
      });
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast({ title: "Error", description: "Failed to delete comment.", variant: "destructive" });
    }
  };

  const startReply = (c: CommentRow) => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    setReplyTo(c);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const toggleThread = (parentId: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  const renderComment = (c: CommentRow, isReply = false) => {
    const canDelete = currentUserId === c.user_id || isAdmin;
    return (
      <div key={c.id} className="flex gap-2 group">
        <Link to={`/artist/${c.user_id}`} className="flex-shrink-0">
          <Avatar className={isReply ? "w-7 h-7" : "w-8 h-8"}>
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
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-[11px] text-muted-foreground">{formatSmartDate(c.created_at)}</span>
            <button
              onClick={() => startReply(c)}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              Reply
            </button>
            {canDelete && (
              <button
                onClick={() => setDeleteConfirmId(c.id)}
                className="text-[11px] text-muted-foreground hover:text-destructive md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                aria-label="Delete comment"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isMobile = useIsMobile();

  const body = (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : topLevel.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          topLevel.map((c) => {
            const replies = repliesByParent.get(c.id) || [];
            const expanded = expandedThreads.has(c.id);
            return (
              <div key={c.id} className="space-y-2">
                {renderComment(c)}
                {replies.length > 0 && (
                  <div className="pl-10 space-y-2">
                    {!expanded ? (
                      <button
                        onClick={() => toggleThread(c.id)}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2"
                      >
                        <span className="h-px w-6 bg-border" />
                        View {replies.length} {replies.length === 1 ? "reply" : "replies"}
                      </button>
                    ) : (
                      <>
                        {replies.map((r) => renderComment(r, true))}
                        <button
                          onClick={() => toggleThread(c.id)}
                          className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2"
                        >
                          <span className="h-px w-6 bg-border" />
                          Hide replies
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t p-3">
        {currentUserId ? (
          <>
            {replyTo && (
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 px-1">
                <span>
                  Replying to <span className="font-semibold">{replyTo.profile?.stage_name || "User"}</span>
                </span>
                <button onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                placeholder={replyTo ? `Reply to ${replyTo.profile?.stage_name || "User"}...` : "Write a comment..."}
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
          </>
        ) : (
          <Button className="w-full" onClick={() => navigate("/login")}>
            Sign in to comment
          </Button>
        )}
      </div>
    </>
  );

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[85vh] flex flex-col">
            <DrawerHeader className="border-b text-left">
              <DrawerTitle>Comments</DrawerTitle>
              <DrawerDescription className="sr-only">View and add comments</DrawerDescription>
            </DrawerHeader>
            {body}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="rounded-lg max-w-md p-0 flex flex-col max-h-[80vh]">
            <DialogHeader className="px-4 pt-4 pb-2 border-b">
              <DialogTitle>Comments</DialogTitle>
              <DialogDescription className="sr-only">View and add comments</DialogDescription>
            </DialogHeader>
            {body}
          </DialogContent>
        </Dialog>
      )}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CommentsDialog;
