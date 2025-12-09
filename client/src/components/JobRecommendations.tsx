import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, DollarSign, TrendingUp, Users, ArrowRight, Star } from "lucide-react";
import { Link } from "wouter";

/**
 * Job Recommendations Component
 * Displays personalized job recommendations based on candidate preferences
 */

interface JobRecommendationsProps {
  limit?: number;
  showCollaborative?: boolean;
}

export default function JobRecommendations({ 
  limit = 6, 
  showCollaborative = true 
}: JobRecommendationsProps) {
  const { data: recommendations, isLoading } = trpc.applications.getJobRecommendations.useQuery({ 
    limit 
  });
  
  const { data: collaborative } = trpc.applications.getCollaborativeRecommendations.useQuery(
    { limit: 3 },
    { enabled: showCollaborative }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  const allRecommendations = [
    ...(recommendations || []),
    ...(collaborative || []).map(job => ({ ...job, isCollaborative: true }))
  ].slice(0, limit);

  if (!allRecommendations || allRecommendations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
            <p className="text-muted-foreground mb-6">
              Complete your profile and set your preferences to get personalized job recommendations
            </p>
            <Link href="/profile-settings">
              <Button>Update Preferences</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    if (score >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  return (
    <div className="space-y-4">
      {allRecommendations.map((job: any) => (
        <Card key={job.jobId} className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">{job.title}</h3>
                  {job.isCollaborative && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <Users className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-medium">{job.companyName}</p>
              </div>
              
              <div className={`px-3 py-1 rounded-full font-semibold ${getMatchScoreColor(job.matchScore)}`}>
                {job.matchScore}% Match
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {job.employmentType.replace("_", " ")}
              </span>
              {(job.salaryMin || job.salaryMax) && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salaryMin && job.salaryMax
                    ? `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
                    : job.salaryMin
                    ? `From ${job.salaryMin.toLocaleString()}`
                    : `Up to ${job.salaryMax?.toLocaleString()}`}
                </span>
              )}
            </div>

            {/* Match Reasons */}
            {job.matchReasons && job.matchReasons.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">Why this matches you:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.matchReasons.slice(0, 3).map((reason: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Required Skills */}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Required Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.slice(0, 5).map((skill: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {job.requiredSkills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{job.requiredSkills.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <Link href={`/jobs/${job.jobId}`}>
                <Button variant="outline" size="sm">
                  View Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              
              <Link href={`/jobs/${job.jobId}/apply`}>
                <Button size="sm">
                  Apply Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}

      {allRecommendations.length > 0 && (
        <div className="text-center pt-4">
          <Link href="/jobs">
            <Button variant="outline">
              Browse All Jobs
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
