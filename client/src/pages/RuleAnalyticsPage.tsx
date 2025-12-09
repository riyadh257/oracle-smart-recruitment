import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import RulePerformanceHeatmap from "@/components/RulePerformanceHeatmap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function RuleAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

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
    }
    
    return { startDate: start, endDate: end };
  }, [dateRange]);

  // Fetch rules
  const { data: rules } = trpc.advancedPriority.getRules.useQuery({});

  // Fetch heatmap data
  const { data: heatmapData, isLoading: heatmapLoading } = trpc.rulePerformance.getHeatmapData.useQuery(
    {
      ruleId: selectedRuleId!,
      startDate,
      endDate,
    },
    { enabled: !!selectedRuleId }
  );

  // Fetch peak times
  const { data: peakTimes } = trpc.rulePerformance.getPeakTimes.useQuery(
    {
      ruleId: selectedRuleId!,
      startDate,
      endDate,
    },
    { enabled: !!selectedRuleId }
  );

  // Fetch recommendations
  const { data: recommendations } = trpc.rulePerformance.getRecommendations.useQuery(
    {
      ruleId: selectedRuleId!,
      startDate,
      endDate,
    },
    { enabled: !!selectedRuleId }
  );

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Please log in to access rule analytics.</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Rule Performance Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Analyze when your priority rules are most effective
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Select
              value={selectedRuleId?.toString() || ""}
              onValueChange={(value) => setSelectedRuleId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a rule to analyze" />
              </SelectTrigger>
              <SelectContent>
                {rules?.map((rule: any) => (
                  <SelectItem key={rule.id} value={rule.id.toString()}>
                    {rule.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!selectedRuleId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No rule selected</h3>
              <p className="text-muted-foreground">
                Select a priority rule from the dropdown above to view its performance analytics
              </p>
            </CardContent>
          </Card>
        ) : heatmapLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Heatmap */}
            {heatmapData && <RulePerformanceHeatmap data={heatmapData} />}

            {/* Recommendations */}
            {recommendations && recommendations.hasData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Optimization Recommendations
                  </CardTitle>
                  <CardDescription>
                    Insights to improve rule effectiveness
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">{recommendations.recommendation}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Best Times */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                        <Clock className="h-4 w-4" />
                        Best Performing Times
                      </h4>
                      <div className="space-y-2">
                        {recommendations.bestTimes?.map((time: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {time.day} at {time.hour}
                              </span>
                              <span className="text-sm text-green-700 font-semibold">
                                {(time.engagementRate / 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Worst Times */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        Avoid These Times
                      </h4>
                      <div className="space-y-2">
                        {recommendations.worstTimes?.map((time: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 bg-red-50 border border-red-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {time.day} at {time.hour}
                              </span>
                              <span className="text-sm text-red-700 font-semibold">
                                {(time.engagementRate / 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Peak Times */}
            {peakTimes && peakTimes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Peak Engagement Times</CardTitle>
                  <CardDescription>
                    Time slots with highest engagement rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {peakTimes.map((time: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            #{index + 1} - {time.dayName} at {time.hourLabel}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {time.totalExecutions} executions
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {(time.engagementRate / 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">engagement</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {recommendations && !recommendations.hasData && (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Not enough data</h3>
                  <p className="text-muted-foreground">
                    {recommendations.message}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
