import React from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { TrendingUp, Activity, CheckCircle, XCircle, Clock, Database, Download, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function AutomationTestingAnalytics() {
  const [exportDays, setExportDays] = React.useState(30);
  const { data: trends } = trpc.automationTesting.analytics.trends.useQuery({ days: exportDays });
  const { data: performance } = trpc.automationTesting.analytics.performance.useQuery();
  const { data: scenarioStats } = trpc.automationTesting.analytics.scenarioStats.useQuery();
  const { data: testResults } = trpc.automationTesting.analytics.testResults.useQuery({});
  const { data: recentExecutions } = trpc.automationTesting.analytics.recentExecutions.useQuery({ limit: 10 });
  const { data: overallStats } = trpc.automationTesting.analytics.overallStats.useQuery();
  const { data: exportData } = trpc.automationTesting.export.data.useQuery({ days: exportDays });
  const { data: csvData } = trpc.automationTesting.export.csv.useQuery({ days: exportDays });

  const handleExportCSV = () => {
    if (!csvData) {
      toast.error("No data available for export");
      return;
    }

    const blob = new Blob([csvData.csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvData.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const handleExportPDF = () => {
    if (!exportData) {
      toast.error("No data available for export");
      return;
    }

    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.text("Automation Testing Analytics Report", 14, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(exportData.generatedAt).toLocaleString()}`, 14, yPos);
    yPos += 5;
    doc.text(`Period: ${exportData.period}`, 14, yPos);
    yPos += 15;

    // Overall Statistics
    doc.setFontSize(14);
    doc.text("Overall Statistics", 14, yPos);
    yPos += 7;

    autoTable(doc, {
      startY: yPos,
      head: [["Metric", "Value"]],
      body: [
        ["Total Scenarios", exportData.overallStats.totalScenarios.toString()],
        ["Active Scenarios", exportData.overallStats.activeScenarios.toString()],
        ["Total Executions", exportData.overallStats.totalExecutions.toString()],
        ["Completed Executions", exportData.overallStats.completedExecutions.toString()],
        ["Failed Executions", exportData.overallStats.failedExecutions.toString()],
        ["Overall Success Rate", `${exportData.overallStats.overallSuccessRate.toFixed(2)}%`],
      ],
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Performance Metrics
    doc.setFontSize(14);
    doc.text("Performance Metrics", 14, yPos);
    yPos += 7;

    autoTable(doc, {
      startY: yPos,
      head: [["Metric", "Value"]],
      body: [
        ["Average Execution Time", `${exportData.performance.averageExecutionTime}s`],
        ["Average Candidates Generated", exportData.performance.averageCandidatesGenerated.toString()],
        ["Average Jobs Generated", exportData.performance.averageJobsGenerated.toString()],
        ["Average Applications Generated", exportData.performance.averageApplicationsGenerated.toString()],
        ["Total Tests Run", exportData.performance.totalTestsRun.toString()],
      ],
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Add new page for scenario stats
    doc.addPage();
    yPos = 20;

    doc.setFontSize(14);
    doc.text("Scenario Statistics", 14, yPos);
    yPos += 7;

    autoTable(doc, {
      startY: yPos,
      head: [["Scenario", "Type", "Executions", "Success Rate", "Avg Time (s)"]],
      body: exportData.scenarioStats.map(s => [
        s.scenarioName,
        s.scenarioType.replace(/_/g, ' '),
        s.totalExecutions.toString(),
        `${s.successRate.toFixed(1)}%`,
        s.averageExecutionTime.toString()
      ]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
    });

    // Save PDF
    doc.save(`automation-testing-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("PDF exported successfully");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const testTypeData = testResults?.testsByType
    ? Object.entries(testResults.testsByType).map(([type, stats]) => ({
        name: type.replace(/_/g, ' '),
        passed: stats.passed,
        failed: stats.failed,
        total: stats.total
      }))
    : [];

  const scenarioSuccessData = scenarioStats?.map(s => ({
    name: s.scenarioName,
    successRate: s.successRate,
    total: s.totalExecutions
  })) || [];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Automation Testing Analytics</h1>
            <p className="text-muted-foreground">
              Performance metrics and execution trends
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <FileText className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scenarios</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats?.totalScenarios || 0}</div>
              <p className="text-xs text-muted-foreground">
                {overallStats?.activeScenarios || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats?.totalExecutions || 0}</div>
              <p className="text-xs text-muted-foreground">
                {overallStats?.completedExecutions || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallStats?.overallSuccessRate.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {overallStats?.failedExecutions || 0} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance?.averageExecutionTime || 0}s
              </div>
              <p className="text-xs text-muted-foreground">
                {performance?.totalTestsRun || 0} tests run
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">Execution Trends</TabsTrigger>
            <TabsTrigger value="scenarios">Scenario Performance</TabsTrigger>
            <TabsTrigger value="tests">Test Results</TabsTrigger>
            <TabsTrigger value="recent">Recent Executions</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Execution Trends (Last 30 Days)</CardTitle>
                <CardDescription>Daily test execution activity and success rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={formatDate}
                      formatter={(value: number, name: string) => {
                        if (name === 'successRate') return `${value.toFixed(1)}%`;
                        return value;
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalExecutions" 
                      stroke="#3b82f6" 
                      name="Total Executions"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completedExecutions" 
                      stroke="#10b981" 
                      name="Completed"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="failedExecutions" 
                      stroke="#ef4444" 
                      name="Failed"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="successRate" 
                      stroke="#8b5cf6" 
                      name="Success Rate (%)"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Avg Candidates Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{performance?.averageCandidatesGenerated || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Avg Jobs Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{performance?.averageJobsGenerated || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Avg Applications Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{performance?.averageApplicationsGenerated || 0}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scenario Success Rates</CardTitle>
                <CardDescription>Performance comparison across test scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={scenarioSuccessData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="successRate" fill="#10b981" name="Success Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scenario Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scenarioStats?.map((scenario) => (
                    <div key={scenario.scenarioId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{scenario.scenarioName}</p>
                        <p className="text-sm text-muted-foreground">{scenario.scenarioType.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Executions</p>
                          <p className="font-semibold">{scenario.totalExecutions}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Success Rate</p>
                          <p className="font-semibold text-green-600">{scenario.successRate.toFixed(1)}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Avg Time</p>
                          <p className="font-semibold">{scenario.averageExecutionTime}s</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Test Results</CardTitle>
                  <CardDescription>Aggregated test pass/fail statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Passed', value: testResults?.passedTests || 0 },
                          { name: 'Failed', value: testResults?.failedTests || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-4">
                    <p className="text-2xl font-bold">{testResults?.successRate.toFixed(1) || 0}%</p>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Results by Type</CardTitle>
                  <CardDescription>Breakdown of test results by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={testTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="passed" fill="#10b981" name="Passed" />
                      <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Test Executions</CardTitle>
                <CardDescription>Latest 10 test execution results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentExecutions?.map((execution) => (
                    <div key={execution.executionId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {execution.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : execution.status === 'failed' ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium">{execution.scenarioName}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(execution.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Candidates</p>
                          <p className="font-semibold">{execution.testCandidatesCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Jobs</p>
                          <p className="font-semibold">{execution.testJobsCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Applications</p>
                          <p className="font-semibold">{execution.testApplicationsCount}</p>
                        </div>
                        {execution.executionTime && (
                          <div className="text-center">
                            <p className="text-muted-foreground">Time</p>
                            <p className="font-semibold">{execution.executionTime}s</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
