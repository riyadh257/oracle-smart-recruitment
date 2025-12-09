import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Rocket, Mail, Users, Calendar, TrendingUp, Play, Pause, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function CampaignManager() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [launchDialogOpen, setLaunchDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [campaignName, setCampaignName] = useState("");

  const { data: templates, isLoading: templatesLoading } = trpc.campaigns.getTemplates.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  const { data: myCampaigns, isLoading: campaignsLoading, refetch: refetchCampaigns } = trpc.campaigns.getMyCampaigns.useQuery({});
  const { data: stats, isLoading: statsLoading } = trpc.campaigns.getStats.useQuery();

  const launchMutation = trpc.campaigns.launch.useMutation({
    onSuccess: () => {
      toast.success("Campaign launched successfully!");
      setLaunchDialogOpen(false);
      setCampaignName("");
      setSelectedTemplate(null);
      refetchCampaigns();
    },
    onError: (error) => {
      toast.error(`Failed to launch campaign: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.campaigns.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Campaign status updated");
      refetchCampaigns();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const handleLaunchClick = (template: any) => {
    setSelectedTemplate(template);
    setCampaignName(`${template.name} - ${new Date().toLocaleDateString()}`);
    setLaunchDialogOpen(true);
  };

  const handleLaunch = () => {
    if (!selectedTemplate || !campaignName) {
      toast.error("Please enter a campaign name");
      return;
    }
    launchMutation.mutate({
      templateId: selectedTemplate.id,
      campaignName,
    });
  };

  const handleStatusChange = (campaignId: number, status: "active" | "paused" | "completed" | "cancelled") => {
    updateStatusMutation.mutate({ campaignId, status });
  };

  const getCategoryBadge = (category: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      welcome: { variant: "default", label: "Welcome" },
      nurture: { variant: "secondary", label: "Nurture" },
      reengagement: { variant: "outline", label: "Re-engagement" },
      interview: { variant: "default", label: "Interview" },
      onboarding: { variant: "secondary", label: "Onboarding" },
      custom: { variant: "outline", label: "Custom" },
    };
    return config[category] || config.custom;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; icon: any }> = {
      active: { variant: "default", icon: Play },
      paused: { variant: "secondary", icon: Pause },
      completed: { variant: "outline", icon: CheckCircle2 },
      cancelled: { variant: "destructive", icon: XCircle },
    };
    return config[status] || config.active;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Campaign Manager</h2>
        <p className="text-sm text-muted-foreground">
          Launch pre-built email campaigns with one click
        </p>
      </div>

      {/* Stats Overview */}
      {statsLoading ? null : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeCampaigns} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmailsSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.avgOpenRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Campaign average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.avgClickRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Campaign average
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="my-campaigns">My Campaigns</TabsTrigger>
        </TabsList>

        {/* Campaign Templates */}
        <TabsContent value="templates" className="space-y-6">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {["all", "welcome", "nurture", "reengagement", "interview", "onboarding"].map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          {templatesLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template: any) => {
                const categoryBadge = getCategoryBadge(template.category);
                return (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="mt-2">{template.description}</CardDescription>
                        </div>
                        <Badge variant={categoryBadge.variant}>{categoryBadge.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Steps</p>
                          <p className="font-semibold">{template.totalSteps} emails</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-semibold">{template.estimatedDuration} days</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Sequence:</p>
                        <div className="space-y-1">
                          {template.sequence.slice(0, 3).map((step: any, idx: number) => (
                            <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className="font-medium">Day {step.delayDays}:</span>
                              <span className="truncate">{step.subject}</span>
                            </div>
                          ))}
                          {template.sequence.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{template.sequence.length - 3} more emails
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">
                          <Users className="h-3 w-3 inline mr-1" />
                          Used {template.usageCount} times
                        </p>
                        <Button onClick={() => handleLaunchClick(template)} size="sm">
                          <Rocket className="h-4 w-4 mr-2" />
                          Launch
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-12">
              <Rocket className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No campaign templates available</p>
            </div>
          )}
        </TabsContent>

        {/* My Campaigns */}
        <TabsContent value="my-campaigns" className="space-y-6">
          {campaignsLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : myCampaigns && myCampaigns.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Active & Past Campaigns</CardTitle>
                <CardDescription>Manage your launched email campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Launched</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myCampaigns.map((campaign: any) => {
                      const statusBadge = getStatusBadge(campaign.status);
                      const StatusIcon = statusBadge.icon;
                      const progress = (campaign.currentStep / campaign.totalSteps) * 100;

                      return (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{campaign.templateName}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {campaign.category}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">
                                {campaign.currentStep} / {campaign.totalSteps} steps
                              </p>
                              <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>
                                <span className="text-blue-600 font-semibold">{campaign.avgOpenRate.toFixed(1)}%</span>{" "}
                                open
                              </p>
                              <p>
                                <span className="text-green-600 font-semibold">{campaign.avgClickRate.toFixed(1)}%</span>{" "}
                                click
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{new Date(campaign.launchedAt).toLocaleDateString()}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {campaign.status === "active" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(campaign.id, "paused")}
                                >
                                  <Pause className="h-3 w-3" />
                                </Button>
                              )}
                              {campaign.status === "paused" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(campaign.id, "active")}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              )}
                              {(campaign.status === "active" || campaign.status === "paused") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(campaign.id, "cancelled")}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center p-12">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No campaigns launched yet</p>
              <Button className="mt-4" onClick={() => setSelectedCategory("all")}>
                Browse Templates
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Launch Dialog */}
      <Dialog open={launchDialogOpen} onOpenChange={setLaunchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Launch Campaign</DialogTitle>
            <DialogDescription>
              Configure and launch {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Campaign Details:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Steps:</span>
                    <span className="ml-2 font-semibold">{selectedTemplate.totalSteps} emails</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-semibold">{selectedTemplate.estimatedDuration} days</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLaunchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLaunch} disabled={launchMutation.isPending}>
              {launchMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Rocket className="h-4 w-4 mr-2" />
              Launch Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
