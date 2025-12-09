import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Target, Award, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ABTestInsights() {
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  
  const { data: insights, isLoading: insightsLoading } = trpc.advancedAnalytics.getABTestInsights.useQuery({});
  const { data: trends, isLoading: trendsLoading } = trpc.advancedAnalytics.getABTestTrends.useQuery({ limit: 30 });
  const { data: patterns, isLoading: patternsLoading } = trpc.advancedAnalytics.getWinningPatterns.useQuery();

  const isLoading = insightsLoading || trendsLoading || patternsLoading;

  // Calculate summary metrics
  const totalTests = insights?.length || 0;
  const avgROI = insights?.reduce((sum: number, i: any) => sum + (i.roi / 100), 0) / (totalTests || 1);
  const totalCostSavings = insights?.reduce((sum: number, i: any) => sum + i.costSavings, 0) || 0;
  const totalRevenueImpact = insights?.reduce((sum: number, i: any) => sum + i.revenueImpact, 0) || 0;

  // Prepare trend chart data
  const trendChartData = trends?.map((t: any) => ({
    date: new Date(t.date).toLocaleDateString(),
    openRate: t.openRateImprovement,
    clickRate: t.clickRateImprovement,
    conversion: t.conversionRateImprovement,
  })) || [];

  // Prepare segment performance data
  const segmentData = patterns?.map((p: any) => ({
    name: p.segmentValue || p.segmentType,
    tests: p.testCount,
    roi: p.avgROI,
    openRate: p.avgOpenRateImprovement,
    clickRate: p.avgClickRateImprovement,
  })) || [];

  // Prepare ROI distribution data
  const roiDistribution = patterns?.map((p: any) => ({
    name: p.segmentValue || p.segmentType,
    value: p.avgROI,
  })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">A/B Test Insights Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Analyze historical A/B test performance, winning patterns, and ROI metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
            <p className="text-xs text-muted-foreground">
              Historical A/B tests analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgROI.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Return on investment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              SAR {(totalCostSavings / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total savings from optimization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              SAR {(totalRevenueImpact / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Additional revenue generated
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="patterns">Winning Patterns</TabsTrigger>
          <TabsTrigger value="segments">Segment Analysis</TabsTrigger>
          <TabsTrigger value="roi">ROI Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Improvement Trends</CardTitle>
              <CardDescription>
                Track how A/B test improvements have evolved over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="openRate" 
                    stroke="#3b82f6" 
                    name="Open Rate Improvement (%)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clickRate" 
                    stroke="#10b981" 
                    name="Click Rate Improvement (%)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversion" 
                    stroke="#f59e0b" 
                    name="Conversion Improvement (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Winning Patterns by Segment</CardTitle>
              <CardDescription>
                Identify which segments respond best to A/B testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patterns?.map((pattern: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{pattern.segmentValue || pattern.segmentType}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pattern.testCount} tests conducted
                        </p>
                      </div>
                      <Badge variant={pattern.avgROI > 10 ? "default" : "secondary"}>
                        {pattern.avgROI.toFixed(1)}% ROI
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Open Rate</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          {pattern.avgOpenRateImprovement > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          {pattern.avgOpenRateImprovement.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Click Rate</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          {pattern.avgClickRateImprovement > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          {pattern.avgClickRateImprovement.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Conversion</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          {pattern.avgConversionRateImprovement > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          {pattern.avgConversionRateImprovement.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cost Savings:</span>
                        <span className="font-medium">SAR {(pattern.totalCostSavings / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Revenue Impact:</span>
                        <span className="font-medium">SAR {(pattern.totalRevenueImpact / 100).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segment Performance Comparison</CardTitle>
              <CardDescription>
                Compare A/B test performance across different candidate segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={segmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="openRate" fill="#3b82f6" name="Open Rate (%)" />
                  <Bar dataKey="clickRate" fill="#10b981" name="Click Rate (%)" />
                  <Bar dataKey="roi" fill="#f59e0b" name="ROI (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ROI Distribution by Segment</CardTitle>
              <CardDescription>
                Visualize return on investment across different segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={roiDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roiDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
