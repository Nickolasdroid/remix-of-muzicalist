import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  count?: number;
}

const CategoryCard = ({ title, description, icon: Icon, href, count }: CategoryCardProps) => {
  return (
    <Link to={href}>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-secondary p-8 border-2 border-transparent hover:border-accent transition-all duration-500 hover:shadow-[var(--shadow-gold)] hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 group-hover:bg-accent group-hover:scale-110 transition-all duration-500">
            <Icon className="h-8 w-8 text-accent group-hover:text-accent-foreground transition-colors" />
          </div>
          
          <h3 className="text-2xl font-display font-bold mb-2 text-foreground group-hover:text-accent transition-colors">
            {title}
          </h3>
          
          <p className="text-muted-foreground mb-4 group-hover:text-foreground/80 transition-colors">
            {description}
          </p>
          
          {count !== undefined && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold">
              {count} artists
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
