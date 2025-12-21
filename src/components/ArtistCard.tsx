import { User, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface ArtistCardProps {
  id: string;
  name?: string;
  stageName: string;
  specialization: string;
  county: string;
  rating?: number;
  imageUrl?: string;
  rank?: number;
  isPremium?: boolean;
}

const ArtistCard = ({ 
  id, 
  name, 
  stageName, 
  specialization, 
  county, 
  rating = 0, 
  imageUrl,
  rank,
  isPremium = true
}: ArtistCardProps) => {
  const borderColor = isPremium ? "border-accent" : "border-burgundy";
  const hoverBorderColor = isPremium ? "hover:border-accent" : "hover:border-burgundy";
  
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-secondary p-6 border-2 border-transparent ${borderColor} ${hoverBorderColor} transition-all duration-500 hover:shadow-[var(--shadow-gold)]`}>
      <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex items-start gap-6">
        {rank && (
          <div className="absolute -top-2 -left-2 w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg">
            <span className="text-xl font-display font-bold text-accent-foreground">#{rank}</span>
          </div>
        )}
        
        <Link to={`/artist/${id}`} className="relative">
          <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${isPremium ? "border-accent/50 group-hover:border-accent" : "border-burgundy/50 group-hover:border-burgundy"} transition-all duration-500 group-hover:scale-110 cursor-pointer`}>
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center">
                <User className="h-12 w-12 text-accent" />
              </div>
            )}
          </div>
          
          {rating > 0 && (
            <div className="absolute -bottom-2 -right-2 flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground font-bold shadow-lg">
              <Star className="h-4 w-4 fill-current" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={`/artist/${id}`}>
            <h3 className="text-2xl font-display font-bold text-foreground mb-2 group-hover:text-accent transition-colors truncate cursor-pointer">
              {stageName}
            </h3>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ArtistCard;
