import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  TrendingUp, 
  Brain, 
  ThumbsUp, 
  ThumbsDown,
  Info,
  Target,
  Award,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SmartRecommendations() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [limit, setLimit] = useState(10);
  const [minScore, setMinScore] = useState(60);

  // Fetch available jobs
  const { data: jobs, isLoading: jobsLoading } = trpc.bulkMatchingOps.getAvailableJobs.useQuery({
    status: 'open',
  });

  // Fetch recommendations for selected job
  const { data: recommendations, isLoading: recommendationsLoading } = trpc.smartRecommendations.getRecommendations.useQuery(
    {
      jobId: selectedJobId!,
      limit,
      minScore,
    },
    {
      enabled: selectedJobId !== null,
    }
  );

  // Fetch statistics
  const { data: statistics, isLoading: statisticsLoading } = trpc.smartRecommendations.getStatistics.useQuery(
    {
      jobId: selectedJobId!,
    },
    {
      enabled: selectedJobId !== null,
    }
  );

  // Fetch learning weights
  const { data: learningWeights } = trpc.smartRecommendations.getLearningWeights.useQuery({});

  // Feedback mutation
  const recordFeedback = trpc.smartRecommendations.recordFeedback.useMutation({
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
    },
  });

  const handleFeedback = (candidateId: number, wasHelpful: boolean) => {
    if (!selectedJobId) return;

    recordFeedback.mutate({
      candidateId,
      jobId: selectedJobId,
      wasHelpful,
    });
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-600">High Confidence</Badge>;
    } else if (confidence >= 0.6) {
      return <Badge className="bg-yellow-600">Medium Confidence</Badge>;
    } else {
      return <Badge variant="secondary">Low Confidence</Badge>;
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Smart Recommendations
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered candidate suggestions that learn from your hiring patterns
          </p>
        </div>
      </div>

      {/* Job Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select a Job</CardTitle>
          <CardDescription>
            Choose a job to get AI-powered candidate recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedJobId?.toString() || ''}
              onValueChange={(value) => setSelectedJobId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a job..." />
              </SelectTrigger>
              <SelectContent>
                {jobs?.map(job => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.title} - {job.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Learning Insights */}
      {learningWeights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Learning Insights
            </CardTitle>
            <CardDescription>
              The AI has learned from your hiring patterns to optimize recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Skills</span>
                  <span className="text-sm text-muted-foreground">
                    {(learningWeights.skillWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={learningWeights.skillWeight * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Culture Fit</span>
                  <span className="text-sm text-muted-foreground">
                    {(learningWeights.cultureWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={learningWeights.cultureWeight * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Wellbeing</span>
                  <span className="text-sm text-muted-foreground">
                    {(learningWeights.wellbeingWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={learningWeights.wellbeingWeight * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Experience</span>
                  <span className="text-sm text-muted-foreground">
                    {(learningWeights.experienceWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={learningWeights.experienceWeight * 100} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {selectedJobId && statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalCandidates}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Analyzed for this position
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.highConfidence}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Strong historical match
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium Confidence</CardTitle>
              <Zap className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.mediumConfidence}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Good potential matches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.avgRecommendationScore}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Recommendation score
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations List */}
      {selectedJobId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Top Recommendations
            </CardTitle>
            <CardDescription>
              Candidates ranked by AI-powered recommendation score
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : recommendations && recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div
                    key={rec.candidate.id}
                    className="flex items-start gap-4 p-6 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    {/* Rank Badge */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
                      #{idx + 1}
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{rec.candidate.name}</h4>
                          <p className="text-sm text-muted-foreground">{rec.candidate.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getConfidenceBadge(rec.confidence)}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Info className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{rec.explanation}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="grid grid-cols-5 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
                          <div className="text-2xl font-bold text-primary">
                            {rec.recommendationScore}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Skills</p>
                          <div className="text-lg font-semibold">
                            {rec.matchScores.skillMatchScore}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Culture</p>
                          <div className="text-lg font-semibold">
                            {rec.matchScores.cultureFitScore}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Wellbeing</p>
                          <div className="text-lg font-semibold">
                            {rec.matchScores.wellbeingMatchScore}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                          <div className="text-lg font-semibold">
                            {(rec.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <span>{rec.explanation}</span>
                      </div>

                      {/* Feedback Buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-sm text-muted-foreground">Was this helpful?</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeedback(rec.candidate.id, true)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Yes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeedback(rec.candidate.id, false)}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          No
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  No recommendations found. Try adjusting the minimum score or ensure there are candidates in the system.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
