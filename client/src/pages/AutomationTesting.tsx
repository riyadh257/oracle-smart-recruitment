import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Play,
  Plus,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  BarChart3,
} from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function AutomationTesting() {
  const [, navigate] = useLocation();
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [createScenarioOpen, setCreateScenarioOpen] = useState(false);
  const [createTriggerOpen, setCreateTriggerOpen] = useState(false);
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [customTemplateView, setCustomTemplateView] = useState(false);

  // Queries
  const { data: scenarios, refetch: refetchScenarios } = trpc.automationTesting.scenarios.list.useQuery();
  const { data: templates } = trpc.automationTesting.templates.list.useQuery();
  const { data: customTemplates, refetch: refetchCustomTemplates } = trpc.automationTesting.customTemplates.list.useQuery();
  const { data: triggers, refetch: refetchTriggers } = trpc.automationTesting.triggers.listByScenario.useQuery(
    { scenarioId: selectedScenario! },
    { enabled: !!selectedScenario }
  );
  const { data: campaigns, refetch: refetchCampaigns } = trpc.automationTesting.campaigns.listByScenario.useQuery(
    { scenarioId: selectedScenario! },
    { enabled: !!selectedScenario }
  );
  const { data: executions, refetch: refetchExecutions } = trpc.automationTesting.executions.listByScenario.useQuery(
    { scenarioId: selectedScenario! },
    { enabled: !!selectedScenario }
  );

  // Mutations
  const saveAsTemplate = trpc.automationTesting.customTemplates.createFromScenario.useMutation({
    onSuccess: () => {
      toast.success("Template saved successfully");
      setSaveTemplateDialogOpen(false);
      refetchCustomTemplates();
    },
    onError: (error) => {
      toast.error(`Failed to save template: ${error.message}`);
    },
  });

  const createFromTemplate = trpc.automationTesting.templates.createFromTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Scenario created from template");
      setTemplateDialogOpen(false);
      setSelectedTemplate(null);
      setCustomTemplateView(false);
      refetchScenarios();
      setSelectedScenario(data.scenarioId);
    },
    onError: (error) => {
      toast.error(`Failed to create from template: ${error.message}`);
    },
  });

  const createFromCustomTemplate = trpc.automationTesting.customTemplates.createFromCustomTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Scenario created from custom template");
      setTemplateDialogOpen(false);
      setSelectedTemplate(null);
      setCustomTemplateView(false);
      refetchScenarios();
      setSelectedScenario(data.scenarioId);
    },
    onError: (error) => {
      toast.error(`Failed to create from custom template: ${error.message}`);
    },
  });

  const createScenario = trpc.automationTesting.scenarios.create.useMutation({
    onSuccess: () => {
      toast.success("Test scenario created successfully");
      setCreateScenarioOpen(false);
      refetchScenarios();
    },
    onError: (error) => {
      toast.error(`Failed to create scenario: ${error.message}`);
    },
  });

  const createTrigger = trpc.automationTesting.triggers.create.useMutation({
    onSuccess: () => {
      toast.success("Test trigger created successfully");
      setCreateTriggerOpen(false);
      refetchTriggers();
    },
    onError: (error) => {
      toast.error(`Failed to create trigger: ${error.message}`);
    },
  });

  const createCampaign = trpc.automationTesting.campaigns.create.useMutation({
    onSuccess: () => {
      toast.success("Test campaign created successfully");
      setCreateCampaignOpen(false);
      refetchCampaigns();
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const createExecution = trpc.automationTesting.executions.create.useMutation({
    onSuccess: () => {
      toast.success("Test execution started");
      refetchExecutions();
    },
    onError: (error) => {
      toast.error(`Failed to start execution: ${error.message}`);
    },
  });

  const deleteScenario = trpc.automationTesting.scenarios.delete.useMutation({
    onSuccess: () => {
      toast.success("Test scenario deleted");
      setSelectedScenario(null);
      refetchScenarios();
    },
    onError: (error) => {
      toast.error(`Failed to delete scenario: ${error.message}`);
    },
  });

  const handleCreateScenario = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createScenario.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      scenarioType: formData.get("scenarioType") as any,
    });
  };

  const handleCreateTrigger = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedScenario) return;
    const formData = new FormData(e.currentTarget);
    createTrigger.mutate({
      scenarioId: selectedScenario,
      name: formData.get("name") as string,
      triggerType: formData.get("triggerType") as any,
      delayMinutes: parseInt(formData.get("delayMinutes") as string) || 0,
    });
  };

  const handleCreateCampaign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedScenario) return;
    const formData = new FormData(e.currentTarget);
    createCampaign.mutate({
      scenarioId: selectedScenario,
      name: formData.get("name") as string,
      campaignType: formData.get("campaignType") as any,
    });
  };

  const executeTest = trpc.automationTesting.executions.execute.useMutation({
    onSuccess: () => {
      toast.success("Test execution completed");
      refetchExecutions();
    },
    onError: (error) => {
      toast.error(`Test execution failed: ${error.message}`);
    },
  });

  const handleRunTest = async () => {
    if (!selectedScenario) return;
    
    // First create the execution
    const result = await createExecution.mutateAsync({ scenarioId: selectedScenario });
    
    // Then execute it
    if (result.id) {
      executeTest.mutate({
        executionId: result.id,
        scenarioId: selectedScenario
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      failed: "destructive",
      running: "secondary",
      pending: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Automation Testing</h1>
            <p className="text-muted-foreground">
              Create and execute test scenarios with sample data
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTemplateDialogOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Use Template
            </Button>
            <Button variant="outline" onClick={() => navigate("/automation-testing/analytics")}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Dialog open={createScenarioOpen} onOpenChange={setCreateScenarioOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Scenario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateScenario}>
                <DialogHeader>
                  <DialogTitle>Create Test Scenario</DialogTitle>
                  <DialogDescription>
                    Define a new test scenario for automation testing
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scenarioType">Scenario Type</Label>
                    <Select name="scenarioType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="candidate_application">Candidate Application</SelectItem>
                        <SelectItem value="interview_scheduling">Interview Scheduling</SelectItem>
                        <SelectItem value="email_campaign">Email Campaign</SelectItem>
                        <SelectItem value="engagement_tracking">Engagement Tracking</SelectItem>
                        <SelectItem value="ab_testing">A/B Testing</SelectItem>
                        <SelectItem value="full_workflow">Full Workflow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createScenario.isPending}>
                    {createScenario.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Scenario
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenarios List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Test Scenarios</CardTitle>
              <CardDescription>Select a scenario to view details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {scenarios?.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedScenario === scenario.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedScenario(scenario.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{scenario.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {scenario.scenarioType.replace(/_/g, " ")}
                      </p>
                    </div>
                    {scenario.isActive && (
                      <Badge variant="outline" className="ml-2">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {!scenarios?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No scenarios yet. Create one to get started.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Scenario Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedScenario ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>
                          {scenarios?.find((s) => s.id === selectedScenario)?.name}
                        </CardTitle>
                        <CardDescription>
                          {scenarios?.find((s) => s.id === selectedScenario)?.description ||
                            "No description provided"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSaveTemplateDialogOpen(true)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Save as Template
                        </Button>
                        <Button onClick={handleRunTest} disabled={createExecution.isPending}>
                          {createExecution.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          Run Test
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteScenario.mutate({ id: selectedScenario })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="triggers">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="triggers">Triggers</TabsTrigger>
                        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                        <TabsTrigger value="executions">Executions</TabsTrigger>
                      </TabsList>

                      <TabsContent value="triggers" className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Test Triggers</h3>
                          <Dialog open={createTriggerOpen} onOpenChange={setCreateTriggerOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Trigger
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <form onSubmit={handleCreateTrigger}>
                                <DialogHeader>
                                  <DialogTitle>Create Test Trigger</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="trigger-name">Name</Label>
                                    <Input id="trigger-name" name="name" required />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="triggerType">Trigger Type</Label>
                                    <Select name="triggerType" required>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="application_submitted">
                                          Application Submitted
                                        </SelectItem>
                                        <SelectItem value="interview_scheduled">
                                          Interview Scheduled
                                        </SelectItem>
                                        <SelectItem value="interview_completed">
                                          Interview Completed
                                        </SelectItem>
                                        <SelectItem value="feedback_submitted">
                                          Feedback Submitted
                                        </SelectItem>
                                        <SelectItem value="engagement_score_change">
                                          Engagement Score Change
                                        </SelectItem>
                                        <SelectItem value="time_based">Time Based</SelectItem>
                                        <SelectItem value="manual">Manual</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="delayMinutes">Delay (minutes)</Label>
                                    <Input
                                      id="delayMinutes"
                                      name="delayMinutes"
                                      type="number"
                                      defaultValue="0"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button type="submit" disabled={createTrigger.isPending}>
                                    {createTrigger.isPending && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Create Trigger
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="space-y-2">
                          {triggers?.map((trigger) => (
                            <div
                              key={trigger.id}
                              className="p-4 border rounded-lg flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium">{trigger.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {trigger.triggerType.replace(/_/g, " ")}
                                  {trigger.delayMinutes > 0 &&
                                    ` • Delay: ${trigger.delayMinutes}m`}
                                </p>
                              </div>
                              {trigger.isActive && <Badge>Active</Badge>}
                            </div>
                          ))}
                          {!triggers?.length && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No triggers configured. Add one to get started.
                            </p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="campaigns" className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Test Campaigns</h3>
                          <Dialog open={createCampaignOpen} onOpenChange={setCreateCampaignOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Campaign
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <form onSubmit={handleCreateCampaign}>
                                <DialogHeader>
                                  <DialogTitle>Create Test Campaign</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="campaign-name">Name</Label>
                                    <Input id="campaign-name" name="name" required />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="campaignType">Campaign Type</Label>
                                    <Select name="campaignType" required>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="sms">SMS</SelectItem>
                                        <SelectItem value="notification">Notification</SelectItem>
                                        <SelectItem value="multi_channel">Multi-Channel</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button type="submit" disabled={createCampaign.isPending}>
                                    {createCampaign.isPending && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Create Campaign
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="space-y-2">
                          {campaigns?.map((campaign) => (
                            <div
                              key={campaign.id}
                              className="p-4 border rounded-lg flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium">{campaign.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {campaign.campaignType}
                                </p>
                              </div>
                              {campaign.isActive && <Badge>Active</Badge>}
                            </div>
                          ))}
                          {!campaigns?.length && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No campaigns configured. Add one to get started.
                            </p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="executions" className="space-y-4">
                        <h3 className="text-lg font-semibold">Test Executions</h3>
                        <div className="space-y-2">
                          {executions?.map((execution) => (
                            <div key={execution.id} className="p-4 border rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(execution.status)}
                                  <span className="font-medium">Execution #{execution.id}</span>
                                </div>
                                {getStatusBadge(execution.status)}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Test Candidates</p>
                                  <p className="font-medium">{execution.testCandidatesCount}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Test Jobs</p>
                                  <p className="font-medium">{execution.testJobsCount}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Applications</p>
                                  <p className="font-medium">{execution.testApplicationsCount}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Triggers Executed</p>
                                  <p className="font-medium">{execution.triggersExecuted}</p>
                                </div>
                              </div>
                              {execution.startedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Started: {new Date(execution.startedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                          {!executions?.length && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No test executions yet. Run a test to see results.
                            </p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No scenario selected</p>
                  <p className="text-sm text-muted-foreground">
                    Select a scenario from the list to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Save as Template Dialog */}
        <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
          <DialogContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (selectedScenario) {
                saveAsTemplate.mutate({
                  scenarioId: selectedScenario,
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  isPublic: formData.get('isPublic') === 'on'
                });
              }
            }}>
              <DialogHeader>
                <DialogTitle>Save as Template</DialogTitle>
                <DialogDescription>
                  Save this scenario as a reusable template
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input id="template-name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Input id="template-description" name="description" />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="isPublic" name="isPublic" className="rounded" />
                  <Label htmlFor="isPublic" className="cursor-pointer">
                    Make this template public (visible to all users)
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saveAsTemplate.isPending}>
                  {saveAsTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Template
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Template Selection Dialog */}
        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create from Template</DialogTitle>
              <DialogDescription>
                Choose a pre-configured test scenario template
              </DialogDescription>
            </DialogHeader>
            <Tabs value={customTemplateView ? "custom" : "builtin"} onValueChange={(v) => setCustomTemplateView(v === "custom")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="builtin">Built-in Templates</TabsTrigger>
                <TabsTrigger value="custom">My Templates</TabsTrigger>
              </TabsList>
              <TabsContent value="builtin" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto py-4">
                  {templates?.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === template.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{template.scenarioType.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Triggers:</span>
                      <span className="font-medium">{template.triggers.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Campaigns:</span>
                      <span className="font-medium">{template.campaigns.length}</span>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              </TabsContent>
              <TabsContent value="custom" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto py-4">
                  {customTemplates?.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate === template.id.toString()
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedTemplate(template.id.toString())}
                    >
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{template.scenarioType.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Visibility:</span>
                          <span className="font-medium">{template.isPublic ? 'Public' : 'Private'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!customTemplates?.length && (
                    <p className="text-sm text-muted-foreground text-center py-8 col-span-2">
                      No custom templates yet. Save a scenario as a template to get started.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (selectedTemplate) {
                    if (customTemplateView) {
                      createFromCustomTemplate.mutate({ templateId: parseInt(selectedTemplate) });
                    } else {
                      createFromTemplate.mutate({ templateId: selectedTemplate });
                    }
                  }
                }}
                disabled={!selectedTemplate || createFromTemplate.isPending || createFromCustomTemplate.isPending}
              >
                {(createFromTemplate.isPending || createFromCustomTemplate.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create from Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
