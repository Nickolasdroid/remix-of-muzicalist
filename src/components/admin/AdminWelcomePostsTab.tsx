import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import type { AdminProfile } from "./adminProfileTypes";
import FeedPostCard from "@/components/FeedPostCard";

interface Props {
  profiles: AdminProfile[];
  roles: Record<string, string>;
  loading: boolean;
  /** Official Muzicalist admin profile (post author) */
  adminProfile?: AdminProfile | null;
}

/** Mirrors the Romanian labels used by the backend generator (display only). */
const CATEGORY_RO: Record<string, string> = {
  Singer: "Solist",
  Band: "Formație",
  Instrumentalist: "Instrumentist",
  DJ: "DJ",
};

/** Preview-only rendering of what `create_artist_joined_post` will store. */
const previewContent = (a: AdminProfile) => {
  const cat = CATEGORY_RO[a.specialization ?? ""] ?? a.specialization ?? "";
  const country =
    a.country === "Romania" || a.country === "România" ? "România" : a.country || "";
  const loc = [a.county, country].filter(Boolean).join(", ");
  return (
    `@${a.stage_name} este acum pe Muzicalist ca ${cat}.` +
    (loc ? `\n📍 ${loc}. ` : "\n") +
    "Descoperă profilul și află mai multe."
  );
};

type Filter = "all" | "not_published" | "published";

interface BulkResult {
  created: number;
  already: number;
  skipped: number;
  failed: number;
}

export default function AdminWelcomePostsTab({ profiles, roles, loading, adminProfile }: Props) {
  const { toast } = useToast();

  const artists = useMemo(
    () =>
      profiles.filter(
        (p) => (roles[p.id] === "artist" || !!p.specialization) && roles[p.id] !== "admin",
      ),
    [profiles, roles],
  );

  const [postsByArtist, setPostsByArtist] = useState<Record<string, string>>({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  const fetchStatus = async () => {
    setLoadingPosts(true);
    const { data, error } = await (supabase as any).rpc("admin_list_artist_joined_posts");
    if (!error) {
      const map: Record<string, string> = {};
      ((data as { post_id: string; subject_profile_id: string }[]) ?? []).forEach((r) => {
        map[r.subject_profile_id] = r.post_id;
      });
      setPostsByArtist(map);
    }
    setLoadingPosts(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return artists.filter((a) => {
      const published = !!postsByArtist[a.id];
      if (filter === "published" && !published) return false;
      if (filter === "not_published" && published) return false;
      if (q) {
        const hay = [a.stage_name, a.first_name, a.last_name].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [artists, search, filter, postsByArtist]);

  const eligible = useMemo(
    () => filtered.filter((a) => !postsByArtist[a.id]),
    [filtered, postsByArtist],
  );

  const allEligibleSelected =
    eligible.length > 0 && eligible.every((a) => selected.includes(a.id));

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const selectAll = () =>
    setSelected(allEligibleSelected ? [] : eligible.map((a) => a.id));

  const selectedArtists = useMemo(
    () => artists.filter((a) => selected.includes(a.id)),
    [artists, selected],
  );

  const runCreate = async () => {
    setWorking(true);
    const res: BulkResult = { created: 0, already: 0, skipped: 0, failed: 0 };
    for (const a of selectedArtists) {
      if (postsByArtist[a.id]) {
        res.already += 1;
        continue;
      }
      if (!a.specialization) {
        res.skipped += 1;
        continue;
      }
      const { data, error } = await (supabase as any).rpc("create_artist_joined_post", {
        _artist_id: a.id,
      });
      if (error || !data) {
        res.failed += 1;
      } else {
        res.created += 1;
      }
    }
    setWorking(false);
    setPreviewOpen(false);
    setSelected([]);
    setResult(res);
    await fetchStatus();
    if (res.failed > 0) {
      toast({
        title: "Some posts could not be created",
        description: `${res.failed} failed.`,
        variant: "destructive",
      });
    }
  };

  const isLoading = loading || loadingPosts;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Artist Welcome Posts</h2>
        <p className="text-sm text-muted-foreground">
          Create official welcome posts for artists on Muzicalist.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search artists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-lg"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="not_published">Not published</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={allEligibleSelected}
            onCheckedChange={selectAll}
            disabled={eligible.length === 0}
          />
          Select all
        </label>
        {selected.length > 0 && (
          <>
            <span className="text-sm text-muted-foreground">{selected.length} selected</span>
            <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setSelected([])}>
              Clear selection
            </Button>
          </>
        )}
        <Button
          className="rounded-lg sm:ml-auto w-full sm:w-auto"
          disabled={selected.length === 0}
          onClick={() => setPreviewOpen(true)}
        >
          {selected.length > 1
            ? `Create ${selected.length} Welcome Posts`
            : "Create Welcome Post"}
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No artists found.</p>
        ) : (
          filtered.map((a) => {
            const postId = postsByArtist[a.id];
            return (
              <Card key={a.id} className="rounded-lg">
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox
                    checked={selected.includes(a.id)}
                    onCheckedChange={() => toggle(a.id)}
                    disabled={!!postId}
                  />
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={a.avatar_url ?? undefined} />
                    <AvatarFallback>{(a.stage_name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{a.stage_name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[a.specialization, [a.county, a.country].filter(Boolean).join(", ")]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {postId ? (
                      <>
                        <Badge variant="secondary" className="rounded-lg gap-1 whitespace-nowrap">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Welcome post published</span>
                          <span className="sm:hidden">Published</span>
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => window.open(`/feed?post=${postId}`, "_blank")}
                          title="View post"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline" className="rounded-lg whitespace-nowrap">
                        Not published
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Preview / confirmation */}
      <Dialog open={previewOpen} onOpenChange={(o) => !working && setPreviewOpen(o)}>
        <DialogContent className="rounded-lg max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedArtists.length > 1
                ? `Create welcome posts for ${selectedArtists.length} artists?`
                : "Preview welcome post"}
            </DialogTitle>
            <DialogDescription>
              {selectedArtists.length > 1
                ? "Each artist will receive an individual introduction post published by the official Muzicalist account."
                : "This post will be published by the official Muzicalist account."}
            </DialogDescription>
          </DialogHeader>

          {selectedArtists.length === 1 && selectedArtists[0] && (
            <div className="border border-border rounded-lg overflow-hidden">
              <FeedPostCard
                author={{
                  id: adminProfile?.id,
                  stageName: adminProfile?.stage_name || "Muzicalist",
                  avatarUrl: adminProfile?.avatar_url,
                  specializationLabel: "Admin",
                  verified: true,
                }}
                content={previewContent(selectedArtists[0])}
                createdAt={new Date().toISOString()}
                mediaUrl={selectedArtists[0].avatar_url}
                mediaType={selectedArtists[0].avatar_url ? "image" : null}
                mentions={[
                  {
                    profileId: selectedArtists[0].id,
                    name: selectedArtists[0].stage_name ?? "",
                  },
                ]}
              />
            </div>
          )}

          {selectedArtists.length > 1 && (
            <ul className="max-h-56 overflow-y-auto text-sm text-muted-foreground space-y-1">
              {selectedArtists.map((a) => (
                <li key={a.id}>· {a.stage_name}</li>
              ))}
            </ul>
          )}

          <DialogFooter>
            <Button variant="outline" className="rounded-lg" disabled={working} onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-lg" disabled={working} onClick={runCreate}>
              {working && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedArtists.length > 1 ? "Create Posts" : "Create Welcome Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result summary */}
      <Dialog open={!!result} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent className="rounded-lg max-w-sm">
          <DialogHeader>
            <DialogTitle>Result</DialogTitle>
          </DialogHeader>
          {result && (
            <div className="text-sm space-y-1">
              <p className="text-foreground">Welcome posts created: {result.created}</p>
              <p className="text-muted-foreground">Already published: {result.already}</p>
              <p className="text-muted-foreground">Skipped: {result.skipped}</p>
              <p className="text-muted-foreground">Failed: {result.failed}</p>
            </div>
          )}
          <DialogFooter>
            <Button className="rounded-lg" onClick={() => setResult(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
