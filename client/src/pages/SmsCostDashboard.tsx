import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign, MessageSquare, CheckCircle, XCircle, TrendingUp, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Line, Doughnut, Bar } from "react-chartjs-2";
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

// Register Chart.js components
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

type DateRange = "7d" | "30d" | "90d" | "1y";

export default function SmsCostDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [dateRange]);

  // Fetch SMS cost analytics
  const { data: analytics, isLoading, error } = trpc.phase26.smsCost.getCostAnalytics.useQuery({
    startDate,
    endDate,
  });

  // Fetch SMS logs for trend visualization
  const { data: logs } = trpc.phase26.smsCost.getLogsByDateRange.useQuery({
    startDate,
    endDate,
  });

  // Calculate metrics
  const totalCost = analytics?.summary?.totalCost ? Number(analytics.summary.totalCost) / 100 : 0;
  const totalSent = analytics?.summary?.totalSent ? Number(analytics.summary.totalSent) : 0;
  const totalDelivered = analytics?.summary?.totalDelivered ? Number(analytics.summary.totalDelivered) : 0;
  const totalFailed = analytics?.summary?.totalFailed ? Number(analytics.summary.totalFailed) : 0;
  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : "0.0";
  const avgCostPerSms = totalSent > 0 ? (totalCost / totalSent).toFixed(4) : "0.0000";

  // Prepare chart data for cost by purpose
  const purposeChartData = useMemo(() => {
    if (!analytics?.byPurpose) return null;

    const labels = analytics.byPurpose.map((item) => 
      item.purpose.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
    const costs = analytics.byPurpose.map((item) => Number(item.totalCost) / 100);
    const counts = analytics.byPurpose.map((item) => Number(item.totalSent));

    return {
      labels,
      datasets: [
        {
          label: "Cost ($)",
          data: costs,
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(236, 72, 153, 0.8)",
          ],
          borderColor: [
            "rgb(59, 130, 246)",
            "rgb(16, 185, 129)",
            "rgb(245, 158, 11)",
            "rgb(239, 68, 68)",
            "rgb(139, 92, 246)",
            "rgb(236, 72, 153)",
          ],
          borderWidth: 2,
        },
      ],
      counts,
    };
  }, [analytics]);

  // Prepare trend chart data
  const trendChartData = useMemo(() => {
    if (!logs || logs.length === 0) return null;

    // Group logs by date
    const dateMap = new Map<string, { cost: number; count: number }>();
    
    logs.forEach((log) => {
      const date = new Date(log.createdAt).toLocaleDateString();
      const existing = dateMap.get(date) || { cost: 0, count: 0 };
      dateMap.set(date, {
        cost: existing.cost + (Number(log.cost) / 100),
        count: existing.count + 1,
      });
    });

    const sortedDates = Array.from(dateMap.keys()).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    return {
      labels: sortedDates,
      datasets: [
        {
          label: "Daily Cost ($)",
          data: sortedDates.map((date) => dateMap.get(date)!.cost),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "SMS Count",
          data: sortedDates.map((date) => dateMap.get(date)!.count),
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    };
  }, [logs]);

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            Failed to load SMS cost analytics. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMS Cost Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor Twilio SMS costs, delivery rates, and usage trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg ${avgCostPerSms}/SMS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.summary?.totalSegments ? Number(analytics.summary.totalSegments).toLocaleString() : 0} segments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalDelivered.toLocaleString()} delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Messages</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFailed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalSent > 0 ? ((totalFailed / totalSent) * 100).toFixed(1) : "0.0"}% failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost Trend Chart */}
        {trendChartData && (
          <Card>
            <CardHeader>
              <CardTitle>Cost & Usage Trends</CardTitle>
              <CardDescription>Daily SMS cost and message count over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Line
                  data={trendChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: "index",
                      intersect: false,
                    },
                    scales: {
                      y: {
                        type: "linear",
                        display: true,
                        position: "left",
                        title: {
                          display: true,
                          text: "Cost ($)",
                        },
                      },
                      y1: {
                        type: "linear",
                        display: true,
                        position: "right",
                        title: {
                          display: true,
                          text: "SMS Count",
                        },
                        grid: {
                          drawOnChartArea: false,
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        position: "top",
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            let label = context.dataset.label || "";
                            if (label) {
                              label += ": ";
                            }
                            if (context.parsed.y !== null) {
                              if (context.datasetIndex === 0) {
                                label += "$" + context.parsed.y.toFixed(2);
                              } else {
                                label += context.parsed.y.toLocaleString();
                              }
                            }
                            return label;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cost by Purpose Chart */}
        {purposeChartData && (
          <Card>
            <CardHeader>
              <CardTitle>Cost by Purpose</CardTitle>
              <CardDescription>SMS costs breakdown by message purpose</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <Doughnut
                  data={purposeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right",
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || "";
                            const value = context.parsed;
                            const count = purposeChartData.counts[context.dataIndex];
                            return [
                              `${label}: $${value.toFixed(2)}`,
                              `Messages: ${count.toLocaleString()}`,
                            ];
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Budget Alert Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cost Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Projected Monthly Cost</p>
              <p className="text-2xl font-bold mt-1">
                ${((totalCost / (dateRange === "30d" ? 30 : dateRange === "7d" ? 7 : dateRange === "90d" ? 90 : 365)) * 30).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Daily Cost</p>
              <p className="text-2xl font-bold mt-1">
                ${(totalCost / (dateRange === "30d" ? 30 : dateRange === "7d" ? 7 : dateRange === "90d" ? 90 : 365)).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cost Efficiency</p>
              <p className="text-2xl font-bold mt-1">
                {deliveryRate}%
              </p>
              <p className="text-xs text-muted-foreground">delivery success rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
