import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Mail, Plus, Play, Pause, Trash2, BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Campaigns() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  
  const { data: campaigns, isLoading } = trpc.campaigns.getAll.useQuery(
    { employerId: user?.id || 0 },
    { enabled: !!user }
  );

  const pauseMutation = trpc.campaigns.pause.useMutation({
    onSuccess: () => {
      utils.campaigns.getAll.invalidate();
      toast.success("Campaign paused successfully");
    },
    onError: (error) => {
      toast.error(`Failed to pause campaign: ${error.message}`);
    }
  });

  const resumeMutation = trpc.campaigns.resume.useMutation({
    onSuccess: () => {
      utils.campaigns.getAll.invalidate();
      toast.success("Campaign resumed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to resume campaign: ${error.message}`);
    }
  });

  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => {
      utils.campaigns.getAll.invalidate();
      toast.success("Campaign deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete campaign: ${error.message}`);
    }
  });

  const handlePause = (campaignId: number) => {
    pauseMutation.mutate({ campaignId });
  };

  const handleResume = (campaignId: number) => {
    resumeMutation.mutate({ campaignId });
  };

  const handleDelete = (campaignId: number) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      deleteMutation.mutate({ campaignId });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      active: "default",
      paused: "outline",
      completed: "secondary"
    };
    
    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Campaigns</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage your recruitment email campaigns
            </p>
          </div>
          <Link href="/campaigns/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>

        {campaigns && campaigns.length > 0 ? (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <CardTitle>{campaign.name}</CardTitle>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <CardDescription>{campaign.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/campaigns/${campaign.id}/analytics`}>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analytics
                        </Button>
                      </Link>
                      
                      {campaign.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePause(campaign.id)}
                          disabled={pauseMutation.isLoading}
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </Button>
                      ) : campaign.status === 'paused' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResume(campaign.id)}
                          disabled={resumeMutation.isLoading}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Resume
                        </Button>
                      ) : null}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(campaign.id)}
                        disabled={deleteMutation.isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Updated</p>
                      <p className="font-medium">
                        {new Date(campaign.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{campaign.status}</p>
                    </div>
                    <div className="text-right">
                      <Link href={`/campaigns/${campaign.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit Campaign →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first email campaign to start engaging with candidates.
                Use our visual editor to build professional recruitment emails.
              </p>
              <Link href="/campaigns/new">
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Campaign
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
