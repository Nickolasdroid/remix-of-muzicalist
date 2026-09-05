import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Clock3, Image as ImageIcon, Loader2, Replace, User, Video, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import PostMediaFrame from "@/components/PostMediaFrame";
import { QuotaInfoButton } from "@/components/dashboard/QuotaInfoButton";
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
  country: string | null;
  plan: string | null;
}

interface DraftPost {
  content: string;
  mediaUrl: string;
  mediaType: "" | "image" | "video";
}

interface PostComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished?: () => void | Promise<void>;
}

const EMPTY_DRAFT: DraftPost = { content: "", mediaUrl: "", mediaType: "" };

const PostComposerDialog = ({ open, onOpenChange, onPublished }: PostComposerDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { entitlements, loading: entitlementsLoading, refresh: refreshEntitlements } = useEntitlements();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ComposerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadKind, setUploadKind] = useState<"image" | "video">("image");
  const [draft, setDraft] = useState<DraftPost>(EMPTY_DRAFT);

  useEffect(() => {
    if (!open || profile) return;
    let active = true;
    setLoadingProfile(true);
    (async () => {
      try {
        const { data: profileRows, error } = await (supabase as any).rpc("get_my_full_profile");
        if (error) throw error;
        const profileData = Array.isArray(profileRows) ? profileRows[0] : profileRows;
        if (!profileData) throw new Error(t("postComposer.profileUnavailable", "Artist profile could not be loaded."));
        if (active) setProfile(profileData as ComposerProfile);
      } catch (error) {
        if (!active) return;
        toast({
          title: t("common.error", "Error"),
          description: error instanceof Error ? error.message : t("postComposer.loadError", "The composer could not be loaded."),
          variant: "destructive",
        });
      } finally {
        if (active) setLoadingProfile(false);
      }
    })();
    return () => { active = false; };
  }, [open, profile, t, toast]);

  const postLimit = isAdmin
    ? Number.POSITIVE_INFINITY
    : serverLimit(entitlements, "posts", getPostLimit(profile?.plan));
  const postsUsed = typeof entitlements?.usage?.posts === "number" ? entitlements.usage.posts : 0;
  const postsRemaining = Number.isFinite(postLimit) ? Math.max(postLimit - postsUsed, 0) : Number.POSITIVE_INFINITY;
  const canCreate = isAdmin || canPost(profile?.plan);
  const isValid = draft.content.trim().length > 0 && Boolean(draft.mediaUrl);
  const location = [profile?.county, profile?.country].filter(Boolean).join(", ");
  const artistMeta = [translateSpecialization(profile?.specialization), location].filter(Boolean).join(" · ");

  const closeComposer = () => {
    if (isPublishing || uploadProgress !== null) return;
    setDraft(EMPTY_DRAFT);
    onOpenChange(false);
  };

  const uploadMedia = async (file: File, kind: "image" | "video") => {
    if (!profile?.id) return;
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
      const fileName = `${profile.id}/posts/${Date.now()}_${sanitizeFileName(file.name)}`;
      const publicUrl = await uploadFileWithProgress("avatars", fileName, file, setUploadProgress);
      setDraft((current) => ({ ...current, mediaUrl: publicUrl, mediaType: kind }));
      toast({
        title: t("common.success", "Success"),
        description: kind === "video"
          ? t("postComposer.videoUploaded", "Video uploaded!")
          : t("postComposer.imageUploaded", "Image uploaded!"),
      });
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
    if (!profile?.id || !isValid || isPublishing) return;
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
          profile_id: profile.id,
          content: draft.content,
          media_url: draft.mediaUrl,
          media_type: draft.mediaType,
        })
        .select("id")
        .single();
      if (error) throw error;

      await (supabase as any).from("consumed_ad_slots").insert({
        profile_id: profile.id,
        is_premium: false,
        announcement_id: insertedPost?.id ?? null,
        kind: "post",
      });
      await refreshEntitlements();
      await onPublished?.();
      toast({ title: t("common.success", "Success"), description: t("postComposer.created", "Post created!") });
      setDraft(EMPTY_DRAFT);
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) closeComposer(); }}>
      <DialogContent
        className="flex max-h-[94dvh] w-[calc(100%-1rem)] max-w-[680px] flex-col gap-0 overflow-hidden rounded-lg border-border/70 bg-card p-0 shadow-2xl sm:w-[calc(100%-2rem)]"
        onInteractOutside={(event) => { if (isPublishing || uploadProgress !== null) event.preventDefault(); }}
        onEscapeKeyDown={(event) => { if (isPublishing || uploadProgress !== null) event.preventDefault(); }}
      >
        <DialogHeader className="border-b border-border/70 px-5 py-4 text-left sm:px-6">
          <DialogTitle className="pr-8 text-center text-lg font-semibold text-foreground sm:text-xl">
            {t("postComposer.title", "Create a post")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loadingProfile || entitlementsLoading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            </div>
          ) : (
            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-border sm:h-12 sm:w-12">
                  <AvatarImage src={profile?.avatar_url || ""} alt={profile?.stage_name || t("postComposer.artistFallback", "Artist")} />
                  <AvatarFallback className="bg-muted text-muted-foreground"><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground notranslate" translate="no">{profile?.stage_name || t("postComposer.artistFallback", "Artist")}</p>
                  {artistMeta && <p className="truncate text-sm text-muted-foreground">{artistMeta}</p>}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-border/70 bg-background/60 transition-colors focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/20">
                <Textarea
                  autoFocus
                  value={draft.content}
                  onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value.slice(0, 200) }))}
                  placeholder={t("postComposer.thoughtPlaceholder", "What’s on your mind?")}
                  maxLength={200}
                  rows={7}
                  className="min-h-[180px] resize-none border-0 bg-transparent px-4 pb-9 pt-4 text-base leading-relaxed shadow-none focus-visible:ring-0 sm:min-h-[200px] sm:text-lg"
                />
                <span className="absolute bottom-3 right-4 text-xs tabular-nums text-muted-foreground">{draft.content.length}/200</span>
              </div>

              {draft.mediaUrl && uploadProgress === null && (
                <div className="overflow-hidden rounded-lg border border-border/70 bg-background/50">
                  <PostMediaFrame
                    url={draft.mediaUrl}
                    type={draft.mediaType}
                    alt={t("postComposer.mediaPreviewAlt", "Selected post media")}
                    className="mt-0 max-h-[320px]"
                  />
                  <div className="flex items-center gap-2 border-t border-border/60 p-3">
                    <span className="mr-auto inline-flex items-center gap-2 text-sm font-medium text-foreground">
                      {draft.mediaType === "image" ? <ImageIcon className="h-4 w-4 text-accent" /> : <Video className="h-4 w-4 text-accent" />}
                      {draft.mediaType === "image"
                        ? t("postComposer.photoSelected", "Photo selected")
                        : t("postComposer.videoSelected", "Video selected")}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-lg text-muted-foreground"
                      onClick={() => draft.mediaType === "image" ? imageInputRef.current?.click() : videoInputRef.current?.click()}
                    >
                      <Replace className="mr-1.5 h-4 w-4" />
                      {t("creationModal.changeMedia", "Change")}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
                      aria-label={t("creationModal.removeMedia", "Remove")}
                      onClick={() => setDraft((current) => ({ ...current, mediaUrl: "", mediaType: "" }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {uploadProgress !== null && (
                <div className="space-y-2 rounded-lg border border-border/70 bg-background/50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {uploadKind === "video" ? t("creationModal.uploadingVideo", "Uploading video…") : t("creationModal.uploadingImage", "Uploading image…")}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{t("postComposer.addToPost", "Add to your post")}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 justify-start gap-3 rounded-lg border-border/70 bg-background/30 px-4 hover:border-accent/50 hover:bg-accent/5"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadProgress !== null}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent"><Camera className="h-5 w-5" /></span>
                    <span>{t("creationModal.photo", "Photo")}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 justify-start gap-3 rounded-lg border-border/70 bg-background/30 px-4 hover:border-accent/50 hover:bg-accent/5"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadProgress !== null}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent"><Video className="h-5 w-5" /></span>
                    <span>{t("creationModal.video", "Video")}</span>
                  </Button>
                  <Input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleMediaInput(event, "image")} />
                  <Input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(event) => handleMediaInput(event, "video")} />
                </div>
              </section>

              <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/40 p-3.5">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-foreground">
                    <span>
                      {Number.isFinite(postsRemaining)
                        ? t("creationModal.postsAvailable", { count: postsRemaining, defaultValue: "{{count}} posts available" })
                        : t("postComposer.unlimitedPosts", "Unlimited posts")}
                    </span>
                    <QuotaInfoButton kind="posts" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("creationModal.resetsAtRenewal", "Resets at renewal")}</p>
                </div>
              </div>

              {!canCreate && (
                <p className="rounded-lg border border-border bg-background/40 p-3 text-sm text-muted-foreground">
                  {t("postComposer.planRequired", "Posts are available with a Standard or Premium plan.")}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border/70 bg-card px-5 py-4 sm:px-6">
          <Button
            type="button"
            className="h-11 w-full rounded-lg bg-accent font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            onClick={handlePublish}
            disabled={loadingProfile || entitlementsLoading || isPublishing || uploadProgress !== null || !isValid || !canCreate || postsRemaining <= 0}
          >
            {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPublishing ? t("creationModal.publishing", "Publishing...") : t("creationModal.publishPost", "Publish post")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostComposerDialog;