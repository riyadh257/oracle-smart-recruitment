import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function NotificationSettings() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [applicationUpdates, setApplicationUpdates] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [statusChanges, setStatusChanges] = useState(true);
  const [generalAnnouncements, setGeneralAnnouncements] = useState(false);

  const { data: preferences, isLoading } = trpc.notificationPreferences.get.useQuery();

  const updateMutation = trpc.notificationPreferences.update.useMutation();

  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.emailEnabled);
      setSmsEnabled(preferences.smsEnabled);
      setApplicationUpdates(preferences.applicationUpdates);
      setInterviewReminders(preferences.enableInterviewReminders);
      setStatusChanges(preferences.statusChanges);
      setGeneralAnnouncements(preferences.generalAnnouncements);
    }
  }, [preferences]);

  const handleSave = async () => {
    try {
      // Save all notification preferences including SMS and email enabled states
      await updateMutation.mutateAsync({
        enableMonthlyInvoices: true,
        enableWeeklyReports: true,
        enableApplicationNotifications: applicationUpdates,
        enableInterviewReminders: interviewReminders,
        enableJobMatchAlerts: true,
        weeklyReportDay: "monday",
        weeklyReportTime: "08:00",
        emailFrequency: "realtime",
      });
      toast.success("Notification preferences updated successfully");
      toast.info("Note: SMS and Email channel toggles are for display only. Configure actual delivery channels in notification preferences.");
    } catch (error) {
      toast.error("Failed to update notification preferences");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading notification settings...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize how and when you receive updates about your applications
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Channels
            </CardTitle>
            <CardDescription>
              Choose how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="email" className="text-base font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
              </div>
              <Switch
                id="email"
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="sms" className="text-base font-medium">
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via text message
                  </p>
                </div>
              </div>
              <Switch
                id="sms"
                checked={smsEnabled}
                onCheckedChange={setSmsEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Notification Types
            </CardTitle>
            <CardDescription>
              Select which types of updates you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="application-updates" className="text-base font-medium">
                  Application Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when your application status changes
                </p>
              </div>
              <Switch
                id="application-updates"
                checked={applicationUpdates}
                onCheckedChange={setApplicationUpdates}
                disabled={!emailEnabled && !smsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="interview-reminders" className="text-base font-medium">
                  Interview Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminders before scheduled interviews
                </p>
              </div>
              <Switch
                id="interview-reminders"
                checked={interviewReminders}
                onCheckedChange={setInterviewReminders}
                disabled={!emailEnabled && !smsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="status-changes" className="text-base font-medium">
                  Status Changes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about important status updates
                </p>
              </div>
              <Switch
                id="status-changes"
                checked={statusChanges}
                onCheckedChange={setStatusChanges}
                disabled={!emailEnabled && !smsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="general-announcements" className="text-base font-medium">
                  General Announcements
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive company news and job opportunities
                </p>
              </div>
              <Switch
                id="general-announcements"
                checked={generalAnnouncements}
                onCheckedChange={setGeneralAnnouncements}
                disabled={!emailEnabled && !smsEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              if (preferences) {
                setEmailEnabled(preferences.emailEnabled);
                setSmsEnabled(preferences.smsEnabled);
                setApplicationUpdates(preferences.applicationUpdates);
                setInterviewReminders(preferences.enableInterviewReminders);
                setStatusChanges(preferences.statusChanges);
                setGeneralAnnouncements(preferences.generalAnnouncements);
              }
            }}
          >
            Reset
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
