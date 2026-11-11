import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getOnboardingState } from "@/lib/onboarding";
import { savePromotionChoice } from "@/lib/promotionConsent";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DISMISSED_KEY = "mz_promo_prompt_dismissed";
const SKIP_PATHS = ["/welcome", "/complete-profile", "/login", "/register", "/reset-password", "/terms-of-service", "/privacy-policy"];

/**
 * Asks an artist once whether Muzicalist may feature them on its social media.
 * Closing it without answering asks again on the next visit.
 */
const PromotionConsentPrompt = () => {
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUserId(session?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const skipPath = SKIP_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (!userId || skipPath || open) return;
    try {
      if (sessionStorage.getItem(DISMISSED_KEY) === userId) return;
    } catch {
      /* ignore */
    }
    let cancelled = false;
    (async () => {
      const state = await getOnboardingState(userId).catch(() => null);
      if (cancelled || !state || state.role !== "artist" || !state.artistComplete) return;
      const { data, error } = await supabase.from("profiles").select("promotion_answered_at" as any).eq("id", userId).maybeSingle();
      // Column missing (migration pending) or already answered: nothing to ask
      if (cancelled || error || !data || (data as any).promotion_answered_at) return;
      setOpen(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, skipPath, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = async (allow: boolean) => {
    if (!userId) return;
    setSaving(true);
    await savePromotionChoice(userId, allow);
    setSaving(false);
    setOpen(false);
  };

  const dismiss = (next: boolean) => {
    if (next) return;
    setOpen(false);
    try {
      if (userId) sessionStorage.setItem(DISMISSED_KEY, userId);
    } catch {
      /* ignore */
    }
  };

  return (
    <Dialog open={open} onOpenChange={dismiss}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-[calc(100%-2rem)] max-w-md rounded-xl border-0 bg-[#1f1f1f] p-6">
        <DialogHeader className="space-y-3 text-left">
          <DialogTitle className="pr-6 text-xl font-bold leading-snug">Can we feature you on Muzicalist's social media?</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            We'd like to post about artists on Muzicalist's Instagram, Facebook and TikTok, using your name, photos and profile description. We tag you and link to your profile, so organizers can find you.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-muted-foreground">You can change this anytime in Settings, and we'll remove a post about you if you ask.</p>
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => answer(false)}
            className="h-11 rounded-full px-5 text-sm font-bold text-foreground/80 transition-colors hover:text-foreground disabled:opacity-60"
          >
            No, thanks
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => answer(true)}
            className="h-11 rounded-full bg-accent px-6 text-sm font-bold text-accent-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            Yes, I agree
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionConsentPrompt;
