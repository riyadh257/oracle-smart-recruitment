import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, TrendingUp, Users, Mail, MousePointerClick, MessageSquare, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function CandidateEngagementDashboard() {
  const [, setLocation] = useLocation();
  const [selectedLevel, setSelectedLevel] = useState<"all" | "very_low" | "low" | "medium" | "high" | "very_high">("all");

  const { data: statistics, isLoading: statsLoading } = trpc.candidateEngagement.getStatistics.useQuery();
  const { data: topEngaged, isLoading: topLoading } = trpc.candidateEngagement.getTopEngaged.useQuery({ limit: 50 });
  const { data: filteredCandidates } = trpc.candidateEngagement.getByLevel.useQuery(
    { level: selectedLevel as any },
    { enabled: selectedLevel !== "all" }
  );

  const displayedCandidates = selectedLevel === "all" ? topEngaged : filteredCandidates;

  const getEngagementBadge = (level: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      very_high: { variant: "default", label: "Very High" },
      high: { variant: "default", label: "High" },
      medium: { variant: "secondary", label: "Medium" },
      low: { variant: "outline", label: "Low" },
      very_low: { variant: "outline", label: "Very Low" },
    };
    const item = config[level] || config.medium;
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/employer/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Candidate Engagement Dashboard
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Statistics Cards */}
        {statsLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : statistics ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalCandidates}</div>
                  <p className="text-xs text-muted-foreground">Tracked candidates</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.averageScore.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Out of 100</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">High Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.distribution.very_high + statistics.distribution.high}
                  </div>
                  <p className="text-xs text-muted-foreground">Highly engaged candidates</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recently Active</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.recentlyEngaged}</div>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
                <CardDescription>Breakdown of candidates by engagement level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
                  {Object.entries(statistics.distribution).map(([level, count]) => (
                    <div key={level} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{level.replace(/_/g, " ")}</span>
                        <span className="text-2xl font-bold">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            level === "very_high"
                              ? "bg-green-600"
                              : level === "high"
                              ? "bg-blue-600"
                              : level === "medium"
                              ? "bg-yellow-600"
                              : "bg-red-600"
                          }`}
                          style={{
                            width: `${statistics.totalCandidates > 0 ? (count / statistics.totalCandidates) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Candidate Engagement Scores</CardTitle>
                <CardDescription>Track and prioritize highly engaged candidates</CardDescription>
              </div>
              <Select value={selectedLevel} onValueChange={(value: any) => setSelectedLevel(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="very_high">Very High</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="very_low">Very Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayedCandidates && displayedCandidates.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-center">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Opens
                    </TableHead>
                    <TableHead className="text-center">
                      <MousePointerClick className="h-4 w-4 inline mr-1" />
                      Clicks
                    </TableHead>
                    <TableHead className="text-center">
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      Responses
                    </TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedCandidates.map((candidate: any) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{candidate.candidateName}</p>
                          <p className="text-sm text-muted-foreground">{candidate.candidateEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-2xl font-bold ${getScoreColor(candidate.engagementScore)}`}>
                          {candidate.engagementScore}
                        </span>
                      </TableCell>
                      <TableCell>{getEngagementBadge(candidate.engagementLevel)}</TableCell>
                      <TableCell className="text-center">
                        <div>
                          <p className="font-medium">{candidate.totalEmailsOpened}</p>
                          <p className="text-xs text-muted-foreground">{candidate.openRate.toFixed(0)}%</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <p className="font-medium">{candidate.totalLinksClicked}</p>
                          <p className="text-xs text-muted-foreground">{candidate.clickRate.toFixed(0)}%</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <p className="font-medium">{candidate.totalResponses}</p>
                          <p className="text-xs text-muted-foreground">{candidate.responseRate.toFixed(0)}%</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {candidate.lastEngagementAt ? (
                          <span className="text-sm">{format(new Date(candidate.lastEngagementAt), "MMM d, yyyy")}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-12">
                <p className="text-muted-foreground">No engagement data available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
