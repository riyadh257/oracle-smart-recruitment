import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function ScheduledReports() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [formData, setFormData] = useState({
    reportName: "",
    reportType: "compliance_summary",
    schedule: "weekly",
    scheduleDay: 1,
    scheduleTime: "09:00",
    recipients: "",
    isActive: true,
  });

  const { data: reports, isLoading, refetch } = trpc.scheduledReports.list.useQuery({});

  const createMutation = trpc.scheduledReports.create.useMutation({
    onSuccess: () => {
      toast.success("Scheduled report created successfully");
      setCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create report: ${error.message}`);
    },
  });

  const updateMutation = trpc.scheduledReports.update.useMutation({
    onSuccess: () => {
      toast.success("Scheduled report updated successfully");
      setEditDialogOpen(false);
      setSelectedReport(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update report: ${error.message}`);
    },
  });

  const deleteMutation = trpc.scheduledReports.delete.useMutation({
    onSuccess: () => {
      toast.success("Scheduled report deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete report: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      reportName: "",
      reportType: "compliance_summary",
      schedule: "weekly",
      scheduleDay: 1,
      scheduleTime: "09:00",
      recipients: "",
      isActive: true,
    });
  };

  const handleCreate = () => {
    const recipients = formData.recipients
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email);

    if (recipients.length === 0) {
      toast.error("Please enter at least one recipient email");
      return;
    }

    createMutation.mutate({
      reportName: formData.reportName,
      reportType: formData.reportType as any,
      schedule: formData.schedule as any,
      scheduleDay: formData.scheduleDay,
      scheduleTime: formData.scheduleTime,
      recipients,
    });
  };

  const handleUpdate = () => {
    if (!selectedReport) return;

    const recipients = formData.recipients
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email);

    updateMutation.mutate({
      id: selectedReport.id,
      reportName: formData.reportName,
      reportType: formData.reportType as any,
      schedule: formData.schedule as any,
      scheduleDay: formData.scheduleDay,
      scheduleTime: formData.scheduleTime,
      recipients,
      isActive: formData.isActive,
    });
  };

  const handleEdit = (report: any) => {
    setSelectedReport(report);
    setFormData({
      reportName: report.reportName,
      reportType: report.reportType,
      schedule: report.schedule,
      scheduleDay: report.scheduleDay || 1,
      scheduleTime: report.scheduleTime || "09:00",
      recipients: Array.isArray(report.recipients) ? report.recipients.join(", ") : "",
      isActive: report.isActive === 1,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this scheduled report?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getScheduleBadge = (schedule: string) => {
    const variants: Record<string, string> = {
      daily: "default",
      weekly: "secondary",
      monthly: "outline",
      quarterly: "outline",
    };

    return (
      <Badge variant={variants[schedule] as any}>
        <Calendar className="h-3 w-3 mr-1" />
        {schedule}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduled Reports</h1>
          <p className="text-muted-foreground mt-2">
            Automate compliance and analytics report delivery to management
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Reports</CardTitle>
          <CardDescription>
            Manage automated report generation and email delivery schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No scheduled reports</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first automated report to get started
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.reportName}</TableCell>
                      <TableCell className="capitalize">
                        {report.reportType.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>{getScheduleBadge(report.schedule)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {Array.isArray(report.recipients) ? report.recipients.length : 0}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {report.nextRunAt
                          ? format(new Date(report.nextRunAt), "MMM dd, yyyy HH:mm")
                          : "Not scheduled"}
                      </TableCell>
                      <TableCell>
                        {report.isActive ? (
                          <Badge variant="default">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(report)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(report.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setSelectedReport(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editDialogOpen ? "Edit Scheduled Report" : "Create Scheduled Report"}
            </DialogTitle>
            <DialogDescription>
              Configure automated report generation and email delivery
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                value={formData.reportName}
                onChange={(e) => setFormData({ ...formData, reportName: e.target.value })}
                placeholder="Weekly Compliance Summary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select
                  value={formData.reportType}
                  onValueChange={(value) => setFormData({ ...formData, reportType: value })}
                >
                  <SelectTrigger id="report-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compliance_summary">Compliance Summary</SelectItem>
                    <SelectItem value="analytics_dashboard">Analytics Dashboard</SelectItem>
                    <SelectItem value="ksa_labor_law">KSA Labor Law</SelectItem>
                    <SelectItem value="nitaqat_status">Nitaqat Status</SelectItem>
                    <SelectItem value="candidate_pipeline">Candidate Pipeline</SelectItem>
                    <SelectItem value="interview_feedback">Interview Feedback</SelectItem>
                    <SelectItem value="engagement_metrics">Engagement Metrics</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule</Label>
                <Select
                  value={formData.schedule}
                  onValueChange={(value) => setFormData({ ...formData, schedule: value })}
                >
                  <SelectTrigger id="schedule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {formData.schedule === "weekly" && (
                <div className="space-y-2">
                  <Label htmlFor="schedule-day">Day of Week</Label>
                  <Select
                    value={String(formData.scheduleDay)}
                    onValueChange={(value) =>
                      setFormData({ ...formData, scheduleDay: Number(value) })
                    }
                  >
                    <SelectTrigger id="schedule-day">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                      <SelectItem value="7">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.schedule === "monthly" && (
                <div className="space-y-2">
                  <Label htmlFor="schedule-day">Day of Month</Label>
                  <Input
                    id="schedule-day"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.scheduleDay}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduleDay: Number(e.target.value) })
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time (HH:MM)</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={formData.scheduleTime}
                  onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
              <Input
                id="recipients"
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                placeholder="manager@company.com, hr@company.com"
              />
            </div>

            {editDialogOpen && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="is-active">Active</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
                setSelectedReport(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editDialogOpen ? handleUpdate : handleCreate}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editDialogOpen ? "Update Report" : "Create Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
