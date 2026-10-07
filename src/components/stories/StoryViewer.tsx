import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Eye, Loader2, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  STORY_DURATION_MS, StoryGroup, Story, deleteStory, fetchStoryViewCounts, markStoryViewed, storyAge,
} from "@/lib/stories";

interface StoryViewerProps {
  groups: StoryGroup[];
  startGroupIndex: number;
  currentUserId: string | null;
  onSeen: (storyId: string) => void;
  onDeleted: (storyId: string) => void;
  onClose: () => void;
}

/** First story in the group the viewer hasn't seen yet (or the first one). */
const firstUnseenIndex = (group: StoryGroup, seen: Set<string>) => {
  const i = group.stories.findIndex((s) => !seen.has(s.id));
  return i === -1 ? 0 : i;
};

const StoryViewer = ({ groups, startGroupIndex, currentUserId, onSeen, onDeleted, onClose }: StoryViewerProps) => {
  const { i18n } = useTranslation();
  const seenRef = useRef<Set<string>>(new Set());
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(() => firstUnseenIndex(groups[startGroupIndex], seenRef.current));
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [held, setHeld] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const holdTimer = useRef<number | null>(null);
  const wasHold = useRef(false);

  const group = groups[groupIndex];
  const story: Story | undefined = group?.stories[storyIndex];
  const loaded = !!story && loadedId === story.id;
  const isOwn = !!currentUserId && group?.author.id === currentUserId;
  const paused = !loaded || held || tabHidden || confirmDelete;

  // Lock page scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Author sees view counts on their own stories.
  useEffect(() => {
    if (!isOwn || !group) return;
    fetchStoryViewCounts(group.stories.map((s) => s.id)).then(setViewCounts).catch(() => {});
  }, [isOwn, group]);

  // Preload the next image so transitions feel instant.
  useEffect(() => {
    const next = group?.stories[storyIndex + 1] ?? groups[groupIndex + 1]?.stories[0];
    if (next) { const img = new Image(); img.src = next.media_url; }
  }, [group, groups, groupIndex, storyIndex]);

  // Mark as seen once the image is actually on screen.
  useEffect(() => {
    if (!loaded || !story || seenRef.current.has(story.id)) return;
    seenRef.current.add(story.id);
    onSeen(story.id);
    if (currentUserId && story.profile_id !== currentUserId) {
      markStoryViewed(story.id, currentUserId).catch(() => {});
    }
  }, [loaded, story, currentUserId, onSeen]);

  const goNext = useCallback(() => {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < groups.length - 1) {
      const ng = groups[groupIndex + 1];
      setGroupIndex(groupIndex + 1);
      setStoryIndex(firstUnseenIndex(ng, seenRef.current));
    } else {
      onClose();
    }
  }, [group, groupIndex, groups, storyIndex, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      const pg = groups[groupIndex - 1];
      setGroupIndex(groupIndex - 1);
      setStoryIndex(pg.stories.length - 1);
    }
  }, [groupIndex, groups, storyIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirmDelete) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose, confirmDelete]);

  // Tap left/right to navigate; press and hold anywhere to pause.
  const onPointerDown = () => {
    wasHold.current = false;
    holdTimer.current = window.setTimeout(() => { wasHold.current = true; setHeld(true); }, 200);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    setHeld(false);
    if (wasHold.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width / 3) goPrev();
    else goNext();
  };
  const onPointerCancel = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    setHeld(false);
  };

  const handleDelete = async () => {
    if (!story) return;
    setDeleting(true);
    try {
      await deleteStory(story);
      onDeleted(story.id);
      toast({ title: "Story deleted" });
      setConfirmDelete(false);
      if (group.stories.length <= 1) onClose();
      else if (storyIndex >= group.stories.length - 1) setStoryIndex(storyIndex - 1);
    } catch {
      toast({ title: "Couldn't delete the story", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (!group || !story) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none" role="dialog" aria-modal="true" aria-label={group.author.stage_name}>
      {/* Desktop arrows between users */}
      {groupIndex > 0 && (
        <button
          type="button"
          onClick={() => { const pg = groups[groupIndex - 1]; setGroupIndex(groupIndex - 1); setStoryIndex(firstUnseenIndex(pg, seenRef.current)); }}
          className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {groupIndex < groups.length - 1 && (
        <button
          type="button"
          onClick={() => { const ng = groups[groupIndex + 1]; setGroupIndex(groupIndex + 1); setStoryIndex(firstUnseenIndex(ng, seenRef.current)); }}
          className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      <div className="relative w-full h-full md:h-[min(92vh,860px)] md:w-auto md:aspect-[9/16] md:rounded-xl overflow-hidden bg-neutral-900">
        {/* Blurred backdrop fills letterboxing for non-9:16 photos */}
        <img src={story.media_url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50" />
        <img
          key={story.id}
          src={story.media_url}
          alt={group.author.stage_name}
          className="absolute inset-0 w-full h-full object-contain"
          onLoad={() => setLoadedId(story.id)}
          onError={() => setLoadedId(story.id)}
          draggable={false}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/80" />
          </div>
        )}

        {/* Tap / hold surface */}
        <div
          className="absolute inset-0"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerCancel}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Top gradient, progress bars and header */}
        <div className="absolute inset-x-0 top-0 pt-[max(env(safe-area-inset-top),8px)] px-2 pb-8 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="flex gap-1">
            {group.stories.map((s, i) => (
              <div key={s.id} className="h-[3px] flex-1 rounded-full bg-white/30 overflow-hidden">
                {i < storyIndex && <div className="h-full w-full bg-white" />}
                {i === storyIndex && (
                  <div
                    key={`${groupIndex}-${s.id}`}
                    className="h-full bg-white origin-left"
                    style={{
                      width: "100%",
                      animation: `story-progress ${STORY_DURATION_MS}ms linear forwards`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                    onAnimationEnd={goNext}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 pointer-events-auto">
            <Link
              to={`/artist/${group.author.slug || group.author.id}`}
              onClick={onClose}
              className="flex items-center gap-2 min-w-0"
            >
              <Avatar className="h-8 w-8 border border-white/40">
                <AvatarImage src={group.author.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="text-xs">{group.author.stage_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-white text-sm font-semibold truncate">{group.author.stage_name}</span>
            </Link>
            <span className="text-white/70 text-xs">{storyAge(story.created_at, i18n.language)}</span>
            <div className="ml-auto flex items-center gap-1">
              {isOwn && (
                <>
                  <span className="flex items-center gap-1 text-white/90 text-xs px-2">
                    <Eye className="h-4 w-4" /> {viewCounts[story.id] ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="h-9 w-9 flex items-center justify-center rounded-full text-white hover:bg-white/15"
                    aria-label="Delete story"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 flex items-center justify-center rounded-full text-white hover:bg-white/15"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="z-[110]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this story?</AlertDialogTitle>
            <AlertDialogDescription>The story will be removed immediately and can't be recovered.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>,
    document.body
  );
};

export default StoryViewer;
