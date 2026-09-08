import { usePlatformStats, formatPlatformStat } from "@/hooks/usePlatformStats";

const PlatformStatsBar = () => {
  const { stats } = usePlatformStats();

  const items = [
    { label: "Countries", value: formatPlatformStat(stats?.countries) },
    { label: "Artists", value: formatPlatformStat(stats?.artists) },
    { label: "Users", value: formatPlatformStat(stats?.users) },
    { label: "Events Booked", value: formatPlatformStat(stats?.eventsBooked) },
  ];

  return (
    <div className="flex items-stretch justify-between bg-background/90 backdrop-blur-sm rounded-none md:rounded-2xl border-y md:border border-border/50 px-2 py-4 md:px-10 md:py-5 shadow-lg">
      {items.map((item, index) => (
        <div key={item.label} className="flex flex-1 items-center">
          {index > 0 && <div className="w-px h-8 bg-border/50" />}
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="flex items-center gap-1 text-lg md:text-2xl font-display font-bold text-accent">
              {item.value}
            </span>
            <span className="text-[10px] md:text-sm text-muted-foreground">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlatformStatsBar;
