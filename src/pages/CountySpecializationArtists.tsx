import Navigation from "@/components/Navigation";
import { ArrowLeft } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchArtistIds } from "@/hooks/use-artist-ids";
import { sortByPlanPriority } from "@/lib/planLimits";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PlanBadge from "@/components/PlanBadge";

interface Artist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  plan: string;
}

type SpecializationType = "Singer" | "Instrumentalist" | "DJ" | "Band";

const specializationMap: Record<string, SpecializationType> = {
  singer: "Singer",
  instrumentalist: "Instrumentalist",
  dj: "DJ",
  band: "Band",
};

const specializationTitles: Record<string, string> = {
  singer: "Singers",
  instrumentalist: "Instrumentalists",
  dj: "DJs",
  band: "Bands",
};

const CountySpecializationArtists = () => {
  const { county, specialization } = useParams<{ county: string; specialization: string }>();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    const fetchArtistsData = async () => {
      if (!county || !specialization) return;
      
      const dbSpecialization = specializationMap[specialization.toLowerCase()];
      if (!dbSpecialization) return;
      
      setLoading(true);
      
      // Get artist IDs first to filter out regular users
      const artistIds = await fetchArtistIds();
      if (artistIds.length === 0) {
        setArtists([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, plan')
        .ilike('county', county)
        .eq('specialization', dbSpecialization)
        .in('id', artistIds);
      
      if (error) {
        console.error('Error fetching artists:', error);
      } else {
        const sorted = [...(data || [])].sort((a, b) => sortByPlanPriority(a, b));
        setArtists(sorted);
      }
      setLoading(false);
    };

    fetchArtistsData();
  }, [county, specialization]);

  const title = specialization ? specializationTitles[specialization.toLowerCase()] || specialization : '';

  return (
    <div className={`min-h-screen ${currentUserId ? 'md:ml-64' : ''} bg-background`}>
      <Navigation mobileTitle={county} mobileBackPath={`/counties/${county}`} />
      
      <div className="container mx-auto px-4 pt-20 md:pt-8 pb-24 md:pb-20">
        <div className="hidden md:flex items-center justify-between mb-6 md:mb-8">
          <Link to={`/counties/${county}`}>
            <Button variant="outline" className="h-9 px-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-sans font-bold text-foreground">
            {county}
          </h1>
          <div className="w-[76px]" /> {/* Spacer for alignment */}
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading artists...</div>
        ) : artists.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No {title?.toLowerCase()} found in {county} yet.
          </div>
        ) : (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-2">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                to={`/artist/${artist.id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/10 transition-colors border"
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={artist.avatar_url || undefined} alt={artist.stage_name} />
                    <AvatarFallback>{artist.stage_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <PlanBadge plan={artist.plan} size={14} className="top-0 right-0" />
                </div>
                <span className="text-base font-medium text-foreground notranslate" data-user-content="true" data-no-translate="true" translate="no">{artist.stage_name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CountySpecializationArtists;
