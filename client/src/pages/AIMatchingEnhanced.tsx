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
import { 
  Loader2, Sparkles, TrendingUp, Heart, Briefcase, User, AlertCircle, 
  Bookmark, Brain, Target, Users, Zap, Shield, Award, Activity, CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function AIMatchingEnhanced() {
  const { user, loading: authLoading } = useAuth();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [matchingMode, setMatchingMode] = useState<"job-to-candidates" | "candidate-to-jobs">("job-to-candidates");
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

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

  const { data: candidateMatchResults, isLoading: candidateMatchLoading, refetch: refetchCandidateMatches} = 
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

  const getBurnoutRiskColor = (risk: string) => {
    if (risk === "low") return "text-green-600";
    if (risk === "medium") return "text-yellow-600";
    return "text-red-600";
  };

  const getBurnoutRiskBadge = (risk: string): "default" | "secondary" | "destructive" => {
    if (risk === "low") return "default";
    if (risk === "medium") return "secondary";
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
        {/* Header with Stats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Brain className="h-8 w-8 text-primary" />
                AI Matching Engine
              </h1>
              <p className="text-muted-foreground mt-2">
                Advanced 10,000+ attribute matching with culture fit and wellbeing analysis
              </p>
            </div>
          </div>

          {/* System Capabilities Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">10,000+</div>
                    <div className="text-sm text-muted-foreground">Attributes Analyzed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">8</div>
                    <div className="text-sm text-muted-foreground">Culture Dimensions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Heart className="h-8 w-8 text-pink-600" />
                  <div>
                    <div className="text-2xl font-bold">8</div>
                    <div className="text-sm text-muted-foreground">Wellbeing Factors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Zap className="h-8 w-8 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold">AI</div>
                    <div className="text-sm text-muted-foreground">Powered Analysis</div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                      Analyzing 10,000+ Attributes...
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
                      Analyzing 10,000+ Attributes...
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Match Results ({matchResults.length})</h2>
              <Badge variant="outline" className="text-sm">
                Sorted by Overall Score
              </Badge>
            </div>
            <div className="grid gap-4">
              {matchResults.map((match: any, index: number) => {
                const matchId = `${match.candidate?.id || match.job?.id}-${index}`;
                const isExpanded = expandedMatchId === matchId;
                
                return (
                  <Card key={matchId} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            {matchingMode === "job-to-candidates" 
                              ? `${match.candidate?.name || "Unknown Candidate"}`
                              : `${match.job?.title || "Unknown Job"}`
                            }
                            {match.overallScore >= 90 && (
                              <Award className="h-5 w-5 text-yellow-500" />
                            )}
                          </CardTitle>
                          <CardDescription>
                            {matchingMode === "job-to-candidates"
                              ? match.candidate?.email
                              : `${match.job?.department} - ${match.job?.location}`
                            }
                          </CardDescription>
                        </div>
                        <div className="text-right space-y-2">
                          <div className={`text-3xl font-bold ${getScoreColor(match.overallScore)}`}>
                            {match.overallScore}%
                          </div>
                          <Badge variant={getScoreBadgeVariant(match.overallScore)}>
                            {match.overallScore >= 90 ? "Exceptional" :
                             match.overallScore >= 80 ? "Excellent Match" : 
                             match.overallScore >= 60 ? "Good Match" : "Fair Match"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Primary Score Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              Technical Match
                            </span>
                            <span className="font-semibold">{match.technicalScore || 0}%</span>
                          </div>
                          <Progress value={match.technicalScore || 0} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            Skills, experience, certifications
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-purple-600" />
                              Culture Fit
                            </span>
                            <span className="font-semibold">{match.cultureFitScore || 0}%</span>
                          </div>
                          <Progress value={match.cultureFitScore || 0} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            Values, work style, team dynamics
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4 text-pink-600" />
                              Wellbeing
                            </span>
                            <span className="font-semibold">{match.wellbeingScore || 0}%</span>
                          </div>
                          <Progress value={match.wellbeingScore || 0} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            Work-life balance, stress, growth
                          </p>
                        </div>
                      </div>

                      {/* Burnout Risk Indicator */}
                      {match.burnoutRisk && (
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            <span className="text-sm font-medium">Burnout Risk Assessment</span>
                          </div>
                          <Badge variant={getBurnoutRiskBadge(match.burnoutRisk)}>
                            {match.burnoutRisk.toUpperCase()} RISK
                          </Badge>
                        </div>
                      )}

                      {/* AI Explanation */}
                      {match.explanation && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <Sparkles className="h-4 w-4 text-primary" />
                            AI Match Analysis
                          </div>
                          <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                            <Streamdown>{match.explanation}</Streamdown>
                          </div>
                        </div>
                      )}

                      {/* Expandable Detailed Analysis */}
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setExpandedMatchId(isExpanded ? null : matchId)}
                        >
                          {isExpanded ? "Hide" : "Show"} Detailed Analysis
                          <CheckCircle2 className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </Button>

                        {isExpanded && (
                          <div className="space-y-4 pt-4 border-t">
                            {/* Culture Fit Dimensions */}
                            {match.cultureDimensions && (
                              <div className="space-y-3">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Culture Fit Dimensions (8 Factors)
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  {Object.entries(match.cultureDimensions).map(([key, value]: [string, any]) => (
                                    <div key={key} className="space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="font-semibold">{value}%</span>
                                      </div>
                                      <Progress value={value} className="h-1" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Wellbeing Factors */}
                            {match.wellbeingFactors && (
                              <div className="space-y-3">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Heart className="h-4 w-4" />
                                  Wellbeing Compatibility (8 Factors)
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  {Object.entries(match.wellbeingFactors).map(([key, value]: [string, any]) => (
                                    <div key={key} className="space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="font-semibold">{value}%</span>
                                      </div>
                                      <Progress value={value} className="h-1" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Top Matching Attributes */}
                            {match.topAttributes && match.topAttributes.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Top Matching Attributes
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {match.topAttributes.slice(0, 10).map((attr: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {attr}
                                    </Badge>
                                  ))}
                                  {match.topAttributes.length > 10 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{match.topAttributes.length - 10} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Concerns */}
                            {match.concerns && match.concerns.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-yellow-600">
                                  <AlertCircle className="h-4 w-4" />
                                  Areas for Discussion
                                </h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                  {match.concerns.map((concern: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-yellow-600 mt-0.5">•</span>
                                      {concern}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => handleSaveMatch(match)}
                          disabled={savingMatchId === matchId}
                          variant="default"
                          className="flex-1"
                        >
                          {savingMatchId === matchId ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Bookmark className="mr-2 h-4 w-4" />
                              Save Match
                            </>
                          )}
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Shield className="mr-2 h-4 w-4" />
                          Schedule Interview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!matchResults || matchResults.length === 0) && (selectedJobId || selectedCandidateId) && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Brain className="h-16 w-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Matches Found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your selection or check back later for new candidates/jobs.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
