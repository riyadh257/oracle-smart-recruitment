import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Zap, Plus, Play, Pause, Trash2, BarChart3, Clock, Mail, 
  CheckCircle2, XCircle, Activity, TrendingUp, AlertCircle 
} from "lucide-react";

const EVENT_TYPES = [
  { value: "candidate_applied", label: "Candidate Applied", icon: "👤", description: "Triggers when a new candidate submits an application" },
  { value: "interview_scheduled", label: "Interview Scheduled", icon: "📅", description: "Triggers when an interview is scheduled" },
  { value: "interview_completed", label: "Interview Completed", icon: "✅", description: "Triggers after an interview is completed" },
  { value: "feedback_submitted", label: "Feedback Submitted", icon: "📝", description: "Triggers when feedback is submitted" },
  { value: "no_response_3days", label: "No Response (3 Days)", icon: "⏰", description: "Triggers if candidate hasn't responded in 3 days" },
  { value: "no_response_7days", label: "No Response (7 Days)", icon: "⏱️", description: "Triggers if candidate hasn't responded in 7 days" },
];

const PRESET_TEMPLATES = [
  {
    id: "welcome",
    name: "Welcome Email",
    subject: "Welcome to {{companyName}}!",
    body: `Hi {{candidateName}},\n\nWe're thrilled to have you join us at {{companyName}}.\n\nYour journey with us starts here. We're excited to see what you'll accomplish!\n\nBest regards,\nThe {{companyName}} Team`,
  },
  {
    id: "interview_reminder",
    name: "Interview Reminder",
    subject: "Reminder: Interview for {{jobTitle}} Tomorrow",
    body: `Hi {{candidateName}},\n\nThis is a friendly reminder about your interview for the {{jobTitle}} position tomorrow.\n\nWe're looking forward to meeting you!\n\nBest regards,\n{{companyName}} Recruitment Team`,
  },
  {
    id: "followup",
    name: "Follow-Up",
    subject: "Following up on your application",
    body: `Hi {{candidateName}},\n\nWe wanted to follow up on your application for the {{jobTitle}} position.\n\nWe're still reviewing applications and wanted to let you know that you're still in consideration.\n\nBest regards,\n{{companyName}}`,
  },
];

export default function EmailAutomation() {
  const [activeTab, setActiveTab] = useState("workflows");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [status, setStatus] = useState<"active" | "paused" | "draft">("draft");

  const { data: workflows, refetch: refetchWorkflows } = trpc.emailAutomation.list.useQuery({
    limit: 50,
    offset: 0,
  });

  const { data: workflowDetails } = trpc.emailAutomation.getDetails.useQuery(
    { workflowId: selectedWorkflowId! },
    { enabled: selectedWorkflowId !== null }
  );

  const createWorkflow = trpc.emailAutomation.create.useMutation({
    onSuccess: () => {
      toast.success("Workflow created successfully!");
      refetchWorkflows();
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to create workflow: " + error.message);
    },
  });

  const toggleStatus = trpc.emailAutomation.toggleStatus.useMutation({
    onSuccess: () => {
      toast.success("Workflow status updated!");
      refetchWorkflows();
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const deleteWorkflow = trpc.emailAutomation.delete.useMutation({
    onSuccess: () => {
      toast.success("Workflow deleted!");
      refetchWorkflows();
    },
    onError: (error) => {
      toast.error("Failed to delete workflow: " + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setEventType("");
    setEmailSubject("");
    setEmailBody("");
    setDelayMinutes(0);
    setStatus("draft");
  };

  const handleCreateWorkflow = async () => {
    if (!name || !eventType || !emailSubject || !emailBody) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createWorkflow.mutateAsync({
      name,
      description,
      eventType: eventType as any,
      emailSubject,
      emailBody,
      delayMinutes,
      status,
    });
  };

  const handleToggleStatus = async (workflowId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    await toggleStatus.mutateAsync({
      workflowId,
      status: newStatus as "active" | "paused",
    });
  };

  const handleDelete = async (workflowId: number) => {
    if (confirm("Are you sure you want to delete this workflow?")) {
      await deleteWorkflow.mutateAsync({ workflowId });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = PRESET_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setEmailSubject(template.subject);
      setEmailBody(template.body);
      toast.success("Template loaded!");
    }
  };

  const activeWorkflows = workflows?.filter(w => w.status === "active") || [];
  const totalExecutions = workflows?.reduce((sum, w) => sum + (w.timesTriggered || 0), 0) || 0;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-8 w-8 text-yellow-500" />
              Email Automation
            </h1>
            <p className="text-muted-foreground mt-2">
              Create automated email workflows triggered by candidate events
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{activeWorkflows.length}</div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{workflows?.length || 0}</div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{totalExecutions}</div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4 mt-6">
          {workflows && workflows.length > 0 ? (
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <Badge variant={workflow.status === "active" ? "default" : workflow.status === "paused" ? "secondary" : "outline"}>
                            {workflow.status}
                          </Badge>
                        </div>
                        <CardDescription className="mt-2">
                          {workflow.description || "No description"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(workflow.id, workflow.status)}
                        >
                          {workflow.status === "active" ? (
                            <>
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(workflow.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Trigger Event</p>
                        <p className="font-medium capitalize">{workflow.eventType.replace(/_/g, " ")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Delay</p>
                        <p className="font-medium">
                          {workflow.delayMinutes === 0 
                            ? "Immediate" 
                            : workflow.delayMinutes < 60 
                              ? `${workflow.delayMinutes}m` 
                              : `${Math.floor(workflow.delayMinutes / 60)}h`}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Times Triggered</p>
                        <p className="font-medium">{workflow.timesTriggered || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Triggered</p>
                        <p className="font-medium text-xs">
                          {workflow.lastTriggeredAt 
                            ? new Date(workflow.lastTriggeredAt).toLocaleDateString() 
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Workflows Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first automated email workflow to start engaging candidates
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Performance</CardTitle>
              <CardDescription>Analytics coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Detailed analytics will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Workflow Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Automation Workflow</DialogTitle>
            <DialogDescription>
              Set up automated emails triggered by candidate events
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Workflow Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Welcome New Candidates"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this workflow does"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Trigger Event */}
            <div className="space-y-2">
              <Label htmlFor="eventType">Trigger Event *</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Select when to trigger this workflow" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      <div className="flex flex-col">
                        <span>{event.icon} {event.label}</span>
                        <span className="text-xs text-muted-foreground">{event.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delay */}
            <div className="space-y-2">
              <Label htmlFor="delay">Delay (minutes)</Label>
              <Input
                id="delay"
                type="number"
                placeholder="0"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 for immediate sending. Use delays for follow-ups (e.g., 4320 = 3 days)
              </p>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Email Template (Optional)</Label>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a preset template" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                placeholder="Use {{candidateName}}, {{jobTitle}}, {{companyName}}"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            {/* Email Body */}
            <div className="space-y-2">
              <Label htmlFor="body">Email Body *</Label>
              <Textarea
                id="body"
                placeholder="Use {{candidateName}}, {{jobTitle}}, {{companyName}}"
                rows={8}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available placeholders: {"{{candidateName}}"}, {"{{jobTitle}}"}, {"{{companyName}}"}
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Not Active)</SelectItem>
                  <SelectItem value="active">Active (Start Immediately)</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkflow} disabled={createWorkflow.isPending}>
              {createWorkflow.isPending ? "Creating..." : "Create Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
