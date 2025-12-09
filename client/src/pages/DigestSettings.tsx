import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail, Clock, Globe, Calendar, Send, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Digest Settings Page
 * 
 * Allows users to configure automated daily digest emails including:
 * - Enable/disable digest
 * - Delivery time (with timezone support)
 * - Frequency (daily/weekly)
 * - Test digest functionality
 */
export default function DigestSettings() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const { data: settings, isLoading } = trpc.digestSettings.get.useQuery(undefined, {
    enabled: !!user,
  });

  const updateSettings = trpc.digestSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Digest settings updated successfully");
      utils.digestSettings.get.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const testDigest = trpc.digestSettings.testDigest.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message || "Test digest sent successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to send test digest: ${error.message}`);
    },
  });

  const sendNow = trpc.manualDigest.sendNow.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success(`Digest sent successfully! ${data.notificationCount} notifications included.`);
      } else {
        toast.info(data.message || "No notifications to send");
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to send digest: ${error.message}`);
    },
  });

  const { data: previewData, refetch: refetchPreview } = trpc.manualDigest.preview.useQuery(undefined, {
    enabled: false,
  });

  const [showPreview, setShowPreview] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState("09:00");
  const [timezone, setTimezone] = useState("UTC");
  const [frequency, setFrequency] = useState<string>("daily");
  const [weeklyDay, setWeeklyDay] = useState<number | null>(null);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setDeliveryTime(settings.deliveryTime);
      setTimezone(settings.timezone);
      setFrequency(settings.frequency);
      setWeeklyDay(settings.weeklyDay);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      enabled,
      deliveryTime,
      timezone,
      frequency: frequency as "daily" | "weekly" | "custom",
      weeklyDay: frequency === "weekly" ? (weeklyDay ?? undefined) : undefined,
    });
  };

  const handleTestDigest = () => {
    testDigest.mutate();
  };

  // Get user's browser timezone
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Common timezones
  const commonTimezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Australia/Sydney",
  ];

  const weekDays = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Digest Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure automated daily digest emails with your recruitment notifications
          </p>
        </div>

        <div className="space-y-6">
          {/* Main Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Digest Configuration
              </CardTitle>
              <CardDescription>
                Receive a daily summary of your recruitment notifications at your preferred time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">Enable Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive automated digest emails with your notifications
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              {enabled && (
                <>
                  {/* Delivery Time */}
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Delivery Time
                    </Label>
                    <Input
                      id="deliveryTime"
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="max-w-xs"
                    />
                    <p className="text-sm text-muted-foreground">
                      Choose what time you'd like to receive your daily digest
                    </p>
                  </div>

                  {/* Timezone */}
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Timezone
                    </Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="timezone" className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={browserTimezone}>
                          {browserTimezone} (Your Browser)
                        </SelectItem>
                        {commonTimezones
                          .filter((tz) => tz !== browserTimezone)
                          .map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Select your timezone for accurate delivery timing
                    </p>
                  </div>

                  {/* Frequency */}
                  <div className="space-y-2">
                    <Label htmlFor="frequency" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Frequency
                    </Label>
                    <Select
                      value={frequency}
                      onValueChange={(value) => setFrequency(value as "daily" | "weekly" | "custom")}
                    >
                      <SelectTrigger id="frequency" className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      How often you want to receive digest emails
                    </p>
                  </div>

                  {/* Weekly Day Selection */}
                  {frequency === "weekly" && (
                    <div className="space-y-2">
                      <Label htmlFor="weeklyDay">Day of Week</Label>
                      <Select
                        value={weeklyDay?.toString() || ""}
                        onValueChange={(value) => setWeeklyDay(parseInt(value))}
                      >
                        <SelectTrigger id="weeklyDay" className="max-w-xs">
                          <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                        <SelectContent>
                          {weekDays.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Choose which day of the week to receive your digest
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
                <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Settings
                </Button>
                {enabled && (
                  <Button
                    variant="outline"
                    onClick={handleTestDigest}
                    disabled={testDigest.isPending}
                  >
                    {testDigest.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Test Digest
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Digest Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Manual Digest Controls
              </CardTitle>
              <CardDescription>
                Send or preview your digest on demand, outside of the scheduled time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => sendNow.mutate()}
                  disabled={sendNow.isPending}
                >
                  {sendNow.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Send className="mr-2 h-4 w-4" />
                  Send Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    refetchPreview();
                    setShowPreview(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Digest
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Send Now:</strong> Immediately sends a digest with your current unread notifications.
                <br />
                <strong>Preview:</strong> View what your next digest will look like without sending it.
              </p>
            </CardContent>
          </Card>

          {/* Preview Dialog */}
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Digest Preview</DialogTitle>
                <DialogDescription>
                  {previewData && (
                    <span>
                      {previewData.notificationCount} notifications grouped into{" "}
                      {previewData.notificationsByType.length} categories
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              {previewData && (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <div className="space-y-1 text-sm">
                      {previewData.notificationsByType.map((item: any) => (
                        <div key={item.type} className="flex justify-between">
                          <span className="capitalize">{item.type.replace(/_/g, " ")}:</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Email Preview</h3>
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewData.html }}
                    />
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <strong>Automated Delivery:</strong> Your digest will be sent automatically at your
                chosen time based on your timezone.
              </p>
              <p>
                <strong>Smart Filtering:</strong> Only relevant notifications are included. Low-priority
                items may be automatically filtered based on your engagement patterns.
              </p>
              <p>
                <strong>Grouped by Type:</strong> Notifications are organized by category (feedback,
                interviews, status changes) for easy scanning.
              </p>
              <p>
                <strong>Test Before Committing:</strong> Use the "Send Test Digest" button to preview
                what your digest will look like.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
