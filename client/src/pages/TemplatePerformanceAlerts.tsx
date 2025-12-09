import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, CheckCircle2, XCircle, Bell, BellOff, Settings } from "lucide-react";
import { toast } from "sonner";

export default function TemplatePerformanceAlerts() {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    alertType: "open_rate_drop" as const,
    thresholdPercentage: 20,
    comparisonPeriodDays: 30,
    isEnabled: true,
    notifyOwner: true,
  });

  const utils = trpc.useUtils();
  
  const { data: templates, isLoading: templatesLoading } = trpc.emailTemplates.getTemplates.useQuery({});
  const { data: alertHistory, isLoading: historyLoading } = trpc.advancedAnalytics.getTemplateAlertHistory.useQuery({
    acknowledged: false,
  });
  const { data: allAlerts, isLoading: allAlertsLoading } = trpc.advancedAnalytics.getTemplateAlertHistory.useQuery({});

  const upsertConfig = trpc.advancedAnalytics.upsertTemplateAlertConfig.useMutation({
    onSuccess: () => {
      toast.success("Alert configuration saved successfully");
      setConfigDialogOpen(false);
      utils.advancedAnalytics.getTemplateAlertConfig.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to save configuration: ${error.message}`);
    },
  });

  const acknowledgeAlert = trpc.advancedAnalytics.acknowledgeTemplateAlert.useMutation({
    onSuccess: () => {
      toast.success("Alert acknowledged");
      utils.advancedAnalytics.getTemplateAlertHistory.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to acknowledge alert: ${error.message}`);
    },
  });

  const checkPerformance = trpc.advancedAnalytics.checkTemplatePerformance.useMutation({
    onSuccess: (data) => {
      if (data.alertsTriggered > 0) {
        toast.warning(`${data.alertsTriggered} new alert(s) triggered`);
      } else {
        toast.success("No performance issues detected");
      }
      utils.advancedAnalytics.getTemplateAlertHistory.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to check performance: ${error.message}`);
    },
  });

  const handleSaveConfig = () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    upsertConfig.mutate({
      templateId: selectedTemplate,
      ...alertConfig,
    });
  };

  const handleAcknowledge = (alertId: number, actionTaken?: string) => {
    acknowledgeAlert.mutate({ alertId, actionTaken });
  };

  const handleCheckPerformance = (templateId: number) => {
    checkPerformance.mutate({ templateId });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getAlertTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const isLoading = templatesLoading || historyLoading || allAlertsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeAlerts = alertHistory?.filter((a: any) => !a.acknowledged) || [];
  const acknowledgedAlerts = allAlerts?.filter((a: any) => a.acknowledged) || [];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Performance Alerts</h1>
          <p className="text-muted-foreground mt-2">
            Monitor email template performance and get notified when metrics drop
          </p>
        </div>
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configure Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Configure Performance Alert</DialogTitle>
              <DialogDescription>
                Set up automated alerts for template performance drops
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select 
                  value={selectedTemplate?.toString() || ""} 
                  onValueChange={(value) => setSelectedTemplate(parseInt(value))}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template: any) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alertType">Alert Type</Label>
                <Select 
                  value={alertConfig.alertType} 
                  onValueChange={(value: any) => setAlertConfig({ ...alertConfig, alertType: value })}
                >
                  <SelectTrigger id="alertType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open_rate_drop">Open Rate Drop</SelectItem>
                    <SelectItem value="click_rate_drop">Click Rate Drop</SelectItem>
                    <SelectItem value="conversion_drop">Conversion Drop</SelectItem>
                    <SelectItem value="bounce_spike">Bounce Rate Spike</SelectItem>
                    <SelectItem value="unsubscribe_spike">Unsubscribe Spike</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold Percentage</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={alertConfig.thresholdPercentage}
                  onChange={(e) => setAlertConfig({ ...alertConfig, thresholdPercentage: parseInt(e.target.value) })}
                  min={1}
                  max={100}
                />
                <p className="text-xs text-muted-foreground">
                  Alert when metric drops by this percentage
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Comparison Period (days)</Label>
                <Input
                  id="period"
                  type="number"
                  value={alertConfig.comparisonPeriodDays}
                  onChange={(e) => setAlertConfig({ ...alertConfig, comparisonPeriodDays: parseInt(e.target.value) })}
                  min={7}
                  max={90}
                />
                <p className="text-xs text-muted-foreground">
                  Compare against last N days
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={alertConfig.isEnabled}
                  onCheckedChange={(checked) => setAlertConfig({ ...alertConfig, isEnabled: checked })}
                />
                <Label htmlFor="enabled">Enable alert</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyOwner"
                  checked={alertConfig.notifyOwner}
                  onCheckedChange={(checked) => setAlertConfig({ ...alertConfig, notifyOwner: checked })}
                />
                <Label htmlFor="notifyOwner">Notify project owner</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConfig} disabled={upsertConfig.isPending}>
                {upsertConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acknowledgedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Resolved alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitored Templates</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Email templates
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Alerts ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
          <TabsTrigger value="templates">Template Status</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                <p className="text-muted-foreground text-center">
                  No active performance alerts at the moment
                </p>
              </CardContent>
            </Card>
          ) : (
            activeAlerts.map((alert: any) => (
              <Card key={alert.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        {getAlertTypeLabel(alert.alertType)}
                      </CardTitle>
                      <CardDescription>
                        {new Date(alert.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm">{alert.message}</p>
                    {alert.recommendation && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          <strong>Recommendation:</strong> {alert.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcknowledge(alert.id, "Reviewed and will monitor")}
                      disabled={acknowledgeAlert.isPending}
                    >
                      {acknowledgeAlert.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Acknowledge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {acknowledgedAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No alert history yet</p>
              </CardContent>
            </Card>
          ) : (
            acknowledgedAlerts.map((alert: any) => (
              <Card key={alert.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {getAlertTypeLabel(alert.alertType)}
                      </CardTitle>
                      <CardDescription>
                        Acknowledged {new Date(alert.acknowledgedAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{alert.severity}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  {alert.actionTaken && (
                    <p className="text-sm mt-2">
                      <strong>Action:</strong> {alert.actionTaken}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates?.map((template: any) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription>{template.type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCheckPerformance(template.id)}
                    disabled={checkPerformance.isPending}
                  >
                    {checkPerformance.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Check Performance
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
