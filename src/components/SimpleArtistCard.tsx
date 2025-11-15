import { Link } from "react-router-dom";

interface SimpleArtistCardProps {
  id: string;
  name: string;
  stageName: string;
  imageUrl?: string;
}

const SimpleArtistCard = ({ id, name, stageName, imageUrl }: SimpleArtistCardProps) => {
  return (
    <Link to={`/artist/${id}`}>
      <div className="group relative aspect-square overflow-hidden rounded-lg border-2 border-accent hover:border-accent/80 transition-all duration-300 hover:shadow-[var(--shadow-gold)]">
        <div className="w-full h-full">
          {imageUrl ? (
            <img src={imageUrl} alt={stageName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent/30 to-accent/10" />
          )}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm py-3 px-4">
          <p className="text-foreground font-semibold text-center truncate">{stageName}</p>
        </div>
      </div>
    </Link>
  );
};

export default SimpleArtistCard;
