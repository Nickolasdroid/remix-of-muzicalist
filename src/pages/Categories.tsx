import Navigation from "@/components/Navigation";
import CategoryCard from "@/components/CategoryCard";
import { Music, Mic, Music2, Users } from "lucide-react";

const Categories = () => {
  const categories = [
    {
      icon: Mic,
      title: "Singers",
      description: "Professional vocalists for any event",
      count: 156,
      href: "/categories/Singers",
    },
    {
      icon: Music,
      title: "Instrumentalists",
      description: "Skilled musicians with various instruments",
      count: 89,
      href: "/categories/Instrumentalists",
    },
    {
      icon: Music2,
      title: "DJs",
      description: "Expert DJs for parties and events",
      count: 124,
      href: "/categories/DJs",
    },
    {
      icon: Users,
      title: "Bands",
      description: "Complete musical groups for your events",
      count: 67,
      href: "/categories/Bands",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6">
            Artist Categories
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse through our diverse collection of talented artists across different specializations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {categories.map((category) => (
            <CategoryCard key={category.title} {...category} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
