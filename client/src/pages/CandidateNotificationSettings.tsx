import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Bell, Mail, Calendar, Briefcase, Building, Lightbulb } from "lucide-react";

export default function CandidateNotificationSettings() {
  const [candidateId, setCandidateId] = useState<number | null>(null);
  
  // Get current user's candidate profile
  const { data: user } = trpc.auth.me.useQuery();
  
  // Fetch candidate ID from user
  useEffect(() => {
    if (user) {
      // In a real scenario, we'd fetch the candidate ID from the user's profile
      // For now, we'll use a placeholder
      setCandidateId(1); // TODO: Replace with actual candidate ID lookup
    }
  }, [user]);

  const { data: preferences, isLoading, refetch } = trpc.candidateNotifications.getPreferences.useQuery(
    { candidateId: candidateId! },
    { enabled: !!candidateId }
  );

  const updatePreferences = trpc.candidateNotifications.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update preferences: ${error.message}`);
    },
  });

  const [localPrefs, setLocalPrefs] = useState({
    jobAlertFrequency: "daily_digest" as "instant" | "daily_digest" | "weekly_summary" | "off",
    applicationStatusUpdates: true,
    interviewReminders: true,
    newJobMatches: true,
    companyUpdates: false,
    careerTips: false,
  });

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        jobAlertFrequency: preferences.jobAlertFrequency,
        applicationStatusUpdates: preferences.applicationStatusUpdates ?? true,
        interviewReminders: preferences.interviewReminders ?? true,
        newJobMatches: preferences.newJobMatches ?? true,
        companyUpdates: preferences.companyUpdates ?? false,
        careerTips: preferences.careerTips ?? false,
      });
    }
  }, [preferences]);

  const handleSave = () => {
    if (!candidateId) return;
    
    updatePreferences.mutate({
      candidateId,
      ...localPrefs,
    });
  };

  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Please log in to manage notification preferences</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notification Preferences</h1>
        <p className="text-muted-foreground">
          Control which types of job alerts and updates you receive
        </p>
      </div>

      <div className="space-y-6">
        {/* Job Alert Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Job Alert Frequency
            </CardTitle>
            <CardDescription>
              Choose how often you want to receive job match notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="frequency" className="text-base">
                  Email Frequency
                </Label>
                <Select
                  value={localPrefs.jobAlertFrequency}
                  onValueChange={(value: typeof localPrefs.jobAlertFrequency) =>
                    setLocalPrefs({ ...localPrefs, jobAlertFrequency: value })
                  }
                >
                  <SelectTrigger id="frequency" className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant (as they arrive)</SelectItem>
                    <SelectItem value="daily_digest">Daily Digest</SelectItem>
                    <SelectItem value="weekly_summary">Weekly Summary</SelectItem>
                    <SelectItem value="off">Off (no job alerts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                {localPrefs.jobAlertFrequency === "instant" && (
                  <p>You'll receive an email immediately when a new job matches your profile.</p>
                )}
                {localPrefs.jobAlertFrequency === "daily_digest" && (
                  <p>You'll receive one email per day with all new job matches (sent at 8:00 AM).</p>
                )}
                {localPrefs.jobAlertFrequency === "weekly_summary" && (
                  <p>You'll receive one email per week with all new job matches (sent Monday at 8:00 AM).</p>
                )}
                {localPrefs.jobAlertFrequency === "off" && (
                  <p>You won't receive any job alert emails. You can still view matches in your dashboard.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-0.5">
                    <Label htmlFor="status-updates" className="text-base font-medium">
                      Application Status Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your application status changes (viewed, interview scheduled, offer extended)
                    </p>
                  </div>
                </div>
                <Switch
                  id="status-updates"
                  checked={localPrefs.applicationStatusUpdates}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, applicationStatusUpdates: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-0.5">
                    <Label htmlFor="interview-reminders" className="text-base font-medium">
                      Interview Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders before scheduled interviews
                    </p>
                  </div>
                </div>
                <Switch
                  id="interview-reminders"
                  checked={localPrefs.interviewReminders}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, interviewReminders: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-0.5">
                    <Label htmlFor="job-matches" className="text-base font-medium">
                      New Job Matches
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new jobs match your profile and preferences
                    </p>
                  </div>
                </div>
                <Switch
                  id="job-matches"
                  checked={localPrefs.newJobMatches}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, newJobMatches: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-0.5">
                    <Label htmlFor="company-updates" className="text-base font-medium">
                      Company Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates from companies you've applied to or shown interest in
                    </p>
                  </div>
                </div>
                <Switch
                  id="company-updates"
                  checked={localPrefs.companyUpdates}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, companyUpdates: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Lightbulb className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-0.5">
                    <Label htmlFor="career-tips" className="text-base font-medium">
                      Career Tips & Resources
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get helpful career advice, interview tips, and industry insights
                    </p>
                  </div>
                </div>
                <Switch
                  id="career-tips"
                  checked={localPrefs.careerTips}
                  onCheckedChange={(checked) =>
                    setLocalPrefs({ ...localPrefs, careerTips: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updatePreferences.isPending}
            size="lg"
          >
            {updatePreferences.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
