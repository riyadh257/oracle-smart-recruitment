import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  "proposal-sent": "bg-purple-100 text-purple-800",
  negotiation: "bg-orange-100 text-orange-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-red-100 text-red-800"
};

const activityIcons: Record<string, any> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: Edit,
  task: CheckCircle2,
  proposal: DollarSign
};

export default function CrmLeadDetail() {
  const params = useParams();
  const leadId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [isEditingLead, setIsEditingLead] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  const { data: lead, isLoading } = trpc.crm.getLeadById.useQuery({ id: leadId });
  const { data: activities } = trpc.crm.getActivitiesByLeadId.useQuery({ leadId });

  const updateLeadMutation = trpc.crm.updateLead.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully");
      utils.crm.getLeadById.invalidate({ id: leadId });
      setIsEditingLead(false);
    },
    onError: (error) => {
      toast.error("Failed to update lead: " + error.message);
    }
  });

  const createActivityMutation = trpc.crm.createActivity.useMutation({
    onSuccess: () => {
      toast.success("Activity added successfully");
      utils.crm.getActivitiesByLeadId.invalidate({ leadId });
      setIsAddingActivity(false);
    },
    onError: (error) => {
      toast.error("Failed to add activity: " + error.message);
    }
  });

  const updateActivityMutation = trpc.crm.updateActivity.useMutation({
    onSuccess: () => {
      toast.success("Activity updated successfully");
      utils.crm.getActivitiesByLeadId.invalidate({ leadId });
    },
    onError: (error) => {
      toast.error("Failed to update activity: " + error.message);
    }
  });

  const [editForm, setEditForm] = useState({
    status: "",
    priority: "",
    estimatedValue: "",
    nextFollowUpAt: "",
    notes: ""
  });

  const [activityForm, setActivityForm] = useState({
    type: "note" as "call" | "email" | "meeting" | "note" | "task" | "proposal",
    subject: "",
    description: "",
    outcome: "",
    scheduledAt: "",
    status: "pending" as "pending" | "completed" | "cancelled"
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Lead not found</h1>
        <Button onClick={() => setLocation("/crm/leads")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leads
        </Button>
      </div>
    );
  }

  const handleUpdateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: any = {};
    if (editForm.status) updates.status = editForm.status;
    if (editForm.priority) updates.priority = editForm.priority;
    if (editForm.estimatedValue) updates.estimatedValue = parseInt(editForm.estimatedValue);
    if (editForm.nextFollowUpAt) updates.nextFollowUpAt = new Date(editForm.nextFollowUpAt);
    if (editForm.notes) updates.notes = editForm.notes;

    updateLeadMutation.mutate({ id: leadId, data: updates });
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    createActivityMutation.mutate({
      leadId,
      type: activityForm.type,
      subject: activityForm.subject,
      description: activityForm.description || undefined,
      outcome: activityForm.outcome || undefined,
      scheduledAt: activityForm.scheduledAt ? new Date(activityForm.scheduledAt) : undefined,
      createdBy: user?.id || 1,
      status: activityForm.status
    });
  };

  const handleCompleteActivity = (activityId: number) => {
    updateActivityMutation.mutate({
      id: activityId,
      data: {
        status: "completed",
        completedAt: new Date()
      }
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => setLocation("/crm/leads")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{lead.companyName}</h1>
          <p className="text-muted-foreground">{lead.contactName}</p>
        </div>
        <Badge className={statusColors[lead.status]}>
          {lead.status.replace("-", " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lead Information</CardTitle>
              <Dialog open={isEditingLead} onOpenChange={setIsEditingLead}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Lead</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateLead} className="space-y-4">
                    <div>
                      <Label>Status</Label>
                      <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="proposal-sent">Proposal Sent</SelectItem>
                          <SelectItem value="negotiation">Negotiation</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Estimated Value ($)</Label>
                      <Input
                        type="number"
                        value={editForm.estimatedValue}
                        onChange={(e) => setEditForm({ ...editForm, estimatedValue: e.target.value })}
                        placeholder="Enter estimated value"
                      />
                    </div>
                    <div>
                      <Label>Next Follow-up Date</Label>
                      <Input
                        type="datetime-local"
                        value={editForm.nextFollowUpAt}
                        onChange={(e) => setEditForm({ ...editForm, nextFollowUpAt: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        placeholder="Add notes..."
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditingLead(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateLeadMutation.isPending}>
                        {updateLeadMutation.isPending ? "Updating..." : "Update Lead"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{lead.contactName}</p>
                  {lead.position && <p className="text-sm text-muted-foreground">{lead.position}</p>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company Size</p>
                  <p className="font-medium">{lead.companySize || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {lead.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {lead.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {lead.industry || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="font-medium">{lead.source || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Value</p>
                  <p className="font-medium text-green-600">
                    {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Close Date</p>
                  <p className="font-medium">
                    {lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
              {lead.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activities Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activity Timeline</CardTitle>
              <Dialog open={isAddingActivity} onOpenChange={setIsAddingActivity}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Activity</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddActivity} className="space-y-4">
                    <div>
                      <Label>Type</Label>
                      <Select value={activityForm.type} onValueChange={(v: any) => setActivityForm({ ...activityForm, type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Input
                        required
                        value={activityForm.subject}
                        onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                        placeholder="Activity subject"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={activityForm.description}
                        onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                        placeholder="Activity details..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Outcome</Label>
                      <Input
                        value={activityForm.outcome}
                        onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
                        placeholder="Result or outcome"
                      />
                    </div>
                    <div>
                      <Label>Scheduled Date/Time</Label>
                      <Input
                        type="datetime-local"
                        value={activityForm.scheduledAt}
                        onChange={(e) => setActivityForm({ ...activityForm, scheduledAt: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddingActivity(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createActivityMutation.isPending}>
                        {createActivityMutation.isPending ? "Adding..." : "Add Activity"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const Icon = activityIcons[activity.type];
                    return (
                      <div key={activity.id} className="flex gap-4 border-l-2 border-muted pl-4 pb-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`p-2 rounded-full ${
                            activity.status === "completed" ? "bg-green-100" :
                            activity.status === "cancelled" ? "bg-red-100" :
                            "bg-blue-100"
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{activity.subject}</h4>
                              <p className="text-sm text-muted-foreground capitalize">
                                {activity.type} • {formatDate(activity.createdAt)}
                              </p>
                            </div>
                            {activity.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteActivity(activity.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                          {activity.description && (
                            <p className="text-sm mt-2">{activity.description}</p>
                          )}
                          {activity.outcome && (
                            <p className="text-sm mt-2 text-green-600">
                              <strong>Outcome:</strong> {activity.outcome}
                            </p>
                          )}
                          {activity.scheduledAt && (
                            <p className="text-sm mt-1 text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Scheduled: {formatDate(activity.scheduledAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No activities yet. Add your first activity to track interactions.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button className="w-full" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Log Call
              </Button>
              <Button className="w-full" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Priority</p>
                <Badge className={`${
                  lead.priority === "urgent" ? "bg-red-100 text-red-800" :
                  lead.priority === "high" ? "bg-orange-100 text-orange-800" :
                  lead.priority === "medium" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-800"
                } mt-1`}>
                  {lead.priority}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Next Follow-up</p>
                <p className="font-medium mt-1">
                  {lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt) : "Not scheduled"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Contacted</p>
                <p className="font-medium mt-1">
                  {lead.lastContactedAt ? formatDate(lead.lastContactedAt) : "Never"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium mt-1">{formatDate(lead.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
