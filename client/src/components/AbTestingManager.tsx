import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Play, Pause, Trophy, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

export default function AbTestingManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: "",
    emailType: "interview_invite" as const,
    trafficSplit: 50,
    variantA: { subject: "", bodyHtml: "", bodyText: "" },
    variantB: { subject: "", bodyHtml: "", bodyText: "" },
  });

  const { data: tests, isLoading, refetch } = trpc.abTesting.listTests.useQuery();
  const createTest = trpc.abTesting.createTest.useMutation({
    onSuccess: () => {
      toast.success("A/B test created successfully");
      setIsCreateDialogOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create test: ${error.message}`);
    },
  });

  const startTest = trpc.abTesting.startTest.useMutation({
    onSuccess: () => {
      toast.success("A/B test started");
      refetch();
    },
  });

  const stopTest = trpc.abTesting.stopTest.useMutation({
    onSuccess: () => {
      toast.success("A/B test stopped");
      refetch();
    },
  });

  const resetForm = () => {
    setNewTest({
      name: "",
      emailType: "interview_invite",
      trafficSplit: 50,
      variantA: { subject: "", bodyHtml: "", bodyText: "" },
      variantB: { subject: "", bodyHtml: "", bodyText: "" },
    });
  };

  const handleCreateTest = () => {
    if (!newTest.name || !newTest.variantA.subject || !newTest.variantB.subject) {
      toast.error("Please fill in all required fields");
      return;
    }
    createTest.mutate(newTest);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      running: "default",
      completed: "outline",
      paused: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const calculateWinner = (variantA: any, variantB: any) => {
    if (!variantA || !variantB) return null;
    
    const aScore = (variantA.openRate || 0) + (variantA.clickRate || 0) * 2;
    const bScore = (variantB.openRate || 0) + (variantB.clickRate || 0) * 2;
    
    if (Math.abs(aScore - bScore) < 5) return "tie";
    return aScore > bScore ? "A" : "B";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">A/B Testing</h2>
          <p className="text-muted-foreground">
            Test different email variations to optimize engagement
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
              <DialogDescription>
                Set up a new A/B test to compare two email variations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="test-name">Test Name</Label>
                <Input
                  id="test-name"
                  placeholder="e.g., Interview Invite Subject Line Test"
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email-type">Email Type</Label>
                  <Select
                    value={newTest.emailType}
                    onValueChange={(value: any) => setNewTest({ ...newTest, emailType: value })}
                  >
                    <SelectTrigger id="email-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interview_invite">Interview Invite</SelectItem>
                      <SelectItem value="interview_reminder">Interview Reminder</SelectItem>
                      <SelectItem value="application_received">Application Received</SelectItem>
                      <SelectItem value="application_update">Application Update</SelectItem>
                      <SelectItem value="job_match">Job Match</SelectItem>
                      <SelectItem value="rejection">Rejection</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="traffic-split">Traffic Split (% for Variant A)</Label>
                  <Input
                    id="traffic-split"
                    type="number"
                    min="0"
                    max="100"
                    value={newTest.trafficSplit}
                    onChange={(e) =>
                      setNewTest({ ...newTest, trafficSplit: parseInt(e.target.value) || 50 })
                    }
                  />
                </div>
              </div>

              <Tabs defaultValue="variantA" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="variantA">Variant A</TabsTrigger>
                  <TabsTrigger value="variantB">Variant B</TabsTrigger>
                </TabsList>

                <TabsContent value="variantA" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="variantA-subject">Subject Line</Label>
                    <Input
                      id="variantA-subject"
                      placeholder="Enter subject line for Variant A"
                      value={newTest.variantA.subject}
                      onChange={(e) =>
                        setNewTest({
                          ...newTest,
                          variantA: { ...newTest.variantA, subject: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variantA-html">Email Body (HTML)</Label>
                    <Textarea
                      id="variantA-html"
                      placeholder="Enter HTML content for Variant A"
                      rows={8}
                      value={newTest.variantA.bodyHtml}
                      onChange={(e) =>
                        setNewTest({
                          ...newTest,
                          variantA: { ...newTest.variantA, bodyHtml: e.target.value },
                        })
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="variantB" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="variantB-subject">Subject Line</Label>
                    <Input
                      id="variantB-subject"
                      placeholder="Enter subject line for Variant B"
                      value={newTest.variantB.subject}
                      onChange={(e) =>
                        setNewTest({
                          ...newTest,
                          variantB: { ...newTest.variantB, subject: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variantB-html">Email Body (HTML)</Label>
                    <Textarea
                      id="variantB-html"
                      placeholder="Enter HTML content for Variant B"
                      rows={8}
                      value={newTest.variantB.bodyHtml}
                      onChange={(e) =>
                        setNewTest({
                          ...newTest,
                          variantB: { ...newTest.variantB, bodyHtml: e.target.value },
                        })
                      }
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTest} disabled={createTest.isPending}>
                {createTest.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Test"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!tests || tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No A/B tests yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first A/B test to start optimizing email performance
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {tests.map((test: any) => {
            const winner = test.winnerVariant !== "none" ? test.winnerVariant : null;
            
            return (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {test.name}
                        {getStatusBadge(test.status)}
                        {winner && (
                          <Badge variant="default" className="bg-green-600">
                            <Trophy className="mr-1 h-3 w-3" />
                            Winner: Variant {winner}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {test.emailType.replace(/_/g, " ")} • Traffic split: {test.trafficSplit}%
                        / {100 - test.trafficSplit}%
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {test.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => startTest.mutate({ testId: test.id })}
                          disabled={startTest.isPending}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start Test
                        </Button>
                      )}
                      {test.status === "running" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => stopTest.mutate({ testId: test.id })}
                          disabled={stopTest.isPending}
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Stop Test
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Variant A */}
                    <div className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Variant A</h4>
                        {winner === "A" && <Trophy className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sent:</span>{" "}
                          <span className="font-medium">0</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Open Rate:</span>{" "}
                          <span className="font-medium">0%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Click Rate:</span>{" "}
                          <span className="font-medium">0%</span>
                        </div>
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Variant B</h4>
                        {winner === "B" && <Trophy className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sent:</span>{" "}
                          <span className="font-medium">0</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Open Rate:</span>{" "}
                          <span className="font-medium">0%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Click Rate:</span>{" "}
                          <span className="font-medium">0%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {test.status === "running" && (
                    <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Test in progress:</strong> Continue sending emails to gather
                        more data. Statistical significance will be calculated automatically.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
