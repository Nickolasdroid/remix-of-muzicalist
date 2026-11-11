import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const USER_FOLDER_BUCKETS = ["avatars", "covers", "verification-docs", "report-attachments", "stories"];

/** Recursively collects every file path under `prefix` in `bucket` (Storage's list() is one level at a time). */
async function listAllFiles(admin: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return [];
  const paths: string[] = [];
  for (const entry of data) {
    const entryPath = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      // A folder entry (no id, no metadata) — recurse into it.
      paths.push(...(await listAllFiles(admin, bucket, entryPath)));
    } else {
      paths.push(entryPath);
    }
  }
  return paths;
}

/**
 * Deletes every Storage object under this user's folder, in every bucket that stores
 * user-owned files (avatars/covers/gallery/posts live under "avatars"; verification docs,
 * report attachments and story media each have their own bucket). Best-effort: a failure
 * on one bucket does not stop cleanup of the others.
 */
export async function deleteAllUserStorage(admin: SupabaseClient, userId: string): Promise<void> {
  for (const bucket of USER_FOLDER_BUCKETS) {
    try {
      const paths = await listAllFiles(admin, bucket, userId);
      if (paths.length > 0) {
        await admin.storage.from(bucket).remove(paths);
      }
    } catch (e) {
      console.error(`deleteAllUserStorage: failed to clean bucket ${bucket} for user ${userId}`, e);
    }
  }
}
