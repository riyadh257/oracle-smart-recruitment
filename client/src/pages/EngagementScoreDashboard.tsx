import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Mail, MousePointer, Users, Award } from "lucide-react";

export default function EngagementScoreDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [limit, setLimit] = useState(20);

  const { data: topCandidates } = trpc.engagementScoring.getTopEngagedCandidates.useQuery({ limit });
  const { data: distribution } = trpc.engagementScoring.getEngagementDistribution.useQuery();

  const getEngagementBadge = (level: string) => {
    const variants: Record<string, any> = {
      very_high: { variant: "default", label: "Very High", color: "bg-green-500" },
      high: { variant: "secondary", label: "High", color: "bg-blue-500" },
      medium: { variant: "outline", label: "Medium", color: "bg-yellow-500" },
      low: { variant: "outline", label: "Low", color: "bg-orange-500" },
      very_low: { variant: "destructive", label: "Very Low", color: "bg-red-500" },
    };
    return variants[level] || variants.medium;
  };

  const filteredCandidates = topCandidates?.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.candidate.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidate.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = filterLevel === "all" || item.engagementScore.engagementLevel === filterLevel;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Candidate Engagement Scoring</h1>
        <p className="text-muted-foreground mt-2">
          Track and analyze candidate engagement levels based on email opens, clicks, applications, and interview responses
        </p>
      </div>

      {/* Engagement Distribution Overview */}
      {distribution && (
        <div className="grid grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Very High</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{distribution.very_high}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${(distribution.very_high / (distribution.very_high + distribution.high + distribution.medium + distribution.low + distribution.very_low)) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">High</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{distribution.high}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${(distribution.high / (distribution.very_high + distribution.high + distribution.medium + distribution.low + distribution.very_low)) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Medium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{distribution.medium}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: `${(distribution.medium / (distribution.very_high + distribution.high + distribution.medium + distribution.low + distribution.very_low)) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Low</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{distribution.low}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{
                    width: `${(distribution.low / (distribution.very_high + distribution.high + distribution.medium + distribution.low + distribution.very_low)) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Very Low</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{distribution.very_low}</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${(distribution.very_low / (distribution.very_high + distribution.high + distribution.medium + distribution.low + distribution.very_low)) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-48">
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
        </CardContent>
      </Card>

      {/* Top Engaged Candidates */}
      <Card>
        <CardHeader>
          <CardTitle>Top Engaged Candidates</CardTitle>
          <CardDescription>Candidates ranked by overall engagement score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCandidates?.map((item, index) => {
              const badge = getEngagementBadge(item.engagementScore.engagementLevel);
              return (
                <div key={item.candidate.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.candidate.fullName}</p>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.candidate.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{item.engagementScore.overallScore}</div>
                      <div className="text-xs text-muted-foreground">Overall</div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.engagementScore.emailEngagementScore}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Email</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.engagementScore.applicationEngagementScore}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Application</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.engagementScore.interviewEngagementScore}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Interview</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
