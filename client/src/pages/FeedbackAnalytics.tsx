import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, Users, Star, Award, ThumbsUp, ThumbsDown, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function FeedbackAnalytics() {
  const { user } = useAuth();
  const employerId = user?.id || 1; // Default to 1 for demo

  // Fetch analytics data
  const { data: summary, isLoading: summaryLoading } = trpc.feedback.getAnalyticsSummary.useQuery({ employerId });
  const { data: interviewerMetrics, isLoading: metricsLoading } = trpc.feedback.getInterviewerMetrics.useQuery({ employerId });
  const { data: recommendationDist, isLoading: distLoading } = trpc.feedback.getRecommendationDistribution.useQuery({ employerId });
  const { data: topCandidates, isLoading: candidatesLoading } = trpc.feedback.getTopCandidates.useQuery({ employerId, limit: 10 });

  const isLoading = summaryLoading || metricsLoading || distLoading || candidatesLoading;

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const recommendationColors = {
    strong_hire: "bg-green-600",
    hire: "bg-green-400",
    maybe: "bg-yellow-400",
    no_hire: "bg-red-400",
    strong_no_hire: "bg-red-600",
  };

  const recommendationLabels = {
    strong_hire: "Strong Hire",
    hire: "Hire",
    maybe: "Maybe",
    no_hire: "No Hire",
    strong_no_hire: "Strong No Hire",
  };

  // Calculate total recommendations for percentage
  const totalRecommendations = recommendationDist?.reduce((sum, item) => sum + Number(item.count), 0) || 0;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback Analytics</h1>
          <p className="text-muted-foreground">
            Insights into interview performance and candidate evaluations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const metrics = [
                  { label: "Total Feedbacks", value: summary?.totalFeedbacks || 0 },
                  { label: "Average Overall Rating", value: `${summary?.avgOverallRating || 0}/5` },
                  { label: "Active Interviewers", value: summary?.totalInterviewers || 0 },
                  { label: "Candidates Evaluated", value: summary?.totalCandidates || 0 },
                ];
                const result = await trpc.export.analyticsCSV.mutate({ metrics });
                const blob = new Blob([result.csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename;
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success("CSV exported successfully");
              } catch (error) {
                toast.error("Failed to export CSV");
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const metrics = [
                  { label: "Total Feedbacks", value: summary?.totalFeedbacks || 0 },
                  { label: "Average Overall Rating", value: `${summary?.avgOverallRating || 0}/5` },
                  { label: "Active Interviewers", value: summary?.totalInterviewers || 0 },
                  { label: "Candidates Evaluated", value: summary?.totalCandidates || 0 },
                ];
                const result = await trpc.export.analyticsPDF.mutate({ 
                  title: "Feedback Analytics Report",
                  metrics,
                  charts: [
                    { title: "Recommendation Distribution", description: "Breakdown of hiring recommendations" },
                    { title: "Interviewer Performance", description: "Metrics by interviewer" },
                  ]
                });
                const blob = new Blob([Uint8Array.from(atob(result.pdf), c => c.charCodeAt(0))], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename;
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success("PDF exported successfully");
              } catch (error) {
                toast.error("Failed to export PDF");
              }
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedbacks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalFeedbacks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Submitted feedback forms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Overall Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.avgOverallRating || 0}/5</div>
            <p className="text-xs text-muted-foreground">
              Average across all feedbacks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Interviewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalInterviewers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Unique interviewers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidates Evaluated</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalCandidates || 0}</div>
            <p className="text-xs text-muted-foreground">
              Unique candidates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recommendation Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of hiring recommendations across all interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendationDist && recommendationDist.length > 0 ? (
            <div className="space-y-4">
              {recommendationDist.map((item) => {
                const percentage = totalRecommendations > 0 
                  ? Math.round((Number(item.count) / totalRecommendations) * 100) 
                  : 0;
                
                return (
                  <div key={item.recommendation} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {recommendationLabels[item.recommendation as keyof typeof recommendationLabels]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${recommendationColors[item.recommendation as keyof typeof recommendationColors]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recommendation data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interviewer Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Interviewer Performance Metrics
          </CardTitle>
          <CardDescription>
            Average ratings and recommendation patterns by interviewer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {interviewerMetrics && interviewerMetrics.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interviewer</TableHead>
                    <TableHead className="text-right">Total Feedbacks</TableHead>
                    <TableHead className="text-right">Avg Rating</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        Hire Rate
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ThumbsDown className="h-3 w-3" />
                        No Hire Rate
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviewerMetrics.map((metric) => (
                    <TableRow key={metric.interviewerId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{metric.interviewerName || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">{metric.interviewerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{Number(metric.totalFeedbacks)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {Number(metric.avgOverallRating).toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {Number(metric.hireRate).toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {Number(metric.noHireRate).toFixed(0)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No interviewer metrics available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Candidates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top-Performing Candidates
          </CardTitle>
          <CardDescription>
            Candidates with the highest average feedback scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topCandidates && topCandidates.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="text-right">Feedbacks</TableHead>
                    <TableHead className="text-right">Overall Rating</TableHead>
                    <TableHead className="text-right">Technical</TableHead>
                    <TableHead className="text-right">Communication</TableHead>
                    <TableHead className="text-right">Problem Solving</TableHead>
                    <TableHead className="text-right">Strong Hires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCandidates.map((candidate, index) => (
                    <TableRow key={candidate.candidateId}>
                      <TableCell>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{candidate.candidateName}</div>
                          <div className="text-sm text-muted-foreground">{candidate.candidateEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{Number(candidate.feedbackCount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {Number(candidate.avgOverallRating).toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {candidate.avgTechnicalRating ? Number(candidate.avgTechnicalRating).toFixed(1) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {candidate.avgCommunicationRating ? Number(candidate.avgCommunicationRating).toFixed(1) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {candidate.avgProblemSolvingRating ? Number(candidate.avgProblemSolvingRating).toFixed(1) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {Number(candidate.strongHireCount)} / {Number(candidate.hireCount)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No candidate data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
