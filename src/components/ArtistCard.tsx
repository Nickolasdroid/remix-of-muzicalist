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
  const borderColor = isPremium ? "border-accent" : "border-muted";
  const hoverBorderColor = isPremium ? "hover:border-accent" : "hover:border-muted";
  
  return (
    <div className={`group relative overflow-hidden rounded-none md:rounded-2xl bg-gradient-to-br from-card to-secondary p-3 md:p-6 border-0 md:border-2 border-transparent ${borderColor} ${hoverBorderColor} transition-all duration-500 hover:shadow-[var(--shadow-gold)] border-b border-border/30 md:border-b-0`}>
      <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        {rank && (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 md:-top-1 md:-left-1 md:translate-y-0 w-6 h-6 md:w-9 md:h-9 rounded-full bg-accent flex items-center justify-center shadow-lg z-20">
            <span className="text-xs md:text-base font-display font-bold text-accent-foreground">#{rank}</span>
          </div>
        )}
        
        <Link to={`/artist/${id}`} className="block">
          {/* Mobile Layout */}
          <div className="flex md:hidden items-center gap-3 pl-7">
            <div className={`w-12 h-12 rounded-full overflow-hidden ${isPremium ? "border-2 border-accent/50" : ""} flex-shrink-0`}>
              {imageUrl ? (
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-accent" />
                </div>
              )}
            </div>
            
            <h3 className="text-base font-display font-bold text-foreground truncate flex-1 notranslate" data-user-content="true" data-no-translate="true" translate="no">
              {stageName}
            </h3>
            
            {rating > 0 && (
              <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-sm font-bold shadow-lg flex-shrink-0">
                <Star className="h-3 w-3 fill-current" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center gap-4">
            <div className={`w-24 h-24 rounded-full overflow-hidden ${isPremium ? "border-4 border-accent/50 group-hover:border-accent" : ""} transition-all duration-500 group-hover:scale-110 cursor-pointer flex-shrink-0`}>
              {imageUrl ? (
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center">
                  <User className="h-12 w-12 text-accent" />
                </div>
              )}
            </div>
            
            <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-accent transition-colors truncate notranslate" data-user-content="true" data-no-translate="true" translate="no">
              {stageName}
            </h3>
            
            {rating > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground font-bold shadow-lg ml-auto">
                <Star className="h-4 w-4 fill-current" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ArtistCard;
