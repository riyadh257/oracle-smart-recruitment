import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  RefreshCw,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useJobMonitoring } from "@/hooks/useJobMonitoring";
import { useEffect } from "react";

type JobExecution = {
  id: number;
  jobName: string;
  jobType: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  triggeredBy: number | null;
  triggerType: string;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  processedRecords: number;
  errorMessage: string | null;
  stackTrace: string | null;
  logOutput: string | null;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  metadata: any;
  performanceMetrics: any;
  createdAt: string;
  updatedAt: string;
};

export default function JobExecutionHistory() {
  const [selectedExecution, setSelectedExecution] = useState<JobExecution | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const utils = trpc.useUtils();
  const { isConnected, jobUpdates, getJobStatus } = useJobMonitoring();

  // Auto-refresh when job updates are received
  useEffect(() => {
    if (jobUpdates.length > 0) {
      utils.phase26.jobExecution.getRecent.invalidate();
      utils.phase26.jobExecution.getStats.invalidate();
    }
  }, [jobUpdates, utils]);

  // Fetch recent job executions
  const { data: executions, isLoading, error } = trpc.phase26.jobExecution.getRecent.useQuery({
    limit: 100,
  });

  // Fetch job execution stats
  const { data: stats } = trpc.phase26.jobExecution.getStats.useQuery({});

  // Retry mutation
  const retryMutation = trpc.phase26.jobExecution.retry.useMutation({
    onSuccess: () => {
      toast.success("Job execution retry scheduled");
      utils.phase26.jobExecution.getRecent.invalidate();
      utils.phase26.jobExecution.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to retry job execution");
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      completed: { variant: "default", icon: CheckCircle },
      running: { variant: "secondary", icon: Play },
      failed: { variant: "destructive", icon: XCircle },
      pending: { variant: "outline", icon: Clock },
      cancelled: { variant: "outline", icon: AlertCircle },
      timeout: { variant: "destructive", icon: AlertTriangle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString();
  };

  const handleRetry = (execution: JobExecution) => {
    if (window.confirm(`Retry job execution "${execution.jobName}"?`)) {
      retryMutation.mutate({ id: execution.id });
    }
  };

  const handleViewDetails = (execution: JobExecution) => {
    setSelectedExecution(execution);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load job execution history. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalExecutions = stats?.totalExecutions ? Number(stats.totalExecutions) : 0;
  const completedCount = stats?.completedCount ? Number(stats.completedCount) : 0;
  const failedCount = stats?.failedCount ? Number(stats.failedCount) : 0;
  const runningCount = stats?.runningCount ? Number(stats.runningCount) : 0;
  const avgDuration = stats?.avgDuration ? Number(stats.avgDuration) : 0;
  const successRate = totalExecutions > 0 ? ((completedCount / totalExecutions) * 100).toFixed(1) : "0.0";

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Execution History</h1>
          <p className="text-muted-foreground mt-1">
            Monitor automated job performance, failures, and retry status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            <span className="text-muted-foreground">
              {isConnected ? "Live Updates" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {runningCount} currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedCount.toLocaleString()} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalExecutions > 0 ? ((failedCount / totalExecutions) * 100).toFixed(1) : "0.0"}% failure rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(avgDuration)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalProcessedRecords ? Number(stats.totalProcessedRecords).toLocaleString() : 0} records processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Execution Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>Last 100 job executions across all automated tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Success/Fail</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions && executions.length > 0 ? (
                  executions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell className="font-medium">{execution.jobName}</TableCell>
                      <TableCell>{getStatusBadge(execution.status)}</TableCell>
                      <TableCell className="capitalize">{execution.jobType}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(execution.startedAt)}
                      </TableCell>
                      <TableCell>{formatDuration(execution.duration)}</TableCell>
                      <TableCell>{execution.processedRecords.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600">{execution.successCount}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-red-600">{execution.failureCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(execution)}
                          >
                            Details
                          </Button>
                          {execution.status === "failed" && execution.retryCount < execution.maxRetries && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetry(execution)}
                              disabled={retryMutation.isPending}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No job executions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Execution Details</DialogTitle>
            <DialogDescription>
              {selectedExecution?.jobName} - {formatDate(selectedExecution?.createdAt || null)}
            </DialogDescription>
          </DialogHeader>

          {selectedExecution && (
            <div className="space-y-6">
              {/* Status & Timing */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedExecution.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="text-lg font-semibold mt-1">{formatDuration(selectedExecution.duration)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Started At</p>
                  <p className="text-sm mt-1">{formatDate(selectedExecution.startedAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed At</p>
                  <p className="text-sm mt-1">{formatDate(selectedExecution.completedAt)}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processed</p>
                  <p className="text-2xl font-bold mt-1">{selectedExecution.processedRecords}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{selectedExecution.successCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{selectedExecution.failureCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Skipped</p>
                  <p className="text-2xl font-bold text-gray-600 mt-1">{selectedExecution.skippedCount}</p>
                </div>
              </div>

              {/* Retry Info */}
              {selectedExecution.retryCount > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Retry Information</p>
                  <p className="text-sm mt-1">
                    Attempt {selectedExecution.retryCount} of {selectedExecution.maxRetries}
                    {selectedExecution.nextRetryAt && (
                      <> • Next retry: {formatDate(selectedExecution.nextRetryAt)}</>
                    )}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {selectedExecution.errorMessage && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Error Message</p>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-mono text-xs">
                      {selectedExecution.errorMessage}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Stack Trace */}
              {selectedExecution.stackTrace && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Stack Trace</p>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto max-h-64">
                    {selectedExecution.stackTrace}
                  </pre>
                </div>
              )}

              {/* Log Output */}
              {selectedExecution.logOutput && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Log Output</p>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto max-h-64">
                    {selectedExecution.logOutput}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {selectedExecution.metadata && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Metadata</p>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(selectedExecution.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
