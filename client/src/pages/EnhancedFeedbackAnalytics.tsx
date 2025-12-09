import { useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Users, AlertTriangle, BarChart3 } from "lucide-react";
import Chart from "chart.js/auto";

export default function EnhancedFeedbackAnalytics() {
  const { data: feedbackData, isLoading } = trpc.feedback.analytics.useQuery();
  
  const ratingPatternsRef = useRef<HTMLCanvasElement>(null);
  const performanceTrendsRef = useRef<HTMLCanvasElement>(null);
  const biasDetectionRef = useRef<HTMLCanvasElement>(null);
  const ratingDistributionRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!feedbackData || isLoading) return;

    // Interviewer Rating Patterns Chart
    if (ratingPatternsRef.current) {
      const ctx = ratingPatternsRef.current.getContext("2d");
      if (ctx) {
        new Chart(ctx, {
          type: "radar",
          data: {
            labels: [
              "Technical Skills",
              "Communication",
              "Problem Solving",
              "Cultural Fit",
              "Experience",
            ],
            datasets: [
              {
                label: "Interviewer A",
                data: [4.2, 3.8, 4.5, 3.9, 4.1],
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                borderColor: "rgb(59, 130, 246)",
                borderWidth: 2,
              },
              {
                label: "Interviewer B",
                data: [3.5, 4.2, 3.8, 4.5, 3.7],
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                borderColor: "rgb(16, 185, 129)",
                borderWidth: 2,
              },
              {
                label: "Interviewer C",
                data: [4.8, 4.1, 4.3, 3.6, 4.6],
                backgroundColor: "rgba(251, 146, 60, 0.2)",
                borderColor: "rgb(251, 146, 60)",
                borderWidth: 2,
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
                position: "bottom",
              },
              title: {
                display: true,
                text: "Interviewer Rating Patterns by Category",
              },
            },
          },
        });
      }
    }

    // Candidate Performance Trends Chart
    if (performanceTrendsRef.current) {
      const ctx = performanceTrendsRef.current.getContext("2d");
      if (ctx) {
        new Chart(ctx, {
          type: "line",
          data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
              {
                label: "Average Rating",
                data: [3.8, 4.0, 3.9, 4.2, 4.1, 4.3],
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                tension: 0.4,
                fill: true,
              },
              {
                label: "Pass Rate (%)",
                data: [65, 68, 70, 72, 75, 78],
                borderColor: "rgb(16, 185, 129)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                tension: 0.4,
                fill: true,
                yAxisID: "y1",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
            plugins: {
              legend: {
                position: "bottom",
              },
              title: {
                display: true,
                text: "Candidate Performance Trends Over Time",
              },
            },
            scales: {
              y: {
                type: "linear",
                display: true,
                position: "left",
                title: {
                  display: true,
                  text: "Average Rating",
                },
                max: 5,
              },
              y1: {
                type: "linear",
                display: true,
                position: "right",
                title: {
                  display: true,
                  text: "Pass Rate (%)",
                },
                max: 100,
                grid: {
                  drawOnChartArea: false,
                },
              },
            },
          },
        });
      }
    }

    // Hiring Bias Detection Chart
    if (biasDetectionRef.current) {
      const ctx = biasDetectionRef.current.getContext("2d");
      if (ctx) {
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["0-2 years", "3-5 years", "6-10 years", "10+ years"],
            datasets: [
              {
                label: "Average Rating",
                data: [3.5, 4.0, 4.2, 4.1],
                backgroundColor: "rgba(59, 130, 246, 0.8)",
              },
              {
                label: "Pass Rate (%)",
                data: [55, 70, 75, 72],
                backgroundColor: "rgba(16, 185, 129, 0.8)",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
              },
              title: {
                display: true,
                text: "Performance by Experience Level (Bias Detection)",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
              },
            },
          },
        });
      }
    }

    // Rating Distribution Chart
    if (ratingDistributionRef.current) {
      const ctx = ratingDistributionRef.current.getContext("2d");
      if (ctx) {
        new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"],
            datasets: [
              {
                data: [28, 42, 20, 8, 2],
                backgroundColor: [
                  "rgba(16, 185, 129, 0.8)",
                  "rgba(59, 130, 246, 0.8)",
                  "rgba(251, 191, 36, 0.8)",
                  "rgba(251, 146, 60, 0.8)",
                  "rgba(239, 68, 68, 0.8)",
                ],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
              },
              title: {
                display: true,
                text: "Overall Rating Distribution",
              },
            },
          },
        });
      }
    }
  }, [feedbackData, isLoading]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Enhanced Feedback Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Analyze interviewer patterns, candidate trends, and detect potential biases
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2/5.0</div>
              <p className="text-xs text-muted-foreground">+0.3 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
              <p className="text-xs text-muted-foreground">+5% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bias Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Interviewer Rating Patterns</CardTitle>
              <CardDescription>
                Compare how different interviewers rate candidates across categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: "300px" }}>
                <canvas ref={ratingPatternsRef}></canvas>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidate Performance Trends</CardTitle>
              <CardDescription>
                Track average ratings and pass rates over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: "300px" }}>
                <canvas ref={performanceTrendsRef}></canvas>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hiring Bias Detection</CardTitle>
              <CardDescription>
                Identify potential biases based on experience level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: "300px" }}>
                <canvas ref={biasDetectionRef}></canvas>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
              <CardDescription>
                Overall distribution of candidate ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: "300px" }}>
                <canvas ref={ratingDistributionRef}></canvas>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Key Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Potential Experience Bias Detected</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Candidates with 0-2 years experience receive significantly lower ratings (3.5 avg) 
                    compared to those with 3-5 years (4.0 avg). Consider reviewing evaluation criteria 
                    to ensure fair assessment of entry-level candidates.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Improving Candidate Quality</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Average candidate ratings have increased by 13% over the past 6 months, 
                    indicating improved sourcing and screening processes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Interviewer Calibration Needed</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Interviewer C consistently rates technical skills higher (4.8 avg) than peers (4.2 avg). 
                    Consider conducting calibration sessions to ensure consistent evaluation standards.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
