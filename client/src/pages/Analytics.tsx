import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { BarChart3, Download, TrendingUp, Users, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { toast } from "sonner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type Period = "7d" | "30d" | "90d" | "1y";

export default function Analytics() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  // Fetch all analytics data
  const { data: overview, isLoading: overviewLoading } = trpc.analytics.getOverviewMetrics.useQuery({ period });
  const { data: notifications, isLoading: notificationsLoading } = trpc.analytics.getNotificationMetrics.useQuery({ period });
  const { data: enrichment, isLoading: enrichmentLoading } = trpc.analytics.getEnrichmentMetrics.useQuery({ period });
  const { data: bulkOps, isLoading: bulkOpsLoading } = trpc.analytics.getBulkOperationsMetrics.useQuery({ period });
  const { data: timeSeries, isLoading: timeSeriesLoading } = trpc.analytics.getTimeSeriesData.useQuery({
    period,
    metrics: ["candidates", "applications", "interviews", "hires"],
  });
  const { data: funnel, isLoading: funnelLoading } = trpc.analytics.getCandidateFunnel.useQuery({ period });

  const exportMutation = trpc.analytics.exportAnalytics.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.data], { type: data.format === "csv" ? "text/csv" : "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Analytics exported as ${data.format.toUpperCase()}`);
    },
    onError: () => {
      toast.error("Failed to export analytics");
    },
  });

  const handleExport = () => {
    exportMutation.mutate({ period, format: exportFormat });
  };

  const isLoading = authLoading || overviewLoading;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view analytics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Prepare time series chart data
  const timeSeriesChartData = {
    labels: timeSeries?.data.map((d) => new Date(d.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: "Candidates",
        data: timeSeries?.data.map((d) => d.candidates) || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
      },
      {
        label: "Applications",
        data: timeSeries?.data.map((d) => d.applications) || [],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
      },
      {
        label: "Interviews",
        data: timeSeries?.data.map((d) => d.interviews) || [],
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        fill: true,
      },
      {
        label: "Hires",
        data: timeSeries?.data.map((d) => d.hires) || [],
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
      },
    ],
  };

  // Prepare notification engagement chart data
  const notificationChartData = {
    labels: ["Delivered", "Opened", "Clicked"],
    datasets: [
      {
        data: [
          notifications?.deliveryRate || 0,
          notifications?.openRate || 0,
          notifications?.clickRate || 0,
        ],
        backgroundColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(245, 158, 11)"],
      },
    ],
  };

  // Prepare enrichment success chart data
  const enrichmentChartData = {
    labels: enrichment?.byType.map((t) => t.type) || [],
    datasets: [
      {
        label: "Completion Rate (%)",
        data: enrichment?.byType.map((t) => t.completionRate) || [],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
      },
      {
        label: "Avg Confidence (%)",
        data: enrichment?.byType.map((t) => t.avgConfidence) || [],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
      },
    ],
  };

  // Prepare bulk operations chart data
  const bulkOpsChartData = {
    labels: bulkOps?.byType.map((t) => t.type) || [],
    datasets: [
      {
        label: "Success Rate (%)",
        data: bulkOps?.byType.map((t) => t.successRate) || [],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
      },
    ],
  };

  // Prepare funnel chart data
  const funnelChartData = {
    labels: funnel?.stages.map((s) => s.stage) || [],
    datasets: [
      {
        label: "Candidates",
        data: funnel?.stages.map((s) => s.count) || [],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(139, 92, 246, 0.8)",
        ],
      },
    ],
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into recruitment performance and system metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "csv" | "json")}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalCandidates || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.newCandidates || 0} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time-to-Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.avgTimeToHire || 0} days</div>
            <p className="text-xs text-muted-foreground">
              From application to hire
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalInterviews || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.completedInterviews || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hires</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalHires || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.hireRate ? `${overview.hireRate.toFixed(1)}% conversion` : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="enrichment">Enrichment</TabsTrigger>
          <TabsTrigger value="bulkops">Bulk Operations</TabsTrigger>
          <TabsTrigger value="funnel">Candidate Funnel</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recruitment Trends</CardTitle>
              <CardDescription>
                Track candidates, applications, interviews, and hires over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeSeriesLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-80">
                  <Line
                    data={timeSeriesChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "top" },
                        title: { display: false },
                      },
                      scales: {
                        y: { beginAtZero: true },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>Current application distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Pending</span>
                    </div>
                    <span className="font-semibold">{overview?.pendingApplications || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Approved</span>
                    </div>
                    <span className="font-semibold">{overview?.approvedApplications || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Rejected</span>
                    </div>
                    <span className="font-semibold">{overview?.rejectedApplications || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interview Status</CardTitle>
                <CardDescription>Current interview distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Scheduled</span>
                    </div>
                    <span className="font-semibold">{overview?.scheduledInterviews || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Completed</span>
                    </div>
                    <span className="font-semibold">{overview?.completedInterviews || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Cancelled</span>
                    </div>
                    <span className="font-semibold">{overview?.cancelledInterviews || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Notification Engagement</CardTitle>
                <CardDescription>Overall delivery and engagement rates</CardDescription>
              </CardHeader>
              <CardContent>
                {notificationsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="h-64">
                    <Doughnut
                      data={notificationChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: "bottom" },
                        },
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Metrics</CardTitle>
                <CardDescription>Detailed engagement statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Delivery Rate</span>
                      <span className="text-sm font-bold">{notifications?.deliveryRate.toFixed(1) || 0}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${notifications?.deliveryRate || 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Open Rate</span>
                      <span className="text-sm font-bold">{notifications?.openRate.toFixed(1) || 0}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${notifications?.openRate || 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Click Rate</span>
                      <span className="text-sm font-bold">{notifications?.clickRate.toFixed(1) || 0}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${notifications?.clickRate || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Sent</span>
                      <span className="text-lg font-bold">{notifications?.totalSent || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Notifications by Type</CardTitle>
              <CardDescription>Performance breakdown by notification type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications?.byType.map((type) => (
                  <div key={type.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{type.type.replace(/_/g, " ")}</span>
                      <span className="text-sm text-muted-foreground">{type.count} sent</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Delivery: </span>
                        <span className="font-semibold">{type.deliveryRate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Open: </span>
                        <span className="font-semibold">{type.openRate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Click: </span>
                        <span className="font-semibold">{type.clickRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrichment Tab */}
        <TabsContent value="enrichment" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Enrichments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{enrichment?.totalEnrichments || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {enrichment?.completedEnrichments || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{enrichment?.completionRate.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {enrichment?.failedEnrichments || 0} failed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{enrichment?.avgConfidence.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Data quality score
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Enrichment Performance by Type</CardTitle>
              <CardDescription>Completion rate and confidence scores</CardDescription>
            </CardHeader>
            <CardContent>
              {enrichmentLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-80">
                  <Bar
                    data={enrichmentChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: "top" },
                      },
                      scales: {
                        y: { beginAtZero: true, max: 100 },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulkops" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{bulkOps?.totalOperations || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {bulkOps?.completedOperations || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{bulkOps?.successRate.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {bulkOps?.failedOperations || 0} failed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{bulkOps?.totalItems || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Processed across all operations
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Success Rate by Operation Type</CardTitle>
              <CardDescription>Performance breakdown by operation type</CardDescription>
            </CardHeader>
            <CardContent>
              {bulkOpsLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-80">
                  <Bar
                    data={bulkOpsChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        y: { beginAtZero: true, max: 100 },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operations by Type</CardTitle>
              <CardDescription>Detailed statistics for each operation type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bulkOps?.byType.map((type) => (
                  <div key={type.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{type.type.replace(/_/g, " ")}</span>
                      <span className="text-sm text-muted-foreground">{type.count} operations</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Success: </span>
                        <span className="font-semibold">{type.successRate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Items: </span>
                        <span className="font-semibold">{type.totalItems}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Time: </span>
                        <span className="font-semibold">{type.avgProcessingTime.toFixed(1)}s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Conversion Funnel</CardTitle>
              <CardDescription>Track candidates through the recruitment pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-80">
                  <Bar
                    data={funnelChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: "y",
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        x: { beginAtZero: true },
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion Rates</CardTitle>
              <CardDescription>Stage-to-stage conversion percentages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnel?.stages.map((stage, index) => (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{stage.stage}</span>
                      <span className="text-sm font-bold">{stage.count} candidates</span>
                    </div>
                    {index < (funnel?.stages.length || 0) - 1 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>
                          {stage.conversionRate.toFixed(1)}% conversion to next stage
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
