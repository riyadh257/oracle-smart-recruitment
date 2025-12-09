import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown, AlertCircle, CheckCircle, BarChart3, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";

/**
 * Priority Rule Analytics Dashboard
 * 
 * Visualize rule effectiveness metrics:
 * - Trigger frequency
 * - Suppression rates
 * - User engagement impact
 * - Conflict rates
 * - Effectiveness scores with recommendations
 */
export default function RuleAnalyticsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [selectedDays, setSelectedDays] = useState("30");

  const { data: effectivenessScores, isLoading: scoresLoading } = trpc.ruleAnalytics.getEffectivenessScores.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: allAnalytics, isLoading: analyticsLoading } = trpc.ruleAnalytics.getAll.useQuery(
    { days: parseInt(selectedDays) },
    { enabled: !!user }
  );

  const calculateEffectiveness = trpc.ruleAnalytics.calculateEffectiveness.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Effectiveness score calculated successfully");
        trpc.useUtils().ruleAnalytics.getEffectivenessScores.invalidate();
      } else {
        toast.error(data.message || "Failed to calculate effectiveness");
      }
    },
    onError: (error) => {
      toast.error(`Failed to calculate effectiveness: ${error.message}`);
    },
  });

  const getRecommendationBadge = (action: string | null) => {
    switch (action) {
      case "keep":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Keep</Badge>;
      case "optimize":
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Optimize</Badge>;
      case "disable":
        return <Badge variant="destructive"><TrendingDown className="w-3 h-3 mr-1" />Disable</Badge>;
      default:
        return <Badge variant="secondary">Not Calculated</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  // Aggregate analytics by rule
  const ruleStats = allAnalytics?.reduce((acc: any, analytics) => {
    if (!acc[analytics.ruleId]) {
      acc[analytics.ruleId] = {
        ruleId: analytics.ruleId,
        ruleName: analytics.ruleName,
        totalTriggers: 0,
        totalSuppressions: 0,
        totalBoosts: 0,
        totalEngagement: 0,
        totalConflicts: 0,
      };
    }
    
    acc[analytics.ruleId].totalTriggers += analytics.triggerCount;
    acc[analytics.ruleId].totalSuppressions += analytics.suppressionCount;
    acc[analytics.ruleId].totalBoosts += analytics.boostCount;
    acc[analytics.ruleId].totalEngagement += analytics.userEngagementCount;
    acc[analytics.ruleId].totalConflicts += analytics.conflictCount;
    
    return acc;
  }, {});

  const ruleStatsArray = ruleStats ? Object.values(ruleStats) : [];

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to view rule analytics</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Priority Rule Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Monitor rule effectiveness and optimize notification prioritization
            </p>
          </div>
          <Select value={selectedDays} onValueChange={setSelectedDays}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Effectiveness Scores Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Effectiveness Scores</h2>
          {scoresLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : effectivenessScores && effectivenessScores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {effectivenessScores.map((score) => (
                <Card key={score.ruleId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{score.ruleName}</CardTitle>
                    <CardDescription>
                      Last calculated: {new Date(score.lastCalculated).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Effectiveness Score</span>
                      <span className={`text-2xl font-bold ${getScoreColor(score.effectivenessScore)}`}>
                        {score.effectivenessScore}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Engagement Impact</span>
                        <span>{(score.engagementImpact / 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Suppression Rate</span>
                        <span>{(score.suppressionRate / 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Conflict Rate</span>
                        <span>{(score.conflictRate / 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Recommendation</span>
                        {getRecommendationBadge(score.recommendedAction)}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => calculateEffectiveness.mutate({ ruleId: score.ruleId })}
                      disabled={calculateEffectiveness.isPending}
                    >
                      {calculateEffectiveness.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Recalculate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No effectiveness scores calculated yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Effectiveness scores are calculated based on rule performance over time
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rule Statistics */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Rule Activity (Last {selectedDays} days)</h2>
          {analyticsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : ruleStatsArray.length > 0 ? (
            <div className="space-y-4">
              {ruleStatsArray.map((stat: any) => (
                <Card key={stat.ruleId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{stat.ruleName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{stat.totalTriggers}</div>
                        <div className="text-xs text-muted-foreground">Total Triggers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{stat.totalSuppressions}</div>
                        <div className="text-xs text-muted-foreground">Suppressions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stat.totalBoosts}</div>
                        <div className="text-xs text-muted-foreground">Priority Boosts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stat.totalEngagement}</div>
                        <div className="text-xs text-muted-foreground">User Engagements</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stat.totalConflicts}</div>
                        <div className="text-xs text-muted-foreground">Conflicts</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No rule activity data available for the selected period
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Insights Section */}
        {effectivenessScores && effectivenessScores.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Insights & Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Top Performing Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {effectivenessScores
                      .filter((s) => s.effectivenessScore >= 70)
                      .slice(0, 5)
                      .map((score) => (
                        <div key={score.ruleId} className="flex justify-between items-center">
                          <span className="text-sm">{score.ruleName}</span>
                          <Badge className="bg-green-500">{score.effectivenessScore}</Badge>
                        </div>
                      ))}
                    {effectivenessScores.filter((s) => s.effectivenessScore >= 70).length === 0 && (
                      <p className="text-sm text-muted-foreground">No high-performing rules yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    Rules Needing Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {effectivenessScores
                      .filter((s) => s.recommendedAction === "optimize" || s.recommendedAction === "disable")
                      .slice(0, 5)
                      .map((score) => (
                        <div key={score.ruleId} className="flex justify-between items-center">
                          <span className="text-sm">{score.ruleName}</span>
                          {getRecommendationBadge(score.recommendedAction)}
                        </div>
                      ))}
                    {effectivenessScores.filter((s) => s.recommendedAction === "optimize" || s.recommendedAction === "disable").length === 0 && (
                      <p className="text-sm text-muted-foreground">All rules are performing well</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
