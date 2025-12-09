import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Briefcase, MapPin, DollarSign, TrendingUp, Sparkles, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function JobRecommendations() {
  const [, setLocation] = useLocation();
  const [minScore, setMinScore] = useState(60);
  const [limit, setLimit] = useState(20);

  // Fetch recommended jobs using new preference-based system
  const { data: recommendations, isLoading, refetch } = trpc.applications.getJobRecommendations.useQuery({
    limit,
  });
  
  // Also fetch collaborative recommendations
  const { data: collaborative } = trpc.applications.getCollaborativeRecommendations.useQuery({
    limit: 5,
  });
  
  // Combine and filter by minScore
  const filteredRecommendations = [
    ...(recommendations || []),
    ...(collaborative || []).map(job => ({ ...job, isCollaborative: true }))
  ].filter(rec => rec.matchScore >= minScore).slice(0, limit);

  const getScoreColor = (score: number | null | undefined) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  return (
    <DashboardLayout>
      <div className="container max-w-7xl py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Job Recommendations
          </h1>
          <p className="text-muted-foreground mt-2">
            Personalized job matches powered by artificial intelligence
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Adjust your job matching preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label>Minimum Match Score: {minScore}%</Label>
                <Slider
                  value={[minScore]}
                  onValueChange={(value) => setMinScore(value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Only show jobs with at least {minScore}% compatibility
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="limit">Number of Results</Label>
                <Input
                  id="limit"
                  type="number"
                  min="5"
                  max="50"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 20)}
                />
                <p className="text-sm text-muted-foreground">
                  Display up to {limit} matching jobs
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Button onClick={() => refetch()}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Recommendations */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Finding your perfect matches...</p>
          </div>
        ) : filteredRecommendations && filteredRecommendations.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {filteredRecommendations.length} matching jobs
              </p>
            </div>

            {filteredRecommendations.map((rec: any) => (
              <Card 
                key={rec.jobId} 
                className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary"
                onClick={() => setLocation(`/jobs/${rec.jobId}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      {/* Job Header */}
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{rec.title}</h3>
                          <Badge variant={getScoreBadgeVariant(rec.matchScore || 0)}>
                            {rec.matchScore}% Match
                          </Badge>
                          {rec.isCollaborative && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              Popular Choice
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{rec.companyName}</span>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {rec.location}
                        </span>
                        
                        {rec.salaryMin && rec.salaryMax && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ${rec.salaryMin.toLocaleString()} - ${rec.salaryMax.toLocaleString()}
                          </span>
                        )}

                        <Badge variant="outline">{rec.workSetting}</Badge>
                        <Badge variant="outline">{rec.employmentType.replace('_', ' ')}</Badge>
                      </div>

                      {/* Match Reasons */}
                      {rec.matchReasons && rec.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {rec.matchReasons.slice(0, 3).map((reason: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Description */}
                      {rec.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {rec.description}
                        </p>
                      )}

                      {/* Required Skills */}
                      {rec.requiredSkills && rec.requiredSkills.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Required Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {rec.requiredSkills.slice(0, 6).map((skill: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {rec.requiredSkills.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{rec.requiredSkills.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button size="sm">
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Matching Jobs Found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or complete your profile for better matches.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setMinScore(Math.max(0, minScore - 10))}>
                    Lower Match Threshold
                  </Button>
                  <Button onClick={() => setLocation("/profile-settings")}>
                    Update Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
