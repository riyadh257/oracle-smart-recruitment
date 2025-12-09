import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Clock, Target, BarChart3, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function PredictiveAnalytics() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

  const { data: jobs } = trpc.jobs.list.useQuery();
  const { data: candidates } = trpc.candidate.list.useQuery(
    { jobId: selectedJobId! },
    { enabled: !!selectedJobId }
  );
  const { data: predictions, refetch: refetchPredictions } = trpc.predictiveAnalytics.getPredictions.useQuery();
  // TODO: Implement getHistoricalTrends and generatePredictions procedures
  // const { data: historicalTrends } = trpc.predictiveAnalytics.getHistoricalTrends.useQuery();
  const historicalTrends: any = null;
  
  // const generateMutation = trpc.predictiveAnalytics.generatePredictions.useMutation();
  const generateMutation = trpc.predictiveAnalytics.generatePrediction.useMutation();

  const handleGeneratePredictions = async () => {
    if (!selectedJobId) {
      toast.error("Please select a job position");
      return;
    }

    try {
      await generateMutation.mutateAsync({
        jobId: selectedJobId,
        predictionType: "success_rate" as const,
        candidateId: selectedCandidateId || undefined,
      });
      toast.success("Predictions generated successfully");
      refetchPredictions();
    } catch (error) {
      toast.error("Failed to generate predictions");
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  const getPredictionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      success_rate: "Candidate Success Rate",
      time_to_hire: "Estimated Time to Hire",
      candidate_fit: "Candidate Fit Score",
    };
    return labels[type] || type;
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Predictive Analytics</h1>
        <p className="text-muted-foreground mt-2">
          ML-based predictions for candidate success rates and time-to-hire estimates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Total Hired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{historicalTrends?.totalHired || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successful placements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{historicalTrends?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Application to hire ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              Avg Time to Hire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {historicalTrends?.avgTimeToHire?.[0]?.avgDays || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Days on average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Generate New Predictions</CardTitle>
            <CardDescription>
              Select a job position and optionally a candidate to generate predictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="job">Job Position *</Label>
              <Select
                value={selectedJobId?.toString() || ""}
                onValueChange={(value) => {
                  setSelectedJobId(parseInt(value));
                  setSelectedCandidateId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a job position" />
                </SelectTrigger>
                <SelectContent>
                  {jobs?.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title} - {job.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedJobId && (
              <div>
                <Label htmlFor="candidate">Candidate (Optional)</Label>
                <Select
                  value={selectedCandidateId?.toString() || ""}
                  onValueChange={(value) => setSelectedCandidateId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a candidate (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None - Job level prediction</SelectItem>
                    {candidates?.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id.toString()}>
                        {candidate.name} - {candidate.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={handleGeneratePredictions}
              disabled={generateMutation.isPending || !selectedJobId}
              className="w-full"
            >
              {generateMutation.isPending ? (
                "Generating..."
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Predictions
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Hiring Trends</CardTitle>
            <CardDescription>
              Historical hiring patterns over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historicalTrends?.monthlyHires && historicalTrends.monthlyHires.length > 0 ? (
              <div className="space-y-3">
                {historicalTrends.monthlyHires.slice(0, 6).map((item: any) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-blue-600 rounded" style={{ width: `${item.count * 20}px` }} />
                      <span className="text-sm text-muted-foreground">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No historical data available yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Predictions
          </CardTitle>
          <CardDescription>
            AI-generated predictions based on historical data and candidate profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {predictions && predictions.length > 0 ? (
            <div className="space-y-4">
              {predictions.map((prediction: any) => {
                const factors = prediction.factors ? JSON.parse(prediction.factors) : {};
                return (
                  <div
                    key={prediction.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {getPredictionTypeLabel(prediction.predictionType)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Job ID: {prediction.jobId}
                          {prediction.candidateId && ` • Candidate ID: ${prediction.candidateId}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {prediction.predictionType === "time_to_hire"
                            ? `${prediction.predictedValue} days`
                            : `${prediction.predictedValue}%`}
                        </div>
                        <div className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                          {prediction.confidence}% confidence
                        </div>
                      </div>
                    </div>

                    {Object.keys(factors).length > 0 && (
                      <div className="bg-muted/50 rounded p-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase">
                          Contributing Factors
                        </p>
                        {Object.entries(factors).map(([key, value]) => (
                          <div key={key} className="text-sm flex items-center justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                            <span className="font-medium">
                              {typeof value === "number" ? value.toFixed(1) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Generated on {new Date(prediction.createdAt).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No predictions yet</h3>
              <p className="text-muted-foreground mt-2">
                Generate your first prediction to see AI-powered insights
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {historicalTrends?.avgTimeToHire && historicalTrends.avgTimeToHire.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Average Time to Hire Trends</CardTitle>
            <CardDescription>
              How long it takes to hire candidates over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historicalTrends.avgTimeToHire.map((item: any) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 bg-purple-600 rounded"
                      style={{ width: `${Math.min(item.avgDays * 3, 200)}px` }}
                    />
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {item.avgDays} days
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
