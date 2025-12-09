import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  FileDown, 
  DollarSign, 
  Briefcase, 
  Users, 
  ClipboardList,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Command Center Dashboard
 * Unified admin interface for job failure alerts, export controls, and budget management
 */

export default function CommandCenter() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Dashboard Overview
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = 
    trpc.commandCenter.getDashboardOverview.useQuery();

  // Job Failures
  const { data: jobFailures, isLoading: failuresLoading, refetch: refetchFailures } = 
    trpc.commandCenter.getJobFailures.useQuery({ limit: 10, offset: 0 });

  // Export History
  const { data: exportHistory, isLoading: exportsLoading, refetch: refetchExports } = 
    trpc.commandCenter.getExportHistory.useQuery({ limit: 10, offset: 0 });

  const { data: failedExports, refetch: refetchFailedExports } = 
    trpc.commandCenter.getFailedExports.useQuery();

  // Budget Scenarios
  const { data: budgetScenarios, isLoading: scenariosLoading, refetch: refetchScenarios } = 
    trpc.commandCenter.getBudgetScenarios.useQuery({ limit: 10, offset: 0 });

  // Budget Alerts
  const { data: budgetAlerts, isLoading: alertsLoading, refetch: refetchAlerts } = 
    trpc.commandCenter.getBudgetAlerts.useQuery({ acknowledged: false, limit: 10 });

  // Mutations
  const retryExportMutation = trpc.commandCenter.retryExport.useMutation({
    onSuccess: () => {
      toast.success("Export retry initiated");
      refetchExports();
      refetchFailedExports();
    },
    onError: (error) => {
      toast.error(`Failed to retry export: ${error.message}`);
    },
  });

  const acknowledgeBudgetAlertMutation = trpc.commandCenter.acknowledgeBudgetAlert.useMutation({
    onSuccess: () => {
      toast.success("Budget alert acknowledged");
      refetchAlerts();
      refetchOverview();
    },
    onError: (error) => {
      toast.error(`Failed to acknowledge alert: ${error.message}`);
    },
  });

  const handleRetryExport = (exportId: number) => {
    retryExportMutation.mutate({ exportId });
  };

  const handleAcknowledgeAlert = (alertId: number) => {
    acknowledgeBudgetAlertMutation.mutate({ alertId });
  };

  const handleRefreshAll = () => {
    refetchOverview();
    refetchFailures();
    refetchExports();
    refetchScenarios();
    refetchAlerts();
    toast.success("Dashboard refreshed");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Command Center</h1>
            <p className="text-muted-foreground mt-1">
              Unified dashboard for system monitoring and strategic management
            </p>
          </div>
          <Button onClick={handleRefreshAll} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overviewLoading ? "..." : overview?.activeJobs || 0}
              </div>
              <p className="text-xs text-muted-foreground">Open positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overviewLoading ? "..." : overview?.totalCandidates || 0}
              </div>
              <p className="text-xs text-muted-foreground">In pipeline</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overviewLoading ? "..." : overview?.pendingApplications || 0}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className={overview?.unresolvedFailures ? "border-destructive" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Job Failures</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {overviewLoading ? "..." : overview?.unresolvedFailures || 0}
              </div>
              <p className="text-xs text-muted-foreground">Unresolved issues</p>
            </CardContent>
          </Card>

          <Card className={overview?.pendingExports ? "border-yellow-500" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Exports</CardTitle>
              <FileDown className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {overviewLoading ? "..." : overview?.pendingExports || 0}
              </div>
              <p className="text-xs text-muted-foreground">In queue</p>
            </CardContent>
          </Card>

          <Card className={overview?.activeBudgetAlerts ? "border-orange-500" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Alerts</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {overviewLoading ? "..." : overview?.activeBudgetAlerts || 0}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="failures">
              Job Failures
              {overview?.unresolvedFailures ? (
                <Badge variant="destructive" className="ml-2">
                  {overview.unresolvedFailures}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="exports">
              Exports
              {overview?.pendingExports ? (
                <Badge variant="secondary" className="ml-2">
                  {overview.pendingExports}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="budget">
              Budget
              {overview?.activeBudgetAlerts ? (
                <Badge variant="secondary" className="ml-2">
                  {overview.activeBudgetAlerts}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Health Summary</CardTitle>
                <CardDescription>
                  Quick overview of critical system metrics and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">System Status</p>
                      <p className="text-sm text-muted-foreground">All services operational</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">Healthy</Badge>
                </div>

                {overview?.unresolvedFailures ? (
                  <div className="flex items-center justify-between p-4 border border-destructive rounded-lg bg-destructive/5">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="font-medium">Job Failures Detected</p>
                        <p className="text-sm text-muted-foreground">
                          {overview.unresolvedFailures} unresolved failure{overview.unresolvedFailures > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setSelectedTab("failures")}
                    >
                      View Details
                    </Button>
                  </div>
                ) : null}

                {overview?.activeBudgetAlerts ? (
                  <div className="flex items-center justify-between p-4 border border-orange-500 rounded-lg bg-orange-50">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">Budget Alerts Active</p>
                        <p className="text-sm text-muted-foreground">
                          {overview.activeBudgetAlerts} alert{overview.activeBudgetAlerts > 1 ? 's' : ''} require acknowledgment
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedTab("budget")}
                    >
                      Review Alerts
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job Failures Tab */}
          <TabsContent value="failures" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Job Failures</CardTitle>
                <CardDescription>
                  Monitor and manage failed background jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {failuresLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading failures...</p>
                ) : !jobFailures || jobFailures.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <p className="text-lg font-medium">No Job Failures</p>
                    <p className="text-sm text-muted-foreground">All background jobs are running smoothly</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobFailures.map((failure) => (
                      <div key={failure.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3 flex-1">
                          <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">{failure.jobName}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {failure.errorMessage || "Unknown error"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Failed at: {failure.executedAt ? new Date(failure.executedAt).toLocaleString() : "Unknown"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="destructive">Failed</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exports Tab */}
          <TabsContent value="exports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export History</CardTitle>
                <CardDescription>
                  Monitor export status and retry failed exports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {exportsLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading exports...</p>
                ) : !exportHistory || exportHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No export history</p>
                ) : (
                  <div className="space-y-3">
                    {exportHistory.map((exp) => (
                      <div key={exp.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          {exp.status === "completed" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : exp.status === "failed" ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : exp.status === "processing" ? (
                            <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-600" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{exp.fileName}</p>
                            <p className="text-sm text-muted-foreground">
                              {exp.exportType.toUpperCase()} • {exp.dataType}
                              {exp.recordCount ? ` • ${exp.recordCount} records` : ""}
                            </p>
                            {exp.errorMessage && (
                              <p className="text-sm text-destructive mt-1">{exp.errorMessage}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              exp.status === "completed" ? "default" :
                              exp.status === "failed" ? "destructive" :
                              exp.status === "processing" ? "secondary" :
                              "outline"
                            }
                          >
                            {exp.status}
                          </Badge>
                          {exp.status === "failed" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRetryExport(exp.id)}
                              disabled={retryExportMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {failedExports && failedExports.length > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Failed Exports Requiring Attention</CardTitle>
                  <CardDescription>
                    These exports failed and may need manual intervention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {failedExports.map((exp) => (
                      <div key={exp.id} className="flex items-center justify-between p-4 border border-destructive rounded-lg bg-destructive/5">
                        <div className="flex-1">
                          <p className="font-medium">{exp.fileName}</p>
                          <p className="text-sm text-muted-foreground">{exp.errorMessage || "Unknown error"}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleRetryExport(exp.id)}
                          disabled={retryExportMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry Now
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-4">
            {budgetAlerts && budgetAlerts.length > 0 && (
              <Card className="border-orange-500">
                <CardHeader>
                  <CardTitle className="text-orange-600">Active Budget Alerts</CardTitle>
                  <CardDescription>
                    Budget thresholds that require acknowledgment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {budgetAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-start justify-between p-4 border border-orange-500 rounded-lg bg-orange-50">
                        <div className="flex items-start gap-3 flex-1">
                          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">Budget Alert</p>
                              <Badge variant={
                                alert.alertLevel === "exceeded" ? "destructive" :
                                alert.alertLevel === "critical" ? "destructive" :
                                "secondary"
                              }>
                                {alert.alertLevel}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {alert.message || `${alert.percentageUsed}% of threshold used`}
                            </p>
                            <p className="text-sm mt-2">
                              <span className="font-medium">Current Spending:</span> SAR {((alert.currentSpending || 0) / 100).toFixed(2)}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Threshold:</span> SAR {((alert.thresholdAmount || 0) / 100).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          disabled={acknowledgeBudgetAlertMutation.isPending}
                        >
                          Acknowledge
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Budget Scenarios</CardTitle>
                <CardDescription>
                  Recent budget planning scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scenariosLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading scenarios...</p>
                ) : !budgetScenarios || budgetScenarios.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No budget scenarios created</p>
                ) : (
                  <div className="space-y-3">
                    {budgetScenarios.map((scenario) => (
                      <div key={scenario.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{scenario.name}</p>
                          {scenario.description && (
                            <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm">
                            <span>
                              <span className="font-medium">Budget:</span> SAR {((scenario.totalCost || 0) / 100).toFixed(2)}
                            </span>
                            <span>
                              <span className="font-medium">Recipients:</span> {scenario.totalRecipients || 0}
                            </span>
                            <span>
                              <span className="font-medium">ROI:</span> {scenario.roi || 0}%
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {scenario.roi || 0}% ROI
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
