import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell, Mail, Clock, TrendingUp, Calendar, Loader2 } from "lucide-react";

export default function NotificationPreferences() {
  const { data: preferences, isLoading, refetch } = trpc.notificationPreferences.get.useQuery();
  const updateMutation = trpc.notificationPreferences.update.useMutation();

  const [formData, setFormData] = useState({
    enableMonthlyInvoices: true,
    enableWeeklyReports: true,
    enableApplicationNotifications: true,
    enableInterviewReminders: true,
    enableJobMatchAlerts: true,
    weeklyReportDay: "monday" as const,
    weeklyReportTime: "08:00",
    emailFrequency: "realtime" as const,
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        enableMonthlyInvoices: preferences.enableMonthlyInvoices ?? true,
        enableWeeklyReports: preferences.enableWeeklyReports ?? true,
        enableApplicationNotifications: preferences.enableApplicationNotifications ?? true,
        enableInterviewReminders: preferences.enableInterviewReminders ?? true,
        enableJobMatchAlerts: preferences.enableJobMatchAlerts ?? true,
        weeklyReportDay: preferences.weeklyReportDay || "monday",
        weeklyReportTime: preferences.weeklyReportTime || "08:00",
        emailFrequency: preferences.emailFrequency || "realtime",
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      toast.success("Notification preferences updated successfully!");
      refetch();
    } catch (error) {
      toast.error("Failed to update preferences. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-600" />
            Email Notification Preferences
          </h1>
          <p className="text-slate-600 mt-2">
            Customize how and when you receive email notifications from Oracle Smart Recruitment
          </p>
        </div>

        {/* Automated Reports */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Automated Reports
            </CardTitle>
            <CardDescription>
              Receive regular updates about your recruitment activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="monthly-invoices" className="text-base font-medium">
                  Monthly Invoices
                </Label>
                <p className="text-sm text-slate-600">
                  Receive your monthly billing invoice on the 1st of each month
                </p>
              </div>
              <Switch
                id="monthly-invoices"
                checked={formData.enableMonthlyInvoices}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableMonthlyInvoices: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-reports" className="text-base font-medium">
                  Weekly Reports
                </Label>
                <p className="text-sm text-slate-600">
                  Get a summary of your recruitment metrics every week
                </p>
              </div>
              <Switch
                id="weekly-reports"
                checked={formData.enableWeeklyReports}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableWeeklyReports: checked })
                }
              />
            </div>

            {formData.enableWeeklyReports && (
              <div className="pl-4 border-l-2 border-blue-200 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report-day" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Delivery Day
                  </Label>
                  <Select
                    value={formData.weeklyReportDay}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, weeklyReportDay: value })
                    }
                  >
                    <SelectTrigger id="report-day">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Delivery Time
                  </Label>
                  <Select
                    value={formData.weeklyReportTime}
                    onValueChange={(value) =>
                      setFormData({ ...formData, weeklyReportTime: value })
                    }
                  >
                    <SelectTrigger id="report-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="06:00">6:00 AM</SelectItem>
                      <SelectItem value="07:00">7:00 AM</SelectItem>
                      <SelectItem value="08:00">8:00 AM</SelectItem>
                      <SelectItem value="09:00">9:00 AM</SelectItem>
                      <SelectItem value="10:00">10:00 AM</SelectItem>
                      <SelectItem value="12:00">12:00 PM</SelectItem>
                      <SelectItem value="14:00">2:00 PM</SelectItem>
                      <SelectItem value="16:00">4:00 PM</SelectItem>
                      <SelectItem value="18:00">6:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Activity Notifications
            </CardTitle>
            <CardDescription>
              Get notified about important recruitment events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="application-notifications" className="text-base font-medium">
                  New Applications
                </Label>
                <p className="text-sm text-slate-600">
                  Receive alerts when candidates apply to your jobs
                </p>
              </div>
              <Switch
                id="application-notifications"
                checked={formData.enableApplicationNotifications}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableApplicationNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="interview-reminders" className="text-base font-medium">
                  Interview Reminders
                </Label>
                <p className="text-sm text-slate-600">
                  Get reminders before scheduled interviews
                </p>
              </div>
              <Switch
                id="interview-reminders"
                checked={formData.enableInterviewReminders}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableInterviewReminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="job-match-alerts" className="text-base font-medium">
                  AI Job Match Alerts
                </Label>
                <p className="text-sm text-slate-600">
                  Receive notifications when AI finds highly matched candidates
                </p>
              </div>
              <Switch
                id="job-match-alerts"
                checked={formData.enableJobMatchAlerts}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enableJobMatchAlerts: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Frequency */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Email Frequency</CardTitle>
            <CardDescription>
              Control how often you receive activity notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.emailFrequency}
              onValueChange={(value: any) =>
                setFormData({ ...formData, emailFrequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time (as they happen)</SelectItem>
                <SelectItem value="daily_digest">Daily Digest (once per day)</SelectItem>
                <SelectItem value="weekly_digest">Weekly Digest (once per week)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              if (preferences) {
                setFormData({
                  enableMonthlyInvoices: preferences.enableMonthlyInvoices ?? true,
                  enableWeeklyReports: preferences.enableWeeklyReports ?? true,
                  enableApplicationNotifications: preferences.enableApplicationNotifications ?? true,
                  enableInterviewReminders: preferences.enableInterviewReminders ?? true,
                  enableJobMatchAlerts: preferences.enableJobMatchAlerts ?? true,
                  weeklyReportDay: preferences.weeklyReportDay || "monday",
                  weeklyReportTime: preferences.weeklyReportTime || "08:00",
                  emailFrequency: preferences.emailFrequency || "realtime",
                });
                toast.info("Changes discarded");
              }
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
