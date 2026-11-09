import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import AuthShell, { authButtonClass } from "@/components/AuthShell";
import SEO from "@/components/SEO";
import { AccountTypeChoice, ArtistPromoConsent, homeForAccount, type AccountType } from "@/pages/Register";
import { getOnboardingState } from "@/lib/onboarding";

/** After signing up with Google: the one question the email sign-up asks up front. */
const Welcome = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | null>(() => {
    try {
      const v = localStorage.getItem("signup_intent");
      return v === "artist" || v === "user" ? v : null;
    } catch {
      return null;
    }
  });
  const [promoConsent, setPromoConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      const state = await getOnboardingState(session.user.id, true);
      if (state.typeChosen) {
        navigate("/", { replace: true });
        return;
      }
      setReady(true);
    });
  }, [navigate]);

  if (!ready) return null;

  const valid = accountType === "user" || (accountType === "artist" && promoConsent);

  const save = async () => {
    if (!accountType || !valid || saving) return;
    setSaving(true);
    const { error } = await (supabase as any).rpc("set_my_account_type", { _type: accountType });
    if (error && !String(error.message).includes("ACCOUNT_TYPE_ALREADY_CHOSEN")) {
      toast.error("Couldn't save your choice. Please try again.");
      setSaving(false);
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) await getOnboardingState(session.user.id, true);
    try {
      localStorage.removeItem("signup_intent");
    } catch {
      /* storage unavailable */
    }
    navigate(homeForAccount(accountType), { replace: true });
  };

  return (
    <>
      <SEO title="Welcome | Muzicalist" description="Finish creating your Muzicalist account." path="/welcome" noindex />
      <AuthShell title="What brings you here?">
        <div className="space-y-6">
          <AccountTypeChoice value={accountType} onChange={setAccountType} />
          {accountType === "artist" && <ArtistPromoConsent checked={promoConsent} onChange={setPromoConsent} />}
          <Button type="button" onClick={save} disabled={!valid || saving} className={authButtonClass}>
            {saving ? "Saving…" : "Continue"}
          </Button>
        </div>
      </AuthShell>
    </>
  );
};

export default Welcome;
