import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useActivation } from "@/hooks/useActivation";
import { supabase } from "@/integrations/supabase/client";
import { PENDING_ACCOUNT_TYPE_KEY } from "@/hooks/useActivation";

// Routes that an inactive logged-in user is still allowed to visit.
const ALLOWED_PATHS = new Set<string>([
  "/plans",
  "/login",
  "/reset-password",
  "/register",
  "/register/artist",
  "/register/user",
  "/help",
  "/privacy-policy",
  "/terms-of-service",
  "/about",
]);

/**
 * Global gate that runs on every authenticated session change.
 *
 * Responsibilities:
 *  1. After a Google OAuth round-trip, if the user has no profile yet,
 *     create one with is_active = false and the role chosen on /register.
 *  2. If a logged-in non-admin user is not yet activated (paid), redirect
 *     them to /plans?activation=required.
 */
const ActivationGate = ({ children }: { children: React.ReactNode }) => {
  const { loading, hasSession, isActive, isAdmin } = useActivation();
  const navigate = useNavigate();
  const location = useLocation();
  const ensuredProfileRef = useRef<string | null>(null);

  // Provision profile + role row for brand-new Google signups.
  useEffect(() => {
    let cancelled = false;
    const ensure = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || cancelled) return;
      if (ensuredProfileRef.current === user.id) return;
      ensuredProfileRef.current = user.id;

      const { data: existing } = await supabase
        .from("profiles")
        .select("id, is_active, pending_account_type")
        .eq("id", user.id)
        .maybeSingle();

      const pending = (localStorage.getItem(PENDING_ACCOUNT_TYPE_KEY) as "artist" | "user" | null) || null;

      if (!existing) {
        // Brand-new Google signup → create inactive profile.
        const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
        const fullName = meta.full_name || meta.name || "";
        const [firstName, ...rest] = fullName.split(" ");
        const lastName = rest.join(" ");

        await supabase.from("profiles").insert({
          id: user.id,
          email: user.email ?? "",
          first_name: firstName || (meta.given_name ?? ""),
          last_name: lastName || (meta.family_name ?? ""),
          stage_name: fullName || (user.email ?? ""),
          phone: "",
          county: "",
          country: "Romania",
          avatar_url: meta.avatar_url ?? meta.picture ?? null,
          plan: "Free",
          is_active: false,
          pending_account_type: pending,
        } as never);

        // Insert role row. If the user did not come through /register,
        // default them to "user" so they aren't accidentally listed as artists.
        const role = pending === "artist" ? "artist" : "user";
        await supabase.from("user_roles").insert({
          user_id: user.id,
          user_type: role as never,
        });

        if (pending) localStorage.removeItem(PENDING_ACCOUNT_TYPE_KEY);
      } else if (!existing.pending_account_type && pending) {
        // Profile exists but doesn't have a remembered choice yet — store it.
        await supabase
          .from("profiles")
          .update({ pending_account_type: pending } as never)
          .eq("id", user.id);
        localStorage.removeItem(PENDING_ACCOUNT_TYPE_KEY);
      }
    };
    ensure();
    return () => {
      cancelled = true;
    };
  }, [hasSession]);

  // Redirect inactive non-admin users.
  useEffect(() => {
    if (loading) return;
    if (!hasSession) return;
    if (isAdmin || isActive) return;
    if (ALLOWED_PATHS.has(location.pathname)) return;
    navigate("/plans?activation=required", { replace: true });
  }, [loading, hasSession, isActive, isAdmin, location.pathname, navigate]);

  return <>{children}</>;
};

export default ActivationGate;
