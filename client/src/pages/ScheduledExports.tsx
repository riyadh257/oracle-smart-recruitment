import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Mail,
  Play,
  Plus,
  Settings,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ExportFormData {
  name: string;
  description: string;
  exportTemplate: "candidates" | "interviews" | "feedback" | "analytics" | "campaigns" | "jobs" | "applications" | "custom";
  exportFormat: "csv" | "pdf" | "excel";
  schedule: "daily" | "weekly" | "monthly" | "custom";
  cronExpression: string;
  timezone: string;
  emailRecipients: string[];
  emailSubject: string;
  emailBody: string;
  includeAttachment: boolean;
}

export default function ScheduledExports() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedExportId, setSelectedExportId] = useState<number | null>(null);
  const [showRunHistory, setShowRunHistory] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [formData, setFormData] = useState<ExportFormData>({
    name: "",
    description: "",
    exportTemplate: "candidates",
    exportFormat: "csv",
    schedule: "weekly",
    cronExpression: "0 9 * * 1",
    timezone: "Asia/Riyadh",
    emailRecipients: [],
    emailSubject: "",
    emailBody: "",
    includeAttachment: true,
  });

  const utils = trpc.useUtils();

  // Queries
  const { data: exports, isLoading: loadingExports } =
    trpc.scheduledExports.getAll.useQuery();
  const { data: stats } = trpc.scheduledExports.getStats.useQuery();
  const { data: runHistory } = trpc.scheduledExports.getRuns.useQuery(
    { scheduledExportId: selectedExportId!, limit: 50 },
    { enabled: !!selectedExportId && showRunHistory }
  );

  // Mutations
  const createExport = trpc.scheduledExports.create.useMutation({
    onSuccess: () => {
      toast.success("Scheduled export created successfully");
      setIsCreateDialogOpen(false);
      utils.scheduledExports.getAll.invalidate();
      utils.scheduledExports.getStats.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create export: ${error.message}`);
    },
  });

  const deleteExport = trpc.scheduledExports.delete.useMutation({
    onSuccess: () => {
      toast.success("Scheduled export deleted");
      utils.scheduledExports.getAll.invalidate();
      utils.scheduledExports.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete export: ${error.message}`);
    },
  });

  const triggerManual = trpc.scheduledExports.triggerManual.useMutation({
    onSuccess: () => {
      toast.success("Export triggered successfully");
      utils.scheduledExports.getRuns.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to trigger export: ${error.message}`);
    },
  });

  const toggleActive = trpc.scheduledExports.update.useMutation({
    onSuccess: () => {
      toast.success("Export status updated");
      utils.scheduledExports.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update export: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      exportTemplate: "candidates",
      exportFormat: "csv",
      schedule: "weekly",
      cronExpression: "0 9 * * 1",
      timezone: "Asia/Riyadh",
      emailRecipients: [],
      emailSubject: "",
      emailBody: "",
      includeAttachment: true,
    });
    setEmailInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExport.mutate(formData);
  };

  const handleAddEmail = () => {
    if (emailInput && emailInput.includes("@")) {
      setFormData((prev) => ({
        ...prev,
        emailRecipients: [...prev.emailRecipients, emailInput],
      }));
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter((e) => e !== email),
    }));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
      failed: "destructive",
      pending: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString();
  };

  if (loadingExports) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading scheduled exports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduled Exports</h1>
          <p className="text-muted-foreground mt-2">
            Automate recurring reports with email delivery
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Export Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Scheduled Export</DialogTitle>
                <DialogDescription>
                  Set up a recurring export with automated email delivery
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Export Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Weekly Candidate Report"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of this export"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="exportTemplate">Template</Label>
                    <Select
                      value={formData.exportTemplate}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, exportTemplate: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="candidates">Candidates</SelectItem>
                        <SelectItem value="interviews">Interviews</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="campaigns">Campaigns</SelectItem>
                        <SelectItem value="jobs">Jobs</SelectItem>
                        <SelectItem value="applications">Applications</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="exportFormat">Format</Label>
                    <Select
                      value={formData.exportFormat}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, exportFormat: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="schedule">Schedule</Label>
                    <Select
                      value={formData.schedule}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, schedule: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom (Cron)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) =>
                        setFormData({ ...formData, timezone: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Riyadh">Asia/Riyadh (KSA)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.schedule === "custom" && (
                  <div className="grid gap-2">
                    <Label htmlFor="cronExpression">Cron Expression</Label>
                    <Input
                      id="cronExpression"
                      value={formData.cronExpression}
                      onChange={(e) =>
                        setFormData({ ...formData, cronExpression: e.target.value })
                      }
                      placeholder="0 9 * * 1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: minute hour day month weekday (e.g., "0 9 * * 1" = Every Monday at 9 AM)
                    </p>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Email Recipients</Label>
                  <div className="flex gap-2">
                    <Input
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="email@example.com"
                      type="email"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddEmail();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddEmail} variant="outline">
                      Add
                    </Button>
                  </div>
                  {formData.emailRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.emailRecipients.map((email) => (
                        <Badge key={email} variant="secondary" className="gap-1">
                          {email}
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="emailSubject">Email Subject</Label>
                  <Input
                    id="emailSubject"
                    value={formData.emailSubject}
                    onChange={(e) =>
                      setFormData({ ...formData, emailSubject: e.target.value })
                    }
                    placeholder="Scheduled Report: {export_name}"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="emailBody">Email Body</Label>
                  <Textarea
                    id="emailBody"
                    value={formData.emailBody}
                    onChange={(e) =>
                      setFormData({ ...formData, emailBody: e.target.value })
                    }
                    placeholder="Your scheduled export is ready..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeAttachment"
                    checked={formData.includeAttachment}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, includeAttachment: checked })
                    }
                  />
                  <Label htmlFor="includeAttachment" className="font-normal">
                    Include file as email attachment
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createExport.isPending}>
                  {createExport.isPending ? "Creating..." : "Create Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.active || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRuns || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalRuns
                ? Math.round((stats.totalSuccesses / stats.totalRuns) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalSuccesses || 0} successful
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Failed Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFailures || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Exports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Export Schedules</CardTitle>
          <CardDescription>
            Manage your automated recurring exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!exports || exports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scheduled exports configured. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exportConfig) => (
                  <TableRow key={exportConfig.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{exportConfig.name}</div>
                        {exportConfig.description && (
                          <div className="text-xs text-muted-foreground">
                            {exportConfig.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {exportConfig.exportTemplate} ({exportConfig.exportFormat})
                    </TableCell>
                    <TableCell className="capitalize">
                      {exportConfig.schedule}
                    </TableCell>
                    <TableCell>{formatDate(exportConfig.nextRunAt)}</TableCell>
                    <TableCell>
                      <div>
                        <div>{formatDate(exportConfig.lastRunAt)}</div>
                        {exportConfig.lastRunStatus && (
                          <div className="mt-1">
                            {getStatusBadge(exportConfig.lastRunStatus)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={exportConfig.isActive === 1}
                          onCheckedChange={(checked) => {
                            toggleActive.mutate({
                              id: exportConfig.id,
                              isActive: checked ? 1 : 0,
                            });
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {exportConfig.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedExportId(exportConfig.id);
                            setShowRunHistory(true);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            triggerManual.mutate({ id: exportConfig.id });
                          }}
                          disabled={triggerManual.isPending}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to delete "${exportConfig.name}"?`
                              )
                            ) {
                              deleteExport.mutate({ id: exportConfig.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Run History Dialog */}
      <Dialog open={showRunHistory} onOpenChange={setShowRunHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Run History</DialogTitle>
            <DialogDescription>
              View execution history for this scheduled export
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!runHistory || runHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No run history available
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Started</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Emails Sent</TableHead>
                    <TableHead>File</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runHistory.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>{formatDate(run.startedAt)}</TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                      <TableCell>
                        {run.processingTime
                          ? `${Math.round(run.processingTime / 1000)}s`
                          : "N/A"}
                      </TableCell>
                      <TableCell>{run.recordCount || 0}</TableCell>
                      <TableCell>{run.emailsSent || 0}</TableCell>
                      <TableCell>
                        {run.fileUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(run.fileUrl!, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
