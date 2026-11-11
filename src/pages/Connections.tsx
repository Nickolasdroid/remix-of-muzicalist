import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2, User, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/usePageTitle";
import { goBack } from "@/lib/backNavigation";
import { translateSpecialization } from "@/lib/specializationLabel";
import { getPlanPriority } from "@/lib/planLimits";

type Tab = "followers" | "following";

interface ProfileRow {
  id: string;
  stage_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  slug: string | null;
  specialization: string | null;
  county: string | null;
  plan?: string | null;
}

const PROFILE_COLUMNS = "id, stage_name, first_name, last_name, avatar_url, slug, specialization, county, plan";
/** Below this many accounts in the open tab, suggested artists are shown underneath. */
const SUGGEST_BELOW = 5;

const displayName = (p: ProfileRow) =>
  p.stage_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Artist";

/**
 * Followers / Following of one profile, on its own page (Instagram-style).
 * Own profile: remove followers, unfollow. Other profiles: follow / unfollow artists.
 * When the open list is short, suggested artists from the viewer's area are shown below.
 */
/** Follow is an outlined pill, Following / Remove a quiet grey one (gold stays for the main actions). */
const OUTLINE_PILL = "h-8 rounded-full border border-foreground/40 bg-transparent px-4 text-sm font-bold text-foreground hover:border-foreground hover:bg-transparent hover:scale-[1.04] transition-transform";
const FILLED_PILL = "h-8 rounded-full bg-foreground/[0.07] px-4 text-sm font-bold text-foreground hover:bg-foreground/[0.12]";

const Connections = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab: Tab = searchParams.get("tab") === "following" ? "following" : "followers";
  const { t } = useTranslation();

  const [me, setMe] = useState<string | null>(null);
  const [owner, setOwner] = useState<ProfileRow | null>(null);
  const [lists, setLists] = useState<Record<Tab, ProfileRow[]>>({ followers: [], following: [] });
  const [loading, setLoading] = useState(true);
  const [myFollowing, setMyFollowing] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<ProfileRow[]>([]);
  const [confirm, setConfirm] = useState<{ kind: "remove" | "unfollow"; row: ProfileRow } | null>(null);

  usePageTitle(owner ? displayName(owner) : "Followers");
  const isOwn = !!me && me === profileId;

  const loadProfiles = async (ids: string[]): Promise<ProfileRow[]> => {
    if (ids.length === 0) return [];
    const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
    const byId = new Map(((data as ProfileRow[]) || []).map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is ProfileRow => !!p);
  };

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const viewer = session?.user?.id ?? null;
      // Follower lists are for members only
      if (!viewer) {
        navigate("/login", { replace: true });
        return;
      }
      const [{ data: ownerRow }, { data: followerRows }, { data: followingRows }, mine] = await Promise.all([
        supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", profileId).maybeSingle(),
        supabase.from("followers").select("follower_id, created_at").eq("artist_id", profileId).order("created_at", { ascending: false }),
        supabase.from("followers").select("artist_id, created_at").eq("follower_id", profileId).order("created_at", { ascending: false }),
        viewer
          ? supabase.from("followers").select("artist_id").eq("follower_id", viewer)
          : Promise.resolve({ data: [] as { artist_id: string }[] }),
      ]);
      const [followers, following] = await Promise.all([
        loadProfiles(((followerRows as any[]) || []).map((r) => r.follower_id)),
        loadProfiles(((followingRows as any[]) || []).map((r) => r.artist_id)),
      ]);
      if (cancelled) return;
      setMe(viewer);
      setOwner((ownerRow as ProfileRow) || null);
      setLists({ followers, following });
      setMyFollowing(new Set(((mine.data as any[]) || []).map((r) => r.artist_id)));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const current = lists[tab];

  // Suggested artists: same country as the viewer, same county first, not already followed.
  const loadSuggestions = useCallback(async () => {
    if (!me) return;
    const { data: mine } = await supabase.from("profiles").select("country, county").eq("id", me).maybeSingle();
    let query = supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .not("specialization", "is", null)
      .not("avatar_url", "is", null)
      .neq("id", me)
      .limit(40);
    if (mine?.country) query = query.eq("country", mine.country);
    const { data } = await query;
    const exclude = new Set([...myFollowing, ...current.map((p) => p.id), profileId]);
    const sameCounty = (p: ProfileRow) => (mine?.county && p.county === mine.county ? 0 : 1);
    const picks = ((data as ProfileRow[]) || [])
      .filter((p) => !exclude.has(p.id))
      .sort((a, b) => sameCounty(a) - sameCounty(b) || getPlanPriority(b.plan) - getPlanPriority(a.plan))
      .slice(0, 6);
    setSuggestions(picks);
    // myFollowing changes on follow; suggestions are only refreshed when the list itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, profileId, tab, current.length]);

  useEffect(() => {
    if (loading || !me || current.length >= SUGGEST_BELOW) {
      setSuggestions([]);
      return;
    }
    loadSuggestions();
  }, [loading, me, current.length, loadSuggestions]);

  const follow = async (row: ProfileRow) => {
    if (!me) {
      navigate("/login");
      return;
    }
    setMyFollowing((prev) => new Set(prev).add(row.id));
    if (isOwn) setLists((l) => ({ ...l, following: [row, ...l.following.filter((p) => p.id !== row.id)] }));
    const { error } = await supabase.from("followers").insert({ artist_id: row.id, follower_id: me });
    if (error) {
      setMyFollowing((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      if (isOwn) setLists((l) => ({ ...l, following: l.following.filter((p) => p.id !== row.id) }));
    }
  };

  const runConfirm = async () => {
    if (!confirm || !me) return;
    const { kind, row } = confirm;
    setConfirm(null);
    if (kind === "remove") {
      setLists((l) => ({ ...l, followers: l.followers.filter((p) => p.id !== row.id) }));
      await supabase.from("followers").delete().eq("artist_id", me).eq("follower_id", row.id);
    } else {
      setMyFollowing((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      if (isOwn) setLists((l) => ({ ...l, following: l.following.filter((p) => p.id !== row.id) }));
      await supabase.from("followers").delete().eq("artist_id", row.id).eq("follower_id", me);
    }
  };

  const actionFor = (row: ProfileRow, suggested: boolean) => {
    if (!me || row.id === me) return null;
    if (isOwn && tab === "followers" && !suggested) {
      return (
        <Button size="sm" variant="ghost" className={FILLED_PILL} onClick={() => setConfirm({ kind: "remove", row })}>
          Remove
        </Button>
      );
    }
    if (!row.specialization) return null; // only artists can be followed
    return myFollowing.has(row.id) ? (
      <Button size="sm" variant="ghost" className={FILLED_PILL} onClick={() => setConfirm({ kind: "unfollow", row })}>
        Following
      </Button>
    ) : (
      <Button size="sm" variant="ghost" className={OUTLINE_PILL} onClick={() => follow(row)}>
        Follow
      </Button>
    );
  };

  const emptyText = useMemo(() => {
    if (tab === "followers") return isOwn ? "No followers yet. Share your profile so people can follow you." : "No followers yet.";
    return isOwn ? "You're not following anyone yet." : "Not following anyone yet.";
  }, [tab, isOwn]);

  /** One account per row, Instagram style: photo, name and details, the button on the right. */
  const renderCard = (p: ProfileRow, suggested = false) => {
    const name = displayName(p);
    const sub = [p.specialization ? translateSpecialization(p.specialization) : null, p.county].filter(Boolean).join(" · ");
    const action = actionFor(p, suggested);
    return (
      <li key={p.id} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-foreground/[0.05]">
        <Link to={`/artist/${p.slug || p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar className="h-14 w-14 shrink-0">
            {p.avatar_url ? <AvatarImage src={p.avatar_url} alt={name} className="object-cover" /> : null}
            <AvatarFallback className="bg-foreground/[0.06]">
              <User className="h-6 w-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold text-foreground notranslate" translate="no">{name}</span>
            {sub && <span className="block truncate text-sm text-muted-foreground">{sub}</span>}
          </span>
        </Link>
        {action && <div className="shrink-0">{action}</div>}
      </li>
    );
  };

  const GRID = "space-y-0.5";

  const setTab = (tb: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tb);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation mobileTitle={owner ? displayName(owner) : " "} onMobileBack={() => goBack(navigate, "/feed")} hideMobileNotifications />
      <div className="md:ml-[316px] md:py-2 md:pr-2 lg:ml-[356px]">
      <main className="min-h-screen bg-background px-4 pb-24 pt-14 md:min-h-[calc(100vh-80px)] md:rounded-lg md:px-8 md:pb-10 md:pt-8">
        <div className="md:max-w-2xl">
        {/* Whose list: small photo and name, back to their profile */}
        {owner && (
          <Link to={`/artist/${owner.slug || owner.id}`} className="hidden items-center gap-2.5 text-sm font-bold text-foreground hover:underline md:inline-flex">
            <Avatar className="h-7 w-7">
              {owner.avatar_url ? <AvatarImage src={owner.avatar_url} alt="" className="object-cover" /> : null}
              <AvatarFallback><User className="h-3.5 w-3.5" /></AvatarFallback>
            </Avatar>
            <span className="notranslate" translate="no">{displayName(owner)}</span>
          </Link>
        )}
        <h1 key={tab} className="mt-2 hidden font-figtree text-5xl font-black tracking-[-0.03em] text-foreground md:block lg:text-6xl">
          {tab === "followers" ? t("social.followers") : isOwn ? t("social.following") : t("social.followingThirdPerson")}
        </h1>

        <div role="tablist" className="sticky top-14 z-10 -mx-4 flex border-b border-foreground/10 bg-background md:top-16 md:mx-0 md:mt-4">
          {(["followers", "following"] as Tab[]).map((tb) => (
            <button
              key={tb}
              role="tab"
              aria-selected={tab === tb}
              onClick={() => setTab(tb)}
              className={`relative h-12 flex-1 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60 ${tab === tb ? "font-bold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"}`}
            >
              <span className="tabular-nums notranslate" translate="no">{loading ? "–" : lists[tb].length}</span>{" "}
              <span>{tb === "followers" ? t("social.followers") : isOwn ? t("social.following") : t("social.followingThirdPerson")}</span>
              {tab === tb && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground" />}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {current.length > 0 ? (
              <ul className={`mt-3 ${GRID}`}>{current.map((p) => renderCard(p))}</ul>
            ) : (
              <div className="flex flex-col items-center px-6 pb-6 pt-12 text-center">
                <div className="mb-3 rounded-full bg-foreground/[0.07] p-3">
                  <Users className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="max-w-xs text-sm text-muted-foreground">{emptyText}</p>
              </div>
            )}

            {suggestions.length > 0 && (
              <section className="mt-10">
                <h2 className="font-figtree text-[22px] font-bold tracking-[-0.01em] text-foreground md:text-2xl">Suggested artists</h2>
                <p className="pb-2 pt-0.5 text-sm text-muted-foreground">Artists near you that you don't follow yet.</p>
                <ul className={GRID}>{suggestions.map((p) => renderCard(p, true))}</ul>
              </section>
            )}
          </>
        )}
        </div>
      </main>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        {confirm && (
          <AlertDialogContent className="rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>{confirm.kind === "remove" ? "Remove this follower?" : "Unfollow this artist?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirm.kind === "remove"
                  ? "They will no longer appear in your followers. They can follow you again later."
                  : "You can follow them again at any time."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="">Back</AlertDialogCancel>
              <AlertDialogAction className="" onClick={runConfirm}>
                {confirm.kind === "remove" ? "Remove" : "Unfollow"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
};

export default Connections;
