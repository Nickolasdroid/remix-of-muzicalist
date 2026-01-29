import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch artist IDs from user_roles table.
 * Only users with user_type = 'artist' should appear in artist listings.
 */
export const useArtistIds = () => {
  const [artistIds, setArtistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistIds = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_type', 'artist');

      if (error) {
        console.error('Error fetching artist IDs:', error);
        setArtistIds([]);
      } else {
        setArtistIds(data?.map(r => r.user_id) || []);
      }
      setLoading(false);
    };

    fetchArtistIds();
  }, []);

  return { artistIds, loading };
};

/**
 * Utility function to fetch artist IDs (for use in async functions)
 */
export const fetchArtistIds = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('user_type', 'artist');

  if (error) {
    console.error('Error fetching artist IDs:', error);
    return [];
  }

  return data?.map(r => r.user_id) || [];
};
