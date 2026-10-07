import { supabase } from "@/integrations/supabase/client";
import { uploadFileWithProgress } from "@/lib/uploadWithProgress";

/** How long each story stays on screen in the viewer. */
export const STORY_DURATION_MS = 10_000;
/** Plans allowed to publish stories (enforced server-side by RLS too). */
export const STORY_PLANS = ["Standard", "Premium"] as const;

export const canPlanPublishStories = (plan?: string | null) =>
  !!plan && (STORY_PLANS as readonly string[]).includes(plan);

export interface Story {
  id: string;
  profile_id: string;
  media_url: string;
  storage_path: string;
  created_at: string;
  expires_at: string;
}

export interface StoryAuthor {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  slug: string | null;
}

export interface StoryGroup {
  author: StoryAuthor;
  /** Oldest first — the order they are played in. */
  stories: Story[];
  /** True when the current viewer has seen every story in the group. */
  allSeen: boolean;
  latestAt: string;
}

// The stories tables are newer than the generated Supabase types.
const db = supabase as any;

/**
 * Loads every active story, grouped by author, with the viewer's seen state.
 * Order: the viewer's own group first, then unseen groups (newest first),
 * then fully seen groups (newest first) — the same order Instagram uses.
 */
export async function fetchStoryGroups(
  currentUserId: string | null,
  localSeen: Set<string> = new Set()
): Promise<StoryGroup[]> {
  const { data, error } = await db
    .from("stories")
    .select("id, profile_id, media_url, storage_path, created_at, expires_at, profiles (id, stage_name, avatar_url, slug)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });

  if (error) throw error;
  const rows = (data || []) as Array<Story & { profiles: StoryAuthor | null }>;
  if (!rows.length) return [];

  let seen = new Set<string>(localSeen);
  if (currentUserId) {
    const { data: views } = await db
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", currentUserId)
      .in("story_id", rows.map((r) => r.id));
    seen = new Set([...seen, ...((views || []) as { story_id: string }[]).map((v) => v.story_id)]);
  }

  // Resolve image URLs through signed links so stories display whether the
  // "stories" bucket is public or private (Lovable creates buckets private).
  const signed = await supabase.storage
    .from("stories")
    .createSignedUrls(rows.map((r) => r.storage_path), 60 * 60 * 24);
  const urlByPath = new Map<string, string>();
  for (const item of signed.data || []) {
    if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl);
  }
  for (const row of rows) {
    const url = urlByPath.get(row.storage_path);
    if (url) row.media_url = url;
  }

  const byAuthor = new Map<string, StoryGroup>();
  for (const row of rows) {
    if (!row.profiles) continue;
    const { profiles, ...story } = row;
    let group = byAuthor.get(row.profile_id);
    if (!group) {
      group = { author: profiles, stories: [], allSeen: true, latestAt: story.created_at };
      byAuthor.set(row.profile_id, group);
    }
    group.stories.push(story);
    group.latestAt = story.created_at;
    if (!seen.has(story.id) && story.profile_id !== currentUserId) group.allSeen = false;
  }

  const groups = [...byAuthor.values()];
  const own = groups.filter((g) => g.author.id === currentUserId);
  const others = groups
    .filter((g) => g.author.id !== currentUserId)
    .sort((a, b) => {
      if (a.allSeen !== b.allSeen) return a.allSeen ? 1 : -1;
      return b.latestAt.localeCompare(a.latestAt);
    });
  return [...own, ...others];
}

/** Records that the current user has seen a story (idempotent). */
export async function markStoryViewed(storyId: string, viewerId: string) {
  await db
    .from("story_views")
    .upsert({ story_id: storyId, viewer_id: viewerId }, { onConflict: "story_id,viewer_id", ignoreDuplicates: true });
}

/** View counts for the author's own stories. */
export async function fetchStoryViewCounts(storyIds: string[]): Promise<Record<string, number>> {
  if (!storyIds.length) return {};
  const { data } = await db.from("story_views").select("story_id").in("story_id", storyIds);
  const counts: Record<string, number> = {};
  for (const v of (data || []) as { story_id: string }[]) counts[v.story_id] = (counts[v.story_id] || 0) + 1;
  return counts;
}

/**
 * Downscales the image to at most 1080×1920 (keeping the aspect ratio) and
 * re-encodes it as JPEG, so stories load fast on mobile data.
 */
async function prepareStoryImage(file: File): Promise<File> {
  const MAX_W = 1080;
  const MAX_H = 1920;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_W / bitmap.width, MAX_H / bitmap.height);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], "story.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export class StoryPlanError extends Error {}

/** Uploads an image and creates the story row. */
export async function publishStory(
  userId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<void> {
  const prepared = await prepareStoryImage(file);
  const ext = prepared.type === "image/png" ? "png" : prepared.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const publicUrl = await uploadFileWithProgress("stories", path, prepared, onProgress);

  const { error } = await db
    .from("stories")
    .insert({ profile_id: userId, media_url: publicUrl, storage_path: path });

  if (error) {
    await supabase.storage.from("stories").remove([path]);
    if (error.code === "42501" || /row-level security/i.test(error.message || "")) {
      throw new StoryPlanError(error.message);
    }
    throw error;
  }
}

export async function deleteStory(story: Story) {
  const { error } = await db.from("stories").delete().eq("id", story.id);
  if (error) throw error;
  await supabase.storage.from("stories").remove([story.storage_path]);
}

/** Compact age label: "now", "12m", "5h". */
export function storyAge(createdAt: string, lang: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (mins < 1) return lang.startsWith("ro") ? "acum" : "now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}
