import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  PlayCircle, 
  CheckSquare, 
  Square,
  Loader2,
  TrendingUp,
  Users,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";

export default function BulkMatchingOps() {
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [topN, setTopN] = useState(10);
  const [minScore, setMinScore] = useState(60);
  const [matchResults, setMatchResults] = useState<any>(null);
  const [isMatching, setIsMatching] = useState(false);

  // Fetch available jobs
  const { data: jobs, isLoading: jobsLoading } = trpc.bulkMatchingOps.getAvailableJobs.useQuery({
    status: 'open',
  });

  // Mutations
  const performBulkMatch = trpc.bulkMatchingOps.performBulkMatch.useMutation({
    onSuccess: (data) => {
      setMatchResults(data);
      setIsMatching(false);
      toast.success(`Bulk matching complete! Found matches for ${data.length} jobs`);
    },
    onError: (error) => {
      setIsMatching(false);
      toast.error(`Bulk matching failed: ${error.message}`);
    },
  });

  const exportToCSV = trpc.bulkMatchingOps.exportToCSV.useMutation({
    onSuccess: (data) => {
      // Create download link
      const blob = new Blob([data.content], { type: data.mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('CSV export downloaded successfully');
    },
    onError: (error) => {
      toast.error(`CSV export failed: ${error.message}`);
    },
  });

  const exportToPDF = trpc.bulkMatchingOps.exportToPDF.useMutation({
    onSuccess: (data) => {
      // For PDF, we would need to generate it client-side or use a library
      // For now, just show the data structure
      console.log('PDF Data:', data);
      toast.success('PDF data prepared (implement PDF generation library)');
    },
    onError: (error) => {
      toast.error(`PDF export failed: ${error.message}`);
    },
  });

  // Toggle job selection
  const toggleJobSelection = (jobId: number) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  // Select/deselect all jobs
  const toggleSelectAll = () => {
    if (selectedJobs.length === jobs?.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs?.map(j => j.id) || []);
    }
  };

  // Handle bulk matching
  const handleBulkMatch = () => {
    if (selectedJobs.length === 0) {
      toast.error('Please select at least one job');
      return;
    }

    setIsMatching(true);
    performBulkMatch.mutate({
      jobIds: selectedJobs,
      topN,
      minScore,
    });
  };

  // Handle CSV export
  const handleCSVExport = () => {
    if (selectedJobs.length === 0) {
      toast.error('Please select at least one job');
      return;
    }

    exportToCSV.mutate({
      jobIds: selectedJobs,
      topN,
      minScore,
    });
  };

  // Handle PDF export
  const handlePDFExport = () => {
    if (selectedJobs.length === 0) {
      toast.error('Please select at least one job');
      return;
    }

    exportToPDF.mutate({
      jobIds: selectedJobs,
      topN,
      minScore,
    });
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Matching Operations</h1>
          <p className="text-muted-foreground mt-2">
            Select multiple jobs and generate comprehensive candidate match reports
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Job Selection Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Select Jobs for Bulk Matching
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Choose one or more jobs to find top candidate matches
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedJobs.length === jobs?.length ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Select All
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : jobs && jobs.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {jobs.map(job => (
                    <div
                      key={job.id}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedJobs.includes(job.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => toggleJobSelection(job.id)}
                    >
                      <Checkbox
                        checked={selectedJobs.includes(job.id)}
                        onCheckedChange={() => toggleJobSelection(job.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{job.title}</h4>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {job.department && (
                            <Badge variant="secondary" className="text-xs">
                              {job.department}
                            </Badge>
                          )}
                          {job.location && (
                            <Badge variant="outline" className="text-xs">
                              {job.location}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No open jobs available. Create a job posting to start bulk matching.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuration & Actions Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Configuration</CardTitle>
              <CardDescription>
                Set parameters for bulk matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topN">Top Candidates per Job</Label>
                <Input
                  id="topN"
                  type="number"
                  min={1}
                  max={50}
                  value={topN}
                  onChange={(e) => setTopN(parseInt(e.target.value) || 10)}
                />
                <p className="text-xs text-muted-foreground">
                  Number of top matches to return for each job
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minScore">Minimum Match Score</Label>
                <Input
                  id="minScore"
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(parseInt(e.target.value) || 60)}
                />
                <p className="text-xs text-muted-foreground">
                  Only include candidates with score above this threshold
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  className="w-full"
                  onClick={handleBulkMatch}
                  disabled={selectedJobs.length === 0 || isMatching}
                >
                  {isMatching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Matching...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Run Bulk Match
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Download match reports in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCSVExport}
                disabled={selectedJobs.length === 0 || exportToCSV.isPending}
              >
                {exportToCSV.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Export to CSV
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={handlePDFExport}
                disabled={selectedJobs.length === 0 || exportToPDF.isPending}
              >
                {exportToPDF.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Export to PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Match Results */}
      {matchResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Match Results
            </CardTitle>
            <CardDescription>
              Top candidate matches for selected jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={matchResults[0]?.job.id.toString()}>
              <TabsList className="w-full justify-start overflow-x-auto">
                {matchResults.map((result: any, idx: number) => (
                  <TabsTrigger key={result.job.id} value={result.job.id.toString()}>
                    {result.job.title}
                    <Badge variant="secondary" className="ml-2">
                      {result.matches.length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {matchResults.map((result: any) => (
                <TabsContent key={result.job.id} value={result.job.id.toString()} className="space-y-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{result.job.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {result.totalMatches} total matches found, showing top {result.matches.length}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {result.matches.map((match: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold">{match.candidate.name}</h4>
                              <p className="text-sm text-muted-foreground">{match.candidate.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-6 items-center">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Overall</p>
                            <p className="text-lg font-bold">{match.match.overallScore}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Technical</p>
                            <p className="text-lg font-bold">{match.match.technicalScore}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Culture</p>
                            <p className="text-lg font-bold">{match.match.cultureFitScore}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Wellbeing</p>
                            <p className="text-lg font-bold">{match.match.wellbeingScore}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
