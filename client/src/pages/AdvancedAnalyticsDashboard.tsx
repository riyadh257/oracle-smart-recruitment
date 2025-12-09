import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Download, TrendingUp, AlertCircle, Mail, Database, FileText } from "lucide-react";
import { format, subDays } from "date-fns";
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
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function AdvancedAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [dataType, setDataType] = useState<"all" | "imports" | "audits" | "reports">("all");

  // Fetch analytics data (placeholder - will be implemented in backend)
  const { data: analytics, isLoading } = trpc.analytics.getAdvancedMetrics.useQuery(
    {
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
      dataType,
    },
    {
      // Use placeholder data for now
      enabled: false,
    }
  );

  // Sample data for demonstration
  const importTrendsData = [
    { date: "2024-01-01", started: 45, completed: 42, failed: 3, records: 1250 },
    { date: "2024-01-02", started: 52, completed: 50, failed: 2, records: 1480 },
    { date: "2024-01-03", started: 38, completed: 36, failed: 2, records: 980 },
    { date: "2024-01-04", started: 61, completed: 58, failed: 3, records: 1720 },
    { date: "2024-01-05", started: 55, completed: 53, failed: 2, records: 1590 },
    { date: "2024-01-06", started: 48, completed: 47, failed: 1, records: 1380 },
    { date: "2024-01-07", started: 42, completed: 40, failed: 2, records: 1150 },
  ];

  const auditActivityData = [
    { hour: "00:00", events: 12, changes: 8, violations: 1 },
    { hour: "04:00", events: 8, changes: 5, violations: 0 },
    { hour: "08:00", events: 45, changes: 32, violations: 3 },
    { hour: "12:00", events: 68, changes: 51, violations: 5 },
    { hour: "16:00", events: 52, changes: 38, violations: 2 },
    { hour: "20:00", events: 28, changes: 19, violations: 1 },
  ];

  const reportDeliveryData = [
    { name: "Delivered", value: 856, color: "#10b981" },
    { name: "Failed", value: 24, color: "#ef4444" },
    { name: "Pending", value: 12, color: "#f59e0b" },
  ];

  const summaryStats = {
    totalImports: 341,
    successRate: 96.5,
    totalAuditEvents: 2134,
    complianceViolations: 12,
    reportsDelivered: 856,
    avgDeliveryTime: 2.3,
  };

  const handleExport = (format: "csv" | "pdf") => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-muted-foreground">Loading analytics...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="w-8 h-8" />
              Advanced Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Unified analytics for import trends, audit activity patterns, and report delivery metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
            <Select value={dataType} onValueChange={(value: any) => setDataType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Data</SelectItem>
                <SelectItem value="imports">Imports Only</SelectItem>
                <SelectItem value="audits">Audits Only</SelectItem>
                <SelectItem value="reports">Reports Only</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Imports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                <div className="text-2xl font-bold">{summaryStats.totalImports}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <div className="text-2xl font-bold">{summaryStats.successRate}%</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Audit Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                <div className="text-2xl font-bold">{summaryStats.totalAuditEvents}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Violations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <div className="text-2xl font-bold">{summaryStats.complianceViolations}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reports Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                <div className="text-2xl font-bold">{summaryStats.reportsDelivered}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.avgDeliveryTime}s</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="imports" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="imports">Import Trends</TabsTrigger>
            <TabsTrigger value="audits">Audit Activity</TabsTrigger>
            <TabsTrigger value="reports">Report Delivery</TabsTrigger>
          </TabsList>

          <TabsContent value="imports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Trends Over Time</CardTitle>
                <CardDescription>
                  Track import operations, success rates, and record volumes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={importTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="completed"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      name="Completed"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="failed"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      name="Failed"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="records"
                      stroke="#3b82f6"
                      name="Records Imported"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Activity Patterns</CardTitle>
                <CardDescription>
                  Hourly distribution of audit events, changes, and violations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={auditActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="events" fill="#8b5cf6" name="Audit Events" />
                    <Bar dataKey="changes" fill="#3b82f6" name="Data Changes" />
                    <Bar dataKey="violations" fill="#ef4444" name="Violations" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Report Delivery Success Rates</CardTitle>
                  <CardDescription>
                    Distribution of report delivery statuses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportDeliveryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportDeliveryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery Performance</CardTitle>
                  <CardDescription>
                    Key metrics for report delivery
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Successfully Delivered</div>
                      <div className="text-2xl font-bold text-green-600">856</div>
                    </div>
                    <div className="text-3xl">✓</div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Failed Deliveries</div>
                      <div className="text-2xl font-bold text-red-600">24</div>
                    </div>
                    <div className="text-3xl">✗</div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                      <div className="text-2xl font-bold text-amber-600">12</div>
                    </div>
                    <div className="text-3xl">⏳</div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Average Delivery Time</div>
                      <div className="text-2xl font-bold text-blue-600">2.3s</div>
                    </div>
                    <div className="text-3xl">⚡</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
