import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ArtistProfile from "./ArtistProfile";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Route resolver for /artist/:id — accepts BOTH URL formats:
 *
 *   /artist/apuseni-fest                              (slug, canonical)
 *   /artist/299db8e1-aa3a-46c5-9d89-9beaa819bd93      (legacy UUID)
 *
 * UUID URLs keep working (old shared links never break) but are
 * transparently replaced in the address bar with the slug version.
 * Internally, ArtistProfile always receives the UUID so every data
 * query keeps working unchanged.
 */
const ArtistProfileRoute = () => {
  const { id: param } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setResolvedId(null);
    setNotFound(false);

    const resolve = async () => {
      if (!param) return;

      if (UUID_RE.test(param)) {
        // Legacy UUID URL: render immediately, then swap the visible URL
        // to the slug version without remounting (no extra data fetch).
        if (!cancelled) setResolvedId(param);
        const { data } = await (supabase.from("profiles") as any)
          .select("slug")
          .eq("id", param)
          .maybeSingle();
        if (!cancelled && data?.slug) {
          window.history.replaceState(
            window.history.state,
            "",
            `/artist/${data.slug}`
          );
        }
        return;
      }

      // Slug URL: look up the UUID, then render.
      const { data } = await (supabase.from("profiles") as any)
        .select("id")
        .eq("slug", param)
        .maybeSingle();
      if (cancelled) return;
      if (data?.id) {
        setResolvedId(data.id);
      } else {
        setNotFound(true);
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [param, navigate]);

  if (notFound) {
    // Let ArtistProfile show its own "artist not found" state.
    return <ArtistProfile artistId={param} />;
  }

  if (!resolvedId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">…</div>
      </div>
    );
  }

  return <ArtistProfile artistId={resolvedId} />;
};

export default ArtistProfileRoute;
