import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useActivation } from "@/hooks/useActivation";

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
 * Global gate: if a logged-in user is not yet activated (paid),
 * redirect them to /plans?activation=required.
 * Admins and unauthenticated users pass through.
 */
const ActivationGate = ({ children }: { children: React.ReactNode }) => {
  const { loading, hasSession, isActive, isAdmin } = useActivation();
  const navigate = useNavigate();
  const location = useLocation();

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
