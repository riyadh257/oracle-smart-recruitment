import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Heart, 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Info,
  Sparkles,
  Building2,
  Clock,
  Users
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { APP_TITLE } from "@/const";

export default function CandidateMatchDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Fetch candidate's profile
  const { data: candidateProfile, isLoading: profileLoading } = trpc.candidates.getMyProfile.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Fetch recommended jobs with match scores
  const { data: recommendedJobs, isLoading: jobsLoading } = trpc.aiMatching.getRecommendedJobsForCandidate.useQuery(
    { candidateId: candidateProfile?.id || 0, limit: 20 },
    { enabled: !!candidateProfile?.id }
  );

  // Fetch detailed match for selected job
  const { data: matchDetails, isLoading: detailsLoading } = trpc.aiMatching.getMatchDetails.useQuery(
    { applicationId: selectedJobId || 0 },
    { enabled: !!selectedJobId }
  );

  const isLoading = authLoading || profileLoading || jobsLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your job matches.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/login")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper to get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-gray-600";
  };

  // Helper to get score badge variant
  const getScoreBadge = (score: number) => {
    if (score >= 90) return "default";
    if (score >= 80) return "secondary";
    if (score >= 70) return "outline";
    return "outline";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Job Matches
              </h1>
              <p className="text-muted-foreground mt-2">
                Personalized recommendations powered by AI matching
              </p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/profile-settings")}>
              Update Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Finding your perfect matches...</p>
            </div>
          </div>
        ) : !candidateProfile ? (
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Create your candidate profile to receive personalized job recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/candidates/new")}>
                Create Profile
              </Button>
            </CardContent>
          </Card>
        ) : recommendedJobs && recommendedJobs.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Matches Yet</CardTitle>
              <CardDescription>
                We're constantly adding new opportunities. Check back soon!
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Job List */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Top Matches ({recommendedJobs?.length || 0})
                  </CardTitle>
                  <CardDescription>
                    Sorted by compatibility score
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {recommendedJobs?.map((match: any) => (
                    <Card
                      key={match.job.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedJobId === match.applicationId ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedJobId(match.applicationId)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm line-clamp-1">
                              {match.job.title}
                            </h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Building2 className="h-3 w-3" />
                              {match.job.companyName || "Company"}
                            </p>
                          </div>
                          <Badge variant={getScoreBadge(match.overallScore)} className="ml-2">
                            {match.overallScore}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{match.job.location || "Remote"}</span>
                        </div>
                        <Progress value={match.overallScore} className="h-1 mt-3" />
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Match Details */}
            <div className="lg:col-span-2">
              {!selectedJobId ? (
                <Card className="h-full flex items-center justify-center min-h-[400px]">
                  <CardContent className="text-center">
                    <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Select a Job Match</h3>
                    <p className="text-muted-foreground">
                      Click on a job to see detailed compatibility analysis
                    </p>
                  </CardContent>
                </Card>
              ) : detailsLoading ? (
                <Card className="h-full flex items-center justify-center min-h-[400px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl">
                          {matchDetails?.application?.job?.title || "Job Title"}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Building2 className="h-4 w-4" />
                          {matchDetails?.application?.job?.companyName || "Company"}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-bold ${getScoreColor(matchDetails?.application?.overallMatchScore || 0)}`}>
                          {matchDetails?.application?.overallMatchScore || 0}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Overall Match</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Job Details */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{matchDetails?.application?.job?.location || "Remote"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {matchDetails?.application?.job?.salaryMin && matchDetails?.application?.job?.salaryMax
                            ? `$${matchDetails.application.job.salaryMin.toLocaleString()} - $${matchDetails.application.job.salaryMax.toLocaleString()}`
                            : "Competitive"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{matchDetails?.application?.job?.employmentType || "Full-time"}</span>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="culture">Culture Fit</TabsTrigger>
                        <TabsTrigger value="wellbeing">Wellbeing</TabsTrigger>
                        <TabsTrigger value="skills">Skills</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4 mt-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Brain className="h-4 w-4 text-purple-600" />
                                Skills Match
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-3xl font-bold ${getScoreColor(matchDetails?.application?.skillMatchScore || 0)}`}>
                                {matchDetails?.application?.skillMatchScore || 0}%
                              </div>
                              <Progress value={matchDetails?.application?.skillMatchScore || 0} className="mt-2" />
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                Culture Fit
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-3xl font-bold ${getScoreColor(matchDetails?.application?.cultureFitScore || 0)}`}>
                                {matchDetails?.application?.cultureFitScore || 0}%
                              </div>
                              <Progress value={matchDetails?.application?.cultureFitScore || 0} className="mt-2" />
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Heart className="h-4 w-4 text-green-600" />
                                Wellbeing
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-3xl font-bold ${getScoreColor(matchDetails?.application?.wellbeingMatchScore || 0)}`}>
                                {matchDetails?.application?.wellbeingMatchScore || 0}%
                              </div>
                              <Progress value={matchDetails?.application?.wellbeingMatchScore || 0} className="mt-2" />
                            </CardContent>
                          </Card>
                        </div>

                        {/* AI Explanation */}
                        {matchDetails?.explanations && matchDetails.explanations.length > 0 && (
                          <Card className="bg-blue-50 border-blue-200">
                            <CardHeader>
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-blue-600" />
                                Why This Match?
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-sm">{matchDetails.explanations[0].summary}</p>
                              
                              {matchDetails.explanations[0].strengths && (
                                <div>
                                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Your Strengths
                                  </h4>
                                  <ul className="text-sm space-y-1 ml-6 list-disc">
                                    {(matchDetails.explanations[0].strengths as string[]).map((strength: string, idx: number) => (
                                      <li key={idx}>{strength}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {matchDetails.explanations[0].recommendations && (
                                <div>
                                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                    Growth Opportunities
                                  </h4>
                                  <ul className="text-sm space-y-1 ml-6 list-disc">
                                    {(matchDetails.explanations[0].recommendations as string[]).map((rec: string, idx: number) => (
                                      <li key={idx}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>

                      <TabsContent value="culture" className="space-y-4 mt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Culture Compatibility Analysis</CardTitle>
                            <CardDescription>
                              How your work style aligns with the company culture
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {matchDetails?.cultureScores && matchDetails.cultureScores.length > 0 ? (
                              matchDetails.cultureScores.map((culture: any, idx: number) => (
                                <div key={idx}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">{culture.dimension}</span>
                                    <span className="text-sm font-bold">{culture.score}%</span>
                                  </div>
                                  <Progress value={culture.score} className="h-2" />
                                  {culture.analysis && (
                                    <p className="text-xs text-muted-foreground mt-1">{culture.analysis}</p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Culture fit analysis will be available soon</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="wellbeing" className="space-y-4 mt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Wellbeing Compatibility</CardTitle>
                            <CardDescription>
                              How this role supports your work-life balance and growth
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {matchDetails?.wellbeingScores && matchDetails.wellbeingScores.length > 0 ? (
                              matchDetails.wellbeingScores.map((wellbeing: any, idx: number) => (
                                <div key={idx}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">{wellbeing.factor}</span>
                                    <span className="text-sm font-bold">{wellbeing.score}%</span>
                                  </div>
                                  <Progress value={wellbeing.score} className="h-2" />
                                  {wellbeing.analysis && (
                                    <p className="text-xs text-muted-foreground mt-1">{wellbeing.analysis}</p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Wellbeing analysis will be available soon</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="skills" className="space-y-4 mt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Skills Breakdown</CardTitle>
                            <CardDescription>
                              Your technical qualifications for this role
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {matchDetails?.application?.matchBreakdown ? (
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Matching Skills
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {(matchDetails.application.matchBreakdown as any).matchedSkills?.map((skill: string, idx: number) => (
                                      <Badge key={idx} variant="default">{skill}</Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    Skills to Develop
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {(matchDetails.application.matchBreakdown as any).missingSkills?.map((skill: string, idx: number) => (
                                      <Badge key={idx} variant="outline">{skill}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Skills breakdown will be available soon</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button className="flex-1" size="lg">
                        Apply Now
                      </Button>
                      <Button variant="outline" size="lg">
                        Save for Later
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
