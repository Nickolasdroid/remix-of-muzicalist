import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, LayoutTemplate, Users, History, ArrowRight } from "lucide-react";

type ItemStatus = { kind: "active" } | { kind: "soon" };

interface CommItem {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: ItemStatus;
  href?: string;
}

const items: CommItem[] = [
  {
    key: "campaigns",
    title: "Email Campaigns",
    description: "Create and manage email campaigns.",
    icon: Mail,
    status: { kind: "active" },
    href: "/admin/communications/campaigns",
  },
  {
    key: "templates",
    title: "Templates",
    description: "Manage reusable email templates.",
    icon: LayoutTemplate,
    status: { kind: "soon" },
  },
  {
    key: "audiences",
    title: "Audiences",
    description: "Create and manage recipient groups.",
    icon: Users,
    status: { kind: "soon" },
  },
  {
    key: "history",
    title: "History",
    description: "View previous campaign reports.",
    icon: History,
    status: { kind: "soon" },
  },
];

const CommunicationsPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.status.kind === "active";
        return (
          <Card
            key={item.key}
            onClick={() => active && item.href && navigate(item.href)}
            className={`group relative overflow-hidden rounded-lg border-border bg-card p-5 transition-all duration-300 ${
              active
                ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/40"
                : "opacity-80"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                  active
                    ? "bg-primary/10 text-primary group-hover:bg-primary/15"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              {active ? (
                <Badge className="rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-0">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-lg">
                  Coming Soon
                </Badge>
              )}
            </div>
            <h3 className="font-display font-semibold text-foreground text-base mb-1">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.description}
            </p>
            {active && (
              <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Open
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default CommunicationsPanel;
