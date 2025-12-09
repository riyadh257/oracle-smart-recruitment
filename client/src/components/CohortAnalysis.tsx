import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, TrendingUp, Users, Lightbulb, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function CohortAnalysis() {
  const [selectedDimension, setSelectedDimension] = useState<"industry" | "experience" | "location">("industry");

  const { data: allAnalyses, isLoading: allLoading } = trpc.cohorts.getAllAnalyses.useQuery();
  const { data: topPerforming, isLoading: topLoading } = trpc.cohorts.getTopPerforming.useQuery({ limit: 10 });

  const currentAnalysis = allAnalyses?.[selectedDimension];

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getEngagementBadge = (score: number) => {
    if (score >= 80) return { variant: "default" as any, label: "High" };
    if (score >= 60) return { variant: "secondary" as any, label: "Good" };
    if (score >= 40) return { variant: "outline" as any, label: "Fair" };
    return { variant: "destructive" as any, label: "Low" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Engagement Cohort Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Compare engagement patterns across candidate segments
        </p>
      </div>

      {/* Top Performers Summary */}
      {topLoading ? null : topPerforming && topPerforming.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top Performing Segments
            </CardTitle>
            <CardDescription>Highest engagement cohorts across all dimensions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {topPerforming.slice(0, 6).map((cohort: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{cohort.cohortValue}</p>
                    <p className="text-xs text-muted-foreground">
                      {cohort.cohortName} • {cohort.candidateCount} candidates
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getEngagementColor(cohort.avgEngagementScore)}`}>
                      {cohort.avgEngagementScore.toFixed(0)}
                    </p>
                    <Badge {...getEngagementBadge(cohort.avgEngagementScore)}>
                      {getEngagementBadge(cohort.avgEngagementScore).label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Cohort Comparison Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Segment Comparison</CardTitle>
          <CardDescription>Analyze engagement by different candidate attributes</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedDimension} onValueChange={(value: any) => setSelectedDimension(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="industry">Industry</TabsTrigger>
              <TabsTrigger value="experience">Experience Level</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>

            {allLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : currentAnalysis ? (
              <>
                <TabsContent value={selectedDimension} className="space-y-6">
                  {/* Insights */}
                  {currentAnalysis.insights && currentAnalysis.insights.length > 0 && (
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertTitle>Key Insights</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {currentAnalysis.insights.map((insight: string, index: number) => (
                            <li key={index} className="text-sm">
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Engagement Score Chart */}
                  {currentAnalysis.cohorts && currentAnalysis.cohorts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Average Engagement Score</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={currentAnalysis.cohorts}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="cohortValue" angle={-45} textAnchor="end" height={100} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="avgEngagementScore" fill="#3b82f6" name="Engagement Score" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Detailed Metrics Table */}
                  {currentAnalysis.cohorts && currentAnalysis.cohorts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{currentAnalysis.dimension}</TableHead>
                            <TableHead className="text-right">Candidates</TableHead>
                            <TableHead className="text-right">Engagement</TableHead>
                            <TableHead className="text-right">Open Rate</TableHead>
                            <TableHead className="text-right">Click Rate</TableHead>
                            <TableHead className="text-right">Response Rate</TableHead>
                            <TableHead className="text-right">Top Performers</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentAnalysis.cohorts.map((cohort: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{cohort.cohortValue}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  {cohort.candidateCount}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span className={`font-bold ${getEngagementColor(cohort.avgEngagementScore)}`}>
                                    {cohort.avgEngagementScore.toFixed(0)}
                                  </span>
                                  <Badge size="sm" {...getEngagementBadge(cohort.avgEngagementScore)}>
                                    {getEngagementBadge(cohort.avgEngagementScore).label}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{cohort.avgOpenRate.toFixed(1)}%</TableCell>
                              <TableCell className="text-right">{cohort.avgClickRate.toFixed(1)}%</TableCell>
                              <TableCell className="text-right">{cohort.avgResponseRate.toFixed(1)}%</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <TrendingUp className="h-3 w-3 text-green-600" />
                                  {cohort.topPerformers}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* No Data State */}
                  {(!currentAnalysis.cohorts || currentAnalysis.cohorts.length === 0) && (
                    <div className="text-center p-12">
                      <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No cohort data available for {currentAnalysis.dimension}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </>
            ) : null}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
