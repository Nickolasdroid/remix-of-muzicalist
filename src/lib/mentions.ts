import { supabase } from "@/integrations/supabase/client";

export type MentionsAllowFrom = "everyone" | "artists" | "following" | "nobody";

export interface MentionCandidate {
  id: string;
  stage_name: string;
  slug: string | null;
  avatar_url: string | null;
  specialization: string | null;
}

/**
 * Autocomplete source for the `@` mention system.
 *
 * Returns only profiles the current account is actually allowed to mention,
 * according to each profile's "Who can mention you?" setting. The same rule is
 * enforced server-side when a mention row is inserted, so hiding a profile here
 * is a UX convenience, not the security boundary.
 */
export const searchMentionableProfiles = async (
  query: string,
  limit = 8,
): Promise<MentionCandidate[]> => {
  const { data, error } = await (supabase as any).rpc("search_mentionable_profiles", {
    _query: query ?? "",
    _limit: limit,
  });
  if (error) return [];
  return (data || []) as MentionCandidate[];
};

/** Server-side check mirror: can the current account mention `targetProfileId`? */
export const canMentionProfile = async (targetProfileId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await (supabase as any).rpc("can_mention", {
    _actor: user.id,
    _target: targetProfileId,
  });
  if (error) return false;
  return Boolean(data);
};
