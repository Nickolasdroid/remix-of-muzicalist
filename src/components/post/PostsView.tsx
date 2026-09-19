import { ReactNode, useEffect, useState } from "react";
import { Grid3X3, Images, List, Play, Type } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getThumbUrl } from "@/lib/imageUrl";
import { getEmbedInfo } from "@/lib/mediaEmbed";

export type PostsViewMode = "list" | "grid";

export interface PostsGridItem {
  id: string;
  kind: "post" | "promotion";
  text: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaCount?: number;
}

const STORAGE_KEY = "muzicalist-posts-view";

function readStoredMode(): PostsViewMode {
  if (typeof window === "undefined") return "list";
  return window.sessionStorage.getItem(STORAGE_KEY) === "grid" ? "grid" : "list";
}

export function usePostsViewMode() {
  const [mode, setModeState] = useState<PostsViewMode>(readStoredMode);

  const setMode = (next: PostsViewMode) => {
    setModeState(next);
    window.sessionStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent<PostsViewMode>(STORAGE_KEY, { detail: next }));
  };

  useEffect(() => {
    const sync = (event: Event) => setModeState((event as CustomEvent<PostsViewMode>).detail);
    window.addEventListener(STORAGE_KEY, sync);
    return () => window.removeEventListener(STORAGE_KEY, sync);
  }, []);

  return [mode, setMode] as const;
}

export function PostsViewSwitcher({ mode, onChange }: { mode: PostsViewMode; onChange: (mode: PostsViewMode) => void }) {
  const { t } = useTranslation();
  const options = [
    { mode: "list" as const, icon: List, label: t("postsView.list", "List view") },
    { mode: "grid" as const, icon: Grid3X3, label: t("postsView.grid", "Grid view") },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-8 shrink-0 items-center gap-0.5 rounded-lg border border-border/70 bg-card/60 p-0.5" role="group" aria-label={t("postsView.switcher", "Post view")}>
        {options.map((option) => {
          const Icon = option.icon;
          const active = mode === option.mode;
          return (
            <Tooltip key={option.mode}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={option.label}
                  aria-pressed={active}
                  onClick={() => onChange(option.mode)}
                  className={cn(
                    "h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
                    active && "bg-accent/15 text-accent hover:bg-accent/20 hover:text-accent",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{option.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

function PostTypeIcon({ item }: { item: PostsGridItem }) {
  if ((item.mediaCount || 0) > 1) return <Images className="h-3.5 w-3.5" />;
  if (item.mediaType === "video") return <Play className="h-3.5 w-3.5 fill-current" />;
  if (item.mediaUrl) return <Images className="h-3.5 w-3.5" />;
  return <Type className="h-3.5 w-3.5" />;
}

function mediaThumbnail(item: PostsGridItem) {
  if (!item.mediaUrl) return null;
  if (item.mediaType !== "video") return getThumbUrl(item.mediaUrl, 240, 70);
  return getEmbedInfo(item.mediaUrl)?.thumbnail || null;
}

export function PostsGrid({ items, onOpen }: { items: PostsGridItem[]; onOpen: (item: PostsGridItem) => void }) {
  const { t } = useTranslation();

  return (
    <div className="grid w-full grid-cols-3 gap-1 sm:gap-1.5" data-testid="posts-grid">
      {items.map((item) => {
        const thumbnail = mediaThumbnail(item);
        const isDirectVideo = item.mediaType === "video" && item.mediaUrl && !thumbnail;
        const label = item.mediaUrl
          ? item.mediaType === "video"
            ? t("postsView.openVideo", "Open video post")
            : t("postsView.openPhoto", "Open photo post")
          : t("postsView.openText", "Open text post");

        return (
          <Button
            key={`${item.kind}-${item.id}`}
            type="button"
            variant="ghost"
            aria-label={label}
            onClick={() => onOpen(item)}
            className="group relative aspect-square h-auto min-w-0 overflow-hidden rounded-sm border border-border/60 bg-card p-0 text-left hover:bg-card focus-visible:ring-2 focus-visible:ring-accent"
          >
            {thumbnail ? (
              <img src={thumbnail} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
            ) : isDirectVideo ? (
              <video src={item.mediaUrl || undefined} preload="metadata" muted playsInline aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary/70 p-2 text-center">
                <Type className="h-7 w-7 text-accent sm:h-9 sm:w-9" />
                {item.text && <span className="line-clamp-3 w-full whitespace-normal text-[9px] font-medium leading-tight text-foreground/85 sm:text-xs">{item.text}</span>}
              </div>
            )}
            <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-background/80 text-foreground shadow-sm backdrop-blur-sm" aria-hidden="true">
              <PostTypeIcon item={item} />
            </span>
          </Button>
        );
      })}
    </div>
  );
}

export function FullPostDialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-[520px] overflow-y-auto rounded-lg border-border bg-background p-2 pt-10 sm:p-4 sm:pt-10">
        <DialogTitle className="sr-only">{t("postsView.postDetails", "Post details")}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}