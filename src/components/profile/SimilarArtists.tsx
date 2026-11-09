import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeaderWithUsage } from "@/components/dashboard/SectionLayout";
import { getThumbUrl } from "@/lib/imageUrl";
import { translateSpecialization } from "@/lib/specializationLabel";

type SimilarArtist = { id: string; slug: string | null; stage_name: string | null; avatar_url: string | null; county: string | null; specialization: string | null };

const COUNT = 6;

/** Artists of the same type, same county first: "Fans also like", for visitors still deciding. */
const SimilarArtists = ({ artistId, specialization, county }: { artistId: string; specialization: string | null; county: string | null }) => {
  const [artists, setArtists] = useState<SimilarArtist[]>([]);

  useEffect(() => {
    if (!specialization) return;
    let cancelled = false;
    (async () => {
      const base = () =>
        supabase
          .from("profiles")
          .select("id, slug, stage_name, avatar_url, county, specialization")
          .eq("specialization", specialization as any)
          .neq("id", artistId)
          .not("avatar_url", "is", null)
          .limit(COUNT);
      let list: SimilarArtist[] = [];
      if (county) {
        const { data } = await base().eq("county", county);
        list = (data as SimilarArtist[]) || [];
      }
      if (list.length < COUNT) {
        const { data } = await base();
        const seen = new Set(list.map((a) => a.id));
        list = [...list, ...(((data as SimilarArtist[]) || []).filter((a) => !seen.has(a.id)))].slice(0, COUNT);
      }
      if (!cancelled) setArtists(list.filter((a) => a.id !== artistId).slice(0, COUNT));
    })();
    return () => {
      cancelled = true;
    };
  }, [artistId, specialization, county]);

  if (artists.length === 0) return null;

  return (
    <div>
      <SectionHeaderWithUsage title="Similar artists" className="mb-4" />
      <div className="-mx-2 grid grid-cols-3 gap-y-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
        {artists.map((a) => (
          <Link
            key={a.id}
            to={`/artist/${a.slug || a.id}`}
            className="group rounded-md p-2 transition-colors hover:bg-foreground/[0.07] focus-visible:bg-foreground/[0.07] focus-visible:outline-none"
          >
            <div className="aspect-square overflow-hidden rounded-full bg-foreground/[0.06]">
              {a.avatar_url ? (
                <img src={getThumbUrl(a.avatar_url, 240)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <User className="h-8 w-8 text-foreground/30" />
                </span>
              )}
            </div>
            <p className="mt-2 truncate text-sm font-medium text-foreground notranslate" translate="no" data-user-content="true">
              {a.stage_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              <span>{translateSpecialization(a.specialization)}</span>
              {a.county ? (
                <>
                  <span>, </span>
                  <span className="notranslate" translate="no">{a.county}</span>
                </>
              ) : null}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SimilarArtists;
