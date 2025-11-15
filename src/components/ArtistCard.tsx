import { User, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface ArtistCardProps {
  id: string;
  name: string;
  stageName: string;
  specialization: string;
  county: string;
  rating?: number;
  imageUrl?: string;
  rank?: number;
}

const ArtistCard = ({ 
  id, 
  name, 
  stageName, 
  specialization, 
  county, 
  rating = 0, 
  imageUrl,
  rank 
}: ArtistCardProps) => {
  return (
    <Link to={`/artist/${id}`}>
      <div className="group relative aspect-square overflow-hidden rounded-xl border border-accent/50 hover:border-accent transition-all duration-300 hover:shadow-lg cursor-pointer">
        {/* Background Image */}
        <div className="absolute inset-0">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
              <User className="h-24 w-24 text-accent/40" />
            </div>
          )}
        </div>

        {/* Rank Badge */}
        {rank && (
          <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-md z-10">
            <span className="text-lg font-display font-bold text-accent-foreground">#{rank}</span>
          </div>
        )}

        {/* Rating Badge */}
        {rating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-accent/90 text-accent-foreground font-bold shadow-md z-10">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-sm">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Semi-transparent overlay with name at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-black/80 backdrop-blur-sm p-4 transition-all duration-300">
          <h3 className="text-lg font-display font-bold text-foreground mb-1 truncate">
            {stageName}
          </h3>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {county}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold whitespace-nowrap">
              {specialization}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ArtistCard;
