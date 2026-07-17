import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MailPlus, ArrowLeft, Inbox, Eye } from "lucide-react";
import CampaignStatusBadge from "@/components/admin/CampaignStatusBadge";
import { useCampaigns } from "@/lib/campaignStore";

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

const AdminEmailCampaigns = () => {
  const navigate = useNavigate();
  const campaigns = useCampaigns();
  const hasCampaigns = campaigns.length > 0;

  return (
    <>
      <Navigation mobileTitle="Email Campaigns" />
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                Email Campaigns
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Create and manage email campaigns for your audience.
              </p>
            </div>
            <Button
              onClick={() => navigate("/admin/communications/campaigns/new")}
              className="rounded-lg h-11"
            >
              <MailPlus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>

          {hasCampaigns ? (
            <Card className="rounded-lg border-border overflow-hidden animate-in fade-in duration-300">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead className="text-right">Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-foreground">
                          {c.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.templateLabel}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          <span className="text-foreground font-medium">
                            {c.validCount}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {c.totalRecipients}
                          </span>
                        </TableCell>
                        <TableCell>
                          <CampaignStatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(c.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg"
                            onClick={() =>
                              navigate(`/admin/communications/campaigns/${c.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="border border-dashed border-border rounded-lg bg-card/50 p-10 sm:p-16 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
                <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Inbox className="h-9 w-9" />
                </div>
              </div>
              <h2 className="text-lg font-display font-semibold text-foreground mb-2">
                No email campaigns have been created yet.
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Launch your first campaign to reach artists and users directly in their inbox.
              </p>
              <Button
                onClick={() => navigate("/admin/communications/campaigns/new")}
                className="rounded-lg h-11"
              >
                <MailPlus className="h-4 w-4 mr-2" />
                Create First Campaign
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminEmailCampaigns;
