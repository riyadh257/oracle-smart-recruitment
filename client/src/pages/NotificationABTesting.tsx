import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  Play, 
  Pause, 
  Trophy, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function NotificationABTesting() {
  const { user, loading } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    testType: "subject" as "subject" | "content" | "send_time" | "full_template",
    variantATemplateId: 0,
    variantBTemplateId: 0,
    trafficSplit: 50,
    minimumSampleSize: 100,
    confidenceLevel: 95,
    primaryMetric: "open_rate" as "open_rate" | "click_rate" | "response_rate" | "conversion_rate",
  });

  const { data: tests, isLoading, refetch } = trpc.emailTemplateSystem.getABTests.useQuery();
  const { data: templates } = trpc.emailTemplateSystem.getTemplates.useQuery({ isActive: true });

  const createTest = trpc.emailTemplateSystem.createABTest.useMutation({
    onSuccess: () => {
      toast.success("A/B test created successfully");
      refetch();
      setCreateDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        testType: "subject",
        variantATemplateId: 0,
        variantBTemplateId: 0,
        trafficSplit: 50,
        minimumSampleSize: 100,
        confidenceLevel: 95,
        primaryMetric: "open_rate",
      });
    },
    onError: (error) => {
      toast.error(`Failed to create test: ${error.message}`);
    },
  });

  const startTest = trpc.emailTemplateSystem.startABTest.useMutation({
    onSuccess: () => {
      toast.success("A/B test started");
      refetch();
    },
  });

  const stopTest = trpc.emailTemplateSystem.stopABTest.useMutation({
    onSuccess: () => {
      toast.success("A/B test stopped");
      refetch();
    },
  });

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const handleCreateTest = () => {
    if (!formData.name || !formData.variantATemplateId || !formData.variantBTemplateId) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.variantATemplateId === formData.variantBTemplateId) {
      toast.error("Variant templates must be different");
      return;
    }
    createTest.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "running":
        return <Badge variant="default" className="bg-green-600">Running</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getWinnerBadge = (winner: string | null) => {
    if (!winner) return <span className="text-muted-foreground">-</span>;
    if (winner === "no_winner") {
      return (
        <Badge variant="outline" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          No Winner
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <Trophy className="h-3 w-3" />
        Variant {winner}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">A/B Testing</h1>
            <p className="text-muted-foreground mt-2">
              Optimize your notification strategy with data-driven experiments
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create A/B Test</DialogTitle>
                <DialogDescription>
                  Set up a new experiment to test different notification variants
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Test Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Subject Line Test - Interview Invites"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what you're testing and why"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testType">Test Type *</Label>
                    <Select
                      value={formData.testType}
                      onValueChange={(value: any) => setFormData({ ...formData, testType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subject">Subject Line</SelectItem>
                        <SelectItem value="content">Content</SelectItem>
                        <SelectItem value="send_time">Send Time</SelectItem>
                        <SelectItem value="full_template">Full Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="primaryMetric">Primary Metric *</Label>
                    <Select
                      value={formData.primaryMetric}
                      onValueChange={(value: any) => setFormData({ ...formData, primaryMetric: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open_rate">Open Rate</SelectItem>
                        <SelectItem value="click_rate">Click Rate</SelectItem>
                        <SelectItem value="response_rate">Response Rate</SelectItem>
                        <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="variantA">Variant A Template *</Label>
                    <Select
                      value={formData.variantATemplateId.toString()}
                      onValueChange={(value) => setFormData({ ...formData, variantATemplateId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.templates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="variantB">Variant B Template *</Label>
                    <Select
                      value={formData.variantBTemplateId.toString()}
                      onValueChange={(value) => setFormData({ ...formData, variantBTemplateId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.templates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="trafficSplit">Traffic Split (%)</Label>
                    <Input
                      id="trafficSplit"
                      type="number"
                      min="10"
                      max="90"
                      value={formData.trafficSplit}
                      onChange={(e) => setFormData({ ...formData, trafficSplit: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Variant A: {formData.trafficSplit}% | Variant B: {100 - formData.trafficSplit}%
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="sampleSize">Min Sample Size</Label>
                    <Input
                      id="sampleSize"
                      type="number"
                      min="30"
                      value={formData.minimumSampleSize}
                      onChange={(e) => setFormData({ ...formData, minimumSampleSize: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confidence">Confidence Level</Label>
                    <Select
                      value={formData.confidenceLevel.toString()}
                      onValueChange={(value) => setFormData({ ...formData, confidenceLevel: parseInt(value) })}
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
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTest} disabled={createTest.isPending}>
                    {createTest.isPending ? "Creating..." : "Create Test"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Experiments</CardTitle>
            <CardDescription>
              Manage and monitor your A/B tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading tests...</div>
            ) : !tests || tests.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No A/B tests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first experiment to start optimizing your notifications
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Test
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Primary Metric</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => {
                    const progress = test.minimumSampleSize > 0 
                      ? Math.min(100, ((test.variantASent + test.variantBSent) / test.minimumSampleSize) * 100)
                      : 0;

                    return (
                      <TableRow key={test.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{test.name}</div>
                            {test.description && (
                              <div className="text-sm text-muted-foreground">{test.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {test.testType.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(test.status)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {test.primaryMetric.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                            <Progress value={progress} className="w-24 h-2" />
                            <span className="text-xs text-muted-foreground">
                              {test.variantASent + test.variantBSent} / {test.minimumSampleSize}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getWinnerBadge(test.winnerVariant)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {test.status === "draft" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startTest.mutate({ testId: test.id })}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Start
                              </Button>
                            )}
                            {test.status === "running" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => stopTest.mutate({ testId: test.id })}
                              >
                                <Pause className="h-4 w-4 mr-1" />
                                Stop
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" asChild>
                              <a href={`/ab-testing/${test.id}`}>View Results</a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
