import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StoryRing from "./StoryRing";
import StoryViewer from "./StoryViewer";
import StoryComposerDialog from "./StoryComposerDialog";
import { StoryGroup, fetchStoryGroups } from "@/lib/stories";

interface StoriesBarProps {
  currentUserId: string | null;
  /** Standard/Premium artist — can add stories. */
  canPublish: boolean;
}

/** Horizontal row of story rings shown at the top of the feed. */
const StoriesBar = ({ currentUserId, canPublish }: StoriesBarProps) => {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [viewerStart, setViewerStart] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [me, setMe] = useState<{ stage_name: string; avatar_url: string | null } | null>(null);
  // Seen state for guests and for instant UI updates before the DB round-trip.
  const localSeen = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      setGroups(await fetchStoryGroups(currentUserId, localSeen.current));
    } catch {
      setGroups([]);
    } finally {
      setLoaded(true);
    }
  }, [currentUserId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!currentUserId || !canPublish) return;
    supabase
      .from("profiles")
      .select("stage_name, avatar_url")
      .eq("id", currentUserId)
      .maybeSingle()
      .then(({ data }) => data && setMe(data));
  }, [currentUserId, canPublish]);

  const handleSeen = useCallback((storyId: string) => {
    localSeen.current.add(storyId);
  }, []);

  const handleDeleted = useCallback((storyId: string) => {
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, stories: g.stories.filter((s) => s.id !== storyId) }))
        .filter((g) => g.stories.length > 0)
    );
  }, []);

  const closeViewer = useCallback(() => {
    setViewerStart(null);
    // Recompute rings and ordering with the newly seen stories.
    setGroups((prev) => {
      const next = prev.map((g) => ({
        ...g,
        allSeen: g.author.id === currentUserId || g.stories.every((s) => localSeen.current.has(s.id)),
      }));
      const own = next.filter((g) => g.author.id === currentUserId);
      const others = next
        .filter((g) => g.author.id !== currentUserId)
        .sort((a, b) => (a.allSeen !== b.allSeen ? (a.allSeen ? 1 : -1) : b.latestAt.localeCompare(a.latestAt)));
      return [...own, ...others];
    });
  }, [currentUserId]);

  const ownGroupIndex = groups.findIndex((g) => g.author.id === currentUserId);
  const hasOwn = ownGroupIndex !== -1;
  const others = groups.filter((g) => g.author.id !== currentUserId);
  const showAddBubble = canPublish && !!currentUserId && !hasOwn;

  if (!loaded || (!groups.length && !showAddBubble)) return null;

  const ownGroup = hasOwn ? groups[ownGroupIndex] : null;
  const ownUnseen = ownGroup ? !ownGroup.stories.every((s) => localSeen.current.has(s.id)) : false;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto px-3 py-3 border-b border-border/40 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Own bubble: view own stories, or add one */}
        {(hasOwn || showAddBubble) && currentUserId && (
          <div className="flex flex-col items-center gap-1 w-[72px] shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => (hasOwn ? setViewerStart(ownGroupIndex) : setComposerOpen(true))}
                aria-label={hasOwn ? "Your story" : "Add story"}
              >
                <StoryRing
                  src={ownGroup?.author.avatar_url ?? me?.avatar_url ?? null}
                  name={ownGroup?.author.stage_name ?? me?.stage_name ?? "?"}
                  state={hasOwn ? (ownUnseen ? "unseen" : "seen") : "none"}
                />
              </button>
              {canPublish && (
                <button
                  type="button"
                  onClick={() => setComposerOpen(true)}
                  className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary text-primary-foreground border-2 border-background flex items-center justify-center"
                  aria-label="Add story"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground truncate w-full text-center">Your story</span>
          </div>
        )}

        {others.map((g) => {
          const index = groups.indexOf(g);
          return (
            <button
              key={g.author.id}
              type="button"
              onClick={() => setViewerStart(index)}
              className="flex flex-col items-center gap-1 w-[72px] shrink-0"
              aria-label={g.author.stage_name}
            >
              <StoryRing src={g.author.avatar_url} name={g.author.stage_name} state={g.allSeen ? "seen" : "unseen"} />
              <span className={`text-[11px] truncate w-full text-center ${g.allSeen ? "text-muted-foreground" : "text-foreground"}`}>
                {g.author.stage_name}
              </span>
            </button>
          );
        })}
      </div>

      {viewerStart !== null && groups[viewerStart] && (
        <StoryViewer
          groups={groups}
          startGroupIndex={viewerStart}
          currentUserId={currentUserId}
          onSeen={handleSeen}
          onDeleted={handleDeleted}
          onClose={closeViewer}
        />
      )}

      {currentUserId && canPublish && (
        <StoryComposerDialog
          open={composerOpen}
          userId={currentUserId}
          onOpenChange={setComposerOpen}
          onPublished={load}
        />
      )}
    </>
  );
};

export default StoriesBar;
