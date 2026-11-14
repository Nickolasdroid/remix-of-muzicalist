import { supabase } from "@/integrations/supabase/client";

// Helpers for files kept in the public "avatars" bucket (profile photos, gallery, post and
// announcement media). Deleting a row must also delete its files, or they stay forever.

const MARK = "/storage/v1/object/public/avatars/";
const URL_RE = /https?:\/\/[^"\s\\]+\/storage\/v1\/object\/public\/avatars\/[^"\s\\]+/g;

/** Storage path of a public file URL (`<user id>/gallery/...`), or null when it is not one of ours. */
export function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const i = url.indexOf(MARK);
  if (i < 0) return null;
  const rest = url.slice(i + MARK.length).split("?")[0].split("#")[0];
  if (!rest) return null;
  try {
    return decodeURIComponent(rest);
  } catch {
    return rest;
  }
}

/** Every storage path mentioned anywhere inside a value (a URL, a row, a JSON column). */
export function storagePathsIn(value: unknown): string[] {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? null);
  const paths = new Set<string>();
  for (const match of text.match(URL_RE) ?? []) {
    const path = storagePathFromUrl(match);
    if (path) paths.add(path);
  }
  return [...paths];
}

/** Reads the media of a post or announcement, to delete its files after the row is gone. */
export async function readMediaPaths(table: "posts" | "announcements", id: string): Promise<string[]> {
  try {
    const columns = table === "posts" ? "media_url, media" : "media_url";
    const { data } = await supabase.from(table).select(columns).eq("id", id).maybeSingle();
    return storagePathsIn(data);
  } catch {
    return [];
  }
}

/** Best effort: a file that cannot be removed must never block deleting the item itself. */
export async function removeStoragePaths(paths: string[]): Promise<void> {
  if (!paths.length) return;
  try {
    await supabase.storage.from("avatars").remove(paths);
  } catch (e) {
    console.warn("Could not remove storage files", e);
  }
}
