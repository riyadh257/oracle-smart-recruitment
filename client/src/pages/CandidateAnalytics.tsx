import { useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Calendar, Star, Presentation } from "lucide-react";
import { GeneratePresentationDialog } from "@/components/GeneratePresentationDialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function CandidateAnalytics() {
  const [, params] = useRoute("/candidates/:id/analytics");
  const candidateId = params?.id ? parseInt(params.id) : 0;

  const radarChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const radarChartInstance = useRef<Chart | null>(null);
  const barChartInstance = useRef<Chart | null>(null);

  const { data: candidate } = trpc.candidate.getById.useQuery({ id: candidateId });
  const { data: analytics, isLoading } = trpc.feedbackAnalytics.getCandidateAnalytics.useQuery(
    { candidateId },
    { enabled: candidateId > 0 }
  );

  useEffect(() => {
    if (!analytics || !radarChartRef.current || !barChartRef.current) return;

    // Destroy existing charts
    if (radarChartInstance.current) {
      radarChartInstance.current.destroy();
    }
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }

    // Radar chart for skill breakdown
    const radarCtx = radarChartRef.current.getContext("2d");
    if (radarCtx) {
      radarChartInstance.current = new Chart(radarCtx, {
        type: "radar",
        data: {
          labels: ["Technical Skills", "Communication", "Problem Solving", "Culture Fit"],
          datasets: [
            {
              label: "Average Ratings",
              data: [
                analytics.averages.technicalSkills,
                analytics.averages.communication,
                analytics.averages.problemSolving,
                analytics.averages.cultureFit,
              ],
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 2,
              pointBackgroundColor: "rgba(59, 130, 246, 1)",
              pointBorderColor: "#fff",
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "rgba(59, 130, 246, 1)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 5,
              ticks: {
                stepSize: 1,
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }

    // Bar chart for interview history
    const barCtx = barChartRef.current.getContext("2d");
    if (barCtx) {
      const sortedHistory = [...analytics.feedbackHistory].sort(
        (a, b) => new Date(a.interviewDate || 0).getTime() - new Date(b.interviewDate || 0).getTime()
      );

      barChartInstance.current = new Chart(barCtx, {
        type: "bar",
        data: {
          labels: sortedHistory.map((f, idx) => `Interview ${idx + 1}`),
          datasets: [
            {
              label: "Overall Rating",
              data: sortedHistory.map((f) => f.overallRating),
              backgroundColor: "rgba(59, 130, 246, 0.7)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 5,
              ticks: {
                stepSize: 1,
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }

    return () => {
      if (radarChartInstance.current) {
        radarChartInstance.current.destroy();
      }
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container py-8">
        <Link href="/candidates">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Candidates
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No feedback data available</p>
            <p className="text-muted-foreground">This candidate hasn't received any interview feedback yet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "strong-hire":
        return "bg-green-500";
      case "hire":
        return "bg-green-400";
      case "maybe":
        return "bg-yellow-500";
      case "no-hire":
        return "bg-red-400";
      case "strong-no-hire":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container py-8">
      <Link href="/candidates">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Candidates
        </Button>
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{candidate?.name}</h1>
          <p className="text-muted-foreground mt-1">Aggregate Interview Feedback Analytics</p>
        </div>
        {candidate && (
          <GeneratePresentationDialog
            candidateId={candidate.id}
            candidateName={candidate.name}
          />
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Interviews</CardDescription>
            <CardTitle className="text-3xl">{analytics.totalInterviews}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Overall Rating</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {analytics.averages.overallRating.toFixed(1)}
              <Star className="h-6 w-6 text-yellow-500" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Technical Skills</CardDescription>
            <CardTitle className="text-3xl">{analytics.averages.technicalSkills.toFixed(1)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Communication</CardDescription>
            <CardTitle className="text-3xl">{analytics.averages.communication.toFixed(1)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Skills Breakdown</CardTitle>
            <CardDescription>Average ratings across all interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <canvas ref={radarChartRef}></canvas>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview History</CardTitle>
            <CardDescription>Overall rating progression</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <canvas ref={barChartRef}></canvas>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Feedback History */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Feedback History</CardTitle>
          <CardDescription>All interview feedback submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.feedbackHistory.map((feedback, idx) => (
              <div key={feedback.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      Interview {idx + 1}
                      {feedback.interviewType && (
                        <Badge variant="outline">
                          {feedback.interviewType}
                        </Badge>
                      )}
                    </h4>
                    {feedback.interviewDate && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(feedback.interviewDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getRecommendationColor(feedback.recommendation)}>
                      {feedback.recommendation.replace("-", " ")}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{feedback.overallRating}/5</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {feedback.technicalSkills && (
                    <div>
                      <p className="text-xs text-muted-foreground">Technical</p>
                      <p className="font-medium">{feedback.technicalSkills}/5</p>
                    </div>
                  )}
                  {feedback.communication && (
                    <div>
                      <p className="text-xs text-muted-foreground">Communication</p>
                      <p className="font-medium">{feedback.communication}/5</p>
                    </div>
                  )}
                  {feedback.problemSolving && (
                    <div>
                      <p className="text-xs text-muted-foreground">Problem Solving</p>
                      <p className="font-medium">{feedback.problemSolving}/5</p>
                    </div>
                  )}
                  {feedback.cultureFit && (
                    <div>
                      <p className="text-xs text-muted-foreground">Culture Fit</p>
                      <p className="font-medium">{feedback.cultureFit}/5</p>
                    </div>
                  )}
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Submitted by: {feedback.submittedBy}</p>
                  
                  {feedback.strengths && (
                    <div className="mb-2">
                      <p className="font-medium text-green-600">Strengths:</p>
                      <p className="text-muted-foreground">{feedback.strengths}</p>
                    </div>
                  )}
                  
                  {feedback.weaknesses && (
                    <div className="mb-2">
                      <p className="font-medium text-red-600">Weaknesses:</p>
                      <p className="text-muted-foreground">{feedback.weaknesses}</p>
                    </div>
                  )}
                  
                  {feedback.comments && (
                    <div>
                      <p className="font-medium">Comments:</p>
                      <p className="text-muted-foreground">{feedback.comments}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
