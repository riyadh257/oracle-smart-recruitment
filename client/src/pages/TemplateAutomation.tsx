import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Play, Zap } from "lucide-react";

export default function TemplateAutomation() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<any>(null);

  const employerId = 1; // TODO: Get from auth context

  const { data: triggers, refetch: refetchTriggers } = trpc.templateAutomation.getTriggers.useQuery({ employerId });
  const { data: templates } = trpc.templateLibrary.getTemplatesByCategory.useQuery({});

  const createMutation = trpc.templateAutomation.createTrigger.useMutation({
    onSuccess: () => {
      toast.success("Automation trigger created successfully");
      setIsCreateDialogOpen(false);
      refetchTriggers();
    },
  });

  const updateMutation = trpc.templateAutomation.updateTrigger.useMutation({
    onSuccess: () => {
      toast.success("Trigger updated successfully");
      setEditingTrigger(null);
      refetchTriggers();
    },
  });

  const deleteMutation = trpc.templateAutomation.deleteTrigger.useMutation({
    onSuccess: () => {
      toast.success("Trigger deleted successfully");
      refetchTriggers();
    },
  });

  const handleCreateTrigger = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createMutation.mutate({
      employerId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      eventType: formData.get("eventType") as any,
      templateId: parseInt(formData.get("templateId") as string),
      isActive: formData.get("isActive") === "on",
      delayMinutes: parseInt(formData.get("delayMinutes") as string) || 0,
    });
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      application_received: "Application Received",
      interview_scheduled: "Interview Scheduled",
      interview_completed: "Interview Completed",
      offer_extended: "Offer Extended",
      offer_accepted: "Offer Accepted",
      offer_rejected: "Offer Rejected",
      candidate_registered: "Candidate Registered",
    };
    return labels[eventType] || eventType;
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Template Automation</h1>
          <p className="text-muted-foreground mt-2">
            Automatically send email templates based on candidate actions and events
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Trigger
        </Button>
      </div>

      {/* Triggers List */}
      <div className="grid grid-cols-1 gap-4">
        {triggers?.map((trigger) => (
          <Card key={trigger.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{trigger.name}</CardTitle>
                    {trigger.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                  {trigger.description && (
                    <CardDescription className="mt-2">{trigger.description}</CardDescription>
                  )}
                </div>
                <Zap className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Event Type</p>
                    <p className="font-medium">{getEventTypeLabel(trigger.eventType)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Delay</p>
                    <p className="font-medium">
                      {trigger.delayMinutes > 0 ? `${trigger.delayMinutes} minutes` : "Immediate"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Times Triggered</p>
                    <p className="font-medium">{trigger.timesTriggered}</p>
                  </div>
                </div>
                {trigger.lastTriggeredAt && (
                  <p className="text-xs text-muted-foreground">
                    Last triggered: {new Date(trigger.lastTriggeredAt).toLocaleString()}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingTrigger(trigger)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm("Delete this trigger?")) {
                        deleteMutation.mutate({ id: trigger.id });
                      }
                    }}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Trigger Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Automation Trigger</DialogTitle>
            <DialogDescription>
              Automatically send email templates when specific events occur
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTrigger}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Trigger Name</Label>
                <Input id="name" name="name" required placeholder="e.g., Welcome New Applicants" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={2} />
              </div>
              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <Select name="eventType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application_received">Application Received</SelectItem>
                    <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="interview_completed">Interview Completed</SelectItem>
                    <SelectItem value="offer_extended">Offer Extended</SelectItem>
                    <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                    <SelectItem value="offer_rejected">Offer Rejected</SelectItem>
                    <SelectItem value="candidate_registered">Candidate Registered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="templateId">Email Template</Label>
                <Select name="templateId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="delayMinutes">Delay (minutes)</Label>
                <Input
                  id="delayMinutes"
                  name="delayMinutes"
                  type="number"
                  min="0"
                  defaultValue="0"
                  placeholder="0 for immediate"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isActive" name="isActive" defaultChecked />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Trigger"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
