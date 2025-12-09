import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, TrendingUp, Heart, Briefcase, User, AlertCircle, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function AIMatching() {
  const { user, loading: authLoading } = useAuth();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [matchingMode, setMatchingMode] = useState<"job-to-candidates" | "candidate-to-jobs">("job-to-candidates");
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);

  const saveMatch = trpc.savedMatches.save.useMutation({
    onSuccess: () => {
      toast.success("Match saved successfully!");
      setSavingMatchId(null);
    },
    onError: (error) => {
      toast.error(`Failed to save match: ${error.message}`);
      setSavingMatchId(null);
    },
  });

  const handleSaveMatch = (match: any) => {
    const candidateId = matchingMode === "job-to-candidates" ? match.candidate?.id : parseInt(selectedCandidateId);
    const jobId = matchingMode === "job-to-candidates" ? parseInt(selectedJobId) : match.job?.id;
    const matchId = `${candidateId}-${jobId}`;
    setSavingMatchId(matchId);
    
    saveMatch.mutate({
      candidateId,
      jobId,
      overallScore: match.overallScore,
      technicalScore: match.technicalScore || 0,
      cultureFitScore: match.cultureFitScore || 0,
      wellbeingScore: match.wellbeingScore || 0,
      matchExplanation: match.explanation,
      matchMetadata: match,
    });
  };

  // Fetch jobs and candidates for selection
  const { data: jobs, isLoading: jobsLoading } = trpc.jobs.list.useQuery(
    { limit: 100 },
    { enabled: !!user }
  );

  const { data: candidates, isLoading: candidatesLoading } = trpc.candidates.list.useQuery(
    { limit: 100 },
    { enabled: !!user }
  );

  // Fetch match results based on mode
  const { data: jobMatchResults, isLoading: jobMatchLoading, refetch: refetchJobMatches } = 
    trpc.aiMatching.matchCandidatesForJob.useQuery(
      { jobId: parseInt(selectedJobId) },
      { enabled: matchingMode === "job-to-candidates" && !!selectedJobId }
    );

  const { data: candidateMatchResults, isLoading: candidateMatchLoading, refetch: refetchCandidateMatches } = 
    trpc.aiMatching.matchJobsForCandidate.useQuery(
      { candidateId: parseInt(selectedCandidateId) },
      { enabled: matchingMode === "candidate-to-jobs" && !!selectedCandidateId }
    );

  const isLoading = jobsLoading || candidatesLoading || jobMatchLoading || candidateMatchLoading;
  const matchResults = matchingMode === "job-to-candidates" ? jobMatchResults : candidateMatchResults;

  const handleFindMatches = () => {
    if (matchingMode === "job-to-candidates" && selectedJobId) {
      refetchJobMatches();
    } else if (matchingMode === "candidate-to-jobs" && selectedCandidateId) {
      refetchCandidateMatches();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI Matching Engine
            </h1>
            <p className="text-muted-foreground mt-2">
              10,000+ attribute matching with culture fit and wellbeing analysis
            </p>
          </div>
        </div>

        {/* Matching Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Matching Mode</CardTitle>
            <CardDescription>Choose whether to find candidates for a job or jobs for a candidate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={matchingMode} onValueChange={(v) => setMatchingMode(v as typeof matchingMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="job-to-candidates" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Find Candidates for Job
                </TabsTrigger>
                <TabsTrigger value="candidate-to-jobs" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Find Jobs for Candidate
                </TabsTrigger>
              </TabsList>

              <TabsContent value="job-to-candidates" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Job</label>
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a job position..." />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs?.jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title} - {job.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleFindMatches} 
                  disabled={!selectedJobId || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Matches...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Find Best Candidates
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="candidate-to-jobs" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Candidate</label>
                  <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a candidate..." />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates?.candidates.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id.toString()}>
                          {candidate.name} - {candidate.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleFindMatches} 
                  disabled={!selectedCandidateId || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Matches...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Find Best Jobs
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Match Results */}
        {matchResults && matchResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Match Results ({matchResults.length})</h2>
            <div className="grid gap-4">
              {matchResults.map((match: any, index: number) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">
                          {matchingMode === "job-to-candidates" 
                            ? `${match.candidate?.name || "Unknown Candidate"}`
                            : `${match.job?.title || "Unknown Job"}`
                          }
                        </CardTitle>
                        <CardDescription>
                          {matchingMode === "job-to-candidates"
                            ? match.candidate?.email
                            : `${match.job?.department} - ${match.job?.location}`
                          }
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(match.overallScore)}`}>
                          {match.overallScore}%
                        </div>
                        <Badge variant={getScoreBadgeVariant(match.overallScore)}>
                          {match.overallScore >= 80 ? "Excellent Match" : 
                           match.overallScore >= 60 ? "Good Match" : "Fair Match"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Score Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Technical Match
                          </span>
                          <span className="font-semibold">{match.technicalScore}%</span>
                        </div>
                        <Progress value={match.technicalScore} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            Culture Fit
                          </span>
                          <span className="font-semibold">{match.cultureFitScore}%</span>
                        </div>
                        <Progress value={match.cultureFitScore} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            Wellbeing
                          </span>
                          <span className="font-semibold">{match.wellbeingScore}%</span>
                        </div>
                        <Progress value={match.wellbeingScore} className="h-2" />
                      </div>
                    </div>

                    {/* AI Explanation */}
                    {match.explanation && (
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Sparkles className="h-4 w-4 text-primary" />
                          AI Match Analysis
                        </div>
                        <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                          <Streamdown>{match.explanation}</Streamdown>
                        </div>
                      </div>
                    )}

                    {/* Top Matching Attributes */}
                    {match.topAttributes && match.topAttributes.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold">Top Matching Attributes</div>
                        <div className="flex flex-wrap gap-2">
                          {match.topAttributes.slice(0, 8).map((attr: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {attr.name}: {attr.score}%
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveMatch(match)}
                        disabled={savingMatchId === `${matchingMode === "job-to-candidates" ? match.candidate?.id : parseInt(selectedCandidateId)}-${matchingMode === "job-to-candidates" ? parseInt(selectedJobId) : match.job?.id}`}
                      >
                        {savingMatchId === `${matchingMode === "job-to-candidates" ? match.candidate?.id : parseInt(selectedCandidateId)}-${matchingMode === "job-to-candidates" ? parseInt(selectedJobId) : match.job?.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Bookmark className="h-4 w-4 mr-2" />
                        )}
                        Save Match
                      </Button>
                    </div>

                    {/* Burnout Risk (if available) */}
                    {match.burnoutRisk !== undefined && match.burnoutRisk > 50 && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                            Burnout Risk: {match.burnoutRisk}%
                          </span>
                          <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                            Consider wellbeing support and work-life balance initiatives for this match.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!matchResults && !isLoading && (selectedJobId || selectedCandidateId) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Matches Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your selection or check back later for new matches.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
