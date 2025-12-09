import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
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

export default function ComplianceAnalytics() {
  const { user, loading: authLoading } = useAuth();

  // Get employer ID from user
  const { data: employer } = trpc.employer.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user }
  );

  const { data: summary, isLoading: summaryLoading } = trpc.complianceAnalytics.getSummary.useQuery(
    { employerId: employer?.id || 0 },
    { enabled: !!employer }
  );

  const { data: timeSeries, isLoading: timeSeriesLoading } = trpc.complianceAnalytics.getTimeSeries.useQuery(
    { employerId: employer?.id || 0, days: 30 },
    { enabled: !!employer }
  );

  const { data: violations, isLoading: violationsLoading } = trpc.complianceAnalytics.getViolationPatterns.useQuery(
    { employerId: employer?.id || 0, days: 30 },
    { enabled: !!employer }
  );

  const { data: nitaqatProgression, isLoading: nitaqatLoading } = trpc.complianceAnalytics.getNitaqatProgression.useQuery(
    { employerId: employer?.id || 0, months: 12 },
    { enabled: !!employer }
  );

  const { data: permitForecast, isLoading: forecastLoading } = trpc.complianceAnalytics.getPermitForecast.useQuery(
    { employerId: employer?.id || 0, months: 12 },
    { enabled: !!employer }
  );

  if (authLoading || summaryLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !employer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Please log in to access compliance analytics.</p>
        </div>
      </DashboardLayout>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBandColor = (band: string) => {
    switch (band.toLowerCase()) {
      case "platinum":
        return "#9333ea";
      case "green":
        return "#16a34a";
      case "yellow":
        return "#eab308";
      case "red":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Compliance Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Historical trends, violation patterns, and Nitaqat progression
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Total Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary?.totalAlerts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.resolvedAlerts || 0} resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Resolution Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {summary && summary.totalAlerts > 0
                  ? Math.round((summary.resolvedAlerts / summary.totalAlerts) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.resolvedAlerts || 0} of {summary?.totalAlerts || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Resolution Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary?.averageResolutionTime || 0}h</div>
              <p className="text-xs text-muted-foreground mt-1">Average hours to resolve</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Nitaqat Band
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-3xl font-bold"
                style={{ color: getBandColor(summary?.currentNitaqatBand || "Unknown") }}
              >
                {summary?.currentNitaqatBand || "Unknown"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Current status</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Time Series */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts Over Time (Last 30 Days)</CardTitle>
            <CardDescription>Daily compliance alerts by severity</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : timeSeries && timeSeries.length > 0 ? (
              <div style={{ height: "300px" }}>
                <Line
                  data={{
                    labels: timeSeries.map((d) => new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })),
                    datasets: [
                      {
                        label: "Critical",
                        data: timeSeries.map((d) => d.critical),
                        borderColor: "#dc2626",
                        backgroundColor: "rgba(220, 38, 38, 0.1)",
                        fill: true,
                        tension: 0.4,
                      },
                      {
                        label: "Warning",
                        data: timeSeries.map((d) => d.warning),
                        borderColor: "#eab308",
                        backgroundColor: "rgba(234, 179, 8, 0.1)",
                        fill: true,
                        tension: 0.4,
                      },
                      {
                        label: "Info",
                        data: timeSeries.map((d) => d.info),
                        borderColor: "#3b82f6",
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        fill: true,
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">No data available</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Violation Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Violation Patterns</CardTitle>
              <CardDescription>Most common compliance issues and trends</CardDescription>
            </CardHeader>
            <CardContent>
              {violationsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : violations && violations.length > 0 ? (
                <div className="space-y-4">
                  {violations.map((violation) => (
                    <div key={violation.alertType} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {violation.alertType.replace(/_/g, " ")}
                          </span>
                          {getTrendIcon(violation.trend)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${violation.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(violation.percentage)}%
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-2xl font-bold">{violation.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">No violations recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Permit Expiry Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>Work Permit Expiry Forecast</CardTitle>
              <CardDescription>Permits expiring in the next 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {forecastLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : permitForecast && permitForecast.length > 0 ? (
                <div style={{ height: "300px" }}>
                  <Bar
                    data={{
                      labels: permitForecast.map((d) => d.month),
                      datasets: [
                        {
                          label: "Expiring Permits",
                          data: permitForecast.map((d) => d.expiring),
                          backgroundColor: "#3b82f6",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0,
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">No permits expiring</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Nitaqat Band Progression */}
        <Card>
          <CardHeader>
            <CardTitle>Nitaqat Band Progression</CardTitle>
            <CardDescription>Saudization rate and band changes over time</CardDescription>
          </CardHeader>
          <CardContent>
            {nitaqatLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : nitaqatProgression && nitaqatProgression.length > 0 ? (
              <div style={{ height: "300px" }}>
                <Line
                  data={{
                    labels: nitaqatProgression.map((d) => new Date(d.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })),
                    datasets: [
                      {
                        label: "Saudization %",
                        data: nitaqatProgression.map((d) => d.saudizationPercentage),
                        borderColor: "#16a34a",
                        backgroundColor: "rgba(22, 163, 74, 0.1)",
                        fill: true,
                        tension: 0.4,
                        yAxisID: "y",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                      tooltip: {
                        callbacks: {
                          afterLabel: (context) => {
                            const index = context.dataIndex;
                            const data = nitaqatProgression[index];
                            return [
                              `Band: ${data.band.toUpperCase()}`,
                              `Saudi: ${data.saudiEmployees}`,
                              `Total: ${data.totalEmployees}`,
                            ];
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: (value) => `${value}%`,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">No Nitaqat data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
