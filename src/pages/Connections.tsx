import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2, User, Users } from "lucide-react";
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
const Connections = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab: Tab = searchParams.get("tab") === "following" ? "following" : "followers";

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
        <Button size="sm" variant="outline" className="h-8 rounded-lg px-3" onClick={() => setConfirm({ kind: "remove", row })}>
          Remove
        </Button>
      );
    }
    if (!row.specialization) return null; // only artists can be followed
    return myFollowing.has(row.id) ? (
      <Button size="sm" variant="outline" className="h-8 rounded-lg px-3" onClick={() => setConfirm({ kind: "unfollow", row })}>
        Following
      </Button>
    ) : (
      <Button size="sm" className="h-8 rounded-lg px-3 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => follow(row)}>
        Follow
      </Button>
    );
  };

  const emptyText = useMemo(() => {
    if (tab === "followers") return isOwn ? "No followers yet. Share your profile so people can follow you." : "No followers yet.";
    return isOwn ? "You're not following anyone yet." : "Not following anyone yet.";
  }, [tab, isOwn]);

  const renderRow = (p: ProfileRow, suggested = false) => {
    const name = displayName(p);
    const sub = [p.specialization ? translateSpecialization(p.specialization) : null, p.county].filter(Boolean).join(" · ");
    return (
      <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
        <Link to={`/artist/${p.slug || p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar className="h-11 w-11">
            {p.avatar_url ? <AvatarImage src={p.avatar_url} alt={name} /> : null}
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground notranslate" translate="no">{name}</p>
            {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
          </div>
        </Link>
        <div className="shrink-0">{actionFor(p, suggested)}</div>
      </li>
    );
  };

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", t);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background md:ml-64">
      <Navigation mobileTitle={owner ? displayName(owner) : " "} onMobileBack={() => goBack(navigate, "/feed")} hideMobileNotifications />
      <main className="mx-auto max-w-xl pt-14 md:pt-6 pb-24 md:pb-10">
        <h1 className="hidden md:block px-4 pb-4 text-2xl font-display font-bold text-foreground notranslate" translate="no">
          {owner ? displayName(owner) : ""}
        </h1>

        <div role="tablist" className="sticky top-14 md:top-0 z-10 grid grid-cols-2 border-b border-border bg-background">
          {(["followers", "following"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`relative py-3 text-sm font-semibold transition-colors ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span className="tabular-nums">{loading ? "–" : lists[t].length}</span>{" "}
              <span>{t === "following" ? "Following" : lists.followers.length === 1 && !loading ? "Follower" : "Followers"}</span>
              {tab === t && <span className="absolute inset-x-8 bottom-0 h-0.5 rounded-full bg-accent" aria-hidden="true" />}
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
              <ul className="py-2">{current.map((p) => renderRow(p))}</ul>
            ) : (
              <div className="flex flex-col items-center px-6 pt-12 pb-6 text-center">
                <div className="mb-3 rounded-2xl bg-accent/10 p-3">
                  <Users className="h-6 w-6 text-accent" aria-hidden="true" />
                </div>
                <p className="max-w-xs text-sm text-muted-foreground">{emptyText}</p>
              </div>
            )}

            {suggestions.length > 0 && (
              <section className="mt-4 border-t border-border pt-4">
                <h2 className="px-4 pb-1 text-sm font-semibold text-foreground">Suggested artists</h2>
                <p className="px-4 pb-2 text-xs text-muted-foreground">Artists near you that you don't follow yet.</p>
                <ul>{suggestions.map((p) => renderRow(p, true))}</ul>
              </section>
            )}
          </>
        )}
      </main>

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
              <AlertDialogCancel className="rounded-lg">Back</AlertDialogCancel>
              <AlertDialogAction className="rounded-lg" onClick={runConfirm}>
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
