import { Link } from "react-router-dom";
import { User, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ArtistProfileCardProps {
  id: string;
  stageName: string;
  imageUrl?: string | null;
  plan?: string;
}

const ArtistProfileCard = ({ id, stageName, imageUrl, plan }: ArtistProfileCardProps) => {
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    const fetchRating = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('rating')
        .eq('profile_id', id);
      
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setRating(Math.round(avg * 10) / 10);
      }
    };
    
    fetchRating();
  }, [id]);

  const isFree = !plan || plan === 'Free';

  return (
    <Link to={`/artist/${id}`} className="group block">
      <div className="overflow-hidden rounded-lg">
        {/* Profile Image */}
        <div className="relative aspect-square overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={stageName} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-card to-secondary flex items-center justify-center">
              <User className="h-16 w-16 text-accent" />
            </div>
          )}
        </div>
        
        {/* Info Section */}
        <div className="bg-card border-t border-border p-2 space-y-0.5">
          <h3 className="text-base font-sans font-semibold text-foreground text-left group-hover:text-accent transition-colors truncate">
            {stageName}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-accent fill-accent" />
              <span className="text-sm font-medium text-muted-foreground">
                {rating !== null ? rating.toFixed(1) : '-'}
              </span>
            </div>
            {isFree && (
              <Star className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ArtistProfileCard;
