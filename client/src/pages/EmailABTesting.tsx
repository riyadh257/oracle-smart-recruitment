import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Trophy, BarChart3, Mail, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EMAIL_TYPES = [
  { value: "interview_invite", label: "Interview Invite" },
  { value: "interview_reminder", label: "Interview Reminder" },
  { value: "application_received", label: "Application Received" },
  { value: "application_update", label: "Application Update" },
  { value: "job_match", label: "Job Match" },
  { value: "rejection", label: "Rejection" },
  { value: "follow_up", label: "Follow-up" },
  { value: "custom", label: "Custom" },
];

export default function EmailABTesting() {
  const [activeTab, setActiveTab] = useState("create");
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  
  // Create test state
  const [testName, setTestName] = useState("");
  const [emailType, setEmailType] = useState<string>("interview_invite");
  const [sampleSize, setSampleSize] = useState(100);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  
  // Variant A state
  const [variantASubject, setVariantASubject] = useState("");
  const [variantABody, setVariantABody] = useState("");
  
  // Variant B state
  const [variantBSubject, setVariantBSubject] = useState("");
  const [variantBBody, setVariantBBody] = useState("");

  // Queries
  const { data: tests, refetch: refetchTests } = trpc.communication.abTesting.list.useQuery({
    limit: 50,
    offset: 0,
  });

  const { data: testDetails } = trpc.communication.abTesting.getDetails.useQuery(
    { testId: selectedTestId! },
    { enabled: selectedTestId !== null }
  );

  // Mutations
  const createTest = trpc.communication.abTesting.create.useMutation({
    onSuccess: () => {
      toast.success("A/B test created successfully");
      refetchTests();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create test: ${error.message}`);
    },
  });

  const calculateResults = trpc.communication.abTesting.calculateResults.useMutation({
    onSuccess: () => {
      toast.success("Test results calculated successfully");
      refetchTests();
    },
    onError: (error) => {
      toast.error(`Failed to calculate results: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTestName("");
    setEmailType("interview_invite");
    setSampleSize(100);
    setConfidenceLevel(95);
    setVariantASubject("");
    setVariantABody("");
    setVariantBSubject("");
    setVariantBBody("");
  };

  const handleCreateTest = async () => {
    if (!testName || !variantASubject || !variantABody || !variantBSubject || !variantBBody) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createTest.mutateAsync({
      name: testName,
      emailType: emailType as any,
      variantA: {
        subject: variantASubject,
        bodyHtml: `<p>${variantABody}</p>`,
        bodyText: variantABody,
      },
      variantB: {
        subject: variantBSubject,
        bodyHtml: `<p>${variantBBody}</p>`,
        bodyText: variantBBody,
      },
      sampleSize,
      confidenceLevel,
    });
  };

  const handleCalculateResults = async (testId: number) => {
    await calculateResults.mutateAsync({ testId });
  };

  // Prepare comparison chart data
  const getComparisonChartData = (test: any, variants: any[], result: any) => {
    if (!result || variants.length !== 2) return null;

    const variantA = variants.find((v) => v.variant === "A");
    const variantB = variants.find((v) => v.variant === "B");

    return {
      labels: ["Variant A", "Variant B"],
      datasets: [
        {
          label: "Open Rate (%)",
          data: [result.variantAOpenRate / 100, result.variantBOpenRate / 100],
          backgroundColor: "rgba(59, 130, 246, 0.8)",
        },
        {
          label: "Click Rate (%)",
          data: [result.variantAClickRate / 100, result.variantBClickRate / 100],
          backgroundColor: "rgba(16, 185, 129, 0.8)",
        },
      ],
    };
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Email A/B Testing</h1>
        <p className="text-muted-foreground mt-1">
          Test different email variations to optimize engagement and conversions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">Create Test</TabsTrigger>
          <TabsTrigger value="active">Active Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed Tests</TabsTrigger>
        </TabsList>

        {/* Create Test Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New A/B Test</CardTitle>
              <CardDescription>
                Create a new test to compare two email variations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Configuration */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="testName">Test Name</Label>
                  <Input
                    id="testName"
                    placeholder="e.g., Interview Invite Subject Line Test"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emailType">Email Type</Label>
                    <Select value={emailType} onValueChange={setEmailType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMAIL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sampleSize">Sample Size</Label>
                    <Input
                      id="sampleSize"
                      type="number"
                      min="10"
                      value={sampleSize}
                      onChange={(e) => setSampleSize(parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confidenceLevel">Confidence Level (%)</Label>
                    <Select
                      value={confidenceLevel.toString()}
                      onValueChange={(value) => setConfidenceLevel(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90%</SelectItem>
                        <SelectItem value="95">95%</SelectItem>
                        <SelectItem value="99">99%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Variant A */}
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge variant="outline">Variant A</Badge>
                    Control Version
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="variantASubject">Subject Line</Label>
                    <Input
                      id="variantASubject"
                      placeholder="Enter subject line for Variant A"
                      value={variantASubject}
                      onChange={(e) => setVariantASubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="variantABody">Email Body</Label>
                    <Textarea
                      id="variantABody"
                      placeholder="Enter email content for Variant A"
                      rows={6}
                      value={variantABody}
                      onChange={(e) => setVariantABody(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Variant B */}
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge variant="outline">Variant B</Badge>
                    Test Version
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="variantBSubject">Subject Line</Label>
                    <Input
                      id="variantBSubject"
                      placeholder="Enter subject line for Variant B"
                      value={variantBSubject}
                      onChange={(e) => setVariantBSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="variantBBody">Email Body</Label>
                    <Textarea
                      id="variantBBody"
                      placeholder="Enter email content for Variant B"
                      rows={6}
                      value={variantBBody}
                      onChange={(e) => setVariantBBody(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateTest} disabled={createTest.isPending}>
                  {createTest.isPending ? "Creating..." : "Create A/B Test"}
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Tests Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active A/B Tests</CardTitle>
              <CardDescription>
                Tests currently running and collecting data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tests && tests.filter((t) => t.status === "active").length > 0 ? (
                <div className="space-y-4">
                  {tests
                    .filter((t) => t.status === "active")
                    .map((test) => (
                      <div
                        key={test.id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedTestId(test.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{test.name}</h3>
                              <Badge>{test.emailType}</Badge>
                              <Badge variant="outline">Active</Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Sample Size: {test.sampleSize}</span>
                                <span>Confidence: {test.confidenceLevel}%</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCalculateResults(test.id);
                            }}
                            disabled={calculateResults.isPending}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Calculate Results
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No active tests
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Tests Tab */}
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed A/B Tests</CardTitle>
              <CardDescription>
                View results and insights from completed tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tests && tests.filter((t) => t.status === "completed").length > 0 ? (
                <div className="space-y-4">
                  {tests
                    .filter((t) => t.status === "completed")
                    .map((test) => (
                      <div
                        key={test.id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedTestId(test.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{test.name}</h3>
                              <Badge>{test.emailType}</Badge>
                              <Badge variant="secondary">Completed</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Click to view detailed results
                            </p>
                          </div>
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No completed tests yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Details Dialog */}
      <Dialog open={selectedTestId !== null} onOpenChange={() => setSelectedTestId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {testDetails && (
            <>
              <DialogHeader>
                <DialogTitle>{testDetails.test.name}</DialogTitle>
                <DialogDescription>
                  {EMAIL_TYPES.find((t) => t.value === testDetails.test.emailType)?.label} • {testDetails.test.status}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Variants Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  {testDetails.variants.map((variant) => (
                    <Card key={variant.id} className={variant.variant === "A" ? "border-blue-200" : "border-green-200"}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>Variant {variant.variant}</span>
                          {testDetails.result?.winnerVariantId === variant.id && (
                            <Badge className="bg-yellow-500">
                              <Trophy className="h-3 w-3 mr-1" />
                              Winner
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Subject</Label>
                          <p className="text-sm font-medium">{variant.subject}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Body</Label>
                          <p className="text-sm line-clamp-3">{variant.bodyText}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          <div>
                            <Label className="text-xs text-muted-foreground">Sent</Label>
                            <p className="text-lg font-bold">{variant.sentCount}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Opens</Label>
                            <p className="text-lg font-bold text-blue-600">{variant.openCount}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Clicks</Label>
                            <p className="text-lg font-bold text-green-600">{variant.clickCount}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Open Rate</Label>
                            <p className="text-lg font-bold">{(variant.openRate / 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Results Analysis */}
                {testDetails.result && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Performance Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          {(() => {
                            const chartData = getComparisonChartData(
                              testDetails.test,
                              testDetails.variants,
                              testDetails.result
                            );
                            return chartData ? (
                              <Bar
                                data={chartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: "top" as const,
                                    },
                                  },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      ticks: {
                                        callback: (value) => `${value}%`,
                                      },
                                    },
                                  },
                                }}
                              />
                            ) : null;
                          })()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Statistical Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Statistical Significance</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={testDetails.result.statisticalSignificance} className="flex-1" />
                              <span className="text-sm font-medium">{testDetails.result.statisticalSignificance}%</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Confidence Level</Label>
                            <p className="text-lg font-bold">{testDetails.result.confidenceLevel}%</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Relative Improvement</Label>
                            <p className="text-lg font-bold text-green-600">
                              {(testDetails.result.relativeImprovement / 100).toFixed(2)}%
                            </p>
                          </div>
                        </div>

                        {testDetails.result.recommendation && (
                          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                              <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                              <div>
                                <p className="font-medium text-blue-900 dark:text-blue-100">Recommendation</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                  {testDetails.result.recommendation}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTestId(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
