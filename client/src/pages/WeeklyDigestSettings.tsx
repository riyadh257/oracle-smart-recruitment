import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, Send, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const PRIORITY_LEVELS = [
  { value: "low", label: "Low - All notifications" },
  { value: "medium", label: "Medium - Important notifications" },
  { value: "high", label: "High - Urgent notifications only" },
  { value: "critical", label: "Critical - Critical alerts only" },
];

export default function WeeklyDigestSettings() {
  const { user, loading: authLoading } = useAuth();
  const { data: settings, isLoading, refetch } = trpc.weeklyDigest.getSettings.useQuery();
  const updateSettings = trpc.weeklyDigest.updateSettings.useMutation();
  const sendTestDigest = trpc.weeklyDigest.sendTestDigest.useMutation();

  const [formData, setFormData] = useState({
    enabled: true,
    deliveryDay: 1,
    deliveryTime: "09:00",
    timezone: "UTC",
    includePredictionAccuracy: true,
    includeABTestResults: true,
    includeEngagementTrends: true,
    includeTopCandidates: true,
    includeCriticalAlerts: true,
    includePushNotificationStats: true,
    minimumPriorityLevel: "medium" as "low" | "medium" | "high" | "critical",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        enabled: settings.enabled,
        deliveryDay: settings.deliveryDay,
        deliveryTime: settings.deliveryTime,
        timezone: settings.timezone,
        includePredictionAccuracy: settings.includePredictionAccuracy,
        includeABTestResults: settings.includeABTestResults,
        includeEngagementTrends: settings.includeEngagementTrends,
        includeTopCandidates: settings.includeTopCandidates,
        includeCriticalAlerts: settings.includeCriticalAlerts ?? true,
        includePushNotificationStats: settings.includePushNotificationStats ?? true,
        minimumPriorityLevel: (settings.minimumPriorityLevel as any) ?? "medium",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast.success("Weekly digest settings saved successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  const handleSendTest = async () => {
    try {
      const result = await sendTestDigest.mutateAsync();
      if (result.success) {
        toast.success("Test digest sent successfully! Check your email.");
      } else {
        toast.error("Failed to send test digest");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send test digest");
    }
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Weekly Digest Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your weekly recruitment digest delivery preferences and content sections
          </p>
        </div>

        <div className="space-y-6">
          {/* Delivery Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Preferences</CardTitle>
              <CardDescription>Configure when and how you receive your weekly digest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">Enable Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive automated weekly summaries of recruitment activities
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryDay">Delivery Day</Label>
                  <Select
                    value={formData.deliveryDay.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, deliveryDay: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="deliveryDay">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryTime">Delivery Time</Label>
                  <Input
                    id="deliveryTime"
                    type="time"
                    value={formData.deliveryTime}
                    onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  placeholder="e.g., America/New_York, Europe/London, UTC"
                />
                <p className="text-sm text-muted-foreground">
                  Enter your timezone (e.g., America/New_York, Europe/London, UTC)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Content Sections</CardTitle>
              <CardDescription>Choose what information to include in your weekly digest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includePredictionAccuracy">Prediction Accuracy Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    AI prediction accuracy metrics and trends
                  </p>
                </div>
                <Switch
                  id="includePredictionAccuracy"
                  checked={formData.includePredictionAccuracy}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, includePredictionAccuracy: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeABTestResults">A/B Test Results</Label>
                  <p className="text-sm text-muted-foreground">
                    Email template A/B test performance and winners
                  </p>
                </div>
                <Switch
                  id="includeABTestResults"
                  checked={formData.includeABTestResults}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, includeABTestResults: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeEngagementTrends">Engagement Trends</Label>
                  <p className="text-sm text-muted-foreground">
                    Candidate engagement patterns and analytics
                  </p>
                </div>
                <Switch
                  id="includeEngagementTrends"
                  checked={formData.includeEngagementTrends}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, includeEngagementTrends: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeTopCandidates">Top Candidates</Label>
                  <p className="text-sm text-muted-foreground">
                    Highest-rated candidates from the week
                  </p>
                </div>
                <Switch
                  id="includeTopCandidates"
                  checked={formData.includeTopCandidates}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, includeTopCandidates: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeCriticalAlerts">Critical Alerts Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Summary of critical engagement alerts from the week
                  </p>
                </div>
                <Switch
                  id="includeCriticalAlerts"
                  checked={formData.includeCriticalAlerts}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, includeCriticalAlerts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includePushNotificationStats">Push Notification Statistics</Label>
                  <p className="text-sm text-muted-foreground">
                    Delivery rates, open rates, and engagement metrics for push notifications
                  </p>
                </div>
                <Switch
                  id="includePushNotificationStats"
                  checked={formData.includePushNotificationStats}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, includePushNotificationStats: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Thresholds</CardTitle>
              <CardDescription>Set minimum priority level for notifications included in digest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minimumPriorityLevel">Minimum Priority Level</Label>
                <Select
                  value={formData.minimumPriorityLevel}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, minimumPriorityLevel: value })
                  }
                >
                  <SelectTrigger id="minimumPriorityLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Only notifications at or above this priority level will be included in your digest
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="flex-1"
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleSendTest}
              disabled={sendTestDigest.isPending}
            >
              {sendTestDigest.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Digest
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
