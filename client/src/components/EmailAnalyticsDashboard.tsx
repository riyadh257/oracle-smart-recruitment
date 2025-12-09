import { useState } from "react";
import { trpc } from "@/lib/trpc";
import BenchmarkComparison from "@/components/BenchmarkComparison";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, MousePointerClick, Eye, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function EmailAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [selectedEmailType, setSelectedEmailType] = useState("custom");
  const [sectorId, setSectorId] = useState("general");
  const [companySizeId, setCompanySizeId] = useState("medium");
  const { data: stats, isLoading } = trpc.emailAnalytics.getStats.useQuery();
  const { data: sectors } = trpc.benchmarks.getSectors.useQuery();
  const { data: companySizes } = trpc.benchmarks.getCompanySizes.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No email analytics data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Mock data for time series - in production, this would come from the API
  const timeSeriesData = [
    { date: "Mon", sent: 45, opened: 32, clicked: 18 },
    { date: "Tue", sent: 52, opened: 38, clicked: 22 },
    { date: "Wed", sent: 48, opened: 35, clicked: 20 },
    { date: "Thu", sent: 61, opened: 44, clicked: 26 },
    { date: "Fri", sent: 55, opened: 40, clicked: 24 },
    { date: "Sat", sent: 38, opened: 28, clicked: 15 },
    { date: "Sun", sent: 42, opened: 30, clicked: 17 },
  ];

  // Mock data for email type distribution
  const emailTypeData = [
    { name: "Interview Invites", value: 35 },
    { name: "Application Confirmations", value: 28 },
    { name: "Job Matches", value: 22 },
    { name: "Status Updates", value: 15 },
  ];

  // Mock data for template performance
  const templatePerformanceData = [
    { template: "Interview Invite V1", openRate: 68, clickRate: 42 },
    { template: "Application Received", openRate: 72, clickRate: 38 },
    { template: "Job Match Alert", openRate: 65, clickRate: 45 },
    { template: "Interview Reminder", openRate: 78, clickRate: 52 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Analytics</h2>
          <p className="text-muted-foreground">
            Track email performance and engagement metrics
          </p>
        </div>
        <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDelivered || 0} delivered ({stats.deliveryRate?.toFixed(1) || 0}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalOpened || 0} opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clickRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalClicked || 0} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.deliveryRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDelivered || 0} of {stats.totalSent || 0} delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Industry Benchmark Comparison</CardTitle>
          <CardDescription>
            See how your email performance compares to industry averages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="space-y-2">
              <Label>Email Type</Label>
              <Select value={selectedEmailType} onValueChange={setSelectedEmailType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interview_invite">Interview Invite</SelectItem>
                  <SelectItem value="interview_reminder">Interview Reminder</SelectItem>
                  <SelectItem value="application_received">Application Received</SelectItem>
                  <SelectItem value="job_match">Job Match</SelectItem>
                  <SelectItem value="rejection">Rejection</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Industry Sector</Label>
              <Select value={sectorId} onValueChange={setSectorId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sectors?.map((sector: any) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Company Size</Label>
              <Select value={companySizeId} onValueChange={setCompanySizeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companySizes?.map((size: any) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <BenchmarkComparison 
            emailType={selectedEmailType}
            openRate={stats?.openRate || 0}
            clickRate={stats?.clickRate || 0}
            sectorId={sectorId}
            companySizeId={companySizeId}
          />
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="templates">Template Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Engagement Over Time</CardTitle>
              <CardDescription>
                Track sent, opened, and clicked emails over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Sent"
                  />
                  <Line
                    type="monotone"
                    dataKey="opened"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Opened"
                  />
                  <Line
                    type="monotone"
                    dataKey="clicked"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="Clicked"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Type Distribution</CardTitle>
              <CardDescription>
                Breakdown of emails sent by type
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={emailTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {emailTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Performance Comparison</CardTitle>
              <CardDescription>
                Compare open and click rates across different email templates
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={templatePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="template" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="openRate" fill="#3B82F6" name="Open Rate %" />
                  <Bar dataKey="clickRate" fill="#10B981" name="Click Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
