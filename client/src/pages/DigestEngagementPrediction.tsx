import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, TrendingDown, Clock, Users, Mail, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";

export default function DigestEngagementPrediction() {
  const [recipientSegment, setRecipientSegment] = useState("general");
  const [notificationCount, setNotificationCount] = useState(5);
  const [notificationTypes, setNotificationTypes] = useState<string[]>(["interview_scheduled", "feedback_request"]);
  const [scheduledHour, setScheduledHour] = useState(9);
  const [scheduledDayOfWeek, setScheduledDayOfWeek] = useState(1); // Monday
  const [prediction, setPrediction] = useState<any>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: predictionHistory, isLoading: loadingHistory } = trpc.engagementPrediction.getHistory.useQuery({ limit: 10 });
  const { data: engagementStats, isLoading: loadingStats } = trpc.engagementPrediction.getEngagementStats.useQuery({
    segment: recipientSegment,
  });

  // Mutations
  const generatePrediction = trpc.engagementPrediction.generatePrediction.useMutation({
    onSuccess: (data) => {
      setPrediction(data);
      toast.success("Prediction generated successfully");
      utils.engagementPrediction.getHistory.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to generate prediction: ${error.message}`);
    },
  });

  const handleGeneratePrediction = () => {
    generatePrediction.mutate({
      recipientSegment: recipientSegment || undefined,
      notificationCount,
      notificationTypes,
      scheduledHour,
      scheduledDayOfWeek,
    });
  };

  const getDayName = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day];
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return <Badge variant="default">High Confidence</Badge>;
    if (score >= 60) return <Badge variant="secondary">Medium Confidence</Badge>;
    return <Badge variant="destructive">Low Confidence</Badge>;
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "positive":
      case "high":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "negative":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  const formatHourlyData = () => {
    if (!engagementStats?.byHour) return [];
    return engagementStats.byHour.map((stat, hour) => ({
      hour: `${hour}:00`,
      openRate: stat ? Number(stat.avgOpenRate).toFixed(1) : 0,
      clickRate: stat ? Number(stat.avgClickRate).toFixed(1) : 0,
      responseRate: stat ? Number(stat.avgResponseRate).toFixed(1) : 0,
    }));
  };

  const formatDailyData = () => {
    if (!engagementStats?.byDay) return [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return engagementStats.byDay.map((stat, day) => ({
      day: days[day],
      openRate: stat ? Number(stat.avgOpenRate).toFixed(1) : 0,
      clickRate: stat ? Number(stat.avgClickRate).toFixed(1) : 0,
      responseRate: stat ? Number(stat.avgResponseRate).toFixed(1) : 0,
    }));
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Digest Engagement Prediction</h1>
          <p className="text-muted-foreground mt-2">
            ML-powered predictions for digest performance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generate Prediction</CardTitle>
            <CardDescription>
              Configure digest parameters to get engagement predictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="segment">Recipient Segment</Label>
              <Input
                id="segment"
                placeholder="e.g., engineering, sales"
                value={recipientSegment}
                onChange={(e) => setRecipientSegment(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">Notification Count</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={50}
                value={notificationCount}
                onChange={(e) => setNotificationCount(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hour">Scheduled Hour (0-23)</Label>
              <Input
                id="hour"
                type="number"
                min={0}
                max={23}
                value={scheduledHour}
                onChange={(e) => setScheduledHour(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">{scheduledHour}:00</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="day">Day of Week</Label>
              <Input
                id="day"
                type="number"
                min={0}
                max={6}
                value={scheduledDayOfWeek}
                onChange={(e) => setScheduledDayOfWeek(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">{getDayName(scheduledDayOfWeek)}</p>
            </div>

            <Button
              className="w-full"
              onClick={handleGeneratePrediction}
              disabled={generatePrediction.isPending}
            >
              {generatePrediction.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Prediction
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Prediction Results */}
        <div className="lg:col-span-2 space-y-6">
          {prediction ? (
            <>
              {/* Predicted Rates */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{prediction.predictedOpenRate}%</div>
                    <Progress value={prediction.predictedOpenRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{prediction.predictedClickRate}%</div>
                    <Progress value={prediction.predictedClickRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{prediction.predictedResponseRate}%</div>
                    <Progress value={prediction.predictedResponseRate} className="mt-2" />
                  </CardContent>
                </Card>
              </div>

              {/* Confidence & Sample Size */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Prediction Confidence</CardTitle>
                    {getConfidenceBadge(prediction.confidenceScore)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Confidence Score</span>
                        <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidenceScore)}`}>
                          {prediction.confidenceScore}%
                        </span>
                      </div>
                      <Progress value={prediction.confidenceScore} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Based on {prediction.historicalSampleSize} historical digests</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prediction Factors */}
              {prediction.predictionFactors && prediction.predictionFactors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Prediction Factors</CardTitle>
                    <CardDescription>Key factors influencing this prediction</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {prediction.predictionFactors.map((factor: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                          {getImpactIcon(factor.impact)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{factor.factor}</span>
                              <Badge variant="outline" className="text-xs">
                                {factor.impact}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{factor.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {prediction.recommendations && prediction.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>Suggestions to improve engagement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {prediction.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                          <AlertCircle className={`h-5 w-5 ${getPriorityColor(rec.priority)}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={rec.priority === "high" ? "destructive" : "secondary"}>
                                {rec.priority} priority
                              </Badge>
                              <Badge variant="outline">{rec.type}</Badge>
                            </div>
                            <p className="text-sm">{rec.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Configure parameters and generate a prediction to see results
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Historical Data & Analytics */}
      <div className="mt-8">
        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">Prediction History</TabsTrigger>
            <TabsTrigger value="hourly">Hourly Trends</TabsTrigger>
            <TabsTrigger value="daily">Daily Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : predictionHistory && predictionHistory.length > 0 ? (
              predictionHistory.map((pred: any) => (
                <Card key={pred.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {pred.recipientSegment} • {pred.notificationCount} notifications
                        </CardTitle>
                        <CardDescription>
                          {getDayName(pred.scheduledDayOfWeek)} at {pred.scheduledHour}:00
                        </CardDescription>
                      </div>
                      {getConfidenceBadge(pred.confidenceScore)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Open Rate:</span>
                        <span className="ml-2 font-medium">{pred.predictedOpenRate}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Click Rate:</span>
                        <span className="ml-2 font-medium">{pred.predictedClickRate}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Response Rate:</span>
                        <span className="ml-2 font-medium">{pred.predictedResponseRate}%</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Generated {new Date(pred.createdAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No prediction history yet
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="hourly">
            <Card>
              <CardHeader>
                <CardTitle>Engagement by Hour of Day</CardTitle>
                <CardDescription>Historical engagement rates by time of day</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={formatHourlyData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="openRate" stroke="hsl(var(--primary))" name="Open Rate %" />
                      <Line type="monotone" dataKey="clickRate" stroke="hsl(var(--chart-2))" name="Click Rate %" />
                      <Line type="monotone" dataKey="responseRate" stroke="hsl(var(--chart-3))" name="Response Rate %" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Engagement by Day of Week</CardTitle>
                <CardDescription>Historical engagement rates by day</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={formatDailyData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="openRate" fill="hsl(var(--primary))" name="Open Rate %" />
                      <Bar dataKey="clickRate" fill="hsl(var(--chart-2))" name="Click Rate %" />
                      <Bar dataKey="responseRate" fill="hsl(var(--chart-3))" name="Response Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
