import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Clock, Filter, TrendingUp, AlertTriangle } from "lucide-react";

interface RuleFormData {
  ruleName: string;
  notificationType: "feedback_submitted" | "interview_scheduled" | "candidate_status_change" | "digest";
  isActive: boolean;
  timeBasedBoost: boolean;
  hoursBeforeEvent?: number;
  candidateStageFilter: string[];
  jobDepartmentFilter: string[];
  hiringManagerFilter: number[];
  priorityBoost?: number;
  forcePriority?: "critical" | "high" | "medium" | "low";
  executionOrder?: number;
}

const defaultFormData: RuleFormData = {
  ruleName: "",
  notificationType: "interview_scheduled",
  isActive: true,
  timeBasedBoost: false,
  candidateStageFilter: [],
  jobDepartmentFilter: [],
  hiringManagerFilter: [],
};

export default function AdvancedPriorityRules() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(defaultFormData);

  const { data: rules, isLoading, refetch } = trpc.advancedPriority.getRules.useQuery();
  const createMutation = trpc.advancedPriority.create.useMutation();
  const updateMutation = trpc.advancedPriority.update.useMutation();
  const deleteMutation = trpc.advancedPriority.delete.useMutation();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Priority rule created successfully");
      setDialogOpen(false);
      setFormData(defaultFormData);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create rule");
    }
  };

  const handleUpdate = async () => {
    if (!editingRule) return;
    
    try {
      await updateMutation.mutateAsync({ id: editingRule, ...formData });
      toast.success("Priority rule updated successfully");
      setDialogOpen(false);
      setEditingRule(null);
      setFormData(defaultFormData);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update rule");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Priority rule deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete rule");
    }
  };

  const openEditDialog = (rule: any) => {
    setEditingRule(rule.id);
    setFormData({
      ruleName: rule.ruleName,
      notificationType: rule.notificationType,
      isActive: rule.isActive,
      timeBasedBoost: rule.timeBasedBoost,
      hoursBeforeEvent: rule.hoursBeforeEvent || undefined,
      candidateStageFilter: rule.candidateStageFilter || [],
      jobDepartmentFilter: rule.jobDepartmentFilter || [],
      hiringManagerFilter: rule.hiringManagerFilter || [],
      priorityBoost: rule.priorityBoost || undefined,
      forcePriority: rule.forcePriority || undefined,
      executionOrder: rule.executionOrder || undefined,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Advanced Priority Rules</h1>
          <p className="text-muted-foreground">
            Create custom rules for time-based priority adjustments and conditional filtering
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      {/* Rule Templates */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quick Templates
          </CardTitle>
          <CardDescription>
            Common rule patterns you can use as starting points
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="p-3 bg-white rounded-lg border">
            <h4 className="font-medium mb-1">Interview Reminder (24h)</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Boost priority for interviews within 24 hours
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormData({
                  ...defaultFormData,
                  ruleName: "Interview Reminder (24h)",
                  notificationType: "interview_scheduled",
                  timeBasedBoost: true,
                  hoursBeforeEvent: 24,
                  priorityBoost: 30,
                  forcePriority: "high",
                });
                setDialogOpen(true);
              }}
            >
              Use Template
            </Button>
          </div>

          <div className="p-3 bg-white rounded-lg border">
            <h4 className="font-medium mb-1">Executive Candidates</h4>
            <p className="text-sm text-muted-foreground mb-2">
              High priority for executive-level candidates
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormData({
                  ...defaultFormData,
                  ruleName: "Executive Candidates",
                  notificationType: "candidate_status_change",
                  candidateStageFilter: ["Final Interview", "Offer"],
                  priorityBoost: 40,
                  forcePriority: "critical",
                });
                setDialogOpen(true);
              }}
            >
              Use Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      {!rules || rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Priority Rules</h3>
            <p className="text-muted-foreground mb-4">
              Create custom rules to automatically adjust notification priorities based on time, candidate stage, or department.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={!rule.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{rule.ruleName}</CardTitle>
                      {!rule.isActive && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="space-y-2">
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <Badge variant="secondary">
                          {rule.notificationType.replace(/_/g, " ")}
                        </Badge>
                        
                        {rule.timeBasedBoost && rule.hoursBeforeEvent && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Clock className="w-4 h-4" />
                            {rule.hoursBeforeEvent}h before event
                          </span>
                        )}
                        
                        {rule.priorityBoost && (
                          <span className="flex items-center gap-1 text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            +{rule.priorityBoost} boost
                          </span>
                        )}
                        
                        {rule.forcePriority && (
                          <Badge className={
                            rule.forcePriority === "critical" ? "bg-red-100 text-red-800" :
                            rule.forcePriority === "high" ? "bg-orange-100 text-orange-800" :
                            rule.forcePriority === "medium" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }>
                            Force: {rule.forcePriority}
                          </Badge>
                        )}
                      </div>
                      
                      {(rule.candidateStageFilter?.length > 0 ||
                        rule.jobDepartmentFilter?.length > 0 ||
                        rule.hiringManagerFilter?.length > 0) && (
                        <div className="text-xs text-muted-foreground flex items-start gap-1 mt-2">
                          <Filter className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>
                            Filters:{" "}
                            {rule.candidateStageFilter?.length > 0 && `Stages (${rule.candidateStageFilter.length})`}
                            {rule.jobDepartmentFilter?.length > 0 && `, Departments (${rule.jobDepartmentFilter.length})`}
                            {rule.hiringManagerFilter?.length > 0 && `, Managers (${rule.hiringManagerFilter.length})`}
                          </span>
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(rule)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Priority Rule" : "Create Priority Rule"}
            </DialogTitle>
            <DialogDescription>
              Configure custom rules to automatically adjust notification priorities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Rule Name */}
            <div className="space-y-2">
              <Label htmlFor="ruleName">Rule Name *</Label>
              <Input
                id="ruleName"
                value={formData.ruleName}
                onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                placeholder="e.g., Interview Reminder (24h)"
              />
            </div>

            {/* Notification Type */}
            <div className="space-y-2">
              <Label htmlFor="notificationType">Notification Type *</Label>
              <Select
                value={formData.notificationType}
                onValueChange={(value: any) => setFormData({ ...formData, notificationType: value })}
              >
                <SelectTrigger id="notificationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feedback_submitted">Feedback Submitted</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="candidate_status_change">Candidate Status Change</SelectItem>
                  <SelectItem value="digest">Digest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Rule Active</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            {/* Time-Based Boost */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="timeBasedBoost" className="font-medium">Time-Based Priority Boost</Label>
                  <p className="text-sm text-muted-foreground">
                    Increase priority as event time approaches
                  </p>
                </div>
                <Switch
                  id="timeBasedBoost"
                  checked={formData.timeBasedBoost}
                  onCheckedChange={(checked) => setFormData({ ...formData, timeBasedBoost: checked })}
                />
              </div>

              {formData.timeBasedBoost && (
                <div className="space-y-2">
                  <Label htmlFor="hoursBeforeEvent">Hours Before Event</Label>
                  <Input
                    id="hoursBeforeEvent"
                    type="number"
                    value={formData.hoursBeforeEvent || ""}
                    onChange={(e) => setFormData({ ...formData, hoursBeforeEvent: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 24"
                  />
                  <p className="text-xs text-muted-foreground">
                    Boost priority when within this many hours of the event
                  </p>
                </div>
              )}
            </div>

            {/* Priority Adjustment */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priorityBoost">Priority Boost Points</Label>
                <Input
                  id="priorityBoost"
                  type="number"
                  value={formData.priorityBoost || ""}
                  onChange={(e) => setFormData({ ...formData, priorityBoost: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 30"
                />
                <p className="text-xs text-muted-foreground">
                  Add points to engagement score (0-100)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="forcePriority">Force Priority Level</Label>
                <Select
                  value={formData.forcePriority || "none"}
                  onValueChange={(value) => setFormData({ ...formData, forcePriority: value === "none" ? undefined : value as any })}
                >
                  <SelectTrigger id="forcePriority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Override</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Execution Order */}
            <div className="space-y-2">
              <Label htmlFor="executionOrder">Execution Order</Label>
              <Input
                id="executionOrder"
                type="number"
                value={formData.executionOrder || ""}
                onChange={(e) => setFormData({ ...formData, executionOrder: parseInt(e.target.value) || undefined })}
                placeholder="e.g., 1"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers execute first (optional)
              </p>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Advanced Feature</p>
                <p>
                  Priority rules are evaluated in execution order. Multiple rules can apply to the same notification.
                  Test your rules carefully to ensure expected behavior.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingRule ? handleUpdate : handleCreate}
              disabled={!formData.ruleName || createMutation.isPending || updateMutation.isPending}
            >
              {editingRule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
