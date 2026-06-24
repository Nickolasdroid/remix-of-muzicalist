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
const CategoryCard = ({
  title,
  description,
  icon: Icon,
  iconImage,
  href,
  count
}: CategoryCardProps) => {
  return <Link to={href}>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-secondary aspect-square border-2 border-border hover:border-accent transition-all duration-500 hover:shadow-[var(--shadow-gold)] hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2 md:gap-4 p-4 md:p-8 px-0">
          <div className="flex items-center justify-center">
            {iconImage ? <img src={iconImage} alt={title} className="h-16 w-16 md:h-32 md:w-32 object-contain invert group-hover:invert-0 transition-all" /> : Icon ? <Icon className="h-14 w-14 md:h-28 md:w-28 text-accent transition-colors" /> : null}
          </div>
          
          <h3 className="text-base md:text-2xl font-display font-bold text-center text-foreground group-hover:text-accent transition-colors">
            {title}
          </h3>
          
          {count !== undefined && <div className="flex items-center justify-center px-3 py-1 md:px-4 md:py-2 rounded-full bg-accent/10 text-accent font-semibold text-sm md:text-lg">
              {count}
            </div>}
        </div>
      </div>
    </Link>;
};
export default CategoryCard;