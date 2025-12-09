import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, Mail, Smartphone, MessageSquare, Clock, Sliders } from "lucide-react";

export default function MatchNotificationSettings() {
  const [jobId, setJobId] = useState<string>("global");
  
  // Fetch jobs for dropdown
  const { data: jobs } = trpc.jobs.getAll.useQuery();
  
  // Fetch current preferences
  const { data: preferences, isLoading, refetch } = trpc.phase27.notificationPreferences.get.useQuery(
    { jobId: jobId === "global" ? undefined : parseInt(jobId) },
    { enabled: true }
  );

  // Form state
  const [formData, setFormData] = useState({
    minMatchScore: 70,
    highScoreThreshold: 85,
    exceptionalScoreThreshold: 90,
    notifyViaEmail: true,
    notifyViaPush: true,
    notifyViaSms: false,
    instantNotifications: true,
    digestMode: false,
    digestFrequency: 'daily' as 'hourly' | 'daily' | 'weekly',
    notifyOnlyNewCandidates: false,
    notifyOnScoreImprovement: true,
    minScoreImprovement: 5,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    timezone: 'Asia/Riyadh',
  });

  // Update form when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        minMatchScore: preferences.minMatchScore,
        highScoreThreshold: preferences.highScoreThreshold,
        exceptionalScoreThreshold: preferences.exceptionalScoreThreshold,
        notifyViaEmail: Boolean(preferences.notifyViaEmail),
        notifyViaPush: Boolean(preferences.notifyViaPush),
        notifyViaSms: Boolean(preferences.notifyViaSms),
        instantNotifications: Boolean(preferences.instantNotifications),
        digestMode: Boolean(preferences.digestMode),
        digestFrequency: preferences.digestFrequency,
        notifyOnlyNewCandidates: Boolean(preferences.notifyOnlyNewCandidates),
        notifyOnScoreImprovement: Boolean(preferences.notifyOnScoreImprovement),
        minScoreImprovement: preferences.minScoreImprovement || 5,
        quietHoursEnabled: Boolean(preferences.quietHoursEnabled),
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
        timezone: preferences.timezone,
      });
    }
  }, [preferences]);

  // Save preferences mutation
  const saveMutation = trpc.phase27.notificationPreferences.upsert.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences saved successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save preferences: ${error.message}`);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      jobId: jobId === "global" ? undefined : parseInt(jobId),
      ...formData,
    });
  };

  const handleReset = () => {
    setFormData({
      minMatchScore: 70,
      highScoreThreshold: 85,
      exceptionalScoreThreshold: 90,
      notifyViaEmail: true,
      notifyViaPush: true,
      notifyViaSms: false,
      instantNotifications: true,
      digestMode: false,
      digestFrequency: 'daily',
      notifyOnlyNewCandidates: false,
      notifyOnScoreImprovement: true,
      minScoreImprovement: 5,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'Asia/Riyadh',
    });
    toast.info("Reset to default settings");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Match Notification Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize how and when you receive notifications about candidate matches
          </p>
        </div>

        {/* Job Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Scope</CardTitle>
            <CardDescription>
              Configure notifications globally or for a specific job posting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="job-select">Apply settings to</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger id="job-select">
                  <SelectValue placeholder="Select job or global" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">All Jobs (Global Default)</SelectItem>
                  {jobs?.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Threshold Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="h-5 w-5" />
              Match Score Thresholds
            </CardTitle>
            <CardDescription>
              Set minimum scores to trigger notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="min-score">Minimum Match Score (%)</Label>
              <Input
                id="min-score"
                type="number"
                min="0"
                max="100"
                value={formData.minMatchScore}
                onChange={(e) => setFormData({ ...formData, minMatchScore: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                Only notify for matches above this score
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="high-score">High Quality Threshold (%)</Label>
              <Input
                id="high-score"
                type="number"
                min="0"
                max="100"
                value={formData.highScoreThreshold}
                onChange={(e) => setFormData({ ...formData, highScoreThreshold: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                Marks matches as "high quality"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exceptional-score">Exceptional Match Threshold (%)</Label>
              <Input
                id="exceptional-score"
                type="number"
                min="0"
                max="100"
                value={formData.exceptionalScoreThreshold}
                onChange={(e) => setFormData({ ...formData, exceptionalScoreThreshold: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                Marks matches as "exceptional" - highest priority
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Channels */}
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
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="email">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
              </div>
              <Switch
                id="email"
                checked={formData.notifyViaEmail}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyViaEmail: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="push">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                </div>
              </div>
              <Switch
                id="push"
                checked={formData.notifyViaPush}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyViaPush: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="sms">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive text message alerts</p>
                </div>
              </div>
              <Switch
                id="sms"
                checked={formData.notifyViaSms}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyViaSms: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Frequency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Notification Frequency
            </CardTitle>
            <CardDescription>
              Control when and how often you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="instant">Instant Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified immediately when matches occur</p>
              </div>
              <Switch
                id="instant"
                checked={formData.instantNotifications}
                onCheckedChange={(checked) => setFormData({ ...formData, instantNotifications: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="digest">Digest Mode</Label>
                <p className="text-sm text-muted-foreground">Batch notifications into periodic digests</p>
              </div>
              <Switch
                id="digest"
                checked={formData.digestMode}
                onCheckedChange={(checked) => setFormData({ ...formData, digestMode: checked })}
              />
            </div>

            {formData.digestMode && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="digest-freq">Digest Frequency</Label>
                <Select 
                  value={formData.digestFrequency} 
                  onValueChange={(value: 'hourly' | 'daily' | 'weekly') => 
                    setFormData({ ...formData, digestFrequency: value })
                  }
                >
                  <SelectTrigger id="digest-freq">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Filters</CardTitle>
            <CardDescription>
              Fine-tune which matches trigger notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="new-only">New Candidates Only</Label>
                <p className="text-sm text-muted-foreground">Only notify for first-time candidate matches</p>
              </div>
              <Switch
                id="new-only"
                checked={formData.notifyOnlyNewCandidates}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyOnlyNewCandidates: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="score-improve">Score Improvements</Label>
                <p className="text-sm text-muted-foreground">Notify when candidate scores improve</p>
              </div>
              <Switch
                id="score-improve"
                checked={formData.notifyOnScoreImprovement}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyOnScoreImprovement: checked })}
              />
            </div>

            {formData.notifyOnScoreImprovement && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="min-improve">Minimum Improvement (%)</Label>
                <Input
                  id="min-improve"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.minScoreImprovement}
                  onChange={(e) => setFormData({ ...formData, minScoreImprovement: parseInt(e.target.value) })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Quiet Hours</CardTitle>
            <CardDescription>
              Set times when you don't want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="quiet-enabled">Enable Quiet Hours</Label>
                <p className="text-sm text-muted-foreground">Pause notifications during specified times</p>
              </div>
              <Switch
                id="quiet-enabled"
                checked={formData.quietHoursEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, quietHoursEnabled: checked })}
              />
            </div>

            {formData.quietHoursEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={formData.quietHoursStart}
                      onChange={(e) => setFormData({ ...formData, quietHoursStart: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end">End Time</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={formData.quietHoursEnd}
                      onChange={(e) => setFormData({ ...formData, quietHoursEnd: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={formData.timezone} 
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Riyadh">Asia/Riyadh (KSA)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (UAE)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (UK)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
