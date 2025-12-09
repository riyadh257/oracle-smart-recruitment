import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Clock, Mail, UserCheck } from "lucide-react";
import EmailPreview from "@/components/EmailPreview";
import JobNotificationPreferences from "@/components/JobNotificationPreferences";

export default function HiringManagerNotificationSettings() {
  const { user, loading } = useAuth();
  const { data: preferences, isLoading, refetch } = trpc.hiringManagerNotifications.get.useQuery(
    undefined,
    { enabled: !!user }
  );

  const updatePreferences = trpc.hiringManagerNotifications.update.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences updated");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });

  const [formData, setFormData] = useState({
    feedbackSubmitted: true,
    interviewScheduled: true,
    candidateStatusChange: true,
    frequency: "immediate" as "immediate" | "daily-digest",
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        feedbackSubmitted: preferences.feedbackSubmitted,
        interviewScheduled: preferences.interviewScheduled,
        candidateStatusChange: preferences.candidateStatusChange,
        frequency: preferences.frequency,
      });
    }
  }, [preferences]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences.mutate(formData);
  };

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading preferences...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please sign in to manage notification preferences</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize which notifications you want to receive and how often
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Types
              </CardTitle>
              <CardDescription>
                Choose which types of notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Feedback Submitted */}
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-start gap-3 flex-1">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <Label htmlFor="feedbackSubmitted" className="text-base font-medium">
                      Feedback Submitted
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get notified when interviewers submit feedback for candidates
                    </p>
                  </div>
                </div>
                <Switch
                  id="feedbackSubmitted"
                  checked={formData.feedbackSubmitted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, feedbackSubmitted: checked })
                  }
                />
              </div>

              {/* Interview Scheduled */}
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-start gap-3 flex-1">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <Label htmlFor="interviewScheduled" className="text-base font-medium">
                      Interview Scheduled
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get notified when new interviews are scheduled
                    </p>
                  </div>
                </div>
                <Switch
                  id="interviewScheduled"
                  checked={formData.interviewScheduled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, interviewScheduled: checked })
                  }
                />
              </div>

              {/* Candidate Status Change */}
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-start gap-3 flex-1">
                  <UserCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <Label htmlFor="candidateStatusChange" className="text-base font-medium">
                      Candidate Status Changes
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get notified when candidate status changes (hired, rejected, etc.)
                    </p>
                  </div>
                </div>
                <Switch
                  id="candidateStatusChange"
                  checked={formData.candidateStatusChange}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, candidateStatusChange: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Notification Frequency
              </CardTitle>
              <CardDescription>
                Choose how often you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="frequency">Delivery Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: "immediate" | "daily-digest") =>
                    setFormData({ ...formData, frequency: value })
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Immediate</span>
                        <span className="text-xs text-muted-foreground">
                          Receive notifications as they happen
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="daily-digest">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Daily Digest</span>
                        <span className="text-xs text-muted-foreground">
                          Receive a summary once per day
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Email Preview */}
          <EmailPreview />

          {/* Job-specific Preferences */}
          <JobNotificationPreferences />

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (preferences) {
                  setFormData({
                    feedbackSubmitted: preferences.feedbackSubmitted,
                    interviewScheduled: preferences.interviewScheduled,
                    candidateStatusChange: preferences.candidateStatusChange,
                    frequency: preferences.frequency,
                  });
                }
              }}
            >
              Reset
            </Button>
            <Button type="submit" disabled={updatePreferences.isPending}>
              {updatePreferences.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
