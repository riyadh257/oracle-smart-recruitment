import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Bookmark, MapPin, DollarSign, Briefcase, Trash2, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function SavedJobs() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: candidate } = trpc.candidate.getProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: savedJobs, isLoading } = trpc.savedJobs.list.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  const unsaveMutation = trpc.savedJobs.unsave.useMutation({
    onSuccess: () => {
      utils.savedJobs.list.invalidate();
      toast.success("Job removed from saved list");
    },
    onError: () => {
      toast.error("Failed to remove job");
    },
  });

  const handleUnsave = (jobId: number) => {
    if (!candidate?.id) return;
    unsaveMutation.mutate({
      candidateId: candidate.id,
      jobId,
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading saved jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Bookmark className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Saved Jobs</h1>
            <p className="text-muted-foreground">
              Jobs you've bookmarked for later review
            </p>
          </div>
        </div>

        {!savedJobs || savedJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No saved jobs yet</h3>
              <p className="text-muted-foreground mb-4">
                Start saving jobs to keep track of opportunities you're interested in
              </p>
              <Button onClick={() => setLocation("/jobs")}>
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {savedJobs.map(({ savedJob, job, employer }) => (
              <Card key={savedJob.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
                      <CardDescription className="text-base">
                        {employer.companyName}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnsave(job.id)}
                      disabled={unsaveMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {job.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                    )}
                    {job.workSetting && (
                      <Badge variant="secondary">
                        {job.workSetting.charAt(0).toUpperCase() + job.workSetting.slice(1)}
                      </Badge>
                    )}
                    {job.employmentType && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        {job.employmentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    )}
                    {(job.salaryMin || job.salaryMax) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {job.salaryMin && job.salaryMax
                          ? `$${(job.salaryMin / 1000).toFixed(0)}k - $${(job.salaryMax / 1000).toFixed(0)}k`
                          : job.salaryMin
                          ? `$${(job.salaryMin / 1000).toFixed(0)}k+`
                          : `Up to $${(job.salaryMax! / 1000).toFixed(0)}k`}
                      </div>
                    )}
                  </div>

                  {savedJob.notes && (
                    <div className="mb-4 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1">Your notes:</p>
                      <p className="text-sm text-muted-foreground">{savedJob.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setLocation(`/jobs/${job.id}`)}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Saved on {new Date(savedJob.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
