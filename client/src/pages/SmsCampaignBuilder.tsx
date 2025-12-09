import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Send, Calendar, Users, Trash2 } from "lucide-react";

export default function SmsCampaignBuilder() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [previewCount, setPreviewCount] = useState(0);

  const employerId = 1; // TODO: Get from auth context
  const userId = 1; // TODO: Get from auth context

  const { data: campaigns, refetch: refetchCampaigns } = trpc.smsCampaignBuilder.getCampaigns.useQuery({ employerId });
  const { data: stats } = trpc.smsCampaignBuilder.getCampaignStats.useQuery({ employerId });

  const createMutation = trpc.smsCampaignBuilder.createCampaign.useMutation({
    onSuccess: () => {
      toast.success("SMS campaign created successfully");
      setIsCreateDialogOpen(false);
      refetchCampaigns();
    },
  });

  const sendMutation = trpc.smsCampaignBuilder.sendCampaign.useMutation({
    onSuccess: (data) => {
      toast.success(`Campaign sent! ${data.deliveredCount} delivered, ${data.failedCount} failed`);
      refetchCampaigns();
    },
  });

  const deleteMutation = trpc.smsCampaignBuilder.deleteCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campaign deleted");
      refetchCampaigns();
    },
  });

  const handlePreview = async (segmentationRules: string) => {
    try {
      const result = await trpc.smsCampaignBuilder.previewRecipients.useQuery({
        employerId,
        segmentationRules,
      });
      setPreviewCount(result.data?.count || 0);
    } catch (error) {
      console.error("Preview failed:", error);
    }
  };

  const handleCreateCampaign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const segmentationRules = JSON.stringify({
      status: selectedStatuses,
    });

    createMutation.mutate({
      employerId,
      name: formData.get("name") as string,
      message: formData.get("message") as string,
      segmentationRules,
      scheduledAt: formData.get("scheduledAt") as string,
      createdBy: userId,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "outline", label: "Draft" },
      scheduled: { variant: "secondary", label: "Scheduled" },
      sending: { variant: "default", label: "Sending" },
      completed: { variant: "default", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    return variants[status] || variants.draft;
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">SMS Campaign Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create and schedule SMS campaigns with advanced candidate segmentation
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalDelivered}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deliveryRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns List */}
      <div className="grid grid-cols-1 gap-4">
        {campaigns?.map((campaign) => {
          const badge = getStatusBadge(campaign.status);
          return (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{campaign.name}</CardTitle>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <CardDescription className="mt-2 line-clamp-2">{campaign.message}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Recipients</p>
                      <p className="font-medium">{campaign.totalRecipients}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sent</p>
                      <p className="font-medium">{campaign.sentCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Delivered</p>
                      <p className="font-medium text-green-600">{campaign.deliveredCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Failed</p>
                      <p className="font-medium text-red-600">{campaign.failedCount}</p>
                    </div>
                  </div>
                  {campaign.scheduledAt && (
                    <p className="text-xs text-muted-foreground">
                      Scheduled for: {new Date(campaign.scheduledAt).toLocaleString()}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    {campaign.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => sendMutation.mutate({ campaignId: campaign.id })}
                        disabled={sendMutation.isPending}
                      >
                        <Send className="mr-1 h-3 w-3" />
                        Send Now
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Delete this campaign?")) {
                          deleteMutation.mutate({ campaignId: campaign.id });
                        }
                      }}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create SMS Campaign</DialogTitle>
            <DialogDescription>
              Send bulk SMS messages to segmented candidate groups
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCampaign}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input id="name" name="name" required placeholder="e.g., Job Fair Invitation" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  placeholder="Your SMS message (max 160 characters recommended)"
                  maxLength={320}
                />
              </div>
              <div>
                <Label>Candidate Segmentation</Label>
                <div className="space-y-2 mt-2">
                  {["applied", "screening", "interviewing", "offered", "hired"].map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={status}
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStatuses([...selectedStatuses, status]);
                          } else {
                            setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
                          }
                        }}
                      />
                      <Label htmlFor={status} className="capitalize">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
                <Input id="scheduledAt" name="scheduledAt" type="datetime-local" />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
