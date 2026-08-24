import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { translateSpecialization } from "@/lib/specializationLabel";
import { useAdminIds } from "@/hooks/useAdminIds";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getAvatarOutlineClasses } from "@/lib/subscriptionStyles";

const PAGE_SIZE = 30;

type LikeTargetType = "post" | "announcement";

interface LikerProfile {
  id: string;
  stage_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  slug: string | null;
  specialization: string | null;
  plan: string | null;
  is_verified: boolean | null;
}

interface LikesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: string;
  targetType?: LikeTargetType;
}

/**
 * Shared "Liked by" list. Reads the real like records
 * (`post_likes` / `announcement_likes`) on demand — never during feed load.
 */
export const LikesDialog = ({ open, onOpenChange, targetId, targetType = "post" }: LikesDialogProps) => {
  const { t } = useTranslation();
  const adminIds = useAdminIds();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [profiles, setProfiles] = useState<LikerProfile[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const fetchPage = async (pageIndex: number) => {
    const table = targetType === "post" ? "post_likes" : "announcement_likes";
    const column = targetType === "post" ? "post_id" : "announcement_id";
    const from = pageIndex * PAGE_SIZE;
    const { data: likeRows } = await (supabase as any)
      .from(table)
      .select("user_id, created_at")
      .eq(column, targetId)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    const rows = (likeRows || []) as { user_id: string }[];
    setHasMore(rows.length === PAGE_SIZE);
    const ids = rows.map((r) => r.user_id).filter(Boolean);
    if (ids.length === 0) return [] as LikerProfile[];

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, stage_name, first_name, last_name, avatar_url, slug, specialization, plan, is_verified")
      .in("id", ids);

    const byId = new Map<string, LikerProfile>(((profs as any[]) || []).map((p) => [p.id, p as LikerProfile]));
    // preserve the like ordering (newest first)
    return ids.map((id) => byId.get(id)).filter(Boolean) as LikerProfile[];
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setPage(0);
    fetchPage(0)
      .then((list) => {
        if (!cancelled) setProfiles(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetId, targetType]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const list = await fetchPage(next);
      setProfiles((prev) => [...prev, ...list]);
      setPage(next);
    } finally {
      setLoadingMore(false);
    }
  };

  const list = (
    <>
          {loading ? (
            <div className="py-8 flex justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("likes.empty", "No likes yet.")}
            </div>
          ) : (
            <ul className="space-y-1">
              {profiles.map((p) => {
                const display =
                  p.stage_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || t("likes.member", "Member");
                const isAdmin = adminIds.has(p.id);
                const label = isAdmin
                  ? "Admin"
                  : p.specialization
                    ? translateSpecialization(p.specialization)
                    : t("likes.user", "User");
                return (
                  <li key={p.id}>
                    <Link
                      to={`/artist/${p.slug || p.id}`}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60 transition-colors"
                    >
                      <div className={`p-0.5 rounded-full ${getAvatarOutlineClasses(p.plan as any)}`}>
                        <Avatar className="h-10 w-10 border-2 border-background">
                          {p.avatar_url ? (
                            <AvatarImage src={p.avatar_url} alt={display} />
                          ) : (
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="truncate text-sm font-medium text-foreground notranslate"
                            translate="no"
                            data-no-translate="true"
                          >
                            {display}
                          </span>
                          {(p.is_verified || isAdmin) && <VerifiedBadge size="sm" />}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{label}</div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {!loading && hasMore && (
            <div className="pt-2 pb-1 flex justify-center">
              <Button variant="ghost" size="sm" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : t("likes.loadMore", "Load more")}
              </Button>
            </div>
          )}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader className="border-b text-center">
            <DrawerTitle className="text-center">{t("likes.likedBy", "Liked by")}</DrawerTitle>
            <DrawerDescription className="sr-only">People who liked this</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-2 py-2">{list}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>{t("likes.likedBy", "Liked by")}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">{list}</div>
      </DialogContent>
    </Dialog>
  );
};

interface LikeCountButtonProps {
  count: number;
  targetId: string;
  targetType?: LikeTargetType;
  className?: string;
}

/**
 * Clickable like count — drop-in replacement for the static count label.
 * Opens the shared "Liked by" list; never triggers like/unlike.
 */
export const LikeCountButton = ({ count, targetId, targetType = "post", className }: LikeCountButtonProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!count) return null;
  return (
    <>
      <button
        type="button"
        aria-label={t("likes.viewLikes", "View who liked this")}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className={`text-lg font-semibold text-foreground -ml-1 rounded-md px-1 transition-colors hover:text-[#D4AF37] active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className || ""}`}
      >
        {count}
      </button>
      {open && <LikesDialog open={open} onOpenChange={setOpen} targetId={targetId} targetType={targetType} />}
    </>
  );
};

export default LikesDialog;
