import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Play, Pause, Trash2, Loader2, Zap, Mail, Calendar, List, Bell, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function WorkflowManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTrigger, setNewTrigger] = useState({
    name: "",
    description: "",
    isActive: true,
    triggerType: "engagement_score" as any,
    triggerCondition: { operator: ">=", threshold: 80 },
    actionType: "send_email" as any,
    actionConfig: { templateId: "", subject: "", delay: 0 },
  });

  const { data: triggers, isLoading, refetch } = trpc.workflows.getTriggers.useQuery();
  const { data: executions } = trpc.workflows.getExecutions.useQuery({ limit: 50 });
  
  const createMutation = trpc.workflows.createTrigger.useMutation({
    onSuccess: () => {
      toast.success("Workflow trigger created successfully");
      setIsCreateDialogOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create trigger: ${error.message}`);
    },
  });

  const updateMutation = trpc.workflows.updateTrigger.useMutation({
    onSuccess: () => {
      toast.success("Workflow trigger updated");
      refetch();
    },
  });

  const deleteMutation = trpc.workflows.deleteTrigger.useMutation({
    onSuccess: () => {
      toast.success("Workflow trigger deleted");
      refetch();
    },
  });

  const resetForm = () => {
    setNewTrigger({
      name: "",
      description: "",
      isActive: true,
      triggerType: "engagement_score",
      triggerCondition: { operator: ">=", threshold: 80 },
      actionType: "send_email",
      actionConfig: { templateId: "", subject: "", delay: 0 },
    });
  };

  const handleCreate = () => {
    if (!newTrigger.name) {
      toast.error("Please enter a workflow name");
      return;
    }
    createMutation.mutate(newTrigger);
  };

  const toggleActive = (triggerId: number, currentState: boolean) => {
    updateMutation.mutate({
      triggerId,
      isActive: !currentState,
    });
  };

  const handleDelete = (triggerId: number) => {
    if (confirm("Are you sure you want to delete this workflow trigger?")) {
      deleteMutation.mutate({ triggerId });
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "send_email": return <Mail className="h-4 w-4" />;
      case "schedule_interview": return <Calendar className="h-4 w-4" />;
      case "add_to_list": return <List className="h-4 w-4" />;
      case "notify_recruiter": return <Bell className="h-4 w-4" />;
      case "update_status": return <RefreshCw className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Engagement Workflows</h2>
          <p className="text-sm text-muted-foreground">
            Automatically trigger actions when candidates reach engagement thresholds
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Engagement Workflow</DialogTitle>
              <DialogDescription>
                Set up automatic actions triggered by candidate engagement
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={newTrigger.name}
                  onChange={(e) => setNewTrigger({ ...newTrigger, name: e.target.value })}
                  placeholder="High engagement follow-up"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTrigger.description}
                  onChange={(e) => setNewTrigger({ ...newTrigger, description: e.target.value })}
                  placeholder="Automatically send follow-up email when engagement score exceeds 80"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="triggerType">Trigger Type</Label>
                  <Select
                    value={newTrigger.triggerType}
                    onValueChange={(value: any) => setNewTrigger({ ...newTrigger, triggerType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engagement_score">Engagement Score</SelectItem>
                      <SelectItem value="engagement_level">Engagement Level</SelectItem>
                      <SelectItem value="email_opened">Email Opened</SelectItem>
                      <SelectItem value="link_clicked">Link Clicked</SelectItem>
                      <SelectItem value="response_received">Response Received</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionType">Action</Label>
                  <Select
                    value={newTrigger.actionType}
                    onValueChange={(value: any) => setNewTrigger({ ...newTrigger, actionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_email">Send Email</SelectItem>
                      <SelectItem value="schedule_interview">Schedule Interview</SelectItem>
                      <SelectItem value="add_to_list">Add to List</SelectItem>
                      <SelectItem value="notify_recruiter">Notify Recruiter</SelectItem>
                      <SelectItem value="update_status">Update Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newTrigger.triggerType === "engagement_score" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select
                      value={newTrigger.triggerCondition.operator}
                      onValueChange={(value) =>
                        setNewTrigger({
                          ...newTrigger,
                          triggerCondition: { ...newTrigger.triggerCondition, operator: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">=">&gt;= (Greater than or equal)</SelectItem>
                        <SelectItem value="<=">&lt;= (Less than or equal)</SelectItem>
                        <SelectItem value="==">== (Equal to)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Threshold</Label>
                    <Input
                      type="number"
                      value={newTrigger.triggerCondition.threshold}
                      onChange={(e) =>
                        setNewTrigger({
                          ...newTrigger,
                          triggerCondition: { ...newTrigger.triggerCondition, threshold: parseInt(e.target.value) },
                        })
                      }
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newTrigger.isActive}
                  onCheckedChange={(checked) => setNewTrigger({ ...newTrigger, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Active Workflows</CardTitle>
          <CardDescription>Manage your engagement-triggered automation workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : triggers && triggers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {triggers.map((trigger: any) => (
                  <TableRow key={trigger.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{trigger.name}</p>
                        {trigger.description && (
                          <p className="text-sm text-muted-foreground">{trigger.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{trigger.triggerType.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTriggerIcon(trigger.actionType)}
                        <span className="text-sm">{trigger.actionType.replace(/_/g, " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trigger.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Paused</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{trigger.executionCount}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(trigger.id, trigger.isActive)}
                        >
                          {trigger.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(trigger.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-12">
              <Zap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No workflows created yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workflow
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Executions */}
      {executions && executions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Executions</CardTitle>
            <CardDescription>Latest workflow automation activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution: any) => (
                  <TableRow key={execution.id}>
                    <TableCell>{execution.triggerName}</TableCell>
                    <TableCell>{execution.candidateName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          execution.status === "success"
                            ? "default"
                            : execution.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {execution.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(execution.executedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
