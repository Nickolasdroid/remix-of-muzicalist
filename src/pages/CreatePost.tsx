import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Clock, Image as ImageIcon, Images, Replace, Video as VideoIcon, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import FeedPostCard from "@/components/FeedPostCard";
import { QuotaInfoButton } from "@/components/dashboard/QuotaInfoButton";
import { UsagePill } from "@/components/dashboard/CreationModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const POSTS_PATH = "/dashboard?tab=profile&section=posts";

interface DraftPost {
  content: string;
  mediaUrl: string;
  mediaType: "" | "image" | "video";
}

interface ComposerProfile {
  id: string;
  stage_name: string | null;
  avatar_url: string | null;
  specialization: string | null;
  plan: string | null;
}

const CreatePost = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { entitlements, loading: entitlementsLoading, refresh: refreshEntitlements } = useEntitlements();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ComposerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadKind, setUploadKind] = useState<"image" | "video">("image");
  const [draft, setDraft] = useState<DraftPost>({ content: "", mediaUrl: "", mediaType: "" });

  const postLimit = isAdmin
    ? Number.POSITIVE_INFINITY
    : serverLimit(entitlements, "posts", getPostLimit(profile?.plan));
  const postsUsed = typeof entitlements?.usage?.posts === "number" ? entitlements.usage.posts : 0;
  const postsRemaining = Number.isFinite(postLimit) ? Math.max(postLimit - postsUsed, 0) : Number.POSITIVE_INFINITY;
  const canCreate = isAdmin || canPost(profile?.plan);
  const isValid = draft.content.trim().length > 0 && Boolean(draft.mediaUrl);

  useEffect(() => {
    const loadComposer = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login", { replace: true });
          return;
        }

        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("user_type")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if ((roleRow?.user_type as string) === "user") {
          navigate("/user-dashboard", { replace: true });
          return;
        }

        const { data: profileRows, error } = await (supabase as any).rpc("get_my_full_profile");
        if (error) throw error;
        const profileData = Array.isArray(profileRows) ? profileRows[0] : profileRows;
        if (!profileData) throw new Error(t("postComposer.profileUnavailable", "Artist profile could not be loaded."));

        setUserId(session.user.id);
        setProfile(profileData as ComposerProfile);
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: error instanceof Error ? error.message : t("postComposer.loadError", "The composer could not be loaded."),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadComposer();
  }, [navigate, t, toast]);

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
          content: draft.content,
          media_url: draft.mediaUrl,
          media_type: draft.mediaType,
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
      navigate(POSTS_PATH, { replace: true });
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

  if (isLoading || entitlementsLoading) {
    return (
      <div className="min-h-screen bg-background md:ml-64">
        <Navigation mobileTitle={t("postComposer.title", "Create a post")} mobileBackPath={POSTS_PATH} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background md:ml-64">
      <Navigation mobileTitle={t("postComposer.title", "Create a post")} mobileBackPath={POSTS_PATH} />

      <main className="px-4 pb-28 pt-20 md:px-8 md:pb-12 md:pt-8">
        <div className="mx-auto max-w-6xl space-y-7">
          <header className="space-y-5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(POSTS_PATH)}
              className="hidden rounded-lg px-0 text-muted-foreground hover:bg-transparent hover:text-foreground md:inline-flex"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("postComposer.backToPosts", "Back to Posts")}
            </Button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                  {t("postComposer.title", "Create a post")}
                </h1>
                <p className="text-sm text-muted-foreground md:text-base">
                  {t("postComposer.subtitle", "Share something with your community.")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
            </div>
          </header>

          {!canCreate && (
            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              {t("postComposer.planRequired", "Posts are available with a Standard or Premium plan.")}
            </div>
          )}

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
            <Card className="rounded-lg border-border/70 bg-card shadow-sm">
              <div className="space-y-8 p-5 sm:p-7">
                <section className="space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {t("creationModal.shareQuestion", "What do you want to share?")}
                    </h2>
                  </div>
                  <Textarea
                    value={draft.content}
                    onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value.slice(0, 200) }))}
                    placeholder={t("creationModal.postPlaceholder", "Write something about your post...")}
                    maxLength={200}
                    rows={8}
                    className="min-h-[190px] resize-none rounded-lg border-border/70 bg-background/50 p-4 text-base leading-relaxed focus-visible:ring-accent/40"
                  />
                  <p className="text-right text-xs tabular-nums text-muted-foreground">{draft.content.length}/200</p>
                </section>

                <section className="space-y-4 border-t border-border/60 pt-6">
                  <div className="space-y-1">
                    <h2 className="text-xs font-semibold uppercase text-foreground">
                      {t("creationModal.media", "Media")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t("creationModal.mediaHint", "Attach a photo or a video to your post.")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto min-h-24 flex-col gap-2 rounded-lg border-border/70 bg-background/30 py-5 hover:border-accent/50 hover:bg-muted/40"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadProgress !== null}
                    >
                      <ImageIcon className="h-6 w-6 text-accent" />
                      {t("creationModal.photo", "Photo")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto min-h-24 flex-col gap-2 rounded-lg border-border/70 bg-background/30 py-5 hover:border-accent/50 hover:bg-muted/40"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadProgress !== null}
                    >
                      <VideoIcon className="h-6 w-6 text-accent" />
                      {t("creationModal.video", "Video")}
                    </Button>
                    <Input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleMediaInput(event, "image")} />
                    <Input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(event) => handleMediaInput(event, "video")} />
                  </div>

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

                  {draft.mediaUrl && uploadProgress === null && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-background/30 p-3">
                      {draft.mediaType === "image" ? <ImageIcon className="h-4 w-4 text-accent" /> : <VideoIcon className="h-4 w-4 text-accent" />}
                      <span className="mr-auto text-sm font-medium text-foreground">
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
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                        aria-label={t("creationModal.removeMedia", "Remove")}
                        onClick={() => setDraft((current) => ({ ...current, mediaUrl: "", mediaType: "" }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {!draft.mediaUrl && uploadProgress === null && (
                    <p className="text-xs text-muted-foreground">{t("creationModal.mediaRequired", "A photo or a video is required.")}</p>
                  )}
                </section>
              </div>
            </Card>

            <section className="space-y-3 lg:sticky lg:top-8">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{t("postComposer.previewTitle", "Preview")}</h2>
                <p className="text-xs text-muted-foreground">{t("postComposer.previewHint", "This is how your post will appear in the Feed.")}</p>
              </div>

              <div className="overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm">
                {draft.content || draft.mediaUrl ? (
                  <FeedPostCard
                    author={{
                      id: profile?.id,
                      stageName: profile?.stage_name || t("postComposer.artistFallback", "Artist"),
                      avatarUrl: profile?.avatar_url,
                      specializationLabel: translateSpecialization(profile?.specialization),
                      plan: profile?.plan,
                    }}
                    content={draft.content}
                    createdAt={new Date().toISOString()}
                    mediaUrl={draft.mediaUrl || null}
                    mediaType={draft.mediaType || null}
                  />
                ) : (
                  <div className="flex min-h-[300px] flex-col items-center justify-center px-8 py-12 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <FilePreviewIcon />
                    </div>
                    <h3 className="font-semibold text-foreground">{t("postComposer.previewTitle", "Preview")}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      {t("postComposer.emptyPreview", "Your post will appear here exactly as other users will see it.")}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-lg sm:min-w-32" onClick={() => navigate(POSTS_PATH)} disabled={isPublishing}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              className="rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 sm:min-w-44"
              onClick={handlePublish}
              disabled={isPublishing || uploadProgress !== null || !isValid || !canCreate || postsRemaining <= 0}
            >
              {isPublishing ? t("creationModal.publishing", "Publishing...") : t("creationModal.publishPost", "Publish post")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

const FilePreviewIcon = () => <ImageIcon className="h-6 w-6" aria-hidden="true" />;

export default CreatePost;