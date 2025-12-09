import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Users, Target, Filter } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MatchAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [scoreThreshold, setScoreThreshold] = useState(70);

  // Fetch analytics data
  const { data: trends, isLoading: trendsLoading } = trpc.matchAnalytics.getTrends.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    groupBy,
  });

  const { data: summary, isLoading: summaryLoading } = trpc.matchAnalytics.getSummary.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: conversionRates, isLoading: conversionLoading } = trpc.matchAnalytics.getConversionRates.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: topAttributes, isLoading: attributesLoading } = trpc.matchAnalytics.getTopAttributes.useQuery({
    limit: 10,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: correlation, isLoading: correlationLoading } = trpc.matchAnalytics.getCorrelation.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Prepare chart data
  const trendChartData = {
    labels: trends?.map(t => new Date(t.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Average Match Score',
        data: trends?.map(t => t.averageScore) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'High Quality Matches (≥90)',
        data: trends?.map(t => t.highQualityMatches) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const funnelChartData = {
    labels: ['Total Matches', 'Screening', 'Interviewing', 'Offered', 'Hired'],
    datasets: [
      {
        label: 'Candidates',
        data: [
          conversionRates?.totalMatches || 0,
          conversionRates?.screening || 0,
          conversionRates?.interviewing || 0,
          conversionRates?.offered || 0,
          conversionRates?.hired || 0,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
      },
    ],
  };

  const cultureFitRadarData = {
    labels: [
      'Innovation',
      'Collaboration',
      'Work-Life Balance',
      'Growth Mindset',
      'Autonomy',
      'Structure',
      'Risk Tolerance',
      'Communication',
    ],
    datasets: [
      {
        label: 'Average Culture Fit Scores',
        data: correlation?.cultureFitDimensions || [75, 82, 68, 90, 77, 85, 72, 88],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      },
    ],
  };

  const attributePerformanceData = {
    labels: topAttributes?.map(a => a.attributeName) || [],
    datasets: [
      {
        label: 'Success Rate (%)',
        data: topAttributes?.map(a => a.successRate) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const radarOptions = {
    ...chartOptions,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Match Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into AI-powered candidate matching performance
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <DateRangePicker
                value={{
                  from: new Date(dateRange.startDate),
                  to: new Date(dateRange.endDate),
                }}
                onChange={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({
                      startDate: range.from.toISOString(),
                      endDate: range.to.toISOString(),
                    });
                  }
                }}
              />
            </div>

            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>

            <Select value={scoreThreshold.toString()} onValueChange={(v) => setScoreThreshold(Number(v))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Score threshold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="70">High Quality (≥70)</SelectItem>
                <SelectItem value="80">Very High (≥80)</SelectItem>
                <SelectItem value="90">Exceptional (≥90)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalMatches || 0}</div>
              <p className="text-xs text-muted-foreground">
                {summary?.matchesChange || 0}% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.averageScore?.toFixed(1) || 0}</div>
              <p className="text-xs text-muted-foreground">
                {summary?.scoreChange || 0}% improvement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Quality Matches</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.highQualityMatches || 0}</div>
              <p className="text-xs text-muted-foreground">
                Score ≥ {scoreThreshold}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {conversionRates?.conversionRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Match to hire rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Match Score Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Match Score Trends Over Time</CardTitle>
              <CardDescription>
                Track average match scores and high-quality match volume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {trendsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Line data={trendChartData} options={chartOptions} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Candidate Pipeline Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Candidate Pipeline Funnel</CardTitle>
              <CardDescription>
                Conversion rates through each hiring stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {conversionLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Bar data={funnelChartData} options={chartOptions} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Culture Fit Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Culture Fit Analysis</CardTitle>
              <CardDescription>
                Multi-dimensional culture compatibility scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {correlationLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Radar data={cultureFitRadarData} options={radarOptions} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Attributes */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Attributes</CardTitle>
              <CardDescription>
                Attributes with highest success rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {attributesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Bar 
                    data={attributePerformanceData} 
                    options={{
                      ...chartOptions,
                      indexAxis: 'y' as const,
                    }} 
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="outline">
            Export Report
          </Button>
          <Button variant="outline">
            Schedule Email Digest
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
