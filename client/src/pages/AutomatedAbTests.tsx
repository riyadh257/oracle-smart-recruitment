import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, TrendingUp, Play, Pause, X } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AutomatedAbTests() {
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [schedulingStrategy, setSchedulingStrategy] = useState<"peak_hours" | "off_peak" | "balanced" | "custom">("peak_hours");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: schedules, isLoading, refetch } = trpc.automatedAbTest.getSchedules.useQuery({});
  const { data: peakHoursData } = trpc.automatedAbTest.getPeakHours.useQuery({ lookbackDays: 30 });
  const { data: abTests } = trpc.ruleAbTesting.list.useQuery({});

  const createScheduleMutation = trpc.automatedAbTest.createSchedule.useMutation({
    onSuccess: (data) => {
      toast.success(`Test scheduled to start at ${new Date(data.scheduledStartTime!).toLocaleString()}`);
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create schedule: ${error.message}`);
    },
  });

  const activateMutation = trpc.automatedAbTest.activateScheduledTest.useMutation({
    onSuccess: () => {
      toast.success("Test activated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to activate: ${error.message}`);
    },
  });

  const deactivateMutation = trpc.automatedAbTest.deactivateScheduledTest.useMutation({
    onSuccess: () => {
      toast.success("Test deactivated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to deactivate: ${error.message}`);
    },
  });

  const cancelMutation = trpc.automatedAbTest.cancelSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule cancelled");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to cancel: ${error.message}`);
    },
  });

  const handleCreateSchedule = () => {
    if (!selectedTestId) {
      toast.error("Please select a test");
      return;
    }

    createScheduleMutation.mutate({
      testId: selectedTestId,
      schedulingStrategy,
      autoActivate: true,
      autoDeactivate: true,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Automated A/B Test Scheduling</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule New Test
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule A/B Test</DialogTitle>
                <DialogDescription>
                  Automatically schedule tests during peak hours for maximum impact
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Test</Label>
                  <Select
                    value={selectedTestId?.toString()}
                    onValueChange={(value) => setSelectedTestId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an A/B test" />
                    </SelectTrigger>
                    <SelectContent>
                      {abTests?.map((test: any) => (
                        <SelectItem key={test.id} value={test.id.toString()}>
                          {test.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scheduling Strategy</Label>
                  <Select
                    value={schedulingStrategy}
                    onValueChange={(value: any) => setSchedulingStrategy(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peak_hours">Peak Hours (Recommended)</SelectItem>
                      <SelectItem value="off_peak">Off-Peak Hours</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreateSchedule}
                  disabled={createScheduleMutation.isPending}
                  className="w-full"
                >
                  {createScheduleMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Peak Hours Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Peak Hours Detected
              </CardTitle>
              <CardDescription>Based on last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {peakHoursData?.peakHours && peakHoursData.peakHours.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {peakHoursData.peakHours.map((hour) => (
                    <Badge key={hour} variant="secondary">
                      {hour}:00 - {hour + 1}:00
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not enough data to detect peak hours
                </p>
              )}
            </CardContent>
          </Card>

          {/* Active Schedules */}
          <Card>
            <CardHeader>
              <CardTitle>Active Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {schedules?.filter((s) => s.status === "active").length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          {/* Pending Schedules */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {schedules?.filter((s) => s.status === "scheduled").length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Waiting to start</p>
            </CardContent>
          </Card>
        </div>

        {/* Schedules List */}
        <Card>
          <CardHeader>
            <CardTitle>All Schedules</CardTitle>
            <CardDescription>Manage your automated A/B test schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedules && schedules.length > 0 ? (
                schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 border rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Test ID: {schedule.testId}</h3>
                        <Badge
                          variant={
                            schedule.status === "active"
                              ? "default"
                              : schedule.status === "completed"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {schedule.status}
                        </Badge>
                        <Badge variant="outline">{schedule.schedulingStrategy}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {schedule.scheduledStartTime && (
                          <p>
                            Scheduled Start: {new Date(schedule.scheduledStartTime).toLocaleString()}
                          </p>
                        )}
                        {schedule.scheduledEndTime && (
                          <p>
                            Scheduled End: {new Date(schedule.scheduledEndTime).toLocaleString()}
                          </p>
                        )}
                        {schedule.actualStartTime && (
                          <p>
                            Actual Start: {new Date(schedule.actualStartTime).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {schedule.status === "scheduled" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => activateMutation.mutate({ scheduleId: schedule.id })}
                            disabled={activateMutation.isPending}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Activate Now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelMutation.mutate({ scheduleId: schedule.id })}
                            disabled={cancelMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                      {schedule.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deactivateMutation.mutate({ scheduleId: schedule.id })}
                          disabled={deactivateMutation.isPending}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No schedules created yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
