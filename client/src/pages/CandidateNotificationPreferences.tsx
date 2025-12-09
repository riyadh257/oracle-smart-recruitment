import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bell, Clock, Globe, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function CandidateNotificationPreferences() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Get candidate ID from user
  const candidateId = user?.id || 0;

  const { data: preferences, isLoading } = trpc.candidateNotification.getPreferences.useQuery(
    { candidateId },
    { enabled: !!candidateId }
  );

  const [formData, setFormData] = useState({
    jobAlertFrequency: "daily_digest" as "instant" | "daily_digest" | "weekly_summary" | "off",
    applicationStatusUpdates: true,
    interviewReminders: true,
    newJobMatches: true,
    companyUpdates: false,
    careerTips: false,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    timezone: "Asia/Riyadh",
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        jobAlertFrequency: preferences.jobAlertFrequency as any,
        applicationStatusUpdates: !!preferences.applicationStatusUpdates,
        interviewReminders: !!preferences.interviewReminders,
        newJobMatches: !!preferences.newJobMatches,
        companyUpdates: !!preferences.companyUpdates,
        careerTips: !!preferences.careerTips,
        quietHoursEnabled: !!preferences.quietHoursEnabled,
        quietHoursStart: preferences.quietHoursStart || "22:00",
        quietHoursEnd: preferences.quietHoursEnd || "08:00",
        timezone: preferences.timezone || "Asia/Riyadh",
      });
    }
  }, [preferences]);

  const updatePreferences = trpc.candidateNotification.updatePreferences.useMutation({
    onSuccess: () => {
      utils.candidateNotification.getPreferences.invalidate();
      toast.success("Notification preferences updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update preferences: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!candidateId) {
      toast.error("User not authenticated");
      return;
    }

    updatePreferences.mutate({
      candidateId,
      ...formData,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading preferences...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Control how and when you receive notifications about job matches, applications, and interviews
        </p>
      </div>

      {/* Email Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Frequency
          </CardTitle>
          <CardDescription>
            Choose how often you want to receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Notification Frequency</Label>
            <Select
              value={formData.jobAlertFrequency}
              onValueChange={(value: any) =>
                setFormData({ ...formData, jobAlertFrequency: value })
              }
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Immediate - Get notified right away</SelectItem>
                <SelectItem value="daily_digest">Daily Digest - Once per day summary</SelectItem>
                <SelectItem value="weekly_summary">Weekly Summary - Once per week</SelectItem>
                <SelectItem value="off">Off - No email notifications</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {formData.jobAlertFrequency === "instant" && "You'll receive emails immediately when new matches are found"}
              {formData.jobAlertFrequency === "daily_digest" && "You'll receive a daily summary of all new matches"}
              {formData.jobAlertFrequency === "weekly_summary" && "You'll receive a weekly summary of all new matches"}
              {formData.jobAlertFrequency === "off" && "You won't receive any email notifications (you can still check in-app)"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="newJobMatches">New Job Matches</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new jobs match your profile
              </p>
            </div>
            <Switch
              id="newJobMatches"
              checked={formData.newJobMatches}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, newJobMatches: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="applicationStatusUpdates">Application Status Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your application status changes
              </p>
            </div>
            <Switch
              id="applicationStatusUpdates"
              checked={formData.applicationStatusUpdates}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, applicationStatusUpdates: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="interviewReminders">Interview Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminders before scheduled interviews
              </p>
            </div>
            <Switch
              id="interviewReminders"
              checked={formData.interviewReminders}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, interviewReminders: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="companyUpdates">Company Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get updates from companies you've applied to
              </p>
            </div>
            <Switch
              id="companyUpdates"
              checked={formData.companyUpdates}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, companyUpdates: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="careerTips">Career Tips & Advice</Label>
              <p className="text-sm text-muted-foreground">
                Receive helpful career development tips
              </p>
            </div>
            <Switch
              id="careerTips"
              checked={formData.careerTips}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, careerTips: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Set times when you don't want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quietHoursEnabled">Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Notifications will be delayed until quiet hours end
              </p>
            </div>
            <Switch
              id="quietHoursEnabled"
              checked={formData.quietHoursEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, quietHoursEnabled: checked })
              }
            />
          </div>

          {formData.quietHoursEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quietHoursStart">Start Time</Label>
                  <Input
                    id="quietHoursStart"
                    type="time"
                    value={formData.quietHoursStart}
                    onChange={(e) =>
                      setFormData({ ...formData, quietHoursStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quietHoursEnd">End Time</Label>
                  <Input
                    id="quietHoursEnd"
                    type="time"
                    value={formData.quietHoursEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, quietHoursEnd: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Timezone
                </Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) =>
                    setFormData({ ...formData, timezone: value })
                  }
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Riyadh">Riyadh (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                    <SelectItem value="Asia/Kuwait">Kuwait (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Bahrain">Bahrain (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Qatar">Qatar (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Muscat">Muscat (GMT+4)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                    <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Quiet hours: {formData.quietHoursStart} to {formData.quietHoursEnd} ({formData.timezone})
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updatePreferences.isPending}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {updatePreferences.isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
