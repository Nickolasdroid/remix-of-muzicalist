import { Link } from "react-router-dom";
import { User, MapPin, CalendarCheck, CalendarX } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCountryName } from "@/lib/countryFlags";
import PlanBadge from "@/components/PlanBadge";
import ArtistCardStatusBadge from "@/components/ArtistCardStatusBadge";

interface ArtistProfileCardProps {
  id: string;
  stageName: string;
  imageUrl?: string | null;
  plan?: string;
  country?: string | null;
  county?: string | null;
  availabilityStatus?: "available" | "booked" | null;
  searchDate?: string | null;
}

const ArtistProfileCard = ({ id, stageName, imageUrl, plan, country, county, availabilityStatus, searchDate }: ArtistProfileCardProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: reviews }, { data: profile }] = await Promise.all([
        supabase.from('reviews').select('rating').eq('profile_id', id),
        supabase.from('profiles').select('created_at').eq('id', id).maybeSingle(),
      ]);

      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        setRating(Math.round(avg * 10) / 10);
        setReviewCount(reviews.length);
      }
      if (profile?.created_at) {
        setCreatedAt(profile.created_at);
      }
    };

    fetchData();

    const channel = supabase
      .channel(`reviews-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `profile_id=eq.${id}` }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);





  return (
    <Link to={`/artist/${id}`} className="group block">
      <div className="overflow-hidden rounded-lg border border-border shadow-sm">
        {/* Profile Image */}
        <div className="relative aspect-square overflow-hidden">
          <PlanBadge plan={plan} />
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
          {availabilityStatus && (
            <div className={`absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              availabilityStatus === "available" 
                ? "bg-green-500/90 text-white" 
                : "bg-red-500/80 text-white"
            }`}>
              {availabilityStatus === "available" ? (
                <><CalendarCheck className="h-3 w-3" /> Available</>
              ) : (
                <><CalendarX className="h-3 w-3" /> Booked</>
              )}
            </div>
          )}
        </div>
        
        {/* Info Section */}
        <div className="bg-card border-t border-border p-2 space-y-0.5">
          <h3 className="text-base font-sans font-semibold text-foreground text-left group-hover:text-accent transition-colors truncate notranslate" data-user-content="true" data-no-translate="true" translate="no">
            {stageName}
          </h3>
          {(country || county) && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-0.5">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {[county, country ? getCountryName(country) : null].filter(Boolean).join(', ')}
              </span>
            </p>
          )}
          <div className="flex items-center justify-between min-h-[20px]">
            <ArtistCardStatusBadge createdAt={createdAt} rating={rating} reviewCount={reviewCount} />
          </div>

        </div>
      </div>
    </Link>
  );
};

export default ArtistProfileCard;
