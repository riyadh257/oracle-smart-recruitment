import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Shield, AlertTriangle, Info, CheckCircle, Clock, FileText, XCircle, Download, Bell, Mail } from "lucide-react";

type AlertSeverity = "info" | "warning" | "critical";
type AlertType = "nitaqat_drop" | "permit_expiry" | "labor_law_violation" | "probation_ending" | "contract_expiry";
type AcknowledgmentStatus = "all" | "acknowledged" | "unacknowledged";

interface ComplianceAlert {
  id: number;
  employerId: number;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, any>;
  createdAt: Date;
  acknowledged: boolean;
}

export default function ComplianceAlertsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">("all");
  const [typeFilter, setTypeFilter] = useState<AlertType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AcknowledgmentStatus>("all");

  // Get employer ID from user
  const { data: employer } = trpc.employer.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user }
  );

  const { data: alerts, isLoading, refetch } = trpc.complianceAlerts.getAlerts.useQuery(
    { employerId: employer?.id || 0 },
    { enabled: !!employer }
  );

  const acknowledgeAlert = trpc.complianceAlerts.acknowledge.useMutation({
    onSuccess: () => {
      toast.success("Alert acknowledged");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to acknowledge alert: ${error.message}`);
    },
  });

  const runChecks = trpc.complianceAlerts.runChecks.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Compliance check complete: ${result.totalAlerts} alerts (${result.criticalAlerts} critical, ${result.warningAlerts} warnings)`
      );
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to run compliance checks: ${error.message}`);
    },
  });

  const sendTestAlert = trpc.complianceAlerts.sendTestAlert.useMutation({
    onSuccess: () => {
      toast.success("Test alert email sent successfully");
    },
    onError: (error) => {
      toast.error(`Failed to send test alert: ${error.message}`);
    },
  });

  const runManualCheck = trpc.complianceAlerts.runManualCheck.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Compliance check completed: ${data.alertsFound} alerts found, ${data.emailsSent} emails sent`
      );
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to run compliance check: ${error.message}`);
    },
  });

  const generatePdfReport = trpc.complianceAlerts.generatePdfReport.useMutation({
    onSuccess: (data) => {
      toast.success(`PDF report generated: ${data.fileName}`);
      // Trigger download
      window.open(`/reports/${data.fileName}`, "_blank");
    },
    onError: (error) => {
      toast.error(`Failed to generate PDF report: ${error.message}`);
    },
  });

  const generateExcelReport = trpc.complianceAlerts.generateExcelReport.useMutation({
    onSuccess: (data) => {
      toast.success(`Excel report generated: ${data.fileName}`);
      // Trigger download
      window.open(`/reports/${data.fileName}`, "_blank");
    },
    onError: (error) => {
      toast.error(`Failed to generate Excel report: ${error.message}`);
    },
  });

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Please log in to access compliance alerts.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!employer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Employer profile not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Filter alerts
  const filteredAlerts = (alerts || []).filter((alert) => {
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
    if (typeFilter !== "all" && alert.alertType !== typeFilter) return false;
    if (statusFilter === "acknowledged" && !alert.acknowledged) return false;
    if (statusFilter === "unacknowledged" && alert.acknowledged) return false;
    return true;
  });

  // Count alerts by severity
  const criticalCount = (alerts || []).filter((a) => a.severity === "critical" && !a.acknowledged).length;
  const warningCount = (alerts || []).filter((a) => a.severity === "warning" && !a.acknowledged).length;
  const infoCount = (alerts || []).filter((a) => a.severity === "info" && !a.acknowledged).length;

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    const variants: Record<AlertSeverity, "destructive" | "default" | "secondary"> = {
      critical: "destructive",
      warning: "default",
      info: "secondary",
    };
    return (
      <Badge variant={variants[severity]} className="capitalize">
        {severity}
      </Badge>
    );
  };

  const getAlertTypeLabel = (type: AlertType) => {
    const labels: Record<AlertType, string> = {
      nitaqat_drop: "Nitaqat Band Drop",
      permit_expiry: "Work Permit Expiry",
      labor_law_violation: "Labor Law Violation",
      probation_ending: "Probation Ending",
      contract_expiry: "Contract Expiry",
    };
    return labels[type] || type;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Compliance Alerts
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage compliance alerts for your organization
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (user?.email) {
                  sendTestAlert.mutate({
                    employerId: employer.id,
                    recipientEmail: user.email,
                  });
                }
              }}
              disabled={sendTestAlert.isPending || !user?.email}
            >
              {sendTestAlert.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Test Email
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                runManualCheck.mutate({ checkType: "daily" });
              }}
              disabled={runManualCheck.isPending}
            >
              {runManualCheck.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Send Alerts
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                generatePdfReport.mutate({ employerId: employer.id });
              }}
              disabled={generatePdfReport.isPending}
            >
              {generatePdfReport.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  PDF Report
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                generateExcelReport.mutate({ employerId: employer.id });
              }}
              disabled={generateExcelReport.isPending}
            >
              {generateExcelReport.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Excel Report
                </>
              )}
            </Button>
            <Button
              onClick={() => runChecks.mutate({ employerId: employer.id })}
              disabled={runChecks.isPending}
            >
              {runChecks.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                "Run Checks"
              )}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Warning Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{warningCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Need attention soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Info Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{infoCount}</div>
              <p className="text-xs text-muted-foreground mt-1">For your awareness</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Alerts</CardTitle>
            <CardDescription>Narrow down alerts by severity, type, and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Severity</label>
                <Select
                  value={severityFilter}
                  onValueChange={(value: AlertSeverity | "all") => setSeverityFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Alert Type</label>
                <Select
                  value={typeFilter}
                  onValueChange={(value: AlertType | "all") => setTypeFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="nitaqat_drop">Nitaqat Band Drop</SelectItem>
                    <SelectItem value="permit_expiry">Work Permit Expiry</SelectItem>
                    <SelectItem value="labor_law_violation">Labor Law Violation</SelectItem>
                    <SelectItem value="probation_ending">Probation Ending</SelectItem>
                    <SelectItem value="contract_expiry">Contract Expiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: AcknowledgmentStatus) => setStatusFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Alerts</SelectItem>
                    <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                <p className="text-lg font-medium">No alerts found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {alerts && alerts.length > 0
                    ? "Try adjusting your filters"
                    : "All compliance checks are passing"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card key={alert.id} className={alert.acknowledged ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          {getSeverityBadge(alert.severity)}
                          <Badge variant="outline">{getAlertTypeLabel(alert.alertType)}</Badge>
                          {alert.acknowledged && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-2">{alert.message}</CardDescription>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert.mutate({ alertId: alert.id })}
                        disabled={acknowledgeAlert.isPending}
                      >
                        {acknowledgeAlert.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Acknowledge"
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
