import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch artist IDs from profiles table.
 * Artists are identified by having a specialization (Singer/Instrumentalist/DJ/Band).
 * Regular users don't have a specialization set.
 */
export const useArtistIds = () => {
  const [artistIds, setArtistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistIds = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .not('specialization', 'is', null);

      if (error) {
        console.error('Error fetching artist IDs:', error);
        setArtistIds([]);
      } else {
        setArtistIds(data?.map(r => r.id) || []);
      }
      setLoading(false);
    };

    fetchArtistIds();
  }, []);

  return { artistIds, loading };
};

/**
 * Utility function to fetch artist IDs (for use in async functions).
 * Artists have a specialization set, regular users don't.
 */
export const fetchArtistIds = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .not('specialization', 'is', null);

  if (error) {
    console.error('Error fetching artist IDs:', error);
    return [];
  }

  return data?.map(r => r.id) || [];
};
