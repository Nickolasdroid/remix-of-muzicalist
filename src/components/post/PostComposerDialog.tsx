import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Image as ImageIcon, Images, Play, Replace, Video as VideoIcon, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { CreationModalShell, UsagePill } from "@/components/dashboard/CreationModal";
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

const MAX_LENGTH = 200;

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

  const handleOpenChange = (next: boolean) => {
    if (!next && (isPublishing || uploadProgress !== null)) return;
    if (!next) resetDraft();
    onOpenChange(next);
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
          media_url: mediaUrl,
          media_type: mediaType,
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <CreationModalShell
        title={t("postComposer.title", "Create a post")}
        className="max-w-[680px]"
        footer={
          <Button
            type="button"
            className="w-full rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90"
            onClick={handlePublish}
            disabled={isPublishing || uploadProgress !== null || !isValid || !canCreate || postsRemaining <= 0}
          >
            {isPublishing ? t("creationModal.publishing", "Publishing...") : t("creationModal.publishPost", "Publish post")}
          </Button>
        }
      >
        {/* Artist header */}
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border border-border/70">
            <AvatarImage src={profile?.avatar_url || undefined} alt={artistName} />
            <AvatarFallback className="bg-muted text-sm font-semibold">{artistName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{artistName}</p>
            {metaLine && <p className="truncate text-xs text-muted-foreground">{metaLine}</p>}
          </div>
        </div>

        {!canCreate && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            {t("postComposer.planRequired", "Posts are available with a Standard or Premium plan.")}
          </div>
        )}

        {/* Text */}
        <div className="space-y-1.5">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, MAX_LENGTH))}
            placeholder={t("creationModal.postPlaceholder", "Write something about your post...")}
            maxLength={MAX_LENGTH}
            className="min-h-[88px] max-h-[220px] resize-none overflow-y-auto rounded-lg border-border/70 bg-background/50 p-4 text-base leading-relaxed transition-colors focus-visible:ring-accent/40"
          />

          <p className="text-right text-xs tabular-nums text-muted-foreground">{content.length}/{MAX_LENGTH}</p>
        </div>

        {/* Media */}
        <section className="space-y-3 border-t border-border/60 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("postComposer.addToPost", "Add to your post")}
          </h3>

          {!mediaUrl && uploadProgress === null && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto flex-col gap-2 rounded-lg border-border/70 bg-background/30 py-4 transition-colors hover:border-accent/50 hover:bg-muted/40"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="h-5 w-5 text-accent" />
                {t("creationModal.photo", "Photo")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto flex-col gap-2 rounded-lg border-border/70 bg-background/30 py-4 transition-colors hover:border-accent/50 hover:bg-muted/40"
                onClick={() => videoInputRef.current?.click()}
              >
                <VideoIcon className="h-5 w-5 text-accent" />
                {t("creationModal.video", "Video")}
              </Button>
            </div>
          )}

          <Input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleMediaInput(event, "image")} />
          <Input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(event) => handleMediaInput(event, "video")} />

          {uploadProgress !== null && (
            <div className="space-y-2.5 rounded-lg border border-border/70 bg-background/30 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">
                  {uploadKind === "video"
                    ? t("creationModal.uploadingVideo", "Uploading video…")
                    : t("creationModal.uploadingImage", "Uploading image…")}
                </span>
                <span className="tabular-nums text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {mediaUrl && uploadProgress === null && (
            <div className="overflow-hidden rounded-lg border border-border/70 bg-background/30">
              <div className="relative flex max-h-[320px] items-center justify-center bg-muted/30">
                {mediaType === "image" ? (
                  <img src={mediaUrl} alt={t("postComposer.photoSelected", "Photo selected")} className="max-h-[320px] w-full object-contain" />
                ) : (
                  <video src={mediaUrl} controls playsInline className="max-h-[320px] w-full bg-black object-contain" />
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  aria-label={t("creationModal.removeMedia", "Remove")}
                  className="absolute right-2 top-2 h-8 w-8 rounded-full opacity-90 transition-opacity hover:opacity-100"
                  onClick={() => { setMediaUrl(""); setMediaType(""); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 px-3 py-2">
                {mediaType === "image"
                  ? <ImageIcon className="h-4 w-4 text-accent" />
                  : <Play className="h-4 w-4 text-accent" />}
                <span className="mr-auto text-xs text-muted-foreground">
                  {mediaType === "image"
                    ? t("postComposer.photoSelected", "Photo selected")
                    : t("postComposer.videoSelected", "Video selected")}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-lg text-muted-foreground"
                  onClick={() => (mediaType === "image" ? imageInputRef.current : videoInputRef.current)?.click()}
                >
                  <Replace className="mr-1.5 h-4 w-4" />
                  {t("creationModal.changeMedia", "Change")}
                </Button>
              </div>
            </div>
          )}

        </section>

        {/* Quota */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-5">
          {Number.isFinite(postsRemaining) && (
            <UsagePill
              icon={<Images className="h-3.5 w-3.5" />}
              tone={postsRemaining === 0 ? "warning" : "accent"}
            >
              {t("creationModal.postsAvailable", { count: postsRemaining, defaultValue: "{{count}} posts available" })}
            </UsagePill>
          )}
          <UsagePill icon={<Clock className="h-3.5 w-3.5" />}>
            {t("creationModal.resetsAtRenewal", "Resets at renewal")}
          </UsagePill>
          <QuotaInfoButton kind="posts" />
        </div>
      </CreationModalShell>
    </Dialog>
  );
};

export default PostComposerDialog;
