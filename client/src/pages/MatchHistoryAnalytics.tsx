import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Users, Clock, Target, Award, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function MatchHistoryAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = trpc.aiMatchingAnalytics.getMatchAnalytics.useQuery(
    { timeRange },
    { enabled: !!user }
  );

  // Fetch match history with outcomes
  const { data: matchHistory, isLoading: historyLoading } = trpc.aiMatchingAnalytics.getMatchHistory.useQuery(
    { limit: 100, includeOutcomes: true },
    { enabled: !!user }
  );

  // Fetch attribute correlation data
  const { data: attributeCorrelation, isLoading: correlationLoading } = trpc.aiMatchingAnalytics.getAttributeCorrelation.useQuery(
    { timeRange },
    { enabled: !!user }
  );

  const isLoading = authLoading || analyticsLoading || historyLoading || correlationLoading;

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>Please log in to view match analytics.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare trend data for visualization
  const trendData = matchHistory?.slice(0, 30).reverse().map((match, idx) => ({
    index: idx + 1,
    overallScore: match.overallScore,
    cultureScore: match.cultureScore || 0,
    wellbeingScore: match.wellbeingScore || 0,
    outcome: match.outcome,
  })) || [];

  // Prepare success rate by score range
  const scoreRanges = [
    { range: "90-100", min: 90, max: 100 },
    { range: "80-89", min: 80, max: 89 },
    { range: "70-79", min: 70, max: 79 },
    { range: "60-69", min: 60, max: 69 },
    { range: "Below 60", min: 0, max: 59 },
  ];

  const successByScore = scoreRanges.map(({ range, min, max }) => {
    const matches = matchHistory?.filter(
      (m) => m.overallScore >= min && m.overallScore <= max
    ) || [];
    const hired = matches.filter((m) => m.outcome === "hired").length;
    const total = matches.length;
    const successRate = total > 0 ? Math.round((hired / total) * 100) : 0;

    return {
      range,
      successRate,
      total,
      hired,
    };
  });

  // Top predictive attributes
  const topAttributes = attributeCorrelation?.topAttributes || [];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Match History & Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Analyze historical match results and identify success patterns
            </p>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalMatches || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.totalHires || 0} resulted in hires
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.successRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Matches that led to hires
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Time to Hire</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.averageTimeToHire ? `${analytics.averageTimeToHire}d` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                From match to hire
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Accuracy</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.scoreAccuracy || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Predictive accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">Match Trends</TabsTrigger>
            <TabsTrigger value="success">Success Analysis</TabsTrigger>
            <TabsTrigger value="attributes">Predictive Attributes</TabsTrigger>
          </TabsList>

          {/* Match Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Match Score Trends (Last 30 Matches)</CardTitle>
                <CardDescription>
                  Track how match scores evolve over time and correlate with outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : trendData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No match history data available yet</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" label={{ value: "Match #", position: "insideBottom", offset: -5 }} />
                      <YAxis label={{ value: "Score", angle: -90, position: "insideLeft" }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-semibold">Match #{data.index}</p>
                                <p className="text-sm">Overall: {data.overallScore}</p>
                                <p className="text-sm">Culture: {data.cultureScore}</p>
                                <p className="text-sm">Wellbeing: {data.wellbeingScore}</p>
                                {data.outcome && (
                                  <p className="text-sm font-medium mt-1 capitalize">
                                    Outcome: {data.outcome}
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="overallScore" stroke="#8b5cf6" name="Overall Score" strokeWidth={2} />
                      <Line type="monotone" dataKey="cultureScore" stroke="#3b82f6" name="Culture Score" strokeWidth={2} />
                      <Line type="monotone" dataKey="wellbeingScore" stroke="#10b981" name="Wellbeing Score" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Success Analysis Tab */}
          <TabsContent value="success" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Success Rate by Match Score Range</CardTitle>
                <CardDescription>
                  Understand which score ranges correlate most with successful hires
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : successByScore.every((s) => s.total === 0) ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No outcome data available yet</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={successByScore}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" label={{ value: "Score Range", position: "insideBottom", offset: -5 }} />
                      <YAxis label={{ value: "Success Rate (%)", angle: -90, position: "insideLeft" }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-semibold">{data.range}</p>
                                <p className="text-sm">Success Rate: {data.successRate}%</p>
                                <p className="text-sm">Hired: {data.hired} / {data.total}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="successRate" fill="#8b5cf6" name="Success Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Average Scores by Outcome</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Hired Candidates</span>
                      <span className="text-2xl font-bold text-green-600">
                        {analytics?.averageHiredScore || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Rejected Candidates</span>
                      <span className="text-2xl font-bold text-red-600">
                        {analytics?.averageRejectedScore || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Average</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {analytics?.averageMatchScore || "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Component Importance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Culture Fit</span>
                        <span className="text-sm font-bold">{analytics?.cultureFitImportance || 0}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${analytics?.cultureFitImportance || 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Wellbeing Match</span>
                        <span className="text-sm font-bold">{analytics?.wellbeingImportance || 0}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${analytics?.wellbeingImportance || 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Technical Skills</span>
                        <span className="text-sm font-bold">{analytics?.technicalImportance || 0}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${analytics?.technicalImportance || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Predictive Attributes Tab */}
          <TabsContent value="attributes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Predictive Attributes</CardTitle>
                <CardDescription>
                  Attributes that correlate most strongly with successful hires
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : topAttributes.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Not enough data to calculate attribute correlations yet</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topAttributes.slice(0, 10).map((attr: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{idx + 1}.</span>
                            <span className="text-sm">{attr.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Correlation: {attr.correlation}
                            </span>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.abs(attr.correlation) * 100}%` }}
                          />
                        </div>
                        {attr.insight && (
                          <p className="text-xs text-muted-foreground ml-6">{attr.insight}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
