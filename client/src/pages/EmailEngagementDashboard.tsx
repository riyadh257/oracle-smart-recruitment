import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, Mail, MousePointerClick, Clock } from "lucide-react";
import { format, subDays } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const EMAIL_TYPES = [
  { value: "interview_invite", label: "Interview Invite" },
  { value: "interview_reminder", label: "Interview Reminder" },
  { value: "application_received", label: "Application Received" },
  { value: "application_update", label: "Application Update" },
  { value: "job_match", label: "Job Match" },
  { value: "rejection", label: "Rejection" },
  { value: "follow_up", label: "Follow-up" },
  { value: "broadcast", label: "Broadcast" },
  { value: "custom", label: "Custom" },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function EmailEngagementDashboard() {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date(),
  });
  const [selectedEmailTypes, setSelectedEmailTypes] = useState<string[]>([]);

  // Fetch engagement rates
  const { data: engagementData, isLoading: engagementLoading } = trpc.communication.emailAnalytics.getEngagementRates.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    emailTypes: selectedEmailTypes.length > 0 ? selectedEmailTypes as any : undefined,
  });

  // Fetch optimal send times
  const { data: optimalTimes, isLoading: timesLoading } = trpc.communication.emailAnalytics.getOptimalSendTimes.useQuery({});

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    if (!engagementData) return { totalSent: 0, avgOpenRate: 0, avgClickRate: 0 };

    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;

    Object.values(engagementData).forEach((data) => {
      totalSent += data.sent;
      totalOpened += data.opened;
      totalClicked += data.clicked;
    });

    return {
      totalSent,
      avgOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      avgClickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
    };
  }, [engagementData]);

  // Prepare chart data for engagement rates by email type
  const engagementChartData = useMemo(() => {
    if (!engagementData) return null;

    const labels = Object.keys(engagementData).map(
      (type) => EMAIL_TYPES.find((t) => t.value === type)?.label || type
    );
    const openRates = Object.values(engagementData).map((data) => data.openRate);
    const clickRates = Object.values(engagementData).map((data) => data.clickRate);

    return {
      labels,
      datasets: [
        {
          label: "Open Rate (%)",
          data: openRates,
          backgroundColor: "rgba(59, 130, 246, 0.8)",
        },
        {
          label: "Click Rate (%)",
          data: clickRates,
          backgroundColor: "rgba(16, 185, 129, 0.8)",
        },
      ],
    };
  }, [engagementData]);

  // Prepare optimal send times visualization
  const optimalTimesData = useMemo(() => {
    if (!optimalTimes || optimalTimes.length === 0) return null;

    // Group by email type
    const grouped = optimalTimes.reduce((acc, time) => {
      if (!acc[time.emailType]) {
        acc[time.emailType] = [];
      }
      acc[time.emailType].push(time);
      return acc;
    }, {} as Record<string, typeof optimalTimes>);

    return grouped;
  }, [optimalTimes]);

  const handleCalculateOptimalTimes = async () => {
    // Calculate for all email types
    for (const emailType of EMAIL_TYPES) {
      try {
        await trpc.communication.emailAnalytics.calculateOptimalSendTimes.mutate({
          emailType: emailType.value as any,
          analysisStartDate: dateRange.start,
          analysisEndDate: dateRange.end,
        });
      } catch (error) {
        console.error(`Failed to calculate optimal times for ${emailType.label}:`, error);
      }
    }
  };

  if (engagementLoading || timesLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading engagement analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Email Engagement Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track open rates, click rates, and optimize send times
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.start, "MMM dd, yyyy")} - {format(dateRange.end, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({ start: subDays(new Date(), 7), end: new Date() })}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({ start: subDays(new Date(), 30), end: new Date() })}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({ start: subDays(new Date(), 90), end: new Date() })}
                  >
                    Last 90 days
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In the selected date range
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.avgOpenRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all email types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Click Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.avgClickRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all email types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Rates by Email Type */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Rates by Email Type</CardTitle>
          <CardDescription>
            Compare open and click rates across different email types
          </CardDescription>
        </CardHeader>
        <CardContent>
          {engagementChartData ? (
            <div className="h-[400px]">
              <Bar
                data={engagementChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                    title: {
                      display: false,
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
            <div className="text-center py-12 text-muted-foreground">
              No engagement data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimal Send Times */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Optimal Send Times</CardTitle>
            <CardDescription>
              Best times to send emails for maximum engagement
            </CardDescription>
          </div>
          <Button onClick={handleCalculateOptimalTimes} variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Recalculate
          </Button>
        </CardHeader>
        <CardContent>
          {optimalTimesData && Object.keys(optimalTimesData).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(optimalTimesData).map(([emailType, times]) => {
                const bestTime = times[0]; // Already sorted by confidence score
                if (!bestTime) return null;

                return (
                  <div key={emailType} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">
                        {EMAIL_TYPES.find((t) => t.value === emailType)?.label || emailType}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        Confidence: {bestTime.confidenceScore}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Best Day</p>
                        <p className="text-lg font-medium">{DAY_NAMES[bestTime.optimalDayOfWeek]}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Best Time</p>
                        <p className="text-lg font-medium">
                          {bestTime.optimalHourOfDay}:00 - {bestTime.optimalHourOfDay + 1}:00
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Open Rate</p>
                        <p className="text-lg font-medium text-blue-600">
                          {(bestTime.avgOpenRate / 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Click Rate</p>
                        <p className="text-lg font-medium text-green-600">
                          {(bestTime.avgClickRate / 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Based on {bestTime.sampleSize} emails sent
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No optimal send time data available yet
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Recalculate" to analyze your email sending patterns
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
