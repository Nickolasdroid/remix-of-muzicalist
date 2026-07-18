import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import CampaignStatusBadge from "@/components/admin/CampaignStatusBadge";
import RecipientsSummary from "@/components/admin/RecipientsSummary";
import {
  campaignStore,
  formatDuration,
  useCampaigns,
} from "@/lib/campaignStore";

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

const Meta = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground break-all">{value}</span>
  </div>
);

const AdminCampaignDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  // Subscribe so status updates reflect live once implemented.
  useCampaigns();
  const campaign = useMemo(
    () => (id ? campaignStore.getById(id) : undefined),
    [id],
  );

  if (!campaign) {
    return (
      <>
        <Navigation mobileTitle="Campaign" />
        <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen bg-background">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <Card className="rounded-lg border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Campaign not found. It may have been removed.
              </p>
              <Button
                variant="outline"
                className="rounded-lg mt-4"
                onClick={() => navigate("/admin/communications/campaigns")}
              >
                Back to Campaigns
              </Button>
            </Card>
          </div>
        </main>
      </>
    );
  }

  const parsedForSummary = {
    total: campaign.totalRecipients,
    valid: campaign.validRecipients,
    invalid: campaign.invalidRecipients,
  };

  return (
    <>
      <Navigation mobileTitle="Campaign" />
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <button
            onClick={() => navigate("/admin/communications/campaigns")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                {campaign.name}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {campaign.templateLabel}
              </p>
            </div>
            <CampaignStatusBadge status={campaign.status} />
          </div>

          <Card className="rounded-lg border-border p-5 sm:p-6 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Meta label="Uploaded File" value={campaign.fileName} />
            <Meta
              label="Created At"
              value={formatDate(campaign.createdAt)}
            />
            <Meta
              label="Estimated Duration"
              value={
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDuration(campaign.estimatedDurationMs ?? 0)}
                </span>
              }
            />
            <Meta
              label="Recipients"
              value={
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {campaign.validCount} / {campaign.totalRecipients}
                </span>
              }
            />
          </Card>

          <RecipientsSummary data={parsedForSummary} />

          <Card className="rounded-lg border-border p-5 sm:p-6 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Meta
              label="Sent"
              value={
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {campaign.sentCount ?? 0}
                </span>
              }
            />
            <Meta
              label="Failed"
              value={
                <span className="inline-flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {campaign.failedCount ?? 0}
                </span>
              }
            />
            <Meta
              label="Started At"
              value={formatDate(campaign.startedAt)}
            />
            <Meta
              label="Completed At"
              value={formatDate(campaign.completedAt)}
            />
          </Card>
        </div>
      </main>
    </>
  );
};

export default AdminCampaignDetail;
