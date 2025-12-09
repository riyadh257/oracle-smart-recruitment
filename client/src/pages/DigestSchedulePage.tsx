import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  AlertTriangle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Edit,
} from "lucide-react";
import { format } from "date-fns";

export default function DigestSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const { data: previews, refetch, isLoading } = trpc.digestSchedule.getPreviews.useQuery(
    { limit: 10 },
    { enabled: !!user }
  );

  const { data: conflictSummary } = trpc.digestSchedule.getConflictSummary.useQuery(
    undefined,
    { enabled: !!user }
  );

  const generateMutation = trpc.digestSchedule.generatePreviews.useMutation();
  const rescheduleMutation = trpc.digestSchedule.reschedule.useMutation();
  const skipMutation = trpc.digestSchedule.skipDigest.useMutation();
  const bulkRescheduleMutation = trpc.digestSchedule.bulkReschedule.useMutation();

  const handleGenerate = async () => {
    await generateMutation.mutateAsync({ count: 10 });
    refetch();
    toast.success("Schedule previews generated");
  };

  const handleReschedule = async () => {
    if (!selectedSchedule || !newDate || !newTime) {
      toast.error("Please select date and time");
      return;
    }

    await rescheduleMutation.mutateAsync({
      id: selectedSchedule.id,
      newDate: new Date(newDate),
      newTime,
    });

    refetch();
    setIsRescheduleDialogOpen(false);
    setSelectedSchedule(null);
    toast.success("Digest rescheduled");
  };

  const handleSkip = async (id: number) => {
    await skipMutation.mutateAsync({ id });
    refetch();
    toast.success("Digest skipped");
  };

  const handleBulkReschedule = async (hoursOffset: number) => {
    const result = await bulkRescheduleMutation.mutateAsync({ hoursOffset });
    refetch();
    toast.success(`Rescheduled ${result.rescheduled} conflicting digests`);
  };

  const openRescheduleDialog = (schedule: any) => {
    setSelectedSchedule(schedule);
    const date = new Date(schedule.scheduledDate);
    setNewDate(format(date, "yyyy-MM-dd"));
    setNewTime(schedule.scheduledTime);
    setIsRescheduleDialogOpen(true);
  };

  const getConflictBadge = (schedule: any) => {
    if (!schedule.hasConflict) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Clear
        </Badge>
      );
    }

    const colors: Record<string, string> = {
      vacation: "bg-purple-50 text-purple-700 border-purple-200",
      quiet_hours: "bg-yellow-50 text-yellow-700 border-yellow-200",
      overlap: "bg-red-50 text-red-700 border-red-200",
    };

    return (
      <Badge variant="outline" className={colors[schedule.conflictType] || "bg-gray-50"}>
        <AlertTriangle className="h-3 w-3 mr-1" />
        {schedule.conflictType?.replace("_", " ")}
      </Badge>
    );
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Please log in to access digest schedules.</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Digest Schedule Preview</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your upcoming digest schedules
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Generate Preview
          </Button>
        </div>

        {/* Conflict Summary */}
        {conflictSummary && conflictSummary.conflicts > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Schedule Conflicts Detected
              </CardTitle>
              <CardDescription className="text-yellow-700">
                {conflictSummary.conflicts} out of {conflictSummary.total} scheduled digests have
                conflicts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {Object.entries(conflictSummary.conflictsByType).map(([type, count]) => (
                  <Badge key={type} variant="outline">
                    {type.replace("_", " ")}: {count as number}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkReschedule(1)}
                  disabled={bulkRescheduleMutation.isPending}
                >
                  Move +1 hour
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkReschedule(-1)}
                  disabled={bulkRescheduleMutation.isPending}
                >
                  Move -1 hour
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkReschedule(3)}
                  disabled={bulkRescheduleMutation.isPending}
                >
                  Move +3 hours
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule List */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !previews || previews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No schedules yet</h3>
                <p className="text-muted-foreground mb-4">
                  Click "Generate Preview" to see your upcoming digest schedules
                </p>
              </CardContent>
            </Card>
          ) : (
            previews.map((schedule: any, index: number) => {
              const date = new Date(schedule.scheduledDate);
              const isSkipped = schedule.status === "skipped";
              const isRescheduled = schedule.status === "rescheduled";

              return (
                <Card
                  key={schedule.id}
                  className={`${
                    schedule.hasConflict
                      ? "border-yellow-300 bg-yellow-50/30"
                      : "border-gray-200"
                  } ${isSkipped ? "opacity-50" : ""}`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-100 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700">
                            {format(date, "dd")}
                          </div>
                          <div className="text-xs text-blue-600">{format(date, "MMM")}</div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              {format(date, "EEEE, MMMM d, yyyy")}
                            </h3>
                            {getConflictBadge(schedule)}
                            {isRescheduled && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Rescheduled
                              </Badge>
                            )}
                            {isSkipped && (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                                Skipped
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {schedule.scheduledTime} ({schedule.timezone})
                            </span>
                            <span>{schedule.notificationCount} notifications</span>
                          </div>
                          {schedule.hasConflict && schedule.conflictReason && (
                            <p className="text-sm text-yellow-700 mt-2">
                              {schedule.conflictReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!isSkipped && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRescheduleDialog(schedule)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Reschedule
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSkip(schedule.id)}
                              disabled={skipMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Skip
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Reschedule Dialog */}
        <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Digest</DialogTitle>
              <DialogDescription>
                Choose a new date and time for this digest
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
              <Button
                onClick={handleReschedule}
                className="w-full"
                disabled={rescheduleMutation.isPending}
              >
                {rescheduleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Confirm Reschedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
