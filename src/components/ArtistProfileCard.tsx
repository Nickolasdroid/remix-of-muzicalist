import { CalendarCheck, CalendarX } from "lucide-react";
import ArtistTile from "@/components/ArtistTile";
import { useEffect, useState } from "react";
import { loadArtistCardMeta, getCachedArtistCardMeta } from "@/lib/artistCardMeta";

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

const ArtistProfileCard = ({ id, stageName, imageUrl, plan, country: countryProp, county: countyProp, availabilityStatus, searchDate }: ArtistProfileCardProps) => {
  const initial = getCachedArtistCardMeta(id);
  const [rating, setRating] = useState<number | null>(initial?.rating ?? null);
  const [reviewCount, setReviewCount] = useState<number>(initial?.reviewCount ?? 0);
  const [createdAt, setCreatedAt] = useState<string | null>(initial?.createdAt ?? null);
  const [specialization, setSpecialization] = useState<string | null>(initial?.specialization ?? null);
  const [loc, setLoc] = useState({ county: initial?.county ?? null, country: initial?.country ?? null });
  const county = countyProp ?? loc.county;
  const country = countryProp ?? loc.country;

  useEffect(() => {
    let active = true;
    loadArtistCardMeta(id).then((meta) => {
      if (!active) return;
      setRating(meta.rating);
      setReviewCount(meta.reviewCount);
      setCreatedAt(meta.createdAt);
      setSpecialization(meta.specialization ?? null);
      setLoc({ county: meta.county ?? null, country: meta.country ?? null });
    });
    return () => { active = false; };
  }, [id]);





  return (
    <ArtistTile
      id={id}
      stageName={stageName}
      imageUrl={imageUrl}
      plan={plan}
      specialization={specialization}
      county={county}
      country={country}
      rating={rating}
      reviewCount={reviewCount}
      overlay={
        availabilityStatus ? (
          <div
            className={`absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              availabilityStatus === "available" ? "bg-green-500/90 text-white" : "bg-red-500/80 text-white"
            }`}
          >
            {availabilityStatus === "available" ? (
              <>
                <CalendarCheck className="h-3 w-3" /> Available
              </>
            ) : (
              <>
                <CalendarX className="h-3 w-3" /> Booked
              </>
            )}
          </div>
        ) : null
      }
    />
  );
};

export default ArtistProfileCard;
