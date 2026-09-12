import { supabase } from "@/integrations/supabase/client";

export interface ArtistCardMeta {
  rating: number | null;
  reviewCount: number;
  createdAt: string | null;
}

const cache = new Map<string, ArtistCardMeta>();
const inflight = new Map<string, Promise<ArtistCardMeta>>();

let pending: string[] = [];
let pendingResolvers = new Map<string, (m: ArtistCardMeta) => void>();
let scheduled = false;

const EMPTY: ArtistCardMeta = { rating: null, reviewCount: 0, createdAt: null };

async function flush() {
  const ids = pending;
  const resolvers = pendingResolvers;
  pending = [];
  pendingResolvers = new Map();
  scheduled = false;
  if (ids.length === 0) return;

  const [{ data: reviews }, { data: profiles }] = await Promise.all([
    supabase.from("reviews").select("profile_id, rating").in("profile_id", ids),
    supabase.from("profiles").select("id, created_at").in("id", ids),
  ]);

  const ratings = new Map<string, number[]>();
  (reviews || []).forEach((r: any) => {
    const list = ratings.get(r.profile_id) || [];
    list.push(r.rating);
    ratings.set(r.profile_id, list);
  });
  const created = new Map<string, string | null>();
  (profiles || []).forEach((p: any) => created.set(p.id, p.created_at));

  ids.forEach((id) => {
    const list = ratings.get(id);
    const meta: ArtistCardMeta = {
      rating: list?.length
        ? Math.round((list.reduce((s, v) => s + v, 0) / list.length) * 10) / 10
        : null,
      reviewCount: list?.length ?? 0,
      createdAt: created.get(id) ?? null,
    };
    cache.set(id, meta);
    inflight.delete(id);
    resolvers.get(id)?.(meta);
  });
}

/**
 * Batches per-card rating/created_at lookups into a single pair of queries,
 * with an in-memory cache so the same artist is never fetched twice.
 */
export function loadArtistCardMeta(id: string): Promise<ArtistCardMeta> {
  const cached = cache.get(id);
  if (cached) return Promise.resolve(cached);

  const existing = inflight.get(id);
  if (existing) return existing;

  const promise = new Promise<ArtistCardMeta>((resolve) => {
    pendingResolvers.set(id, resolve);
    pending.push(id);
    if (!scheduled) {
      scheduled = true;
      setTimeout(() => {
        flush().catch(() => {
          pendingResolvers.forEach((r) => r(EMPTY));
          pendingResolvers = new Map();
          pending = [];
          scheduled = false;
        });
      }, 30);
    }
  });

  inflight.set(id, promise);
  return promise;
}

export function getCachedArtistCardMeta(id: string) {
  return cache.get(id);
}
