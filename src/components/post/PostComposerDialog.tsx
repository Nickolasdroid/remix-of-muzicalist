import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarCheck, Image as ImageIcon, Video as VideoIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LinkEmbed from "@/components/post/LinkEmbed";
import { findEmbed } from "@/lib/mediaEmbeds";
import { MAX_POST_PHOTOS, type PostMediaItem } from "@/lib/postMedia";
import { formatLocalDateToYMD, parseYMDToLocalDate } from "@/lib/utils";
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
import { canPublishPosts, getPostLimit } from "@/lib/planLimits";
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
/** The quota line only shows when few posts are left. */
const QUOTA_HINT_AT = 5;
const draftKey = (uid: string) => `mz_post_draft:${uid}`;

interface PostDraft {
  content: string;
  items: PostMediaItem[];
  availableOn: string | null;
}

/**
 * The single, shared "Create a post" composer used everywhere an artist can
 * publish a post (Dashboard → Posts, Feed, deep links).
 * Presentation redesign only — publishing, uploads and quota rules unchanged.
 */
const PostComposerDialog = ({ open, onOpenChange, onPublished }: PostComposerDialogProps) => {
  const { t, i18n } = useTranslation();
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
  // One video, or up to MAX_POST_PHOTOS photos
  const [items, setItems] = useState<PostMediaItem[]>([]);
  // "I'm available" post: the free date (YYYY-MM-DD)
  const [availableOn, setAvailableOn] = useState<string | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const hasVideo = items.some((i) => i.type === "video");
  const photoCount = items.filter((i) => i.type === "image").length;

  const postLimit = isAdmin
    ? Number.POSITIVE_INFINITY
    : serverLimit(entitlements, "posts", getPostLimit(profile?.plan));
  const postsUsed = typeof entitlements?.usage?.posts === "number" ? entitlements.usage.posts : 0;
  const postsRemaining = Number.isFinite(postLimit) ? Math.max(postLimit - postsUsed, 0) : Number.POSITIVE_INFINITY;
  const canCreate = isAdmin || canPublishPosts(profile?.plan);
  const isValid = content.trim().length > 0 || !!availableOn;

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
        // Bring back an unsent draft (closed by accident, app killed, lost signal)
        try {
          const raw = localStorage.getItem(draftKey(session.user.id));
          const d = raw ? (JSON.parse(raw) as PostDraft) : null;
          if (d && (d.content?.trim() || d.items?.length || d.availableOn)) {
            setContent((c) => c || d.content || "");
            setItems((cur) => (cur.length ? cur : Array.isArray(d.items) ? d.items : []));
            setAvailableOn((cur) => cur ?? d.availableOn ?? null);
            setDraftRestored(true);
          }
        } catch {
          /* storage unavailable */
        }
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

  // Autosave the draft while typing (per account, on this device)
  useEffect(() => {
    if (!open || !userId) return;
    const t = window.setTimeout(() => {
      try {
        if (content.trim() || items.length || availableOn) {
          localStorage.setItem(draftKey(userId), JSON.stringify({ content, items, availableOn } satisfies PostDraft));
        } else {
          localStorage.removeItem(draftKey(userId));
        }
      } catch {
        /* storage unavailable */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [open, userId, content, items, availableOn]);

  const clearSavedDraft = () => {
    try {
      if (userId) localStorage.removeItem(draftKey(userId));
    } catch {
      /* storage unavailable */
    }
  };

  const resetDraft = () => {
    setContent("");
    setItems([]);
    setAvailableOn(null);
    setDraftRestored(false);
    setUploadProgress(null);
  };

  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const isBusy = isPublishing || uploadProgress !== null;
  const isDirty = content.trim().length > 0 || items.length > 0 || !!availableOn;
  const finishClose = () => {
    clearSavedDraft();
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

  const uploadOne = async (file: File, kind: "image" | "video"): Promise<string> => {
    const fileName = `${userId}/posts/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${sanitizeFileName(file.name)}`;
    return uploadFileWithProgress("avatars", fileName, file, setUploadProgress);
  };

  const handleMediaInput = async (event: React.ChangeEvent<HTMLInputElement>, kind: "image" | "video") => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!userId || files.length === 0) return;

    if (kind === "video") {
      const file = files[0];
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: t("common.error", "Error"),
          description: t("postComposer.videoSizeError", "Video file size must not exceed 500 MB."),
          variant: "destructive",
        });
        return;
      }
      setUploadKind("video");
      setUploadProgress(0);
      try {
        const url = await uploadOne(file, "video");
        setItems([{ url, type: "video" }]); // a video stands alone
      } catch (error) {
        toast({ title: t("common.error", "Error"), description: error instanceof Error ? error.message : t("postComposer.uploadError", "Media could not be uploaded."), variant: "destructive" });
      } finally {
        setUploadProgress(null);
      }
      return;
    }

    const room = MAX_POST_PHOTOS - (hasVideo ? 0 : photoCount);
    const picked = files.slice(0, Math.max(room, 0));
    if (files.length > picked.length) {
      toast({ title: `Up to ${MAX_POST_PHOTOS} photos per post`, description: "The extra photos were not added." });
    }
    if (picked.length === 0) return;
    setUploadKind("image");
    const added: PostMediaItem[] = [];
    try {
      for (const file of picked) {
        setUploadProgress(0);
        added.push({ url: await uploadOne(file, "image"), type: "image" });
      }
    } catch (error) {
      toast({ title: t("common.error", "Error"), description: error instanceof Error ? error.message : t("postComposer.uploadError", "Media could not be uploaded."), variant: "destructive" });
    } finally {
      setUploadProgress(null);
      // Photos replace a video; otherwise they are appended
      if (added.length) setItems((cur) => [...cur.filter((i) => i.type === "image"), ...added].slice(0, MAX_POST_PHOTOS));
    }
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
          // First item also goes in the single columns, so older views still show it
          media_url: items[0]?.url ?? null,
          media_type: items[0]?.type ?? null,
          // New columns are only sent when used, so plain posts work everywhere
          ...(items.length > 1 ? { media: items } : {}),
          ...(availableOn ? { post_kind: "availability", available_on: availableOn } : {}),
        } as any)
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
      clearSavedDraft();
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

  const dateLocale = (i18n.language || "ro").startsWith("ro") ? "ro-RO" : "en-GB";
  const embed = findEmbed(content);
  const used = content.length;
  const ringPct = Math.min(100, Math.round((used / MAX_LENGTH) * 100));
  const nearLimit = used >= MAX_LENGTH * 0.9;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} manageHistory={false}>
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
            {Number.isFinite(postsRemaining) && postsRemaining <= QUOTA_HINT_AT && (
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
          <Avatar className="h-11 w-11">
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
            Posts are not available on your plan right now.
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

        <Input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => handleMediaInput(event, "image")} />
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

        {draftRestored && (
          <p className="mt-2 text-xs text-muted-foreground">Your unsent draft was restored.</p>
        )}

        {availableOn && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2.5">
            <CalendarCheck className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available</p>
              <p className="truncate text-sm font-semibold text-foreground first-letter:uppercase notranslate" translate="no">
                {parseYMDToLocalDate(availableOn).toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <button
              type="button"
              aria-label="Remove date"
              onClick={() => setAvailableOn(null)}
              className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {items.length > 0 && uploadProgress === null && (
          hasVideo ? (
            <div className="relative mt-3 overflow-hidden rounded-xl bg-muted/30">
              <video src={items[0].url} controls playsInline className="max-h-[340px] w-full bg-black object-contain" />
              <button
                type="button"
                aria-label="Remove"
                className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-black/65 text-white transition-colors hover:bg-black/80"
                onClick={() => setItems([])}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : items.length === 1 ? (
            <div className="relative mt-3 overflow-hidden rounded-xl bg-muted/30">
              <img src={items[0].url} alt="Photo selected" className="max-h-[340px] w-full object-cover" />
              <button
                type="button"
                aria-label="Remove"
                className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-black/65 text-white transition-colors hover:bg-black/80"
                onClick={() => setItems([])}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <div className="grid grid-cols-3 gap-1.5">
                {items.map((it, i) => (
                  <div key={`${it.url}-${i}`} className="relative aspect-square overflow-hidden rounded-lg bg-muted/30">
                    <img src={it.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/65 text-white hover:bg-black/80"
                      onClick={() => setItems((cur) => cur.filter((_, j) => j !== i))}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">Cover</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                <span>{items.length} / {MAX_POST_PHOTOS}</span> <span>photos</span>
              </p>
            </div>
          )
        )}

        {/* Preview of a YouTube / Spotify / SoundCloud link, when there is no photo or video */}
        {items.length === 0 && embed && (
          <div className="-mx-5 mt-1">
            <LinkEmbed embed={embed} />
          </div>
        )}

        {/* Toolbar */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 py-3">
          <button
            type="button"
            disabled={uploadProgress !== null}
            onClick={() => imageInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-2 text-sm text-foreground/90 transition-colors hover:bg-muted disabled:opacity-50"
          >
            <ImageIcon className="h-4 w-4 text-accent" />
            Photo
          </button>
          <button
            type="button"
            disabled={uploadProgress !== null}
            onClick={() => videoInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-2 text-sm text-foreground/90 transition-colors hover:bg-muted disabled:opacity-50"
          >
            <VideoIcon className="h-4 w-4 text-accent" />
            Video
          </button>
          <Popover open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${availableOn ? "bg-accent/15 text-accent" : "bg-card text-foreground/90 hover:bg-muted"}`}
              >
                <CalendarCheck className="h-4 w-4 text-accent" />
                <span className="max-sm:hidden">I'm available</span>
                <span className="sm:hidden">Available</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <p className="px-3 pt-3 text-sm font-semibold text-foreground">Which day are you free?</p>
              <p className="px-3 text-xs text-muted-foreground">Organizers can request an offer for that date.</p>
              <Calendar
                mode="single"
                selected={availableOn ? parseYMDToLocalDate(availableOn) : undefined}
                onSelect={(d) => {
                  setAvailableOn(d ? formatLocalDateToYMD(d) : null);
                  setAvailabilityOpen(false);
                }}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {used > 0 && (
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className={`whitespace-nowrap text-xs tabular-nums ${nearLimit ? "text-amber-400" : "text-muted-foreground"}`}>
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
