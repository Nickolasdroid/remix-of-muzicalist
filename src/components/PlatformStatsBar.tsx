import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";


interface PlatformStats {
  artists: number;
  countries: number;
  averageRating: number | null;
  eventsBooked: number;
}

const formatCount = (value: number) => `${value}+`;

const PlatformStatsBar = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  const loadStats = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_platform_stats");
    if (error) {
      console.error("Error loading platform stats:", error);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return;
    setStats({
      artists: Number(row.artists ?? 0),
      countries: Number(row.countries ?? 0),
      averageRating: row.average_rating === null ? null : Number(row.average_rating),
      eventsBooked: Number(row.events_booked ?? 0),
    });
  }, []);

  useEffect(() => {
    loadStats();
    const interval = window.setInterval(loadStats, 60000);
    const onFocus = () => loadStats();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadStats]);


  const items = [
    { label: "Countries", value: stats ? formatCount(stats.countries) : "—" },
    { label: "Artists", value: stats ? formatCount(stats.artists) : "—" },
    {
      label: "Average Rating",
      value: stats?.averageRating != null ? stats.averageRating.toFixed(1) : "—",
      icon: true,
    },
    { label: "Events Booked", value: stats ? formatCount(stats.eventsBooked) : "—" },
  ];

  return (
    <div className="flex items-stretch justify-between bg-background/90 backdrop-blur-sm rounded-none md:rounded-2xl border-y md:border border-border/50 px-2 py-4 md:px-10 md:py-5 shadow-lg">
      {items.map((item, index) => (
        <div key={item.label} className="flex flex-1 items-center">
          {index > 0 && <div className="w-px h-8 bg-border/50" />}
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="flex items-center gap-1 text-lg md:text-2xl font-display font-bold text-accent">
              {item.value}
              {item.icon && <Star className="h-4 w-4 md:h-5 md:w-5 fill-accent text-accent" />}
            </span>
            <span className="text-[10px] md:text-sm text-muted-foreground">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlatformStatsBar;
