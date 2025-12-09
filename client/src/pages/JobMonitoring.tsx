import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function JobMonitoring() {
  const [periodStart, setPeriodStart] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() - 24);
    return date.toISOString().split("T")[0];
  });

  const [periodEnd, setPeriodEnd] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [selectedJob, setSelectedJob] = useState<string | undefined>(undefined);

  // Fetch system health
  const { data: health, isLoading: healthLoading } =
    trpc.jobMonitoring.getSystemHealth.useQuery();

  // Fetch job names
  const { data: jobNames, isLoading: jobNamesLoading } =
    trpc.jobMonitoring.getAllJobNames.useQuery();

  // Fetch execution timeline
  const { data: timeline, isLoading: timelineLoading } =
    trpc.jobMonitoring.getExecutionTimeline.useQuery({
      periodStart,
      periodEnd,
      jobName: selectedJob,
    });

  // Fetch stats by hour
  const { data: statsByHour, isLoading: statsLoading } =
    trpc.jobMonitoring.getStatsByHour.useQuery({
      periodStart,
      periodEnd,
    });

  // Fetch job metrics if a job is selected
  const { data: jobMetrics } = trpc.jobMonitoring.getJobMetrics.useQuery(
    {
      jobName: selectedJob || "",
      periodStart,
      periodEnd,
    },
    {
      enabled: !!selectedJob,
    }
  );

  const isLoading = healthLoading || jobNamesLoading || timelineLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hourlyChartData = statsByHour
    ? {
        labels: statsByHour.map((s) => new Date(s.hour).toLocaleTimeString()),
        datasets: [
          {
            label: "Success",
            data: statsByHour.map((s) => s.success),
            backgroundColor: "rgba(16, 185, 129, 0.5)",
            borderColor: "rgb(16, 185, 129)",
            borderWidth: 1,
          },
          {
            label: "Failed",
            data: statsByHour.map((s) => s.failed),
            backgroundColor: "rgba(239, 68, 68, 0.5)",
            borderColor: "rgb(239, 68, 68)",
            borderWidth: 1,
          },
        ],
      }
    : null;

  const durationChartData = statsByHour
    ? {
        labels: statsByHour.map((s) => new Date(s.hour).toLocaleTimeString()),
        datasets: [
          {
            label: "Avg Duration (ms)",
            data: statsByHour.map((s) => s.avgDuration),
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
          },
        ],
      }
    : null;

  const healthColor =
    health?.overallHealth === "healthy"
      ? "text-green-600"
      : health?.overallHealth === "degraded"
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of scheduled jobs and system health
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${healthColor}`}>
              {health?.overallHealth.toUpperCase()}
            </div>
            <p className="text-xs text-muted-foreground">
              {health?.averageSuccessRate.toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.activeJobs}</div>
            <p className="text-xs text-muted-foreground">Currently running or pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed (24h)</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {health?.failedJobsLast24h}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slowest Job</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.slowestJob?.duration
                ? `${(health.slowestJob.duration / 1000).toFixed(1)}s`
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {health?.slowestJob?.name || "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Failures */}
      {health && health.recentFailures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Failures</CardTitle>
            <CardDescription>Jobs that failed in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {health.recentFailures.map((failure, index) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{failure.jobName}</AlertTitle>
                <AlertDescription>
                  <p className="text-sm">{failure.errorMessage}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(failure.timestamp).toLocaleString()}
                  </p>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Job Selection and Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Job Selection</CardTitle>
          <CardDescription>Select a job to view detailed metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedJob === undefined ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedJob(undefined)}
            >
              All Jobs
            </Badge>
            {jobNames?.map((jobName) => (
              <Badge
                key={jobName}
                variant={selectedJob === jobName ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedJob(jobName)}
              >
                {jobName}
              </Badge>
            ))}
          </div>

          {jobMetrics && selectedJob && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Success Rate</span>
                </div>
                <div className="text-2xl font-bold">{jobMetrics.successRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {jobMetrics.successCount} / {jobMetrics.totalExecutions} executions
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Avg Duration</span>
                </div>
                <div className="text-2xl font-bold">
                  {(jobMetrics.averageDuration / 1000).toFixed(2)}s
                </div>
                <p className="text-xs text-muted-foreground">Average execution time</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Last Status</span>
                </div>
                <div className="text-2xl font-bold">{jobMetrics.lastStatus || "N/A"}</div>
                <p className="text-xs text-muted-foreground">
                  {jobMetrics.lastExecution
                    ? new Date(jobMetrics.lastExecution).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="hourly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hourly">Hourly Stats</TabsTrigger>
          <TabsTrigger value="duration">Duration Trend</TabsTrigger>
          <TabsTrigger value="timeline">Execution Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="hourly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Execution Stats</CardTitle>
              <CardDescription>Success and failure counts by hour</CardDescription>
            </CardHeader>
            <CardContent>
              {hourlyChartData && (
                <Bar data={hourlyChartData} options={{ responsive: true }} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="duration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Duration Trend</CardTitle>
              <CardDescription>Job execution duration over time</CardDescription>
            </CardHeader>
            <CardContent>
              {durationChartData && (
                <Line data={durationChartData} options={{ responsive: true }} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Timeline</CardTitle>
              <CardDescription>Recent job executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeline && timeline.length > 0 ? (
                  timeline.map((execution, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {execution.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : execution.status === "failed" ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium">{execution.jobName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(execution.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Duration:</span>{" "}
                          {(execution.duration / 1000).toFixed(2)}s
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success:</span>{" "}
                          {execution.successCount}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Failed:</span>{" "}
                          {execution.failureCount}
                        </div>
                        <Badge
                          variant={
                            execution.status === "completed"
                              ? "default"
                              : execution.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {execution.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No executions found for selected period
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
