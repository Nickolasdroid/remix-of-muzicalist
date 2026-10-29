import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon, Video as VideoIcon, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import MobileComposerHeader from "@/components/composer/MobileComposerHeader";
import DiscardDraftDialog from "@/components/composer/DiscardDraftDialog";
import { useCloseOnBack } from "@/hooks/useCloseOnBack";
import { CreationModalShell } from "@/components/dashboard/CreationModal";
import { QuotaInfoButton } from "@/components/dashboard/QuotaInfoButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEntitlements, serverLimit } from "@/hooks/useEntitlements";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { canPost, getPostLimit } from "@/lib/planLimits";
import { translateSpecialization } from "@/lib/specializationLabel";
import { sanitizeFileName } from "@/lib/utils";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";

interface ComposerProfile {
  id: string;
  stage_name: string | null;
  avatar_url: string | null;
  specialization: string | null;
  county: string | null;
  plan: string | null;
}

interface PostComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a post has been published successfully */
  onPublished?: () => void | Promise<void>;
}

const MAX_LENGTH = 500;

/**
 * The single, shared "Create a post" composer used everywhere an artist can
 * publish a post (Dashboard → Posts, Feed, deep links).
 * Presentation redesign only — publishing, uploads and quota rules unchanged.
 */
const PostComposerDialog = ({ open, onOpenChange, onPublished }: PostComposerDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { entitlements, refresh: refreshEntitlements } = useEntitlements();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ComposerProfile | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadKind, setUploadKind] = useState<"image" | "video">("image");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"" | "image" | "video">("");

  const postLimit = isAdmin
    ? Number.POSITIVE_INFINITY
    : serverLimit(entitlements, "posts", getPostLimit(profile?.plan));
  const postsUsed = typeof entitlements?.usage?.posts === "number" ? entitlements.usage.posts : 0;
  const postsRemaining = Number.isFinite(postLimit) ? Math.max(postLimit - postsUsed, 0) : Number.POSITIVE_INFINITY;
  const canCreate = isAdmin || canPost(profile?.plan);
  const isValid = content.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: profileRows, error } = await (supabase as any).rpc("get_my_full_profile");
        if (error) throw error;
        const profileData = Array.isArray(profileRows) ? profileRows[0] : profileRows;
        if (cancelled) return;
        setUserId(session.user.id);
        setProfile((profileData as ComposerProfile) ?? null);
      } catch {
        /* the composer still works with a minimal header */
      }
    };

    load();
    refreshEntitlements();
    return () => { cancelled = true; };
  }, [open, refreshEntitlements]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  const resetDraft = () => {

    setContent("");
    setMediaUrl("");
    setMediaType("");
    setUploadProgress(null);
  };

  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const isBusy = isPublishing || uploadProgress !== null;
  const isDirty = content.trim().length > 0 || !!mediaUrl;
  const finishClose = () => {
    resetDraft();
    onOpenChange(false);
  };
  // Phone Back closes the composer (asks first if there is a draft)
  const releaseHistory = useCloseOnBack(open, () => {
    if (isBusy) return false;
    if (isDirty) {
      setConfirmDiscard(true);
      return false;
    }
    finishClose();
    return true;
  });

  const handleOpenChange = (next: boolean) => {
    if (next) {
      onOpenChange(true);
      return;
    }
    if (isBusy) return;
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    releaseHistory();
    finishClose();
  };

  const uploadMedia = async (file: File, kind: "image" | "video") => {
    if (!userId) return;
    if (kind === "video" && file.size > 500 * 1024 * 1024) {
      toast({
        title: t("common.error", "Error"),
        description: t("postComposer.videoSizeError", "Video file size must not exceed 500 MB."),
        variant: "destructive",
      });
      return;
    }

    setUploadKind(kind);
    setUploadProgress(0);
    try {
      const fileName = `${userId}/posts/${Date.now()}_${sanitizeFileName(file.name)}`;
      const publicUrl = await uploadFileWithProgress("avatars", fileName, file, setUploadProgress);
      setMediaUrl(publicUrl);
      setMediaType(kind);
    } catch (error) {
      toast({
        title: t("common.error", "Error"),
        description: error instanceof Error ? error.message : t("postComposer.uploadError", "Media could not be uploaded."),
        variant: "destructive",
      });
    } finally {
      setUploadProgress(null);
    }
  };

  const handleMediaInput = async (event: React.ChangeEvent<HTMLInputElement>, kind: "image" | "video") => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await uploadMedia(file, kind);
  };

  const handlePublish = async () => {
    if (!userId || !isValid || isPublishing) return;
    if (!canCreate || postsRemaining <= 0) {
      toast({
        title: t("postComposer.limitReachedTitle", "Limit reached"),
        description: t("postComposer.limitReached", "You have no post slots available right now."),
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const { data: insertedPost, error } = await supabase
        .from("posts")
        .insert({
          profile_id: userId,
          content,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      await (supabase as any).from("consumed_ad_slots").insert({
        profile_id: userId,
        is_premium: false,
        announcement_id: insertedPost?.id ?? null,
        kind: "post",
      });
      await refreshEntitlements();
      toast({ title: t("common.success", "Success"), description: t("postComposer.created", "Post created!") });
      releaseHistory();
      resetDraft();
      onOpenChange(false);
      await onPublished?.();
    } catch (error) {
      toast({
        title: t("common.error", "Error"),
        description: error instanceof Error ? error.message : t("postComposer.publishError", "The post could not be published."),
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const artistName = profile?.stage_name || t("postComposer.artistFallback", "Artist");
  const metaLine = [translateSpecialization(profile?.specialization), profile?.county]
    .filter(Boolean)
    .join(" · ");

  const used = content.length;
  const ringPct = Math.min(100, Math.round((used / MAX_LENGTH) * 100));
  const nearLimit = used >= MAX_LENGTH * 0.9;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <CreationModalShell
        title="New post"
        bodyClassName="space-y-0 pt-4 pb-0"
        mobileHeader={
          <MobileComposerHeader
            title="New post"
            onCancel={() => handleOpenChange(false)}
            actionLabel="Publish"
            onAction={handlePublish}
            busy={isPublishing}
            disabled={uploadProgress !== null || !isValid || !canCreate || postsRemaining <= 0}
          />
        }
        footer={
          <div className="space-y-3">
            {Number.isFinite(postsRemaining) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={postsRemaining === 0 ? "font-semibold text-destructive tabular-nums" : "font-semibold text-foreground tabular-nums"}>
                  {postsRemaining}
                </span>
                <span>{postsRemaining === 1 ? "post left" : "posts left"}</span>
                <span>·</span>
                <span>resets at renewal</span>
                <QuotaInfoButton kind="posts" />
              </div>
            )}
            <Button
              type="button"
              className="max-md:hidden h-11 w-full rounded-lg bg-accent font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              onClick={handlePublish}
              disabled={isPublishing || uploadProgress !== null || !isValid || !canCreate || postsRemaining <= 0}
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        }
      >
        {/* Author */}
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border border-accent/60">
            <AvatarImage src={profile?.avatar_url || undefined} alt={artistName} />
            <AvatarFallback className="bg-accent/10 text-sm font-semibold text-accent">{artistName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-foreground notranslate" translate="no">{artistName}</p>
            {metaLine && <p className="truncate text-xs text-muted-foreground notranslate" translate="no">{metaLine}</p>}
          </div>
        </div>

        {!canCreate && (
          <div className="mt-3 rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
            Posts are available with a Standard or Premium plan.
          </div>
        )}

        {/* Text: the main thing, no box around it */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value.slice(0, MAX_LENGTH))}
          placeholder="What do you want to show your fans and organizers?"
          maxLength={MAX_LENGTH}
          aria-label="Post text"
          className="mt-4 min-h-[110px] max-h-[40dvh] resize-none overflow-y-auto border-0 bg-transparent px-0 py-1 text-[17px] leading-relaxed shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        <Input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleMediaInput(event, "image")} />
        <Input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(event) => handleMediaInput(event, "video")} />

        {uploadProgress !== null && (
          <div className="mt-3 space-y-2.5 rounded-xl bg-card p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">
                {uploadKind === "video" ? "Uploading video…" : "Uploading image…"}
              </span>
              <span className="tabular-nums text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {mediaUrl && uploadProgress === null && (
          <div className="relative mt-3 overflow-hidden rounded-xl bg-muted/30">
            {mediaType === "image" ? (
              <img src={mediaUrl} alt="Photo selected" className="max-h-[340px] w-full object-cover" />
            ) : (
              <video src={mediaUrl} controls playsInline className="max-h-[340px] w-full bg-black object-contain" />
            )}
            <button
              type="button"
              aria-label="Remove"
              className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-black/65 text-white transition-colors hover:bg-black/80"
              onClick={() => { setMediaUrl(""); setMediaType(""); }}
            >
              <X className="h-4 w-4" />
            </button>
            {mediaType === "image" && (
              <button
                type="button"
                className="absolute bottom-2.5 left-2.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black/80"
                onClick={() => imageInputRef.current?.click()}
              >
                Change
              </button>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="mt-3 flex items-center gap-2 border-t border-border/60 py-3">
          <button
            type="button"
            disabled={uploadProgress !== null}
            onClick={() => imageInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-sm text-foreground/90 transition-colors hover:bg-muted disabled:opacity-50"
          >
            <ImageIcon className="h-4 w-4 text-accent" />
            Photo
          </button>
          <button
            type="button"
            disabled={uploadProgress !== null}
            onClick={() => videoInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-sm text-foreground/90 transition-colors hover:bg-muted disabled:opacity-50"
          >
            <VideoIcon className="h-4 w-4 text-accent" />
            Video
          </button>
          {used > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className={`text-xs tabular-nums ${nearLimit ? "text-amber-400" : "text-muted-foreground"}`}>
                {used} / {MAX_LENGTH}
              </span>
              <span
                aria-hidden
                className="grid h-5 w-5 place-items-center rounded-full"
                style={{ background: `conic-gradient(hsl(var(--accent)) ${ringPct}%, hsl(var(--border)) ${ringPct}% 100%)` }}
              >
                <span className="h-3.5 w-3.5 rounded-full bg-background" />
              </span>
            </div>
          )}
        </div>
      </CreationModalShell>
      <DiscardDraftDialog
        open={confirmDiscard}
        title="Discard this post?"
        onKeep={() => setConfirmDiscard(false)}
        onDiscard={() => {
          setConfirmDiscard(false);
          releaseHistory();
          finishClose();
        }}
      />
    </Dialog>
  );
};

export default PostComposerDialog;
