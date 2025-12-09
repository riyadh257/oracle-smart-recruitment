import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, X, Download, FileText } from "lucide-react";
import { toast } from "sonner";

/**
 * Bulk Matching Page
 * Batch processing UI for enterprise-scale AI matching operations
 */
export default function BulkMatching() {
  const [jobName, setJobName] = useState("");
  const [matchType, setMatchType] = useState<'candidates_to_job' | 'jobs_to_candidate' | 'all_to_all'>('candidates_to_job');
  const [candidateIds, setCandidateIds] = useState("");
  const [jobIds, setJobIds] = useState("");

  // Fetch user's bulk matching jobs
  const { data: jobs, isLoading, refetch } = trpc.matching.bulkMatching.getUserJobs.useQuery({ limit: 20 });

  // Create bulk matching job mutation
  const createJobMutation = trpc.matching.bulkMatching.createJob.useMutation({
    onSuccess: (data) => {
      toast.success(`Bulk matching job created: #${data.jobId}`);
      setJobName("");
      setCandidateIds("");
      setJobIds("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create job: ${error.message}`);
    },
  });

  // Cancel job mutation
  const cancelJobMutation = trpc.matching.bulkMatching.cancelJob.useMutation({
    onSuccess: () => {
      toast.success("Job cancelled");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to cancel: ${error.message}`);
    },
  });

  const handleCreateJob = () => {
    if (!jobName.trim()) {
      toast.error("Please enter a job name");
      return;
    }

    const candidateIdArray = candidateIds
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    const jobIdArray = jobIds
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    if (candidateIdArray.length === 0 || jobIdArray.length === 0) {
      toast.error("Please enter valid candidate and job IDs");
      return;
    }

    createJobMutation.mutate({
      jobName,
      matchType,
      sourceType: 'database_selection',
      sourceData: {
        candidateIds: candidateIdArray,
        jobIds: jobIdArray,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", label: "Pending" },
      processing: { variant: "default", label: "Processing" },
      completed: { variant: "default", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
      cancelled: { variant: "outline", label: "Cancelled" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Matching Operations</h1>
        <p className="text-muted-foreground mt-2">
          Run AI matching against multiple candidates and jobs simultaneously
        </p>
      </div>

      {/* Create New Job */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Bulk Matching Job</CardTitle>
          <CardDescription>
            Process multiple candidate-job matches in a single batch operation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jobName">Job Name</Label>
              <Input
                id="jobName"
                placeholder="e.g., Q1 2025 Engineering Candidates"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="matchType">Match Type</Label>
              <Select value={matchType} onValueChange={(value: any) => setMatchType(value)}>
                <SelectTrigger id="matchType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candidates_to_job">Candidates to Job</SelectItem>
                  <SelectItem value="jobs_to_candidate">Jobs to Candidate</SelectItem>
                  <SelectItem value="all_to_all">All to All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="candidateIds">Candidate IDs (comma-separated)</Label>
            <Input
              id="candidateIds"
              placeholder="e.g., 1, 2, 3, 4, 5"
              value={candidateIds}
              onChange={(e) => setCandidateIds(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobIds">Job IDs (comma-separated)</Label>
            <Input
              id="jobIds"
              placeholder="e.g., 10, 11, 12"
              value={jobIds}
              onChange={(e) => setJobIds(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCreateJob}
            disabled={createJobMutation.isPending}
            className="w-full"
          >
            {createJobMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Job...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Bulk Matching
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Job History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bulk Matching Jobs</CardTitle>
          <CardDescription>
            Track progress and view results of your batch operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No bulk matching jobs yet</p>
              <p className="text-sm mt-2">Create your first batch operation above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job: any) => (
                <Card key={job.id} className="border">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Job Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{job.jobName}</h3>
                            {getStatusBadge(job.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Job #{job.id} • {new Date(job.createdAt).toLocaleString()}
                          </p>
                        </div>
                        
                        {job.status === 'processing' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cancelJobMutation.mutate({ jobId: job.id })}
                            disabled={cancelJobMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {(job.status === 'processing' || job.status === 'completed') && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} />
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Items</p>
                          <p className="font-medium">{job.totalItems}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Processed</p>
                          <p className="font-medium">{job.processedItems}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Successful</p>
                          <p className="font-medium text-green-600">{job.successfulMatches}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Failed</p>
                          <p className="font-medium text-red-600">{job.failedItems}</p>
                        </div>
                      </div>

                      {/* Results Summary */}
                      {job.status === 'completed' && job.resultsSummary && (
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-sm font-medium">Results Summary</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Avg Match Score</p>
                              <p className="font-medium">{job.resultsSummary.averageMatchScore}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">High Quality (≥90%)</p>
                              <p className="font-medium">{job.resultsSummary.highQualityMatches}</p>
                            </div>
                          </div>
                          {job.resultsFileUrl && (
                            <Button size="sm" variant="outline" className="w-full mt-2">
                              <Download className="h-4 w-4 mr-2" />
                              Download Results
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Error Message */}
                      {job.status === 'failed' && job.errorMessage && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                          <p className="font-medium">Error:</p>
                          <p>{job.errorMessage}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
