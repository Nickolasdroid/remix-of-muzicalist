import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileX, Flag, Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import FeedPostCard from "@/components/FeedPostCard";
import PostActionsMenu from "@/components/PostActionsMenu";
import CommentsDialog from "@/components/CommentsDialog";
import ReportContentDialog from "@/components/ReportContentDialog";
import InstagramZoomPreview from "@/components/InstagramZoomPreview";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { translateSpecialization } from "@/lib/specializationLabel";
import { sharePost } from "@/lib/sharePost";
import { toast } from "@/hooks/use-toast";

type Kind = "post" | "promotion";

interface DetailItem {
  id: string;
  profileId: string;
  content: string;
  createdAt: string;
  mediaUrl: string | null;
  mediaType: string | null;
  promotedUntil: string | null;
  likes: number;
  isLiked: boolean;
  commentsCount: number;
}

interface Author {
  id: string;
  stage_name: string | null;
  avatar_url: string | null;
  specialization: string | null;
  plan: string | null;
}

/**
 * Dedicated page for a single post (or media promotion). Reuses FeedPostCard,
 * the shared comments/report dialogs and the existing media viewer.
 */
const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const kind: Kind = params.get("kind") === "promotion" ? "promotion" : "post";
  const isPromo = kind === "promotion";
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [item, setItem] = useState<DetailItem | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);

  const load = useCallback(async () => {
    if (!id) { setStatus("missing"); return; }
    setStatus("loading");
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id ?? null;
      setUserId(uid);

      let base: Omit<DetailItem, "likes" | "isLiked" | "commentsCount"> | null = null;
      if (isPromo) {
        const { data, error } = await supabase.from("announcements")
          .select("id, profile_id, description, media_url, media_type, created_at, is_premium")
          .eq("id", id).maybeSingle();
        if (error) throw error;
        if (data && data.is_premium) base = { id: data.id, profileId: data.profile_id, content: data.description || "", createdAt: data.created_at, mediaUrl: data.media_url, mediaType: data.media_type, promotedUntil: null };
      } else {
        const { data, error } = await supabase.from("posts")
          .select("id, profile_id, content, media_url, media_type, created_at, promoted_until")
          .eq("id", id).maybeSingle();
        if (error) throw error;
        if (data) base = { id: data.id, profileId: data.profile_id, content: data.content || "", createdAt: data.created_at, mediaUrl: data.media_url, mediaType: data.media_type, promotedUntil: (data as any).promoted_until ?? null };
      }
      if (!base) { setStatus("missing"); return; }

      const likeTable = isPromo ? "announcement_likes" : "post_likes";
      const likeCol = isPromo ? "announcement_id" : "post_id";
      const [authorRes, likesRes, mineRes, commentsRes] = await Promise.all([
        supabase.from("profiles").select("id, stage_name, avatar_url, specialization, plan").eq("id", base.profileId).maybeSingle(),
        (supabase as any).from(likeTable).select(likeCol, { count: "exact", head: true }).eq(likeCol, id),
        uid ? (supabase as any).from(likeTable).select(likeCol).eq(likeCol, id).eq("user_id", uid) : Promise.resolve({ data: [] }),
        (supabase as any).from("comments").select("id", { count: "exact", head: true }).eq(likeCol, id),
      ]);
      if (!authorRes.data) { setStatus("missing"); return; }
      setAuthor(authorRes.data as Author);
      setItem({ ...base, likes: likesRes.count || 0, isLiked: (mineRes.data || []).length > 0, commentsCount: commentsRes.count || 0 });
      setStatus("ready");
    } catch (e) {
      console.error("Error loading post:", e);
      setStatus("error");
    }
  }, [id, isPromo]);

  useEffect(() => { load(); }, [load]);

  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(author ? `/artist/${author.id}` : "/feed");
  };

  const handleLike = async () => {
    if (!item) return;
    if (!userId) { navigate("/login"); return; }
    const prev = item;
    setItem({ ...item, isLiked: !item.isLiked, likes: item.isLiked ? Math.max(0, item.likes - 1) : item.likes + 1 });
    try {
      const table = isPromo ? "announcement_likes" : "post_likes";
      const col = isPromo ? "announcement_id" : "post_id";
      const res = prev.isLiked
        ? await (supabase as any).from(table).delete().eq(col, item.id).eq("user_id", userId)
        : await (supabase as any).from(table).insert({ [col]: item.id, user_id: userId });
      if (res.error) throw res.error;
    } catch (e) {
      setItem(prev);
      console.error("Error toggling like:", e);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    const { error } = await supabase.from(isPromo ? "announcements" : "posts").delete().eq("id", item.id);
    if (error) { toast({ title: t("postDetail.deleteError", "Could not delete"), variant: "destructive" }); return; }
    toast({ title: t("postDetail.deleted", "Deleted") });
    goBack();
  };

  const isOwner = !!userId && !!author && userId === author.id;
  const promoted = isPromo || (!!item?.promotedUntil && new Date(item.promotedUntil).getTime() > Date.now());

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-2xl items-center gap-2 px-2">
          <Button variant="ghost" size="icon" onClick={goBack} aria-label={t("postDetail.back", "Back")} className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-semibold text-foreground">{t("postDetail.title", "Post")}</h1>
        </div>
      </div>

      <main className="mx-auto max-w-2xl pb-24 pt-2 md:pt-4">
        {status === "loading" && (
          <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        )}
        {(status === "missing" || status === "error") && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <FileX className="h-10 w-10 text-accent" />
            <p className="font-medium text-foreground">
              {status === "missing" ? t("postDetail.notFound", "This post is no longer available") : t("postDetail.error", "Could not load this post")}
            </p>
            <div className="flex gap-2">
              {status === "error" && <Button variant="outline" onClick={load}>{t("postDetail.retry", "Try again")}</Button>}
              <Button variant="ghost" onClick={goBack}>{t("postDetail.back", "Back")}</Button>
            </div>
          </div>
        )}
        {status === "ready" && item && author && (
          <FeedPostCard
            author={{ id: author.id, stageName: author.stage_name || "Artist", avatarUrl: author.avatar_url, specializationLabel: translateSpecialization(author.specialization), plan: author.plan }}
            content={item.content}
            createdAt={item.createdAt}
            mediaUrl={item.mediaUrl}
            mediaType={item.mediaType}
            likes={item.likes}
            commentsCount={item.commentsCount}
            isLiked={item.isLiked}
            promoted={promoted}
            postId={isPromo ? undefined : item.id}
            onAuthorClick={() => navigate(`/artist/${author.id}`)}
            onMediaClick={() => item.mediaUrl && setMediaPreview({ url: item.mediaUrl, type: item.mediaType === "video" ? "video" : "image" })}
            onLike={handleLike}
            onComment={() => setCommentsOpen(true)}
            onShare={() => sharePost({ profileId: author.id, stageName: author.stage_name || "Artist", type: isPromo ? "announcement" : "post" })}
            menu={<PostActionsMenu actions={[
              ...(!isOwner ? [{ key: "report", label: t("dashboardPosts.report", "Report"), icon: Flag, onSelect: () => { if (!userId) { navigate("/login"); return; } setReportOpen(true); } }] : []),
              ...(isOwner ? [{ key: "delete", label: t("dashboardPosts.delete", "Delete"), icon: Trash2, destructive: true, onSelect: () => setDeleteOpen(true) }] : []),
            ]} />}
          />
        )}
      </main>

      <CommentsDialog
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        targetType={isPromo ? "announcement" : "post"}
        targetId={item?.id ?? null}
        currentUserId={userId}
        onCountChange={(count) => setItem((p) => (p ? { ...p, commentsCount: count } : p))}
      />
      <ReportContentDialog open={reportOpen} onOpenChange={setReportOpen} contentType={isPromo ? "announcement" : "post"} contentId={item?.id ?? null} />
      <InstagramZoomPreview media={mediaPreview} onClose={() => setMediaPreview(null)} />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("postDetail.deleteTitle", "Delete this post?")}</AlertDialogTitle>
            <AlertDialogDescription>{t("postDetail.deleteDesc", "This action cannot be undone.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("postDetail.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("dashboardPosts.delete", "Delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PostDetail;
