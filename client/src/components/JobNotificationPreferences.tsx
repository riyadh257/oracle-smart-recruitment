import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Settings, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function JobNotificationPreferences() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  
  const { data: jobs } = trpc.jobs.list.useQuery();
  const { data: preferences, isLoading } = trpc.notificationPreferences.list.useQuery();

  const upsertPreference = trpc.notificationPreferences.upsert.useMutation({
    onSuccess: () => {
      utils.jobNotificationPreferences.list.invalidate();
      toast.success("Preferences updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update preferences: ${error.message}`);
    },
  });

  const deletePreference = trpc.notificationPreferences.delete.useMutation({
    onSuccess: () => {
      utils.jobNotificationPreferences.list.invalidate();
      toast.success("Job-specific preferences removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove preferences: ${error.message}`);
    },
  });

  const handleAddJobPreference = () => {
    if (!selectedJobId) {
      toast.error("Please select a job");
      return;
    }

    upsertPreference.mutate({
      jobId: selectedJobId,
      frequency: "immediate",
      feedbackSubmitted: true,
      interviewScheduled: true,
      candidateStatusChange: true,
    });

    setIsAddDialogOpen(false);
    setSelectedJobId(null);
  };

  const handleUpdatePreference = (
    jobId: number,
    field: "frequency" | "feedbackSubmitted" | "interviewScheduled" | "candidateStatusChange",
    value: any
  ) => {
    upsertPreference.mutate({
      jobId,
      [field]: value,
    });
  };

  const handleDeletePreference = (jobId: number) => {
    if (confirm("Remove job-specific notification preferences? You'll receive notifications based on your global settings.")) {
      deletePreference.mutate({ jobId });
    }
  };

  const getJobTitle = (jobId: number) => {
    return jobs?.find((j) => j.id === jobId)?.title || `Job #${jobId}`;
  };

  const availableJobs = jobs?.filter(
    (job) => !preferences?.some((pref) => pref.jobId === job.id)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Per-Job Notification Preferences
            </CardTitle>
            <CardDescription>
              Set different notification frequencies for specific job positions
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Job-Specific Preferences</DialogTitle>
                <DialogDescription>
                  Choose a job position to customize notification settings
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="job-select">Select Job</Label>
                <Select
                  value={selectedJobId?.toString()}
                  onValueChange={(value) => setSelectedJobId(parseInt(value))}
                >
                  <SelectTrigger id="job-select" className="mt-2">
                    <SelectValue placeholder="Choose a job position" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableJobs && availableJobs.length > 0 ? (
                      availableJobs.map((job) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title} - {job.department}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        All jobs have custom preferences
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddJobPreference}
                  disabled={!selectedJobId || upsertPreference.isPending}
                >
                  Add Preferences
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : preferences && preferences.length > 0 ? (
          <div className="space-y-4">
            {preferences.map((pref) => (
              <div key={pref.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{getJobTitle(pref.jobId)}</h3>
                    <p className="text-sm text-muted-foreground">
                      Job ID: {pref.jobId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={pref.frequency === "immediate" ? "default" : "secondary"}
                    >
                      {pref.frequency === "immediate" ? "Immediate" : "Daily Digest"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePreference(pref.jobId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`frequency-${pref.id}`} className="text-sm">
                      Notification Frequency
                    </Label>
                    <Select
                      value={pref.frequency}
                      onValueChange={(value: "immediate" | "daily-digest") =>
                        handleUpdatePreference(pref.jobId, "frequency", value)
                      }
                    >
                      <SelectTrigger id={`frequency-${pref.id}`} className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="daily-digest">Daily Digest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`feedback-${pref.id}`} className="text-sm">
                      Feedback Submitted
                    </Label>
                    <Switch
                      id={`feedback-${pref.id}`}
                      checked={pref.feedbackSubmitted}
                      onCheckedChange={(checked) =>
                        handleUpdatePreference(pref.jobId, "feedbackSubmitted", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`interview-${pref.id}`} className="text-sm">
                      Interview Scheduled
                    </Label>
                    <Switch
                      id={`interview-${pref.id}`}
                      checked={pref.interviewScheduled}
                      onCheckedChange={(checked) =>
                        handleUpdatePreference(pref.jobId, "interviewScheduled", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`status-${pref.id}`} className="text-sm">
                      Candidate Status Change
                    </Label>
                    <Switch
                      id={`status-${pref.id}`}
                      checked={pref.candidateStatusChange}
                      onCheckedChange={(checked) =>
                        handleUpdatePreference(pref.jobId, "candidateStatusChange", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">
              No job-specific preferences configured
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Add custom notification settings for specific job positions
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Job Preference
            </Button>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-medium text-blue-900 mb-2">How it works</p>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>
              Set <strong>Immediate</strong> for senior roles or urgent positions to get notified right away
            </li>
            <li>
              Use <strong>Daily Digest</strong> for junior positions or high-volume roles to reduce notification fatigue
            </li>
            <li>
              Job-specific settings override your global notification preferences
            </li>
            <li>
              Remove job preferences to fall back to global settings
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
