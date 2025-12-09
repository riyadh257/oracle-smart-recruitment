import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, TrendingUp, Users, Briefcase, Target, Sparkles, Bookmark } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AIMatchingDashboard() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [minScore, setMinScore] = useState(60);

  // Fetch jobs and candidates for selection
  const { data: jobs, isLoading: jobsLoading } = trpc.jobs.list.useQuery({ limit: 100 });
  const { data: candidatesData, isLoading: candidatesLoading } = trpc.candidates.list.useQuery({ 
    page: 1, 
    pageSize: 100 
  });

  // Fetch top matches for selected job
  const { data: jobMatches, isLoading: jobMatchesLoading, refetch: refetchJobMatches } = 
    trpc.aiMatching.getTopMatchesForJob.useQuery(
      { jobId: selectedJobId!, limit: 10, minScore },
      { enabled: !!selectedJobId }
    );

  // Fetch recommended jobs for selected candidate
  const { data: candidateRecommendations, isLoading: candidateRecsLoading, refetch: refetchCandidateRecs } = 
    trpc.aiMatching.getRecommendedJobsForCandidate.useQuery(
      { candidateId: selectedCandidateId!, limit: 10 },
      { enabled: !!selectedCandidateId }
    );

  // Save match mutation
  const saveMatchMutation = trpc.savedMatches.saveMatch.useMutation({  
    onSuccess: () => {
      toast.success("Match saved successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to save match: ${error.message}`);
    },
  });

  // Calculate match mutation
  const calculateMatch = trpc.aiMatching.calculateMatch.useMutation({
    onSuccess: () => {
      toast.success("Match calculated successfully!");
      refetchJobMatches();
      refetchCandidateRecs();
    },
    onError: (error) => {
      toast.error(`Failed to calculate match: ${error.message}`);
    }
  });

  const handleCalculateMatch = (candidateId: number, jobId: number) => {
    calculateMatch.mutate({ candidateId, jobId });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            AI Matching Engine
          </h1>
          <p className="text-muted-foreground mt-2">
            10,000+ attribute matching powered by advanced AI
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Ready for matching</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidatesData?.total || 0}</div>
            <p className="text-xs text-muted-foreground">In talent pool</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">Across all matches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Matches</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobMatches?.filter(m => (m.application.overallMatchScore || 0) >= 80).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">80%+ match score</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Matching Interface */}
      <Tabs defaultValue="job-matches" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="job-matches">Find Candidates for Job</TabsTrigger>
          <TabsTrigger value="candidate-jobs">Find Jobs for Candidate</TabsTrigger>
        </TabsList>

        {/* Job Matches Tab */}
        <TabsContent value="job-matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Top Candidates</CardTitle>
              <CardDescription>
                Select a job to find the best matching candidates using AI-powered analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="job-select">Select Job</Label>
                  <Select
                    value={selectedJobId?.toString()}
                    onValueChange={(value) => setSelectedJobId(parseInt(value))}
                  >
                    <SelectTrigger id="job-select">
                      <SelectValue placeholder="Choose a job position" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobsLoading ? (
                        <SelectItem value="loading" disabled>Loading jobs...</SelectItem>
                      ) : (
                        jobs?.map((job) => (
                          <SelectItem key={job.id} value={job.id.toString()}>
                            {job.title} - {job.location}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-score">Minimum Match Score (%)</Label>
                  <Input
                    id="min-score"
                    type="number"
                    min="0"
                    max="100"
                    value={minScore}
                    onChange={(e) => setMinScore(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Match Results */}
          {selectedJobId && (
            <Card>
              <CardHeader>
                <CardTitle>Top Matching Candidates</CardTitle>
                <CardDescription>
                  Ranked by overall match score (Technical, Culture, Wellbeing)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jobMatchesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : jobMatches && jobMatches.length > 0 ? (
                  <div className="space-y-4">
                    {jobMatches.map((match) => (
                      <Card key={match.application.id} className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold">
                                  {match.candidate.fullName}
                                </h3>
                                <Badge variant={getScoreBadgeVariant(match.application.overallMatchScore || 0)}>
                                  {match.application.overallMatchScore}% Match
                                </Badge>
                              </div>
                              
                              <div className="flex gap-2 text-sm text-muted-foreground">
                                <span>{match.candidate.email}</span>
                                {match.candidate.location && (
                                  <>
                                    <span>•</span>
                                    <span>{match.candidate.location}</span>
                                  </>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-4 mt-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Technical</p>
                                  <p className={`text-lg font-semibold ${getScoreColor(match.application.skillMatchScore || 0)}`}>
                                    {match.application.skillMatchScore}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Culture Fit</p>
                                  <p className={`text-lg font-semibold ${getScoreColor(match.application.cultureFitScore || 0)}`}>
                                    {match.application.cultureFitScore}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Wellbeing</p>
                                  <p className={`text-lg font-semibold ${getScoreColor(match.application.wellbeingMatchScore || 0)}`}>
                                    {match.application.wellbeingMatchScore}%
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => saveMatchMutation.mutate({
                                  candidateId: match.candidate.id,
                                  jobId: selectedJobId!,
                                  applicationId: match.application.id,
                                  priority: "medium",
                                })}
                              >
                                <Bookmark className="h-4 w-4 mr-2" />
                                Save Match
                              </Button>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                              <Button size="sm">
                                Contact
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No matches found above {minScore}% threshold</p>
                    <p className="text-sm mt-2">Try lowering the minimum score or select a different job</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Candidate Jobs Tab */}
        <TabsContent value="candidate-jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Recommended Jobs</CardTitle>
              <CardDescription>
                Select a candidate to find the best matching job opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="candidate-select">Select Candidate</Label>
                <Select
                  value={selectedCandidateId?.toString()}
                  onValueChange={(value) => setSelectedCandidateId(parseInt(value))}
                >
                  <SelectTrigger id="candidate-select">
                    <SelectValue placeholder="Choose a candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidatesLoading ? (
                      <SelectItem value="loading" disabled>Loading candidates...</SelectItem>
                    ) : (
                      candidatesData?.candidates.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id.toString()}>
                          {candidate.fullName} - {candidate.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Candidate Job Recommendations */}
          {selectedCandidateId && (
            <Card>
              <CardHeader>
                <CardTitle>Recommended Jobs</CardTitle>
                <CardDescription>
                  Best matching opportunities based on skills and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {candidateRecsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : candidateRecommendations && candidateRecommendations.length > 0 ? (
                  <div className="space-y-4">
                    {candidateRecommendations.map((rec) => (
                      <Card key={rec.job.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold">
                                  {rec.job.title}
                                </h3>
                                <Badge variant={getScoreBadgeVariant(rec.matchScore)}>
                                  {rec.matchScore}% Match
                                </Badge>
                              </div>
                              
                              <div className="flex gap-2 text-sm text-muted-foreground">
                                <span>{rec.job.location}</span>
                                {rec.job.salaryMin && rec.job.salaryMax && (
                                  <>
                                    <span>•</span>
                                    <span>SAR {rec.job.salaryMin.toLocaleString()} - {rec.job.salaryMax.toLocaleString()}</span>
                                  </>
                                )}
                              </div>

                              {rec.matchedSkills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {rec.matchedSkills.map((skill, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleCalculateMatch(selectedCandidateId, rec.job.id)}
                                disabled={calculateMatch.isPending}
                              >
                                {calculateMatch.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Apply"
                                )}
                              </Button>
                              <Button size="sm" variant="outline">
                                View Job
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No job recommendations found</p>
                    <p className="text-sm mt-2">Check back later for new opportunities</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
