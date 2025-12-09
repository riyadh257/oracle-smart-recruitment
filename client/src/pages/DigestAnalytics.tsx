import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Mail, TrendingUp, MousePointer, BarChart3, Calendar } from "lucide-react";
import { useState } from "react";
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

/**
 * Digest Analytics Dashboard
 * Shows digest open rates, click patterns, and engagement trends
 */

export default function DigestAnalytics() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const { data: overview, isLoading: overviewLoading } = trpc.digestAnalytics.getDigestOverview.useQuery(dateRange);
  const { data: trends, isLoading: trendsLoading } = trpc.digestAnalytics.getDigestTrends.useQuery(dateRange);
  const { data: performanceByType, isLoading: performanceLoading } = trpc.digestAnalytics.getDigestPerformanceByType.useQuery(dateRange);
  const { data: engagementPatterns, isLoading: patternsLoading } = trpc.digestAnalytics.getEngagementPatterns.useQuery(dateRange);
  const { data: topDigests, isLoading: topLoading } = trpc.digestAnalytics.getTopPerformingDigests.useQuery({
    ...dateRange,
    limit: 10,
  });

  const handleDateRangeChange = (range: "7d" | "30d" | "90d") => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    setDateRange({
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    });
  };

  if (overviewLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Prepare chart data
  const trendsChartData = {
    labels: trends?.map(t => new Date(t.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: "Sent",
        data: trends?.map(t => t.sent) || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
      },
      {
        label: "Opened",
        data: trends?.map(t => t.opened) || [],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
      },
      {
        label: "Clicked",
        data: trends?.map(t => t.clicked) || [],
        borderColor: "rgb(168, 85, 247)",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        fill: true,
      },
    ],
  };

  const performanceByTypeData = {
    labels: performanceByType?.map(p => p.digestType) || [],
    datasets: [
      {
        label: "Open Rate (%)",
        data: performanceByType?.map(p => p.openRate) || [],
        backgroundColor: "rgba(34, 197, 94, 0.6)",
      },
      {
        label: "Click Rate (%)",
        data: performanceByType?.map(p => p.clickRate) || [],
        backgroundColor: "rgba(168, 85, 247, 0.6)",
      },
    ],
  };

  const hourlyPatternsData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: "Opens by Hour",
        data: Array.from({ length: 24 }, (_, hour) => {
          const pattern = engagementPatterns?.hourlyPatterns.find(p => p.hour === hour);
          return pattern?.openCount || 0;
        }),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
      },
    ],
  };

  const dayPatternsData = {
    labels: engagementPatterns?.dayPatterns.map(p => p.dayName) || [],
    datasets: [
      {
        label: "Open Rate (%)",
        data: engagementPatterns?.dayPatterns.map(p => p.openRate) || [],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(199, 199, 199, 0.6)",
        ],
      },
    ],
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Digest Analytics</h1>
        <p className="text-muted-foreground">
          Track digest email performance, engagement trends, and click patterns
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={dateRange.startDate === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] ? "default" : "outline"}
          onClick={() => handleDateRangeChange("7d")}
          size="sm"
        >
          Last 7 Days
        </Button>
        <Button
          variant={dateRange.startDate === new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] ? "default" : "outline"}
          onClick={() => handleDateRangeChange("30d")}
          size="sm"
        >
          Last 30 Days
        </Button>
        <Button
          variant={dateRange.startDate === new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] ? "default" : "outline"}
          onClick={() => handleDateRangeChange("90d")}
          size="sm"
        >
          Last 90 Days
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalSent || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {overview?.avgMatchCount.toFixed(1) || 0} matches per digest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.openRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview?.totalOpened || 0} of {overview?.totalSent || 0} opened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.clickRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview?.totalClicked || 0} of {overview?.totalSent || 0} clicked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.clickThroughRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Of opened emails
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Engagement Trends Over Time</CardTitle>
          <CardDescription>Daily digest performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64">
              <Line
                data={trendsChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance by Type and Engagement Patterns */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Digest Type</CardTitle>
            <CardDescription>Comparison of daily, weekly, and biweekly digests</CardDescription>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <Bar
                  data={performanceByTypeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top" as const,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                      },
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opens by Day of Week</CardTitle>
            <CardDescription>Best days for digest engagement</CardDescription>
          </CardHeader>
          <CardContent>
            {patternsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64">
                <Doughnut
                  data={dayPatternsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right" as const,
                      },
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Patterns */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Hourly Engagement Patterns</CardTitle>
          <CardDescription>Best times of day for digest opens</CardDescription>
        </CardHeader>
        <CardContent>
          {patternsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64">
              <Line
                data={hourlyPatternsData}
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
                    },
                  },
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Digests */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Digests</CardTitle>
          <CardDescription>Digests with the highest quality matches</CardDescription>
        </CardHeader>
        <CardContent>
          {topLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-4">
              {topDigests?.map((digest) => (
                <div key={digest.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{digest.userName || digest.userEmail}</div>
                    <div className="text-sm text-muted-foreground">
                      {digest.digestType} digest • {new Date(digest.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-lg">{digest.highQualityMatchCount}</div>
                      <div className="text-muted-foreground">High Quality</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{digest.matchCount}</div>
                      <div className="text-muted-foreground">Total Matches</div>
                    </div>
                    <div className="text-center">
                      {digest.emailOpenedAt ? (
                        <div className="text-green-600 font-medium">✓ Opened</div>
                      ) : (
                        <div className="text-muted-foreground">Not Opened</div>
                      )}
                      {digest.emailClickedAt && (
                        <div className="text-purple-600 font-medium text-xs">Clicked</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!topDigests || topDigests.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No digest data available for this period
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
