import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Briefcase, MapPin, DollarSign, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

/**
 * Top Matches Dashboard Widget
 * Displays top 5 AI-matched jobs with quick-apply functionality
 * Priority 2: Engagement & Conversion
 */
export function TopMatchesWidget() {
  const { data: topMatches, isLoading, error } = trpc.aiMatching.getTopMatches.useQuery();
  const applyMutation = trpc.jobs.applyToJob.useMutation({
    onSuccess: () => {
      toast.success("Application submitted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit application");
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Top Matches For You
          </CardTitle>
          <CardDescription>AI-powered job recommendations based on your profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Top Matches For You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load job matches. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!topMatches || topMatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Top Matches For You
          </CardTitle>
          <CardDescription>AI-powered job recommendations based on your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No job matches found yet. Complete your profile to get personalized recommendations.
            </p>
            <Link href="/profile/resume">
              <Button variant="outline">Complete Your Profile</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleQuickApply = async (jobId: number) => {
    try {
      await applyMutation.mutateAsync({ jobId });
    } catch (error) {
      // Error handled by mutation callbacks
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Top Matches For You
            </CardTitle>
            <CardDescription>AI-powered job recommendations based on your profile</CardDescription>
          </div>
          <Link href="/job-search">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {topMatches.map((match, index) => (
          <div
            key={match.job.id}
            className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    #{index + 1} Match
                  </Badge>
                  <Badge variant="outline" className="font-semibold">
                    {match.matchScore}% Match
                  </Badge>
                </div>
                
                <Link href={`/jobs/${match.job.id}`}>
                  <h3 className="font-semibold text-lg hover:text-primary transition-colors cursor-pointer">
                    {match.job.title}
                  </h3>
                </Link>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {match.job.companyName && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {match.job.companyName}
                    </div>
                  )}
                  {match.job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {match.job.location}
                    </div>
                  )}
                  {(match.job.salaryMin || match.job.salaryMax) && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {match.job.salaryMin && match.job.salaryMax
                        ? `${match.job.salaryMin.toLocaleString()} - ${match.job.salaryMax.toLocaleString()} SAR`
                        : match.job.salaryMin
                        ? `From ${match.job.salaryMin.toLocaleString()} SAR`
                        : `Up to ${match.job.salaryMax?.toLocaleString()} SAR`}
                    </div>
                  )}
                </div>

                {/* Match breakdown */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    Skills: {match.skillMatchScore}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Culture: {match.cultureFitScore}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Wellbeing: {match.wellbeingMatchScore}%
                  </Badge>
                </div>

                {/* Matched skills preview */}
                {match.matchedSkills && match.matchedSkills.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>
                      Matched: {match.matchedSkills.slice(0, 3).join(", ")}
                      {match.matchedSkills.length > 3 && ` +${match.matchedSkills.length - 3} more`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={() => handleQuickApply(match.job.id)}
                  disabled={applyMutation.isPending}
                >
                  Quick Apply
                </Button>
                <Link href={`/jobs/${match.job.id}`}>
                  <Button size="sm" variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
