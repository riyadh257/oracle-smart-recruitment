import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Calendar, Clock, X, RefreshCw, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function ScheduledNotifications() {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("queued");

  const { data: notifications, isLoading, refetch } = trpc.scheduledNotifications.list.useQuery({
    status: selectedStatus as any,
    limit: 100,
  });

  const { data: stats } = trpc.scheduledNotifications.getStats.useQuery();
  const { data: templates } = trpc.notificationTemplates.list.useQuery();

  const scheduleMutation = trpc.scheduledNotifications.schedule.useMutation({
    onSuccess: () => {
      toast.success("Notification scheduled successfully");
      setIsScheduleDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to schedule notification: ${error.message}`);
    },
  });

  const cancelMutation = trpc.scheduledNotifications.cancel.useMutation({
    onSuccess: () => {
      toast.success("Notification cancelled");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to cancel notification: ${error.message}`);
    },
  });

  const rescheduleMutation = trpc.scheduledNotifications.reschedule.useMutation({
    onSuccess: () => {
      toast.success("Notification rescheduled");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to reschedule: ${error.message}`);
    },
  });

  const handleCancel = (id: number) => {
    if (confirm("Are you sure you want to cancel this scheduled notification?")) {
      cancelMutation.mutate({ id });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      queued: "bg-blue-100 text-blue-800",
      processing: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-100 text-gray-600",
      medium: "bg-blue-100 text-blue-600",
      high: "bg-orange-100 text-orange-600",
      urgent: "bg-red-100 text-red-600",
    };
    return colors[priority] || "bg-gray-100 text-gray-600";
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading scheduled notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduled Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Queue notifications for future delivery at optimal engagement times
          </p>
        </div>
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Notification</DialogTitle>
              <DialogDescription>
                Create a notification to be sent at a specific time or optimal engagement window
              </DialogDescription>
            </DialogHeader>
            <ScheduleForm
              onSubmit={(data) => scheduleMutation.mutate(data)}
              templates={templates || []}
              isSubmitting={scheduleMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Queued</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.queued}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <X className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <X className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs by Status */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="space-y-4">
        <TabsList>
          <TabsTrigger value="queued">Queued</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {['queued', 'processing', 'sent', 'failed', 'cancelled'].map((status) => (
          <TabsContent key={status} value={status}>
            <NotificationList
              notifications={(notifications || []).filter((n: any) => n.status === status)}
              onCancel={handleCancel}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function NotificationList({
  notifications,
  onCancel,
  getStatusColor,
  getPriorityColor,
}: any) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No notifications found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification: any) => (
        <Card key={notification.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{notification.title}</CardTitle>
                  <Badge className={getStatusColor(notification.status)}>
                    {notification.status}
                  </Badge>
                  <Badge className={getPriorityColor(notification.priority)}>
                    {notification.priority}
                  </Badge>
                </div>
                <CardDescription>
                  Type: {notification.type.replace(/_/g, ' ')} • Channel: {notification.deliveryMethod}
                </CardDescription>
              </div>
              {notification.status === 'queued' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancel(notification.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Message:</p>
              <p className="text-sm mt-1">{notification.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Scheduled For:</p>
                <p className="flex items-center gap-1 mt-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(notification.scheduledFor), 'PPp')}
                </p>
              </div>
              {notification.optimalSendTime === 1 && (
                <div>
                  <Badge variant="outline" className="mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Optimal Time
                  </Badge>
                </div>
              )}
            </div>
            {notification.userSegment && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Target Segment:</p>
                <Badge variant="secondary" className="mt-1">
                  {notification.userSegment.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}
            {notification.attempts > 0 && (
              <div className="text-xs text-muted-foreground">
                Attempts: {notification.attempts}
                {notification.lastAttemptAt && ` • Last attempt: ${format(new Date(notification.lastAttemptAt), 'PPp')}`}
              </div>
            )}
            {notification.errorMessage && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                Error: {notification.errorMessage}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ScheduleForm({ onSubmit, templates, isSubmitting }: any) {
  const [formData, setFormData] = useState({
    userId: 1, // This should be dynamic based on selected user/segment
    templateId: undefined as number | undefined,
    type: "general" as any,
    title: "",
    message: "",
    actionUrl: "",
    priority: "medium" as any,
    deliveryMethod: "push" as any,
    scheduledFor: "",
    optimalSendTime: false,
    userSegment: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === "none") {
      setFormData({ ...formData, templateId: undefined });
      return;
    }
    
    const template = templates.find((t: any) => t.id === parseInt(templateId));
    if (template) {
      setFormData({
        ...formData,
        templateId: template.id,
        type: template.type,
        title: template.name,
        message: template.bodyTemplate,
        deliveryMethod: template.channel,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="template">Use Template (Optional)</Label>
        <Select onValueChange={handleTemplateSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Template</SelectItem>
            {templates.map((template: any) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                {template.name} ({template.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interview_reminder">Interview Reminder</SelectItem>
              <SelectItem value="feedback_request">Feedback Request</SelectItem>
              <SelectItem value="candidate_response">Candidate Response</SelectItem>
              <SelectItem value="engagement_alert">Engagement Alert</SelectItem>
              <SelectItem value="ab_test_result">A/B Test Result</SelectItem>
              <SelectItem value="system_update">System Update</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority *</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliveryMethod">Delivery Method *</Label>
        <Select
          value={formData.deliveryMethod}
          onValueChange={(value) => setFormData({ ...formData, deliveryMethod: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="push">Push Notification</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="push_email">Push + Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={5}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="actionUrl">Action URL (Optional)</Label>
        <Input
          id="actionUrl"
          type="url"
          value={formData.actionUrl}
          onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduledFor">Scheduled Date & Time *</Label>
        <Input
          id="scheduledFor"
          type="datetime-local"
          value={formData.scheduledFor}
          onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="optimalSendTime"
          checked={formData.optimalSendTime}
          onCheckedChange={(checked) => 
            setFormData({ ...formData, optimalSendTime: checked as boolean })
          }
        />
        <Label htmlFor="optimalSendTime" className="cursor-pointer">
          Adjust to optimal send time based on historical engagement data
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="userSegment">User Segment (Optional)</Label>
        <Input
          id="userSegment"
          value={formData.userSegment}
          onChange={(e) => setFormData({ ...formData, userSegment: e.target.value })}
          placeholder="e.g., active_candidates, hiring_managers"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Scheduling..." : "Schedule Notification"}
        </Button>
      </div>
    </form>
  );
}
