import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, TrendingUp, Users, Briefcase, Heart, Brain, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function MatchingDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // Fetch jobs for the employer
  const { data: jobs, isLoading: jobsLoading } = trpc.jobs.list.useQuery(
    { employerId: user?.id },
    { enabled: !!user }
  );

  // Fetch matches for selected job
  const { data: matches, isLoading: matchesLoading } = trpc.aiMatching.matchCandidatesForJob.useQuery(
    { jobId: selectedJobId!, limit: 10 },
    { enabled: !!selectedJobId }
  );

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Auto-select first job if none selected
  if (!selectedJobId && jobs && jobs.length > 0) {
    setSelectedJobId(jobs[0].id);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Matching Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover the best candidates for your positions using our advanced AI matching engine
          </p>
        </div>

        {/* Job Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Select Position
            </CardTitle>
            <CardDescription>Choose a job to view matched candidates</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading positions...</span>
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedJobId === job.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{job.location}</p>
                    <Badge variant="secondary" className="mt-2">
                      {job.status}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No job postings yet</p>
                <Button className="mt-4" asChild>
                  <Link href="/jobs/new">Create Job Posting</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matched Candidates */}
        {selectedJobId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Matched Candidates
              </CardTitle>
              <CardDescription>
                AI-powered matching based on skills, culture fit, and wellbeing compatibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              {matchesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : matches && matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <MatchCard key={match.candidateId} match={match} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No candidates matched yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Run the matching engine to find suitable candidates
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function MatchCard({ match }: { match: any }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{match.candidateName}</h3>
          <p className="text-sm text-muted-foreground">{match.candidateEmail}</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getScoreColor(match.overallScore)}`}>
            {match.overallScore}%
          </div>
          <p className="text-xs text-muted-foreground">Overall Match</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <Tabs defaultValue="overview" className="mt-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="culture">Culture</TabsTrigger>
          <TabsTrigger value="wellbeing">Wellbeing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <ScoreItem
              icon={<Brain className="h-4 w-4" />}
              label="Skills Match"
              score={match.skillsScore}
            />
            <ScoreItem
              icon={<Users className="h-4 w-4" />}
              label="Culture Fit"
              score={match.cultureFitScore}
            />
            <ScoreItem
              icon={<Heart className="h-4 w-4" />}
              label="Wellbeing"
              score={match.wellbeingScore}
            />
          </div>

          {match.explanation && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Insights
              </p>
              <p className="text-sm text-muted-foreground">{match.explanation}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/candidates/${match.candidateId}`}>View Profile</Link>
            </Button>
            <Button variant="outline" className="flex-1">
              Schedule Interview
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="mt-4">
          <div className="space-y-3">
            {match.matchedAttributes?.slice(0, 5).map((attr: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{attr.name}</span>
                  <span className="font-medium">{attr.score}%</span>
                </div>
                <Progress value={attr.score} className="h-2" />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="culture" className="mt-4">
          <div className="space-y-3">
            {match.cultureDimensions?.map((dim: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{dim.dimension}</span>
                  <span className="font-medium">{dim.alignment}%</span>
                </div>
                <Progress value={dim.alignment} className="h-2" />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="wellbeing" className="mt-4">
          <div className="space-y-3">
            {match.wellbeingFactors?.map((factor: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{factor.factor}</span>
                  <span className="font-medium">{factor.compatibility}%</span>
                </div>
                <Progress value={factor.compatibility} className="h-2" />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScoreItem({ icon, label, score }: { icon: React.ReactNode; label: string; score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</div>
    </div>
  );
}
