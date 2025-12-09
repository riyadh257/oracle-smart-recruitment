import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FlaskConical, Play, Pause, CheckCircle, Loader2, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

export default function RuleABTesting() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [testName, setTestName] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [variantAConfig, setVariantAConfig] = useState("");
  const [variantBConfig, setVariantBConfig] = useState("");
  const [durationDays, setDurationDays] = useState(14);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: tests, isLoading: loadingTests } = trpc.ruleAbTesting.list.useQuery({});
  const { data: selectedTest, isLoading: loadingSelectedTest } = trpc.ruleAbTesting.getById.useQuery(
    { id: selectedTestId! },
    { enabled: !!selectedTestId }
  );
  const { data: peakHoursSuggestion } = trpc.ruleAbTesting.getPeakHoursSuggestion.useQuery(
    { ruleId: selectedRuleId! },
    { enabled: !!selectedRuleId }
  );

  // Mutations
  const createFromHeatmap = trpc.ruleAbTesting.createFromHeatmap.useMutation({
    onSuccess: (data) => {
      toast.success(`A/B test created with peak hours ${data.peakHours.start}:00-${data.peakHours.end}:00`);
      setCreateDialogOpen(false);
      resetForm();
      utils.ruleAbTesting.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create test: ${error.message}`);
    },
  });

  const startTest = trpc.ruleAbTesting.start.useMutation({
    onSuccess: () => {
      toast.success("A/B test started");
      utils.ruleAbTesting.list.invalidate();
      if (selectedTestId) {
        utils.ruleAbTesting.getById.invalidate({ id: selectedTestId });
      }
    },
    onError: (error) => {
      toast.error(`Failed to start test: ${error.message}`);
    },
  });

  const pauseTest = trpc.ruleAbTesting.pause.useMutation({
    onSuccess: () => {
      toast.success("A/B test paused");
      utils.ruleAbTesting.list.invalidate();
      if (selectedTestId) {
        utils.ruleAbTesting.getById.invalidate({ id: selectedTestId });
      }
    },
    onError: (error) => {
      toast.error(`Failed to pause test: ${error.message}`);
    },
  });

  const completeTest = trpc.ruleAbTesting.complete.useMutation({
    onSuccess: (data) => {
      toast.success(`Test completed with ${data.confidenceLevel}% confidence`);
      utils.ruleAbTesting.list.invalidate();
      if (selectedTestId) {
        utils.ruleAbTesting.getById.invalidate({ id: selectedTestId });
      }
    },
    onError: (error) => {
      toast.error(`Failed to complete test: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTestName("");
    setTestDescription("");
    setVariantAConfig("");
    setVariantBConfig("");
    setSelectedRuleId(null);
    setDurationDays(14);
  };

  const handleCreateTest = () => {
    if (!selectedRuleId || !testName || !variantAConfig || !variantBConfig) {
      toast.error("Please fill in all required fields");
      return;
    }

    createFromHeatmap.mutate({
      name: testName,
      description: testDescription || undefined,
      ruleId: selectedRuleId,
      variantAConfig,
      variantBConfig,
      durationDays,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      running: "default",
      completed: "secondary",
      paused: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getWinnerBadge = (winner: string | null) => {
    if (!winner || winner === "none") return null;
    return (
      <Badge variant="default" className="ml-2">
        Winner: Variant {winner === "variant_a" ? "A" : "B"}
      </Badge>
    );
  };

  const calculatePerformanceDiff = (variantA: any, variantB: any) => {
    if (!variantA || !variantB) return { diff: 0, better: "none" };
    
    const engagementA = Number(variantA.avgEngagementRate) || 0;
    const engagementB = Number(variantB.avgEngagementRate) || 0;
    
    if (engagementA === 0 && engagementB === 0) return { diff: 0, better: "none" };
    
    const diff = ((engagementB - engagementA) / Math.max(engagementA, 1)) * 100;
    const better = diff > 0 ? "b" : diff < 0 ? "a" : "none";
    
    return { diff: Math.abs(diff), better };
  };

  const formatChartData = (results: any) => {
    if (!results || results.length === 0) return [];
    
    const variantA = results.find((r: any) => r.variant === "a");
    const variantB = results.find((r: any) => r.variant === "b");
    
    return [
      {
        name: "Executions",
        "Variant A": Number(variantA?.totalExecutions) || 0,
        "Variant B": Number(variantB?.totalExecutions) || 0,
      },
      {
        name: "Opens",
        "Variant A": Number(variantA?.totalOpens) || 0,
        "Variant B": Number(variantB?.totalOpens) || 0,
      },
      {
        name: "Clicks",
        "Variant A": Number(variantA?.totalClicks) || 0,
        "Variant B": Number(variantB?.totalClicks) || 0,
      },
      {
        name: "Responses",
        "Variant A": Number(variantA?.totalResponses) || 0,
        "Variant B": Number(variantB?.totalResponses) || 0,
      },
    ];
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Rule A/B Testing</h1>
          <p className="text-muted-foreground mt-2">
            Test notification rules during peak vs off-peak hours
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <FlaskConical className="mr-2 h-4 w-4" />
              Create A/B Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create A/B Test from Heatmap</DialogTitle>
              <DialogDescription>
                Automatically detect peak hours from heatmap data and test rule variants
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="testName">Test Name</Label>
                <Input
                  id="testName"
                  placeholder="e.g., Interview Reminder Timing Test"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testDescription">Description</Label>
                <Textarea
                  id="testDescription"
                  placeholder="Describe what you're testing..."
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruleId">Rule ID</Label>
                <Input
                  id="ruleId"
                  type="number"
                  placeholder="Enter rule ID"
                  value={selectedRuleId || ""}
                  onChange={(e) => setSelectedRuleId(parseInt(e.target.value) || null)}
                />
                {peakHoursSuggestion && (
                  <p className="text-sm text-muted-foreground">
                    {peakHoursSuggestion.recommendation}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="variantA">Variant A Config (Peak Hours)</Label>
                  <Textarea
                    id="variantA"
                    placeholder='{"priority": "high", "delay": 0}'
                    value={variantAConfig}
                    onChange={(e) => setVariantAConfig(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variantB">Variant B Config (Off-Peak)</Label>
                  <Textarea
                    id="variantB"
                    placeholder='{"priority": "medium", "delay": 60}'
                    value={variantBConfig}
                    onChange={(e) => setVariantBConfig(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Test Duration (Days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={90}
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 14)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTest} disabled={createFromHeatmap.isPending}>
                {createFromHeatmap.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" onValueChange={() => setSelectedTestId(null)}>
        <TabsList>
          <TabsTrigger value="active">Active Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed Tests</TabsTrigger>
          <TabsTrigger value="all">All Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loadingTests ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tests?.filter((t: any) => t.status === "running" || t.status === "paused").length ? (
            tests.filter((t: any) => t.status === "running" || t.status === "paused").map((test) => (
              <Card key={test.id} className="cursor-pointer hover:border-primary" onClick={() => setSelectedTestId(test.id)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{test.name}</CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(test.status)}
                      {getWinnerBadge(test.winner)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Peak Hours: {test.peakHoursStart}:00 - {test.peakHoursEnd}:00</span>
                        <span className="text-muted-foreground">
                          {test.startDate && new Date(test.startDate).toLocaleDateString()} - {test.endDate && new Date(test.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {test.status === "running" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            pauseTest.mutate({ testId: test.id });
                          }}
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </Button>
                      )}
                      {test.status === "paused" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            startTest.mutate({ testId: test.id });
                          }}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Resume
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const winner = prompt("Declare winner (variant_a, variant_b, or none):");
                          if (winner && ["variant_a", "variant_b", "none"].includes(winner)) {
                            completeTest.mutate({ testId: test.id, winner: winner as any });
                          }
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No active tests
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {tests?.filter((t: any) => t.status === "completed").map((test) => (
            <Card key={test.id} className="cursor-pointer hover:border-primary" onClick={() => setSelectedTestId(test.id)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{test.name}</CardTitle>
                    <CardDescription>{test.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.status)}
                    {getWinnerBadge(test.winner)}
                    {test.confidenceLevel && (
                      <Badge variant="outline">{test.confidenceLevel}% confidence</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {tests?.map((test) => (
            <Card key={test.id} className="cursor-pointer hover:border-primary" onClick={() => setSelectedTestId(test.id)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{test.name}</CardTitle>
                    <CardDescription>{test.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.status)}
                    {getWinnerBadge(test.winner)}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Test Details Dialog */}
      {selectedTestId && (
        <Dialog open={!!selectedTestId} onOpenChange={() => setSelectedTestId(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTest?.test.name}</DialogTitle>
              <DialogDescription>{selectedTest?.test.description}</DialogDescription>
            </DialogHeader>
            {loadingSelectedTest ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : selectedTest ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Variant A (Peak Hours)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {selectedTest.results?.find((r: any) => r.variant === "a") ? (
                          <>
                            <div className="flex justify-between">
                              <span>Executions:</span>
                              <span className="font-medium">{Number(selectedTest.results.find((r: any) => r.variant === "a")?.totalExecutions) || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Opens:</span>
                              <span className="font-medium">{Number(selectedTest.results.find((r: any) => r.variant === "a")?.totalOpens) || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Clicks:</span>
                              <span className="font-medium">{Number(selectedTest.results.find((r: any) => r.variant === "a")?.totalClicks) || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Engagement Rate:</span>
                              <span className="font-medium">{(Number(selectedTest.results.find((r: any) => r.variant === "a")?.avgEngagementRate) / 100).toFixed(2)}%</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-muted-foreground">No data yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Variant B (Off-Peak)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {selectedTest.results?.find((r: any) => r.variant === "b") ? (
                          <>
                            <div className="flex justify-between">
                              <span>Executions:</span>
                              <span className="font-medium">{Number(selectedTest.results.find((r: any) => r.variant === "b")?.totalExecutions) || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Opens:</span>
                              <span className="font-medium">{Number(selectedTest.results.find((r: any) => r.variant === "b")?.totalOpens) || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Clicks:</span>
                              <span className="font-medium">{Number(selectedTest.results.find((r: any) => r.variant === "b")?.totalClicks) || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Engagement Rate:</span>
                              <span className="font-medium">{(Number(selectedTest.results.find((r: any) => r.variant === "b")?.avgEngagementRate) / 100).toFixed(2)}%</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-muted-foreground">No data yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedTest.results && selectedTest.results.length === 2 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Performance Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const variantA = selectedTest.results.find((r: any) => r.variant === "a");
                        const variantB = selectedTest.results.find((r: any) => r.variant === "b");
                        const { diff, better } = calculatePerformanceDiff(variantA, variantB);
                        
                        return (
                          <div className="flex items-center gap-4">
                            {better === "a" && <TrendingDown className="h-8 w-8 text-destructive" />}
                            {better === "b" && <TrendingUp className="h-8 w-8 text-green-500" />}
                            {better === "none" && <Minus className="h-8 w-8 text-muted-foreground" />}
                            <div>
                              <p className="font-medium">
                                {better === "none" ? "No significant difference" : 
                                 better === "a" ? "Variant A performs better" : 
                                 "Variant B performs better"}
                              </p>
                              {better !== "none" && (
                                <p className="text-sm text-muted-foreground">
                                  {diff.toFixed(1)}% higher engagement rate
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}

                {selectedTest.results && selectedTest.results.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Results Chart</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={formatChartData(selectedTest.results)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Variant A" fill="hsl(var(--primary))" />
                          <Bar dataKey="Variant B" fill="hsl(var(--chart-2))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
