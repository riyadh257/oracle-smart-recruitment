import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap,
  TrendingUp,
  Users,
  Target,
  Award,
  Calendar,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#43e97b", "#fa709a"];

export default function TrainingAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [trendMonths, setTrendMonths] = useState(12);

  const { data: summaryStats, isLoading: summaryLoading } =
    trpc.trainingAnalytics.getSummaryStats.useQuery();

  const { data: effectivenessMetrics, isLoading: metricsLoading } =
    trpc.trainingAnalytics.getEffectivenessMetrics.useQuery({
      startDate: dateRange.start,
      endDate: dateRange.end,
    });

  const { data: completionTrends, isLoading: trendsLoading } =
    trpc.trainingAnalytics.getCompletionTrends.useQuery({
      months: trendMonths,
    });

  const { data: topPrograms, isLoading: topLoading } =
    trpc.trainingAnalytics.getTopPerformingPrograms.useQuery({
      limit: 10,
    });

  const isLoading = summaryLoading || metricsLoading || trendsLoading || topLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading training analytics...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Prepare data for category distribution pie chart
  const categoryData = effectivenessMetrics?.reduce((acc: any[], metric) => {
    const existing = acc.find((item) => item.name === metric.category);
    if (existing) {
      existing.value += metric.totalEnrollments;
    } else {
      acc.push({ name: metric.category, value: metric.totalEnrollments });
    }
    return acc;
  }, []);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track training program effectiveness and ROI
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.totalEnrollments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {summaryStats?.programCount || 0} programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completions</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.totalCompletions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats?.avgCompletionRate.toFixed(1)}% avg completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Score Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{summaryStats?.avgMatchScoreImprovement.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Average after completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground">From training completers</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.start || ""}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.end || ""}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trendMonths">Trend Period</Label>
            <Select
              value={trendMonths.toString()}
              onValueChange={(value) => setTrendMonths(parseInt(value))}
            >
              <SelectTrigger id="trendMonths">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
                <SelectItem value="24">Last 24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Completion Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Completion Trends
          </CardTitle>
          <CardDescription>Monthly enrollment and completion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={completionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke="#667eea"
                name="Enrollments"
              />
              <Line
                type="monotone"
                dataKey="completions"
                stroke="#43e97b"
                name="Completions"
              />
              <Line
                type="monotone"
                dataKey="completionRate"
                stroke="#fa709a"
                name="Completion Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performing Programs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performing Programs
          </CardTitle>
          <CardDescription>Ranked by ROI (completion rate + match improvement + application rate)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPrograms?.map((program, index) => (
              <div key={program.programId} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{program.programTitle}</div>
                  <div className="text-sm text-muted-foreground">
                    {program.category} • {program.completionCount} completions
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium text-green-600">
                    +{program.avgMatchScoreImprovement.toFixed(1)}% match score
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {program.completionRate.toFixed(1)}% completion rate
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Program Effectiveness Table */}
      <Card>
        <CardHeader>
          <CardTitle>Program Effectiveness Metrics</CardTitle>
          <CardDescription>Detailed analytics for all training programs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Program</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-right p-2">Enrollments</th>
                  <th className="text-right p-2">Completions</th>
                  <th className="text-right p-2">Completion Rate</th>
                  <th className="text-right p-2">Match Improvement</th>
                  <th className="text-right p-2">Applications</th>
                  <th className="text-right p-2">Avg Days</th>
                </tr>
              </thead>
              <tbody>
                {effectivenessMetrics?.map((metric) => (
                  <tr key={metric.programId} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{metric.programTitle}</td>
                    <td className="p-2">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10">
                        {metric.category}
                      </span>
                    </td>
                    <td className="text-right p-2">{metric.totalEnrollments}</td>
                    <td className="text-right p-2">{metric.completionCount}</td>
                    <td className="text-right p-2">{metric.completionRate.toFixed(1)}%</td>
                    <td className="text-right p-2 text-green-600">
                      +{metric.avgMatchScoreImprovement.toFixed(1)}%
                    </td>
                    <td className="text-right p-2">{metric.applicationCount}</td>
                    <td className="text-right p-2">{metric.avgTimeToComplete}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      {categoryData && categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Distribution by Category</CardTitle>
            <CardDescription>Program categories by enrollment volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
