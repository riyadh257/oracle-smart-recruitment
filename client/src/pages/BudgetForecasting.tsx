import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, DollarSign, Calendar } from "lucide-react";
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

export default function BudgetForecasting() {
  const [periodStart, setPeriodStart] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of month
    return date.toISOString().split("T")[0];
  });

  const [periodEnd, setPeriodEnd] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0); // Last day of month
    return date.toISOString().split("T")[0];
  });

  // Fetch forecast data
  const { data: forecast, isLoading: forecastLoading } =
    trpc.budgetForecasting.generateForecast.useQuery({
      periodStart,
      periodEnd,
    });

  // Fetch current analytics
  const { data: analytics, isLoading: analyticsLoading } =
    trpc.budgetForecasting.getAnalytics.useQuery({
      periodStart,
      periodEnd,
    });

  // Fetch recent alerts
  const { data: alerts, isLoading: alertsLoading } =
    trpc.budgetForecasting.getRecentAlerts.useQuery({
      limit: 10,
    });

  // Fetch thresholds
  const { data: thresholds, isLoading: thresholdsLoading } =
    trpc.budgetForecasting.getThresholds.useQuery();

  const acknowledgeAlertMutation = trpc.budgetForecasting.acknowledgeAlert.useMutation();

  const handleAcknowledgeAlert = async (alertId: number) => {
    await acknowledgeAlertMutation.mutateAsync({ alertId });
    // Refresh alerts
    window.location.reload();
  };

  const isLoading = forecastLoading || analyticsLoading || alertsLoading || thresholdsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const forecastChartData = {
    labels: ["Baseline", "Predicted"],
    datasets: [
      {
        label: "Spending (SAR)",
        data: [forecast?.baselineSpend || 0, forecast?.predictedSpend || 0],
        backgroundColor: ["rgba(59, 130, 246, 0.5)", "rgba(16, 185, 129, 0.5)"],
        borderColor: ["rgb(59, 130, 246)", "rgb(16, 185, 129)"],
        borderWidth: 1,
      },
    ],
  };

  const trendData = analytics
    ? {
        labels: ["Previous Period", "Current Period", "Projected"],
        datasets: [
          {
            label: "SMS Spending (SAR)",
            data: [
              analytics.previousPeriodSpend,
              analytics.currentPeriodSpend,
              analytics.projectedMonthlySpend,
            ],
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
          },
        ],
      }
    : null;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Forecasting</h1>
          <p className="text-muted-foreground">
            Predictive analytics for SMS spending and budget management
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.currentPeriodSpend.toFixed(2)} SAR
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics && analytics.percentageChange > 0 ? (
                <span className="text-red-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{analytics.percentageChange.toFixed(1)}% from last period
                </span>
              ) : (
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {analytics?.percentageChange.toFixed(1)}% from last period
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted Spending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecast?.predictedSpend.toFixed(2)} SAR
            </div>
            <p className="text-xs text-muted-foreground">
              Confidence: {forecast?.confidenceLevel.toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Cost</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.averageDailyCost.toFixed(2)} SAR
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.averageSmsCount.toFixed(0)} SMS/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.daysRemaining}</div>
            <p className="text-xs text-muted-foreground">
              Projected: {analytics?.projectedMonthlySpend.toFixed(2)} SAR
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Alerts</CardTitle>
            <CardDescription>Recent budget threshold notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alertData) => {
              const alert = alertData.alert;
              const threshold = alertData.threshold;

              return (
                <Alert
                  key={alert.id}
                  variant={
                    alert.alertLevel === "critical"
                      ? "destructive"
                      : alert.alertLevel === "exceeded"
                        ? "destructive"
                        : "default"
                  }
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center gap-2">
                    {threshold?.name || "Budget Alert"}
                    <Badge
                      variant={
                        alert.alertLevel === "critical" || alert.alertLevel === "exceeded"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {alert.alertLevel}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p>{alert.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt || "").toLocaleString()}
                      </span>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {alert.acknowledged && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Acknowledged
                        </Badge>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="trend">Trend Analysis</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Forecast</CardTitle>
              <CardDescription>
                Predicted spending based on historical trends and seasonality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Bar data={forecastChartData} options={{ responsive: true }} />
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <strong>Methodology:</strong> {forecast?.methodology.algorithm}
                </p>
                <p>
                  <strong>Data Points:</strong> {forecast?.methodology.dataPoints}
                </p>
                <p>
                  <strong>Historical Period:</strong> {forecast?.methodology.historicalPeriod}
                </p>
                <p>
                  <strong>Trend Factor:</strong>{" "}
                  {((forecast?.trendFactor || 0) * 100).toFixed(2)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending Trend</CardTitle>
              <CardDescription>Historical and projected SMS spending</CardDescription>
            </CardHeader>
            <CardContent>
              {trendData && <Line data={trendData} options={{ responsive: true }} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Thresholds</CardTitle>
              <CardDescription>Configured budget limits and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {thresholds && thresholds.length > 0 ? (
                  thresholds.map((threshold) => (
                    <div
                      key={threshold.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-semibold">{threshold.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {threshold.thresholdType} - {(threshold.thresholdAmount || 0) / 100}{" "}
                          {threshold.currency}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={threshold.isActive ? "default" : "secondary"}>
                          {threshold.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No thresholds configured
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
