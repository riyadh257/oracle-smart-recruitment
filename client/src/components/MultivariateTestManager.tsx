import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, TrendingUp, Trophy } from "lucide-react";

interface Variant {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

export default function MultivariateTestManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [testName, setTestName] = useState("");
  const [emailType, setEmailType] = useState("custom");
  const [variants, setVariants] = useState<Variant[]>([
    { name: "Variant A", subject: "", bodyHtml: "", bodyText: "" },
    { name: "Variant B", subject: "", bodyHtml: "", bodyText: "" },
    { name: "Variant C", subject: "", bodyHtml: "", bodyText: "" },
  ]);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  const { data: tests, isLoading: testsLoading } = trpc.abTesting.listTests.useQuery();
  const { data: analysis, isLoading: analysisLoading } = trpc.abTesting.analyzeMultivariate.useQuery(
    { testId: selectedTestId!, metric: "open", confidenceLevel: "95" },
    { enabled: !!selectedTestId }
  );

  const createTest = trpc.abTesting.createMultivariateTest.useMutation({
    onSuccess: () => {
      toast.success("Multivariate test created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create test: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTestName("");
    setEmailType("custom");
    setVariants([
      { name: "Variant A", subject: "", bodyHtml: "", bodyText: "" },
      { name: "Variant B", subject: "", bodyHtml: "", bodyText: "" },
      { name: "Variant C", subject: "", bodyHtml: "", bodyText: "" },
    ]);
  };

  const addVariant = () => {
    if (variants.length >= 10) {
      toast.error("Maximum 10 variants allowed");
      return;
    }
    const nextLetter = String.fromCharCode(65 + variants.length);
    setVariants([...variants, { name: `Variant ${nextLetter}`, subject: "", bodyHtml: "", bodyText: "" }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 3) {
      toast.error("Minimum 3 variants required for multivariate testing");
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const updated = [...variants];
    if (updated[index]) {
      updated[index] = { ...updated[index]!, [field]: value };
      setVariants(updated);
    }
  };

  const handleCreateTest = () => {
    if (!testName.trim()) {
      toast.error("Please enter a test name");
      return;
    }

    const invalidVariants = variants.filter((v: any) => !v.subject.trim() || !v.bodyHtml.trim());
    if (invalidVariants.length > 0) {
      toast.error("All variants must have a subject and body");
      return;
    }

    createTest.mutate({
      name: testName,
      emailType: emailType as any,
      variants,
    });
  };

  // Filter tests with 3+ variants
  const multivariateTests = tests?.filter((test: any) => {
    // We'd need to check variant count, but for now show all
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Multivariate Testing</h2>
          <p className="text-muted-foreground">
            Test 3+ email variants simultaneously to find the best performer
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Multivariate Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Multivariate Test</DialogTitle>
              <DialogDescription>
                Test 3-10 email variants to find which performs best
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="testName">Test Name</Label>
                  <Input
                    id="testName"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g., Interview Invite Subject Line Test"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailType">Email Type</Label>
                  <Select value={emailType} onValueChange={setEmailType}>
                    <SelectTrigger id="emailType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interview_invite">Interview Invite</SelectItem>
                      <SelectItem value="interview_reminder">Interview Reminder</SelectItem>
                      <SelectItem value="application_received">Application Received</SelectItem>
                      <SelectItem value="rejection">Rejection</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Variants ({variants.length})</Label>
                  <Button variant="outline" size="sm" onClick={addVariant}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Variant
                  </Button>
                </div>

                {variants.map((variant, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{variant.name}</CardTitle>
                        {variants.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariant(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`subject-${index}`}>Subject Line</Label>
                        <Input
                          id={`subject-${index}`}
                          value={variant.subject}
                          onChange={(e) => updateVariant(index, "subject", e.target.value)}
                          placeholder="Enter email subject"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`body-${index}`}>Email Body (HTML)</Label>
                        <Textarea
                          id={`body-${index}`}
                          value={variant.bodyHtml}
                          onChange={(e) => updateVariant(index, "bodyHtml", e.target.value)}
                          placeholder="Enter email HTML content"
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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

      {/* Test Results */}
      {testsLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : multivariateTests && multivariateTests.length > 0 ? (
        <div className="grid gap-6">
          {multivariateTests.map((test: any) => (
            <Card key={test.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedTestId(test.id)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{test.name}</CardTitle>
                    <CardDescription>{test.emailType}</CardDescription>
                  </div>
                  <Badge variant={test.status === "running" ? "default" : "secondary"}>
                    {test.status}
                  </Badge>
                </div>
              </CardHeader>
              {selectedTestId === test.id && analysis && (
                <CardContent>
                  <div className="space-y-6">
                    {/* Overall Winner */}
                    {analysis.overallWinner && (
                      <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-green-900 dark:text-green-100">
                            Overall Winner: Variant {analysis.overallWinner}
                          </h4>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          This variant outperformed others with statistical significance
                        </p>
                      </div>
                    )}

                    {/* Variant Performance Grid */}
                    <div>
                      <h4 className="font-semibold mb-3">Variant Performance</h4>
                      <div className="grid gap-4 md:grid-cols-3">
                        {analysis.variants.map((variant: any) => (
                          <Card key={variant.id}>
                            <CardHeader>
                              <CardTitle className="text-base flex items-center gap-2">
                                {variant.name}
                                {analysis.overallWinner === variant.id && (
                                  <Trophy className="h-4 w-4 text-green-600" />
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Open Rate:</span>
                                  <span className="font-medium">{(variant.stats.openRate / 100).toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Click Rate:</span>
                                  <span className="font-medium">{(variant.stats.clickRate / 100).toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Sent:</span>
                                  <span className="font-medium">{variant.stats.sentCount}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950">
                        <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                          Recommendations
                        </h4>
                        <ul className="space-y-1 text-sm text-blue-900 dark:text-blue-100">
                          {analysis.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No multivariate tests yet. Create your first test to compare 3+ email variants.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Test
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
