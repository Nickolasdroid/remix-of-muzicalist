import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, BarChart3, Lock, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isFree, isPremium } from "@/lib/planLimits";
import { fetchMyProfileViews, viewsChangePct, type ProfileViewStats } from "@/lib/profileViews";
import { canManagePlans } from "@/lib/native";

/**
 * Profile views over the last 30 days: Standard and Premium.
 * Free sees a locked card with an upgrade nudge; Premium links to full statistics.
 * Renders nothing until the counter is available on the server.
 */
const ProfileViewsCard = ({ plan }: { plan?: string | null }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProfileViewStats | null>(null);

  const free = isFree(plan);
  useEffect(() => {
    if (free) return;
    let active = true;
    fetchMyProfileViews().then((s) => { if (active) setStats(s); });
    return () => { active = false; };
  }, [free]);

  // Free: the counter is a Standard / Premium feature
  if (free) {
    return (
      <div className="rounded-lg bg-foreground/[0.05] p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2.5 md:p-3 rounded-full bg-foreground/[0.08]">
              <Lock className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile views</p>
              <p className="text-xs text-muted-foreground">See how many people visit your profile with Standard or Premium.</p>
            </div>
          </div>
          {canManagePlans() && (
            <Button size="sm" onClick={() => navigate("/my-plan")} className="self-start bg-accent text-accent-foreground hover:bg-accent/90">
              Upgrade
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const change = viewsChangePct(stats);
  const premium = isPremium(plan);

  return (
    <div className="rounded-lg bg-foreground/[0.05] p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 rounded-full bg-foreground/[0.08]">
            <Eye className="h-5 w-5 md:h-6 md:w-6 text-accent" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Profile views</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">{stats.last30}</span>
              <span className="text-sm text-muted-foreground">in the last 30 days</span>
            </div>
            {change !== null ? (
              <p className={`mt-0.5 flex items-center gap-1 text-xs ${change >= 0 ? "text-green-500" : "text-destructive"}`}>
                {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
                <span className="tabular-nums">{change > 0 ? `+${change}` : change}%</span>
                <span className="text-muted-foreground">vs. the previous 30 days</span>
              </p>
            ) : stats.total === 0 ? (
              <p className="mt-0.5 text-xs text-muted-foreground">No views yet. Share your profile link to get discovered.</p>
            ) : null}
          </div>
        </div>

        {premium ? (
          <Button variant="outline" size="sm" onClick={() => navigate("/analytics")} className="gap-1.5 self-start">
            <BarChart3 className="h-4 w-4" />
            Full statistics
          </Button>
        ) : (
          <div className="flex flex-col gap-2 md:items-end">
            <p className="text-xs text-muted-foreground md:text-right">See how views turn into booking requests with Premium.</p>
            {canManagePlans() && (
              <Button size="sm" onClick={() => navigate("/plans")} className="self-start bg-accent text-accent-foreground hover:bg-accent/90">
                Upgrade
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileViewsCard;
