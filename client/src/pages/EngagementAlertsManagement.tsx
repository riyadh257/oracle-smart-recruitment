import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, AlertTriangle, CheckCircle, XCircle, Settings } from "lucide-react";

export default function EngagementAlertsManagement() {
  const [isCreateConfigOpen, setIsCreateConfigOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const employerId = 1; // TODO: Get from auth context
  const userId = 1; // TODO: Get from auth context

  const { data: configs, refetch: refetchConfigs } = trpc.engagementAlertsSystem.getConfigs.useQuery({ employerId });
  const { data: alerts, refetch: refetchAlerts } = trpc.engagementAlertsSystem.getAlerts.useQuery({ employerId });
  const { data: stats } = trpc.engagementAlertsSystem.getAlertStats.useQuery({ employerId });

  const createConfigMutation = trpc.engagementAlertsSystem.createConfig.useMutation({
    onSuccess: () => {
      toast.success("Alert configuration created");
      setIsCreateConfigOpen(false);
      refetchConfigs();
    },
  });

  const acknowledgeMutation = trpc.engagementAlertsSystem.acknowledgeAlert.useMutation({
    onSuccess: () => {
      toast.success("Alert acknowledged");
      setSelectedAlert(null);
      refetchAlerts();
    },
  });

  const resolveMutation = trpc.engagementAlertsSystem.resolveAlert.useMutation({
    onSuccess: () => {
      toast.success("Alert resolved");
      setSelectedAlert(null);
      refetchAlerts();
    },
  });

  const handleCreateConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createConfigMutation.mutate({
      employerId,
      name: formData.get("name") as string,
      isActive: formData.get("isActive") === "on",
      minEngagementScore: parseInt(formData.get("minEngagementScore") as string),
      scoreDropThreshold: parseInt(formData.get("scoreDropThreshold") as string),
      timeWindowDays: parseInt(formData.get("timeWindowDays") as string),
      notifyEmail: formData.get("notifyEmail") === "on",
      notifyInApp: formData.get("notifyInApp") === "on",
      recipientEmails: formData.get("recipientEmails") as string,
    });
  };

  const getAlertLevelBadge = (level: string) => {
    return level === "critical" ? (
      <Badge variant="destructive">Critical</Badge>
    ) : (
      <Badge variant="default">Warning</Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      new: { variant: "default", label: "New", icon: AlertTriangle },
      acknowledged: { variant: "secondary", label: "Acknowledged", icon: CheckCircle },
      resolved: { variant: "outline", label: "Resolved", icon: XCircle },
    };
    const config = variants[status] || variants.new;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Engagement Alerts</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and respond to declining candidate engagement scores
          </p>
        </div>
        <Button onClick={() => setIsCreateConfigOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Alert Rule
        </Button>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlerts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">New Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.newAlerts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.criticalAlerts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolvedAlerts}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Alerts */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Candidates with declining engagement requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts?.filter((a) => a.alert.status === "new").map((item) => (
              <div key={item.alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getAlertLevelBadge(item.alert.alertLevel)}
                    {getStatusBadge(item.alert.status)}
                  </div>
                  <p className="font-medium">{item.candidate?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{item.candidate?.email}</p>
                  <p className="text-sm mt-2">
                    Score dropped from <span className="font-medium">{item.alert.previousScore}</span> to{" "}
                    <span className="font-medium text-red-600">{item.alert.currentScore}</span>
                    {" "}(-{item.alert.scoreDrop} points)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.alert.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAlert(item.alert)}
                  >
                    Acknowledge
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => resolveMutation.mutate({ alertId: item.alert.id })}
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert Configurations */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Rules</CardTitle>
          <CardDescription>Configure thresholds and notification settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {configs?.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{config.name}</p>
                    {config.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Min Score</p>
                      <p className="font-medium">{config.minEngagementScore}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Drop Threshold</p>
                      <p className="font-medium">{config.scoreDropThreshold} points</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time Window</p>
                      <p className="font-medium">{config.timeWindowDays} days</p>
                    </div>
                  </div>
                </div>
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Config Dialog */}
      <Dialog open={isCreateConfigOpen} onOpenChange={setIsCreateConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Alert Rule</DialogTitle>
            <DialogDescription>
              Set thresholds for engagement decline notifications
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateConfig}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Rule Name</Label>
                <Input id="name" name="name" required placeholder="e.g., High-Value Candidate Alert" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="minEngagementScore">Minimum Score</Label>
                  <Input
                    id="minEngagementScore"
                    name="minEngagementScore"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="60"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="scoreDropThreshold">Drop Threshold</Label>
                  <Input
                    id="scoreDropThreshold"
                    name="scoreDropThreshold"
                    type="number"
                    min="1"
                    defaultValue="20"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="timeWindowDays">Time Window (days)</Label>
                  <Input
                    id="timeWindowDays"
                    name="timeWindowDays"
                    type="number"
                    min="1"
                    defaultValue="7"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="recipientEmails">Notification Emails</Label>
                <Input
                  id="recipientEmails"
                  name="recipientEmails"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="notifyEmail" name="notifyEmail" defaultChecked />
                  <Label htmlFor="notifyEmail">Email Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="notifyInApp" name="notifyInApp" defaultChecked />
                  <Label htmlFor="notifyInApp">In-App Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="isActive" name="isActive" defaultChecked />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateConfigOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createConfigMutation.isPending}>
                {createConfigMutation.isPending ? "Creating..." : "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Acknowledge Alert Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Alert</DialogTitle>
            <DialogDescription>Add notes about how you're addressing this alert</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              acknowledgeMutation.mutate({
                alertId: selectedAlert.id,
                userId,
                notes: formData.get("notes") as string,
              });
            }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={4} placeholder="Add your notes here..." />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setSelectedAlert(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={acknowledgeMutation.isPending}>
                {acknowledgeMutation.isPending ? "Acknowledging..." : "Acknowledge"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
