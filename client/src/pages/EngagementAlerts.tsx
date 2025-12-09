import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Bell, AlertTriangle, Settings, Check } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EngagementAlerts() {
  const [openRateThreshold, setOpenRateThreshold] = useState(30);
  const [clickRateThreshold, setClickRateThreshold] = useState(10);
  const [responseRateThreshold, setResponseRateThreshold] = useState(5);
  const [overallThreshold, setOverallThreshold] = useState(20);
  const [alertFrequency, setAlertFrequency] = useState<"immediate" | "daily" | "weekly">("immediate");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const { data: thresholds, isLoading: loadingThresholds } = trpc.engagementAlert.getThresholds.useQuery();
  const { data: alerts, isLoading: loadingAlerts, refetch: refetchAlerts } = trpc.engagementAlert.getAlerts.useQuery({});
  const { data: analytics } = trpc.engagementAlert.getAnalytics.useQuery({ days: 30 });

  const setThresholdsMutation = trpc.engagementAlert.setThresholds.useMutation({
    onSuccess: () => {
      toast.success("Threshold settings saved");
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const acknowledgeMutation = trpc.engagementAlert.acknowledgeAlert.useMutation({
    onSuccess: () => {
      toast.success("Alert acknowledged");
      refetchAlerts();
    },
    onError: (error) => {
      toast.error(`Failed to acknowledge: ${error.message}`);
    },
  });

  // Initialize form with loaded thresholds
  useState(() => {
    if (thresholds) {
      setOpenRateThreshold(thresholds.openRateThreshold / 100);
      setClickRateThreshold(thresholds.clickRateThreshold / 100);
      setResponseRateThreshold(thresholds.responseRateThreshold / 100);
      setOverallThreshold(thresholds.overallEngagementThreshold / 100);
      setAlertFrequency(thresholds.alertFrequency);
      setEmailNotifications(thresholds.emailNotifications);
      setInAppNotifications(thresholds.inAppNotifications);
    }
  });

  const handleSaveSettings = () => {
    setThresholdsMutation.mutate({
      openRateThreshold: openRateThreshold * 100,
      clickRateThreshold: clickRateThreshold * 100,
      responseRateThreshold: responseRateThreshold * 100,
      overallEngagementThreshold: overallThreshold * 100,
      alertFrequency,
      emailNotifications,
      inAppNotifications,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  if (loadingThresholds || loadingAlerts) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Engagement Prediction Alerts</h1>
        </div>

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.summary.totalAlerts || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Critical</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {analytics?.summary.criticalAlerts || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {analytics?.summary.acknowledgedAlerts || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Predicted Open Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.summary.avgPredictedOpenRate || 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Notifications when predicted engagement falls below thresholds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts && alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 border rounded-lg ${
                          alert.acknowledged ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <h3 className="font-semibold capitalize">
                              {alert.alertType.replace(/_/g, " ")}
                            </h3>
                          </div>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="font-medium">Predicted {alert.predictedMetric}:</span>{" "}
                            {(alert.predictedValue / 100).toFixed(2)}%
                          </p>
                          <p>
                            <span className="font-medium">Threshold:</span>{" "}
                            {(alert.threshold / 100).toFixed(2)}%
                          </p>
                          
                          {alert.recommendations && (
                            <div>
                              <p className="font-medium mb-1">Recommendations:</p>
                              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                {JSON.parse(alert.recommendations).map((rec: string, idx: number) => (
                                  <li key={idx}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <p className="text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {!alert.acknowledged && (
                          <Button
                            size="sm"
                            className="mt-3"
                            onClick={() => acknowledgeMutation.mutate({ alertId: alert.id })}
                            disabled={acknowledgeMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        
                        {alert.acknowledged && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Acknowledged on {new Date(alert.acknowledgedAt!).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No alerts yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Analytics</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Predictions Generated</h4>
                      <p className="text-3xl font-bold">{analytics?.predictions.length || 0}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Alerts Triggered</h4>
                      <p className="text-3xl font-bold">{analytics?.alerts.length || 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>Alert Threshold Configuration</CardTitle>
                </div>
                <CardDescription>
                  Set thresholds to receive alerts when predicted engagement is low
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Open Rate Threshold (%)</Label>
                    <Input
                      type="number"
                      value={openRateThreshold}
                      onChange={(e) => setOpenRateThreshold(parseFloat(e.target.value))}
                      min="0"
                      max="100"
                      step="1"
                    />
                    <p className="text-sm text-muted-foreground">
                      Alert when predicted open rate falls below this value
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Click Rate Threshold (%)</Label>
                    <Input
                      type="number"
                      value={clickRateThreshold}
                      onChange={(e) => setClickRateThreshold(parseFloat(e.target.value))}
                      min="0"
                      max="100"
                      step="1"
                    />
                    <p className="text-sm text-muted-foreground">
                      Alert when predicted click rate falls below this value
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Response Rate Threshold (%)</Label>
                    <Input
                      type="number"
                      value={responseRateThreshold}
                      onChange={(e) => setResponseRateThreshold(parseFloat(e.target.value))}
                      min="0"
                      max="100"
                      step="1"
                    />
                    <p className="text-sm text-muted-foreground">
                      Alert when predicted response rate falls below this value
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Overall Engagement Threshold (%)</Label>
                    <Input
                      type="number"
                      value={overallThreshold}
                      onChange={(e) => setOverallThreshold(parseFloat(e.target.value))}
                      min="0"
                      max="100"
                      step="1"
                    />
                    <p className="text-sm text-muted-foreground">
                      Alert when overall predicted engagement falls below this value
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Alert Frequency</Label>
                    <Select
                      value={alertFrequency}
                      onValueChange={(value: any) => setAlertFrequency(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="rounded"
                      />
                      <span>Email Notifications</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inAppNotifications}
                        onChange={(e) => setInAppNotifications(e.target.checked)}
                        className="rounded"
                      />
                      <span>In-App Notifications</span>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleSaveSettings}
                  disabled={setThresholdsMutation.isPending}
                  className="w-full"
                >
                  {setThresholdsMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
