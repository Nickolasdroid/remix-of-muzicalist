import { supabase } from "@/integrations/supabase/client";

/** Saves the artist's answer about promotion on Muzicalist's social media. */
export const savePromotionChoice = async (userId: string, allow: boolean) => {
  const { error } = await supabase
    .from("profiles")
    .update({ allow_promotion: allow, promotion_answered_at: new Date().toISOString() } as any)
    .eq("id", userId);
  if (!error) return { error: null };
  // Column not there yet (migration pending): save the choice alone
  return supabase.from("profiles").update({ allow_promotion: allow } as any).eq("id", userId);
};
