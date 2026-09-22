import { usePlatformStats, formatPlatformStat } from "@/hooks/usePlatformStats";
import { useTranslation } from "react-i18next";

const PlatformStatsBar = () => {
  const { stats } = usePlatformStats();
  const { t } = useTranslation();

  const items = [
    { label: t("platformStats.singers"), value: formatPlatformStat(stats?.singers) },
    { label: t("platformStats.instrumentalists"), value: formatPlatformStat(stats?.instrumentalists) },
    { label: t("platformStats.djs"), value: formatPlatformStat(stats?.djs) },
    { label: t("platformStats.bands"), value: formatPlatformStat(stats?.bands) },
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
            <span className="text-[10px] md:text-sm text-muted-foreground text-center whitespace-nowrap">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlatformStatsBar;
