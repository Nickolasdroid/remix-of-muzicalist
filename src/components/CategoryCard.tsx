import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  iconImage?: string;
  href: string;
  count?: number;
}

const CategoryCard = ({ title, description, icon: Icon, iconImage, href, count }: CategoryCardProps) => {
  return (
    <Link to={href}>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-secondary p-8 border-2 border-transparent hover:border-accent transition-all duration-500 hover:shadow-[var(--shadow-gold)] hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
          <div className="flex items-center justify-center w-32 h-32 rounded-full bg-accent/20 group-hover:bg-accent group-hover:scale-110 transition-all duration-500">
            {iconImage ? (
              <img src={iconImage} alt={title} className="h-24 w-24 object-contain invert group-hover:invert-0 transition-all" />
            ) : Icon ? (
              <Icon className="h-20 w-20 text-accent group-hover:text-accent-foreground transition-colors" />
            ) : null}
          </div>
          
          <h3 className="text-2xl font-display font-bold text-center text-foreground group-hover:text-accent transition-colors">
            {title}
          </h3>
          
          {count !== undefined && (
            <div className="flex items-center justify-center px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold text-lg">
              {count}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
