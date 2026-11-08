import { Link } from "react-router-dom";
import { Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

// An example only: the request and the matches are illustrative
const mockResults = [
  { name: "DJ Alex Beat", detail: "DJ, Cluj-Napoca", rating: "5.0", initials: "AB" },
  { name: "DJ SoundWave", detail: "DJ, Cluj-Napoca", rating: "4.9", initials: "SW" },
  { name: "DJ ElectroNight", detail: "DJ, Cluj-Napoca", rating: "4.8", initials: "EN" },
];

const AISearchShowcase = () => (
  <section className="px-4 py-16 md:px-8 md:py-24">
    <div className="container mx-auto grid max-w-6xl items-center gap-10 px-0 lg:grid-cols-2 lg:gap-16">
      <div>
        <h2 className="font-headline text-3xl font-bold tracking-[-0.025em] text-foreground md:text-[2.75rem] md:leading-[1.08]">
          Describe the event, get a shortlist
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
          Write what you need in your own words. AI search suggests artists that fit.
        </p>
        <Button asChild variant="outline" size="lg" className="mt-8 h-12 gap-2 rounded-full border-border bg-transparent px-6 text-[15px] font-semibold hover:bg-secondary">
          <Link to="/search">
            <Sparkles className="h-4 w-4" />
            Try AI search
          </Link>
        </Button>
      </div>

      <div className="rounded-3xl bg-card p-5 md:p-7" aria-hidden="true">
        <p className="rounded-2xl bg-secondary px-4 py-3.5 text-[15px] leading-relaxed text-foreground/90">
          I need a DJ in Cluj, Romania for a wedding on June 14, budget € 1200.
        </p>
        <ul className="mt-5 divide-y divide-border/70">
          {mockResults.map((a) => (
            <li key={a.name} className="flex items-center gap-3 py-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                {a.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-foreground notranslate" translate="no">{a.name}</span>
                <span className="block truncate text-[13px] text-muted-foreground">{a.detail}</span>
              </span>
              <span className="flex items-center gap-1 text-[13px] font-medium tabular-nums text-foreground">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                {a.rating}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

export default AISearchShowcase;
