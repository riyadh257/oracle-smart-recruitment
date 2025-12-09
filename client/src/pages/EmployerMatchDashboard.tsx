import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  MapPin, 
  Mail, 
  Phone, 
  AlertCircle,
  CheckCircle2,
  Eye,
  Sparkles
} from "lucide-react";
import { CultureFitRadarChart } from "@/components/CultureFitRadarChart";
import { toast } from "sonner";

export default function EmployerMatchDashboard() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [minScore, setMinScore] = useState(70);

  // Fetch active jobs
  const { data: jobs, isLoading: jobsLoading } = trpc.employerMatchDashboard.getActiveJobs.useQuery();

  // Fetch top matches for selected job
  const { data: matches, isLoading: matchesLoading } = trpc.employerMatchDashboard.getTopMatchesForJob.useQuery(
    { jobId: selectedJobId!, minScore, limit: 10 },
    { enabled: !!selectedJobId }
  );

  // Fetch match statistics
  const { data: stats } = trpc.employerMatchDashboard.getMatchStatistics.useQuery(
    { jobId: selectedJobId! },
    { enabled: !!selectedJobId }
  );

  // Fetch hiring recommendations
  const { data: recommendations } = trpc.employerMatchDashboard.getHiringRecommendations.useQuery(
    { jobId: selectedJobId! },
    { enabled: !!selectedJobId }
  );

  // Mark match as viewed mutation
  const markAsViewedMutation = trpc.employerMatchDashboard.markMatchAsViewed.useMutation({
    onSuccess: () => {
      toast.success("Match marked as viewed");
    },
  });

  const handleViewCandidate = (matchId: number) => {
    markAsViewedMutation.mutate({ matchId });
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-400";
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number | null): "default" | "secondary" | "destructive" => {
    if (!score) return "secondary";
    if (score >= 85) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Match Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Discover top candidates matched to your job openings with AI-powered scoring
        </p>
      </div>

      {/* Job Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Job Position</CardTitle>
          <CardDescription>Choose a job to view AI-matched candidates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Job Opening</label>
              {jobsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedJobId?.toString() || ""}
                  onValueChange={(value) => setSelectedJobId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job position" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs?.map((job) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.title} - {job.department} ({job.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">Minimum Score</label>
              <Select value={minScore.toString()} onValueChange={(value) => setMinScore(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90% - Excellent</SelectItem>
                  <SelectItem value="85">85% - Very Good</SelectItem>
                  <SelectItem value="70">70% - Good</SelectItem>
                  <SelectItem value="60">60% - Fair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Statistics */}
          {selectedJobId && stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Matches</p>
                <p className="text-2xl font-bold">{stats.totalMatches}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">High Score (&gt;85%)</p>
                <p className="text-2xl font-bold text-green-600">{stats.highScoreMatches}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Overall</p>
                <p className="text-2xl font-bold">{stats.avgOverallScore?.toFixed(0) || 0}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Culture</p>
                <p className="text-2xl font-bold">{stats.avgCultureScore?.toFixed(0) || 0}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Wellbeing</p>
                <p className="text-2xl font-bold">{stats.avgWellbeingScore?.toFixed(0) || 0}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hiring Recommendations */}
      {selectedJobId && recommendations && recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Hiring Recommendations
            </CardTitle>
            <CardDescription>Actionable insights for your top candidates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.candidateId} className="bg-white p-4 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{rec.candidateName}</h4>
                  <Badge variant={getScoreBadgeVariant(rec.overallScore)}>
                    {rec.overallScore}% Match
                  </Badge>
                </div>
                <ul className="space-y-1 text-sm">
                  {rec.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {insight.startsWith("⚠️") ? (
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{insight.replace("⚠️ ", "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Matched Candidates */}
      {!selectedJobId ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a job position above to view AI-matched candidates
          </AlertDescription>
        </Alert>
      ) : matchesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : !matches || matches.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No candidates found matching the selected criteria. Try lowering the minimum score threshold.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Top Matched Candidates</h2>
          {matches.map((match) => (
            <CandidateMatchCard
              key={match.matchId}
              match={match}
              onView={() => handleViewCandidate(match.matchId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Candidate Match Card Component
function CandidateMatchCard({ match, onView }: { match: any; onView: () => void }) {
  const [showCultureChart, setShowCultureChart] = useState(false);

  const { data: cultureFit } = trpc.employerMatchDashboard.getCultureFitBreakdown.useQuery(
    { matchId: match.matchId },
    { enabled: showCultureChart }
  );

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-400";
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className={match.wasViewed ? "opacity-75" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{match.candidateName}</CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm">
              {match.candidateCurrentRole && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {match.candidateCurrentRole}
                  {match.candidateCurrentCompany && ` at ${match.candidateCurrentCompany}`}
                </span>
              )}
              {match.candidateLocation && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {match.candidateLocation}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-lg px-4 py-1">
              {match.overallScore}%
            </Badge>
            {match.wasViewed && <Eye className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scores" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scores">Score Breakdown</TabsTrigger>
            <TabsTrigger value="culture" onClick={() => setShowCultureChart(true)}>
              Culture Fit
            </TabsTrigger>
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
          </TabsList>

          <TabsContent value="scores" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Skills Match</p>
                <p className={`text-2xl font-bold ${getScoreColor(match.skillScore)}`}>
                  {match.skillScore || "N/A"}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Technical</p>
                <p className={`text-2xl font-bold ${getScoreColor(match.technicalScore)}`}>
                  {match.technicalScore || "N/A"}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Culture Fit</p>
                <p className={`text-2xl font-bold ${getScoreColor(match.cultureFitScore)}`}>
                  {match.cultureFitScore || "N/A"}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Wellbeing</p>
                <p className={`text-2xl font-bold ${getScoreColor(match.wellbeingScore)}`}>
                  {match.wellbeingScore || "N/A"}%
                </p>
              </div>
            </div>

            {match.matchExplanation && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Why This Match?</h4>
                <p className="text-sm text-muted-foreground">{match.matchExplanation}</p>
              </div>
            )}

            {match.topAttributes && (
              <div>
                <h4 className="font-semibold mb-2">Top Matching Attributes</h4>
                <div className="flex flex-wrap gap-2">
                  {(match.topAttributes as string[]).slice(0, 8).map((attr, idx) => (
                    <Badge key={idx} variant="secondary">
                      {attr}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="culture" className="space-y-4">
            {cultureFit ? (
              <div className="flex justify-center py-4">
                <CultureFitRadarChart 
                  candidateScores={{
                    hierarchy: cultureFit.structure || 75,
                    innovation: cultureFit.innovation || 75,
                    teamStyle: cultureFit.collaboration || 75,
                    communication: cultureFit.collaboration || 75,
                    workLifeBalance: cultureFit.autonomy || 75,
                    riskTolerance: cultureFit.innovation || 75,
                    decisionMaking: cultureFit.autonomy || 75,
                    feedback: cultureFit.growth || 75,
                  }}
                  height={300}
                />
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <Skeleton className="h-64 w-64 rounded-full" />
              </div>
            )}
            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              <p>
                Culture fit assessment evaluates alignment across 5 key dimensions: innovation mindset,
                collaboration style, autonomy preference, structure orientation, and growth potential.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="space-y-3">
              {match.candidateEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${match.candidateEmail}`} className="text-blue-600 hover:underline">
                    {match.candidateEmail}
                  </a>
                </div>
              )}
              {match.candidatePhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${match.candidatePhone}`} className="text-blue-600 hover:underline">
                    {match.candidatePhone}
                  </a>
                </div>
              )}
              {match.candidateExperience && (
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>{match.candidateExperience} years of experience</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={onView} variant="default" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                View Full Profile
              </Button>
              <Button variant="outline" className="flex-1">
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
