import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type EnrichmentType = "linkedin" | "github" | "resume_parse" | "skills_inference" | "education_verify";

export default function ProfileEnrichment() {
  const { user, loading: authLoading } = useAuth();
  const [candidateId, setCandidateId] = useState("");
  const [enrichmentType, setEnrichmentType] = useState<EnrichmentType>("linkedin");
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedEnrichmentId, setSelectedEnrichmentId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Fetch enrichment status
  const { data: status, isLoading: statusLoading } = trpc.profileEnrichmentV2.getEnrichmentStatus.useQuery(
    { candidateId: parseInt(candidateId) || 0 },
    { enabled: !!candidateId && !isNaN(parseInt(candidateId)) }
  );

  // Fetch enrichment history
  const { data: history, isLoading: historyLoading } = trpc.profileEnrichmentV2.getEnrichmentHistory.useQuery({
    page: historyPage,
    limit: 10,
  });

  // Fetch enrichment results
  const { data: results, isLoading: resultsLoading } = trpc.profileEnrichmentV2.getEnrichmentResults.useQuery(
    { enrichmentId: selectedEnrichmentId || 0 },
    { enabled: !!selectedEnrichmentId }
  );

  // Fetch enrichment metrics
  const { data: metrics, isLoading: metricsLoading } = trpc.profileEnrichmentV2.getEnrichmentMetrics.useQuery({
    period: "30d",
  });

  // Enrich profile mutation
  const enrichMutation = trpc.profileEnrichmentV2.enrichProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile enrichment started successfully");
      utils.profileEnrichmentV2.getEnrichmentStatus.invalidate();
      utils.profileEnrichmentV2.getEnrichmentHistory.invalidate();
      utils.profileEnrichmentV2.getEnrichmentMetrics.invalidate();
      setCandidateId("");
    },
    onError: (error) => {
      toast.error(`Enrichment failed: ${error.message}`);
    },
  });

  const handleEnrich = () => {
    if (!candidateId || isNaN(parseInt(candidateId))) {
      toast.error("Please enter a valid candidate ID");
      return;
    }
    enrichMutation.mutate({
      candidateId: parseInt(candidateId),
      type: enrichmentType,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 bg-green-50";
    if (confidence >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle2 className="h-4 w-4" />;
    if (confidence >= 60) return <AlertCircle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access profile enrichment</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Profile Enrichment
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered candidate profile enhancement with confidence scoring
          </p>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrichments</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalEnrichments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.completedEnrichments || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.completionRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.failedEnrichments || 0} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgConfidence.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Data quality score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgProcessingTime.toFixed(1) || 0}s</div>
            <p className="text-xs text-muted-foreground">
              Per enrichment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="enrich" className="space-y-6">
        <TabsList>
          <TabsTrigger value="enrich">Enrich Profile</TabsTrigger>
          <TabsTrigger value="history">Enrichment History</TabsTrigger>
          <TabsTrigger value="results">View Results</TabsTrigger>
        </TabsList>

        {/* Enrich Tab */}
        <TabsContent value="enrich" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Start Profile Enrichment</CardTitle>
              <CardDescription>
                Enhance candidate profiles with AI-powered data extraction and verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="candidateId">Candidate ID</Label>
                  <Input
                    id="candidateId"
                    type="number"
                    placeholder="Enter candidate ID"
                    value={candidateId}
                    onChange={(e) => setCandidateId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enrichmentType">Enrichment Type</Label>
                  <Select value={enrichmentType} onValueChange={(v) => setEnrichmentType(v as EnrichmentType)}>
                    <SelectTrigger id="enrichmentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linkedin">LinkedIn Profile</SelectItem>
                      <SelectItem value="github">GitHub Profile</SelectItem>
                      <SelectItem value="resume_parse">Resume Parsing</SelectItem>
                      <SelectItem value="skills_inference">Skills Inference</SelectItem>
                      <SelectItem value="education_verify">Education Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleEnrich}
                disabled={enrichMutation.isPending || !candidateId}
                className="w-full"
              >
                {enrichMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Enriching...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Enrichment
                  </>
                )}
              </Button>

              {/* Current Status */}
              {candidateId && status && (
                <div className="mt-6 p-4 border rounded-lg space-y-4">
                  <h3 className="font-semibold">Current Enrichment Status</h3>
                  <div className="space-y-2">
                    {status.enrichments.map((enrichment) => (
                      <div key={enrichment.id} className="flex items-center justify-between p-3 bg-muted rounded">
                        <div className="flex items-center gap-3">
                          <div className="capitalize">{enrichment.type.replace(/_/g, " ")}</div>
                          {getStatusBadge(enrichment.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          {enrichment.confidence !== null && (
                            <Badge className={getConfidenceColor(enrichment.confidence)}>
                              {enrichment.confidence}% confidence
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedEnrichmentId(enrichment.id)}
                          >
                            View Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrichment Type Info */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">LinkedIn Profile</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Extract professional experience, skills, education, and connections from LinkedIn profiles
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">GitHub Profile</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Analyze repositories, contributions, programming languages, and open-source activity
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resume Parsing</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Extract structured data from resumes including work history, education, and skills
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skills Inference</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                AI-powered skill detection and proficiency estimation based on experience
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Education Verification</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Verify educational credentials and certifications with confidence scoring
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrichment History</CardTitle>
              <CardDescription>View all past enrichment operations</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : history && history.enrichments.length > 0 ? (
                <div className="space-y-3">
                  {history.enrichments.map((enrichment) => (
                    <div
                      key={enrichment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">Candidate #{enrichment.candidateId}</span>
                          <span className="text-sm text-muted-foreground capitalize">
                            {enrichment.type.replace(/_/g, " ")}
                          </span>
                          {getStatusBadge(enrichment.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Started: {new Date(enrichment.startedAt).toLocaleString()}</span>
                          {enrichment.completedAt && (
                            <span>Completed: {new Date(enrichment.completedAt).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {enrichment.confidence !== null && (
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${getConfidenceColor(enrichment.confidence)}`}>
                            {getConfidenceIcon(enrichment.confidence)}
                            <span className="text-sm font-semibold">{enrichment.confidence}%</span>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEnrichmentId(enrichment.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {historyPage} of {history.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((p) => Math.min(history.totalPages, p + 1))}
                      disabled={historyPage === history.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No enrichment history found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {!selectedEnrichmentId ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an enrichment from the history tab to view detailed results</p>
                </div>
              </CardContent>
            </Card>
          ) : resultsLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : results ? (
            <div className="space-y-6">
              {/* Enrichment Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Enrichment Results</CardTitle>
                      <CardDescription>
                        Candidate #{results.enrichment.candidateId} • {results.enrichment.type.replace(/_/g, " ")}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(results.enrichment.status)}
                      {results.enrichment.confidence !== null && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getConfidenceColor(results.enrichment.confidence)}`}>
                          {getConfidenceIcon(results.enrichment.confidence)}
                          <span className="font-semibold">{results.enrichment.confidence}% Confidence</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Started At</Label>
                      <p className="text-sm font-medium">{new Date(results.enrichment.startedAt).toLocaleString()}</p>
                    </div>
                    {results.enrichment.completedAt && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Completed At</Label>
                        <p className="text-sm font-medium">{new Date(results.enrichment.completedAt).toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">Data Sources</Label>
                      <p className="text-sm font-medium">{results.enrichment.dataSources || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Extracted Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Extracted Data</CardTitle>
                  <CardDescription>AI-extracted information with confidence scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.results.map((result) => (
                      <div key={result.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{result.fieldName.replace(/_/g, " ")}</span>
                            <Badge variant="outline">{result.fieldType}</Badge>
                          </div>
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${getConfidenceColor(result.confidence)}`}>
                            {getConfidenceIcon(result.confidence)}
                            <span className="text-sm font-semibold">{result.confidence}%</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Extracted Value</Label>
                            <p className="text-sm mt-1">{result.extractedValue}</p>
                          </div>
                          {result.originalValue && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Original Value</Label>
                              <p className="text-sm mt-1 text-muted-foreground">{result.originalValue}</p>
                            </div>
                          )}
                          {result.dataSource && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Source</Label>
                              <p className="text-sm mt-1">{result.dataSource}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No results found for this enrichment</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
