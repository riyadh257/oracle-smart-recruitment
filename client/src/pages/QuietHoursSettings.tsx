import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Moon, Plane, Trash2, Calendar } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * Quiet Hours & Vacation Mode Settings
 * 
 * Allows users to:
 * - Configure quiet hours to prevent digests during specified times
 * - Set vacation mode to pause all digests for a date range
 * - View skip history
 */
export default function QuietHoursSettings() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");
  const [showVacationDialog, setShowVacationDialog] = useState(false);

  const { data: quietHours, isLoading: quietHoursLoading } = trpc.digestEnhancements.getQuietHours.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: vacationModes, isLoading: vacationLoading } = trpc.digestEnhancements.getVacationModes.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: skipHistory, isLoading: skipHistoryLoading } = trpc.digestEnhancements.getSkipHistory.useQuery(undefined, {
    enabled: !!user,
  });

  const updateQuietHours = trpc.digestEnhancements.upsertQuietHours.useMutation({
    onSuccess: () => {
      toast.success("Quiet hours updated successfully");
      utils.digestEnhancements.getQuietHours.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update quiet hours: ${error.message}`);
    },
  });

  const createVacation = trpc.digestEnhancements.createVacationMode.useMutation({
    onSuccess: () => {
      toast.success("Vacation mode created successfully");
      utils.digestEnhancements.getVacationModes.invalidate();
      setShowVacationDialog(false);
      setVacationStart("");
      setVacationEnd("");
    },
    onError: (error) => {
      toast.error(`Failed to create vacation mode: ${error.message}`);
    },
  });

  const deactivateVacation = trpc.digestEnhancements.deactivateVacationMode.useMutation({
    onSuccess: () => {
      toast.success("Vacation mode deactivated");
      utils.digestEnhancements.getVacationModes.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to deactivate vacation mode: ${error.message}`);
    },
  });

  const skipNext = trpc.digestEnhancements.skipNext.useMutation({
    onSuccess: (data) => {
      toast.success(`Next digest scheduled for ${new Date(data.nextScheduled).toLocaleString()} has been skipped`);
      utils.digestEnhancements.getSkipHistory.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to skip digest: ${error.message}`);
    },
  });

  const handleQuietHoursToggle = (enabled: boolean) => {
    if (!quietHours) return;
    
    updateQuietHours.mutate({
      enabled,
      startTime: quietHours.startTime,
      endTime: quietHours.endTime,
      timezone: quietHours.timezone,
    });
  };

  const handleQuietHoursUpdate = (field: "startTime" | "endTime", value: string) => {
    if (!quietHours) return;
    
    updateQuietHours.mutate({
      enabled: quietHours.enabled,
      startTime: field === "startTime" ? value : quietHours.startTime,
      endTime: field === "endTime" ? value : quietHours.endTime,
      timezone: quietHours.timezone,
    });
  };

  const handleCreateVacation = () => {
    if (!vacationStart || !vacationEnd) {
      toast.error("Please select both start and end dates");
      return;
    }

    const start = new Date(vacationStart);
    const end = new Date(vacationEnd);

    if (start >= end) {
      toast.error("End date must be after start date");
      return;
    }

    createVacation.mutate({
      startDate: start,
      endDate: end,
    });
  };

  if (authLoading || quietHoursLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to manage quiet hours settings</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Quiet Hours & Vacation Mode</h1>
          <p className="text-muted-foreground mt-2">
            Control when you receive digest emails
          </p>
        </div>

        <div className="space-y-6">
          {/* Quiet Hours Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5" />
                <CardTitle>Quiet Hours</CardTitle>
              </div>
              <CardDescription>
                Prevent digest emails during specified times (e.g., overnight or during meetings)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="quiet-hours-enabled">Enable Quiet Hours</Label>
                <Switch
                  id="quiet-hours-enabled"
                  checked={quietHours?.enabled || false}
                  onCheckedChange={handleQuietHoursToggle}
                  disabled={updateQuietHours.isPending}
                />
              </div>

              {quietHours?.enabled && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={quietHours.startTime}
                      onChange={(e) => handleQuietHoursUpdate("startTime", e.target.value)}
                      disabled={updateQuietHours.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={quietHours.endTime}
                      onChange={(e) => handleQuietHoursUpdate("endTime", e.target.value)}
                      disabled={updateQuietHours.isPending}
                    />
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    Digests scheduled during quiet hours will be automatically rescheduled to the next available time.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skip Next Digest Card */}
          <Card>
            <CardHeader>
              <CardTitle>Skip Next Digest</CardTitle>
              <CardDescription>
                Temporarily skip your next scheduled digest email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => skipNext.mutate({ reason: "User requested skip" })}
                disabled={skipNext.isPending}
                variant="outline"
              >
                {skipNext.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Skip Next Digest
              </Button>

              {skipHistory && skipHistory.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="font-medium text-sm">Recent Skips</h4>
                  <div className="space-y-2">
                    {skipHistory.slice(0, 5).map((skip) => (
                      <div key={skip.id} className="text-sm text-muted-foreground flex justify-between">
                        <span>Skipped on {new Date(skip.skippedAt).toLocaleDateString()}</span>
                        <span>Originally scheduled: {new Date(skip.originalScheduledTime).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vacation Mode Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5" />
                <CardTitle>Vacation Mode</CardTitle>
              </div>
              <CardDescription>
                Pause all digest emails for a specific date range
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={showVacationDialog} onOpenChange={setShowVacationDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Calendar className="w-4 h-4 mr-2" />
                    Add Vacation Period
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Vacation Mode</DialogTitle>
                    <DialogDescription>
                      Select the date range when you'll be away
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="vacation-start">Start Date</Label>
                      <Input
                        id="vacation-start"
                        type="date"
                        value={vacationStart}
                        onChange={(e) => setVacationStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vacation-end">End Date</Label>
                      <Input
                        id="vacation-end"
                        type="date"
                        value={vacationEnd}
                        onChange={(e) => setVacationEnd(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleCreateVacation}
                      disabled={createVacation.isPending}
                      className="w-full"
                    >
                      {createVacation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create Vacation Mode
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {vacationLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : vacationModes && vacationModes.length > 0 ? (
                <div className="space-y-2">
                  {vacationModes.map((vacation) => {
                    const isActive = vacation.isActive && 
                      new Date(vacation.startDate) <= new Date() && 
                      new Date(vacation.endDate) >= new Date();
                    
                    return (
                      <div
                        key={vacation.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {new Date(vacation.startDate).toLocaleDateString()} - {new Date(vacation.endDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {isActive ? (
                              <span className="text-green-600 font-medium">Active</span>
                            ) : vacation.isActive ? (
                              <span className="text-blue-600">Upcoming</span>
                            ) : (
                              <span className="text-muted-foreground">Completed</span>
                            )}
                          </div>
                        </div>
                        {vacation.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deactivateVacation.mutate({ id: vacation.id })}
                            disabled={deactivateVacation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No vacation periods configured</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
