import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EngagementTrends() {
  const { user, loading: authLoading } = useAuth();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  if (dateRange === "7d") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (dateRange === "30d") {
    startDate.setDate(startDate.getDate() - 30);
  } else {
    startDate.setDate(startDate.getDate() - 90);
  }

  const { data: trendsData, isLoading } = trpc.engagementTrends.getUserTrends.useQuery(
    {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    {
      enabled: !!user,
    }
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view engagement trends.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!trendsData || trendsData.trends.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Engagement Trends</h1>
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              No engagement predictions found for the selected date range. Predictions will appear here once your system starts generating engagement forecasts.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const labels = trendsData.trends.map((t) =>
    new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  const predictedOpenRates = trendsData.trends.map((t) => t.predictedOpenRate / 100);
  const actualOpenRates = trendsData.trends.map((t) =>
    t.actualOpenRate !== null ? t.actualOpenRate / 100 : null
  );

  const predictedClickRates = trendsData.trends.map((t) => t.predictedClickRate / 100);
  const actualClickRates = trendsData.trends.map((t) =>
    t.actualClickRate !== null ? t.actualClickRate / 100 : null
  );

  const predictedResponseRates = trendsData.trends.map((t) => t.predictedResponseRate / 100);
  const actualResponseRates = trendsData.trends.map((t) =>
    t.actualResponseRate !== null ? t.actualResponseRate / 100 : null
  );

  const openRateChartData = {
    labels,
    datasets: [
      {
        label: "Predicted Open Rate",
        data: predictedOpenRates,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
      },
      {
        label: "Actual Open Rate",
        data: actualOpenRates,
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        spanGaps: true,
      },
    ],
  };

  const clickRateChartData = {
    labels,
    datasets: [
      {
        label: "Predicted Click Rate",
        data: predictedClickRates,
        borderColor: "rgb(245, 158, 11)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
      },
      {
        label: "Actual Click Rate",
        data: actualClickRates,
        borderColor: "rgb(139, 92, 246)",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        spanGaps: true,
      },
    ],
  };

  const responseRateChartData = {
    labels,
    datasets: [
      {
        label: "Predicted Response Rate",
        data: predictedResponseRates,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
      },
      {
        label: "Actual Response Rate",
        data: actualResponseRates,
        borderColor: "rgb(236, 72, 153)",
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        spanGaps: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + "%";
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
    },
  };

  // Calculate accuracy trend
  const accuracyTrend =
    trendsData.overallAccuracy > 0
      ? trendsData.overallAccuracy >= 80
        ? "high"
        : trendsData.overallAccuracy >= 60
        ? "medium"
        : "low"
      : "unknown";

  const accuracyIcon =
    accuracyTrend === "high" ? (
      <TrendingUp className="w-5 h-5 text-green-600" />
    ) : accuracyTrend === "medium" ? (
      <Minus className="w-5 h-5 text-yellow-600" />
    ) : (
      <TrendingDown className="w-5 h-5 text-red-600" />
    );

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Engagement Trends</h1>
        <div className="flex gap-2">
          <Button
            variant={dateRange === "7d" ? "default" : "outline"}
            onClick={() => setDateRange("7d")}
            size="sm"
          >
            7 Days
          </Button>
          <Button
            variant={dateRange === "30d" ? "default" : "outline"}
            onClick={() => setDateRange("30d")}
            size="sm"
          >
            30 Days
          </Button>
          <Button
            variant={dateRange === "90d" ? "default" : "outline"}
            onClick={() => setDateRange("90d")}
            size="sm"
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Predictions</CardDescription>
            <CardTitle className="text-3xl">{trendsData.totalPredictions}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Predicted Open Rate</CardDescription>
            <CardTitle className="text-3xl">
              {(trendsData.averagePredictedOpenRate / 100).toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Actual Open Rate</CardDescription>
            <CardTitle className="text-3xl">
              {trendsData.averageActualOpenRate > 0
                ? (trendsData.averageActualOpenRate / 100).toFixed(1) + "%"
                : "N/A"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              Overall Accuracy {accuracyIcon}
            </CardDescription>
            <CardTitle className="text-3xl">
              {trendsData.overallAccuracy > 0
                ? trendsData.overallAccuracy.toFixed(1) + "%"
                : "N/A"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Open Rate Trends</CardTitle>
            <CardDescription>
              Comparison of predicted vs actual open rates over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <Line data={openRateChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Click Rate Trends</CardTitle>
            <CardDescription>
              Comparison of predicted vs actual click rates over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <Line data={clickRateChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Rate Trends</CardTitle>
            <CardDescription>
              Comparison of predicted vs actual response rates over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <Line data={responseRateChartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
