import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PushNotificationManager } from "@/components/PushNotificationSettings";
import {
  Bell,
  BellOff,
  Calendar,
  Users,
  TrendingUp,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Moon,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "interviews" | "candidates" | "engagement" | "campaigns";
  enabled: boolean;
  frequency: "instant" | "hourly" | "daily" | "weekly";
}

const defaultPreferences: NotificationPreference[] = [
  {
    id: "new_interview_response",
    title: "New Interview Response",
    description: "Get notified when a candidate responds to an interview invitation",
    icon: Calendar,
    category: "interviews",
    enabled: true,
    frequency: "instant",
  },
  {
    id: "interview_reminder",
    title: "Interview Reminders",
    description: "Receive reminders before scheduled interviews",
    icon: Calendar,
    category: "interviews",
    enabled: true,
    frequency: "instant",
  },
  {
    id: "feedback_pending",
    title: "Pending Feedback",
    description: "Reminder to submit feedback after interviews",
    icon: Calendar,
    category: "interviews",
    enabled: true,
    frequency: "daily",
  },
  {
    id: "high_engagement_candidate",
    title: "High Engagement Candidates",
    description: "Alert when a candidate shows high engagement scores",
    icon: TrendingUp,
    category: "engagement",
    enabled: true,
    frequency: "instant",
  },
  {
    id: "engagement_drop",
    title: "Engagement Drops",
    description: "Get notified when candidate engagement drops significantly",
    icon: TrendingUp,
    category: "engagement",
    enabled: true,
    frequency: "hourly",
  },
  {
    id: "new_candidate",
    title: "New Candidate Applications",
    description: "Notification when new candidates apply",
    icon: Users,
    category: "candidates",
    enabled: false,
    frequency: "daily",
  },
  {
    id: "candidate_status_change",
    title: "Candidate Status Changes",
    description: "Track when candidates move through the pipeline",
    icon: Users,
    category: "candidates",
    enabled: true,
    frequency: "instant",
  },
  {
    id: "ab_test_results",
    title: "A/B Test Results",
    description: "Statistical significance reached in A/B tests",
    icon: TrendingUp,
    category: "campaigns",
    enabled: true,
    frequency: "instant",
  },
  {
    id: "campaign_performance",
    title: "Campaign Performance",
    description: "Daily summary of email campaign metrics",
    icon: Mail,
    category: "campaigns",
    enabled: true,
    frequency: "daily",
  },
];

export default function PushNotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(defaultPreferences);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("08:00");
  const [quietHoursTimezone, setQuietHoursTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  // Load quiet hours settings
  const { data: notifPrefs } = trpc.notificationPreferences.get.useQuery();
  const updateQuietHoursMutation = trpc.notificationPreferences.updateQuietHours.useMutation({
    onSuccess: () => {
      toast.success("Quiet hours updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update quiet hours: ${error.message}`);
    },
  });
  const toggleQuietHoursMutation = trpc.notificationPreferences.toggleQuietHours.useMutation({
    onSuccess: () => {
      toast.success(quietHoursEnabled ? "Quiet hours disabled" : "Quiet hours enabled");
    },
    onError: (error) => {
      toast.error(`Failed to toggle quiet hours: ${error.message}`);
    },
  });

  // Update local state when preferences load
  useState(() => {
    if (notifPrefs) {
      setQuietHoursEnabled(notifPrefs.quietHoursEnabled || false);
      setQuietHoursStart(notifPrefs.quietHoursStart || "22:00");
      setQuietHoursEnd(notifPrefs.quietHoursEnd || "08:00");
      setQuietHoursTimezone(notifPrefs.quietHoursTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    }
  });

  const savePreferencesMutation = trpc.notifications.savePreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save preferences: ${error.message}`);
    },
  });

  // Check notification permission status on mount
  useState(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
      setPushEnabled(Notification.permission === "granted");
    }
  });

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Push notifications are not supported in this browser");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      setPushEnabled(permission === "granted");

      if (permission === "granted") {
        toast.success("Push notifications enabled successfully");
        // Show a test notification
        new Notification("Oracle Smart Recruitment", {
          body: "You'll now receive push notifications for important events",
          icon: "/pwa-192x192.png",
        });
      } else if (permission === "denied") {
        toast.error("Push notification permission denied. You can enable it in browser settings.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to request notification permission");
    }
  };

  const handleTogglePreference = (id: string) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  const handleFrequencyChange = (id: string, frequency: string) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === id
          ? { ...pref, frequency: frequency as NotificationPreference["frequency"] }
          : pref
      )
    );
  };

  const handleSavePreferences = () => {
    const preferencesData = preferences.map((pref) => ({
      type: pref.id,
      enabled: pref.enabled,
      frequency: pref.frequency,
    }));

    savePreferencesMutation.mutate({
      preferences: preferencesData,
      pushEnabled,
    });
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) {
      acc[pref.category] = [];
    }
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  const categoryLabels = {
    interviews: "Interview Notifications",
    candidates: "Candidate Notifications",
    engagement: "Engagement Alerts",
    campaigns: "Campaign & Analytics",
  };

  const categoryDescriptions = {
    interviews: "Stay updated on interview scheduling, responses, and feedback",
    candidates: "Track new applications and candidate pipeline movements",
    engagement: "Monitor candidate engagement levels and trends",
    campaigns: "Get insights on email campaigns and A/B test results",
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Push Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize which events trigger push notifications and how often you receive them
        </p>
      </div>

      {/* Browser Push Notifications */}
      <PushNotificationManager />

      {/* Legacy notification preferences card header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {pushEnabled ? (
                  <Bell className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose which events trigger notifications and their frequency
              </CardDescription>
            </div>
            {permissionStatus === "granted" && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Enabled
              </Badge>
            )}
            {permissionStatus === "denied" && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Blocked
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {permissionStatus === "default" && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm">
                Push notifications allow you to stay informed about important recruitment
                events in real-time, even when you're not actively using the app.
              </p>
              <Button onClick={requestNotificationPermission} className="gap-2">
                <Bell className="h-4 w-4" />
                Enable Push Notifications
              </Button>
            </div>
          )}

          {permissionStatus === "granted" && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Push notifications are enabled</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive notifications based on your preferences below
                  </p>
                </div>
              </div>
            </div>
          )}

          {permissionStatus === "denied" && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Push notifications are blocked</p>
                  <p className="text-sm text-muted-foreground">
                    To enable notifications, please allow them in your browser settings
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences by Category */}
      {Object.entries(groupedPreferences).map(([category, prefs]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{categoryLabels[category as keyof typeof categoryLabels]}</CardTitle>
            <CardDescription>
              {categoryDescriptions[category as keyof typeof categoryDescriptions]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {prefs.map((pref, index) => (
              <div key={pref.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <pref.icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <Label
                        htmlFor={pref.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {pref.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">{pref.description}</p>
                      {pref.enabled && (
                        <div className="flex items-center gap-2 mt-2">
                          <Label
                            htmlFor={`${pref.id}-frequency`}
                            className="text-xs text-muted-foreground"
                          >
                            Frequency:
                          </Label>
                          <Select
                            value={pref.frequency}
                            onValueChange={(value) =>
                              handleFrequencyChange(pref.id, value)
                            }
                          >
                            <SelectTrigger
                              id={`${pref.id}-frequency`}
                              className="h-8 w-32"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="instant">Instant</SelectItem>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                  <Switch
                    id={pref.id}
                    checked={pref.enabled}
                    onCheckedChange={() => handleTogglePreference(pref.id)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Quiet Hours Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-primary" />
                Quiet Hours
              </CardTitle>
              <CardDescription>
                Pause notifications during specific hours to avoid disturbances
              </CardDescription>
            </div>
            <Switch
              checked={quietHoursEnabled}
              onCheckedChange={(checked) => {
                setQuietHoursEnabled(checked);
                toggleQuietHoursMutation.mutate({ enabled: checked });
              }}
            />
          </div>
        </CardHeader>
        {quietHoursEnabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Start Time
                </Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  End Time
                </Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={quietHoursTimezone} onValueChange={setQuietHoursTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                  <SelectItem value="Asia/Riyadh">Riyadh</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  <SelectItem value="Asia/Singapore">Singapore</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateQuietHoursMutation.mutate({
                  start: quietHoursStart,
                  end: quietHoursEnd,
                  timezone: quietHoursTimezone,
                });
              }}
              disabled={updateQuietHoursMutation.isPending}
            >
              {updateQuietHoursMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Save Quiet Hours
            </Button>
            <p className="text-sm text-muted-foreground">
              Notifications will be silenced from {quietHoursStart} to {quietHoursEnd} ({quietHoursTimezone})
            </p>
          </CardContent>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <Button
          onClick={handleSavePreferences}
          disabled={savePreferencesMutation.isPending}
          className="gap-2"
        >
          {savePreferencesMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
