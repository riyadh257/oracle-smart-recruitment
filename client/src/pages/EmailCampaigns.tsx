import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailCampaignBuilder } from "@/components/EmailCampaignBuilder";
import { Plus, Mail, Play, Pause, BarChart3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function EmailCampaigns() {
  const { user } = useAuth();
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<number | undefined>();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsCampaignId, setAnalyticsCampaignId] = useState<number | undefined>();

  // Get employer ID from user
  const employerId = user?.id || 0;

  const { data: campaigns = [], refetch } = trpc.campaigns.getAll.useQuery(
    { employerId },
    { enabled: !!employerId }
  );

  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => {
      toast.success("Campaign deleted successfully");
      refetch();
    },
  });

  const pauseMutation = trpc.campaigns.pause.useMutation({
    onSuccess: () => {
      toast.success("Campaign paused");
      refetch();
    },
  });

  const resumeMutation = trpc.campaigns.resume.useMutation({
    onSuccess: () => {
      toast.success("Campaign resumed");
      refetch();
    },
  });

  const handleCreateNew = () => {
    setSelectedCampaign(undefined);
    setShowBuilder(true);
  };

  const handleEdit = (campaignId: number) => {
    setSelectedCampaign(campaignId);
    setShowBuilder(true);
  };

  const handleDelete = (campaignId: number) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      deleteMutation.mutate({ campaignId });
    }
  };

  const handleToggleStatus = (campaignId: number, currentStatus: string) => {
    if (currentStatus === "active") {
      pauseMutation.mutate({ campaignId });
    } else {
      resumeMutation.mutate({ campaignId });
    }
  };

  const handleViewAnalytics = (campaignId: number) => {
    setAnalyticsCampaignId(campaignId);
    setShowAnalytics(true);
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-500",
    active: "bg-green-500",
    paused: "bg-yellow-500",
    completed: "bg-blue-500",
  };

  if (showBuilder) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setShowBuilder(false)}>
            ← Back to Campaigns
          </Button>
        </div>
        <EmailCampaignBuilder
          employerId={employerId}
          campaignId={selectedCampaign}
          onSaved={() => {
            setShowBuilder(false);
            refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage automated email workflows
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first email campaign to automate candidate communication
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign: any) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {campaign.description || "No description"}
                    </CardDescription>
                  </div>
                  <Badge className={statusColors[campaign.status]}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(campaign.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(campaign.id)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAnalytics(campaign.id)}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>

                    {campaign.status === "active" || campaign.status === "paused" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                      >
                        {campaign.status === "active" ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </>
                        )}
                      </Button>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(campaign.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analytics Dialog */}
      <CampaignAnalyticsDialog
        open={showAnalytics}
        campaignId={analyticsCampaignId}
        onClose={() => {
          setShowAnalytics(false);
          setAnalyticsCampaignId(undefined);
        }}
      />
    </div>
  );
}

// Campaign Analytics Dialog
interface CampaignAnalyticsDialogProps {
  open: boolean;
  campaignId?: number;
  onClose: () => void;
}

function CampaignAnalyticsDialog({
  open,
  campaignId,
  onClose,
}: CampaignAnalyticsDialogProps) {
  const { data: analytics } = trpc.campaigns.getAnalytics.useQuery(
    { campaignId: campaignId! },
    { enabled: !!campaignId && open }
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Campaign Analytics</DialogTitle>
          <DialogDescription>Performance metrics for this campaign</DialogDescription>
        </DialogHeader>

        {analytics && (
          <div className="space-y-6">
            {/* Email Metrics */}
            <div>
              <h3 className="font-semibold mb-3">Email Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total Sent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalSent}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Open Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.openRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Click Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.clickRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total Clicked</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalClicked}</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Execution Metrics */}
            <div>
              <h3 className="font-semibold mb-3">Workflow Executions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.executions.total}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.executions.completed}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Running</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.executions.running}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Failed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {analytics.executions.failed}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
