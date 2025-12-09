import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Play, Pause, Trash2, Loader2, TrendingUp, Mail, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function WarmupScheduler() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWarmup, setNewWarmup] = useState({
    domain: "",
    targetVolume: 1000,
    totalDays: 30,
  });

  const { data: schedules, isLoading, refetch } = trpc.warmup.getSchedules.useQuery({});
  
  const createMutation = trpc.warmup.create.useMutation({
    onSuccess: () => {
      toast.success("Warmup schedule created successfully");
      setIsCreateDialogOpen(false);
      refetch();
      setNewWarmup({ domain: "", targetVolume: 1000, totalDays: 30 });
    },
    onError: (error) => {
      toast.error(`Failed to create warmup: ${error.message}`);
    },
  });

  const pauseMutation = trpc.warmup.pause.useMutation({
    onSuccess: () => {
      toast.success("Warmup paused");
      refetch();
    },
  });

  const resumeMutation = trpc.warmup.resume.useMutation({
    onSuccess: () => {
      toast.success("Warmup resumed");
      refetch();
    },
  });

  const deleteMutation = trpc.warmup.delete.useMutation({
    onSuccess: () => {
      toast.success("Warmup schedule deleted");
      refetch();
    },
  });

  const handleCreate = () => {
    if (!newWarmup.domain) {
      toast.error("Please enter a domain");
      return;
    }
    createMutation.mutate(newWarmup);
  };

  const togglePause = (warmupId: number, currentStatus: string) => {
    if (currentStatus === "active") {
      pauseMutation.mutate({ warmupId });
    } else if (currentStatus === "paused") {
      resumeMutation.mutate({ warmupId });
    }
  };

  const handleDelete = (warmupId: number) => {
    if (confirm("Are you sure you want to delete this warmup schedule?")) {
      deleteMutation.mutate({ warmupId });
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      active: { variant: "default", label: "Active" },
      paused: { variant: "secondary", label: "Paused" },
      completed: { variant: "outline", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
    };
    return config[status] || config.active;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Email Warmup Scheduler</h2>
          <p className="text-sm text-muted-foreground">
            Gradually increase sending volume to build sender reputation
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Warmup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Warmup Schedule</DialogTitle>
              <DialogDescription>
                Set up a gradual sending volume increase for a new domain
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={newWarmup.domain}
                  onChange={(e) => setNewWarmup({ ...newWarmup, domain: e.target.value })}
                  placeholder="example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetVolume">Target Daily Volume</Label>
                <Input
                  id="targetVolume"
                  type="number"
                  value={newWarmup.targetVolume}
                  onChange={(e) => setNewWarmup({ ...newWarmup, targetVolume: parseInt(e.target.value) })}
                  min="100"
                  max="10000"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum emails per day after warmup completion
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalDays">Warmup Duration (Days)</Label>
                <Input
                  id="totalDays"
                  type="number"
                  value={newWarmup.totalDays}
                  onChange={(e) => setNewWarmup({ ...newWarmup, totalDays: parseInt(e.target.value) })}
                  min="14"
                  max="60"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 30 days for optimal reputation building
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>Warmup Schedules</CardTitle>
          <CardDescription>Manage your email domain warmup schedules</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : schedules && schedules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Daily Limit</TableHead>
                  <TableHead>Sent Today</TableHead>
                  <TableHead>Total Sent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule: any) => {
                  const progressPercent = (schedule.currentDay / schedule.totalDays) * 100;
                  return (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.domain}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Day {schedule.currentDay} of {schedule.totalDays}</span>
                            <span>{Math.round(progressPercent)}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {schedule.dailyLimit}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={schedule.sentToday >= schedule.dailyLimit ? "text-orange-600 font-medium" : ""}>
                          {schedule.sentToday}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          {schedule.totalSent.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge {...getStatusBadge(schedule.status)}>
                          {getStatusBadge(schedule.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {schedule.status !== "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePause(schedule.id, schedule.status)}
                            >
                              {schedule.status === "active" ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-12">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No warmup schedules created yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Warmup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Why Email Warmup?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Build Sender Reputation:</strong> Gradually increasing email volume helps email providers recognize you as a legitimate sender.
            </p>
            <p>
              <strong>Avoid Spam Filters:</strong> Sudden high-volume sending from new domains triggers spam filters. Warmup prevents this.
            </p>
            <p>
              <strong>Improve Deliverability:</strong> A proper warmup schedule can improve inbox placement rates by 40-60%.
            </p>
            <p>
              <strong>Recommended Timeline:</strong> 30-day warmup for new domains, starting at 10 emails/day and gradually increasing to your target volume.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
