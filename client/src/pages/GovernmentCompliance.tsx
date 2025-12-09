import { GovernmentSyncStatus } from "@/components/GovernmentSyncStatus";
import { WorkPermitManagement } from "@/components/WorkPermitManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { FileText, Plus, Download } from "lucide-react";

export default function GovernmentCompliance() {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportData, setReportData] = useState({
    reportType: "monthly",
    reportPeriodStart: "",
    reportPeriodEnd: "",
    submittedTo: "mhrsd",
    notes: "",
  });

  const { data: reports, refetch } = trpc.compliance.getComplianceReports.useQuery();

  const createReportMutation = trpc.compliance.createComplianceReport.useMutation({
    onSuccess: () => {
      toast.success("Compliance report created successfully");
      setShowReportDialog(false);
      setReportData({
        reportType: "monthly",
        reportPeriodStart: "",
        reportPeriodEnd: "",
        submittedTo: "mhrsd",
        notes: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create report");
    },
  });

  const submitReportMutation = trpc.compliance.submitComplianceReport.useMutation({
    onSuccess: () => {
      toast.success("Report submitted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit report");
    },
  });

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();

    createReportMutation.mutate({
      reportType: reportData.reportType as any,
      reportPeriodStart: new Date(reportData.reportPeriodStart),
      reportPeriodEnd: new Date(reportData.reportPeriodEnd),
      submittedTo: reportData.submittedTo as any,
      notes: reportData.notes || undefined,
    });
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending_review":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Government Compliance</h1>
          <p className="text-gray-600">
            Manage MHRSD/Qiwa integrations, work permits, and compliance reporting
          </p>
        </div>

        {/* Sync Status Widget */}
        <GovernmentSyncStatus />

        {/* Work Permits Widget */}
        <WorkPermitManagement />

        {/* Compliance Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Compliance Reports</CardTitle>
                <CardDescription>Submit and track government compliance reports</CardDescription>
              </div>
              <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Compliance Report</DialogTitle>
                    <DialogDescription>Generate a new compliance report</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateReport} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reportType">Report Type *</Label>
                      <Select
                        value={reportData.reportType}
                        onValueChange={(value) =>
                          setReportData((prev) => ({ ...prev, reportType: value }))
                        }
                      >
                        <SelectTrigger id="reportType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="audit">Audit</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reportPeriodStart">Period Start *</Label>
                        <Input
                          id="reportPeriodStart"
                          type="date"
                          required
                          value={reportData.reportPeriodStart}
                          onChange={(e) =>
                            setReportData((prev) => ({
                              ...prev,
                              reportPeriodStart: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reportPeriodEnd">Period End *</Label>
                        <Input
                          id="reportPeriodEnd"
                          type="date"
                          required
                          value={reportData.reportPeriodEnd}
                          onChange={(e) =>
                            setReportData((prev) => ({ ...prev, reportPeriodEnd: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="submittedTo">Submit To *</Label>
                      <Select
                        value={reportData.submittedTo}
                        onValueChange={(value) =>
                          setReportData((prev) => ({ ...prev, submittedTo: value }))
                        }
                      >
                        <SelectTrigger id="submittedTo">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mhrsd">MHRSD</SelectItem>
                          <SelectItem value="qiwa">Qiwa</SelectItem>
                          <SelectItem value="mudad">Mudad</SelectItem>
                          <SelectItem value="gosi">GOSI</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={reportData.notes}
                        onChange={(e) =>
                          setReportData((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={createReportMutation.isPending}
                        className="flex-1"
                      >
                        {createReportMutation.isPending ? "Creating..." : "Create Report"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowReportDialog(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {reports && reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">
                          {report.reportType.replace("_", " ")} Report
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getReportStatusColor(report.submissionStatus)}`}>
                          {report.submissionStatus.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Period: {new Date(report.reportPeriodStart).toLocaleDateString()} -{" "}
                        {new Date(report.reportPeriodEnd).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submit to: {report.submittedTo.toUpperCase()}
                      </p>
                      {report.referenceNumber && (
                        <p className="text-sm text-muted-foreground">
                          Ref: {report.referenceNumber}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {report.submissionStatus === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => submitReportMutation.mutate({ id: report.id })}
                          disabled={submitReportMutation.isPending}
                        >
                          Submit
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No compliance reports found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Create Report" to generate your first compliance report
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
