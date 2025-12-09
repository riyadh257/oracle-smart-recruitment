import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, BarChart3, PieChart, Target, Download, Calendar } from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { addDays, subMonths, format } from "date-fns";
import type { DateRange } from "react-day-picker";

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

export default function MatchAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week');

  const startDate = dateRange.from?.toISOString() || subMonths(new Date(), 3).toISOString();
  const endDate = dateRange.to?.toISOString() || new Date().toISOString();

  // Fetch analytics data
  const { data: trends, isLoading: trendsLoading } = trpc.matchAnalytics.getTrends.useQuery({
    startDate,
    endDate,
    groupBy,
  });

  const { data: correlation, isLoading: correlationLoading } = trpc.matchAnalytics.getCorrelation.useQuery({
    startDate,
    endDate,
  });

  const { data: conversionRates, isLoading: conversionLoading } = trpc.matchAnalytics.getConversionRates.useQuery({
    startDate,
    endDate,
  });

  const { data: summary, isLoading: summaryLoading } = trpc.matchAnalytics.getSummary.useQuery({
    startDate,
    endDate,
  });

  const { data: categoryPerformance, isLoading: categoryLoading } = trpc.matchAnalytics.getCategoryPerformance.useQuery({
    startDate,
    endDate,
  });

  // Chart data for trends
  const trendsChartData = trends ? {
    labels: trends.map(t => t.period),
    datasets: [
      {
        label: 'Overall Score',
        data: trends.map(t => t.avgOverallScore),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Skill Score',
        data: trends.map(t => t.avgSkillScore),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Culture Score',
        data: trends.map(t => t.avgCultureScore),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Wellbeing Score',
        data: trends.map(t => t.avgWellbeingScore),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  } : null;

  // Chart data for correlation
  const correlationChartData = correlation ? {
    labels: correlation.map(c => c.outcome || 'Unknown'),
    datasets: [
      {
        label: 'Average Overall Score',
        data: correlation.map(c => c.avgOverallScore),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  } : null;

  // Chart data for conversion funnel
  const conversionChartData = conversionRates ? {
    labels: ['Matched', 'Contacted', 'Interviewed', 'Offered', 'Hired'],
    datasets: [
      {
        label: 'Candidates',
        data: [
          conversionRates.stages.matched,
          conversionRates.stages.contacted,
          conversionRates.stages.interviewed,
          conversionRates.stages.offered,
          conversionRates.stages.hired,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      },
    ],
  } : null;

  // Chart data for culture fit radar
  const cultureFitRadarData = summary ? {
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
        data: [
          summary.avgCultureScore || 75,
          summary.avgCollaborationScore || 82,
          summary.avgWorkLifeBalanceScore || 68,
          summary.avgGrowthMindsetScore || 90,
          summary.avgAutonomyScore || 77,
          summary.avgStructureScore || 85,
          summary.avgRiskToleranceScore || 72,
          summary.avgCommunicationScore || 88,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      },
    ],
  } : null;

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const barChartOptions = {
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
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
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
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Match Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visualize match history trends, attribute correlations, and hiring pipeline conversion rates
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Range and Grouping Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
            />
          </div>
          <div className="w-[200px]">
            <label className="text-sm font-medium mb-2 block">Group By</label>
            <Select value={groupBy} onValueChange={(value: 'day' | 'week' | 'month') => setGroupBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.totalMatches || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg Score: {summary?.avgOverallScore?.toFixed(1) || 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Score Matches</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.highScoreMatches || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Score ≥ 80
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {conversionLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {conversionRates?.conversionRates.overallConversion.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Match to Hire
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Score Matches</CardTitle>
            <PieChart className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.mediumScoreMatches || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Score 60-79
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Match Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Match Score Trends Over Time</CardTitle>
          <CardDescription>
            Track how different match scores evolve over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : trendsChartData ? (
            <div style={{ height: '400px' }}>
              <Line data={trendsChartData} options={lineChartOptions} />
            </div>
          ) : (
            <Alert>
              <AlertDescription>No trend data available for the selected period</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Correlation and Conversion Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attribute Correlation by Outcome</CardTitle>
            <CardDescription>
              Average scores grouped by hiring outcome
            </CardDescription>
          </CardHeader>
          <CardContent>
            {correlationLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : correlationChartData ? (
              <div style={{ height: '300px' }}>
                <Bar data={correlationChartData} options={barChartOptions} />
              </div>
            ) : (
              <Alert>
                <AlertDescription>No correlation data available</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hiring Pipeline Conversion</CardTitle>
            <CardDescription>
              Candidate progression through recruitment stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conversionLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : conversionChartData ? (
              <div style={{ height: '300px' }}>
                <Bar data={conversionChartData} options={barChartOptions} />
              </div>
            ) : (
              <Alert>
                <AlertDescription>No conversion data available</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Culture Fit Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Culture Fit Analysis</CardTitle>
            <CardDescription>
              Multi-dimensional culture compatibility assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : cultureFitRadarData ? (
              <div style={{ height: '300px' }}>
                <Radar data={cultureFitRadarData} options={radarChartOptions} />
              </div>
            ) : (
              <Alert>
                <AlertDescription>No culture fit data available</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rates Details */}
      {conversionRates && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Conversion Rates</CardTitle>
            <CardDescription>
              Step-by-step conversion metrics through the hiring pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Match → Contact</p>
                <p className="text-2xl font-bold">{conversionRates.conversionRates.matchToContact.toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Contact → Interview</p>
                <p className="text-2xl font-bold">{conversionRates.conversionRates.contactToInterview.toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Interview → Offer</p>
                <p className="text-2xl font-bold">{conversionRates.conversionRates.interviewToOffer.toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Offer → Hire</p>
                <p className="text-2xl font-bold">{conversionRates.conversionRates.offerToHire.toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Overall</p>
                <p className="text-2xl font-bold text-green-600">{conversionRates.conversionRates.overallConversion.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Category Performance */}
      {categoryPerformance && categoryPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Job Category Performance</CardTitle>
            <CardDescription>
              Compare match quality and success rates across different job categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryPerformance.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{cat.jobTitle}</h4>
                    <p className="text-sm text-muted-foreground">{cat.department}</p>
                  </div>
                  <div className="flex gap-8 items-center">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Matches</p>
                      <p className="text-lg font-bold">{cat.totalMatches}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Avg Score</p>
                      <p className="text-lg font-bold">{cat.avgScore?.toFixed(1) || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Hired</p>
                      <p className="text-lg font-bold">{cat.hiredCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-lg font-bold text-green-600">{cat.successRate?.toFixed(1) || 0}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
