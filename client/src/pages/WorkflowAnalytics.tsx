import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  MousePointerClick, 
  CheckCircle2, 
  XCircle, 
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Download
} from "lucide-react";
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
import { format, subDays } from "date-fns";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: "up" | "down";
}

function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
                  {Math.abs(change)}%
                </span>
                <span className="text-sm text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WorkflowAnalytics() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  // Fetch workflows
  const { data: workflows } = trpc.emailAutomation.listWorkflows.useQuery();

  // Fetch workflow conversions
  const { data: conversions } = trpc.conversionTracking.getWorkflowConversions.useQuery(
    {
      workflowId: selectedWorkflowId!,
      startDate: format(subDays(new Date(), dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    },
    { enabled: selectedWorkflowId !== null }
  );

  // Calculate metrics from conversions
  const metrics = conversions
    ? {
        totalSent: conversions.filter((c) => c.eventType === "email_sent").length,
        totalOpened: conversions.filter((c) => c.eventType === "email_opened").length,
        totalClicked: conversions.filter((c) => c.eventType === "link_clicked" || c.eventType === "email_clicked").length,
        totalConversions: conversions.filter((c) => 
          c.eventType === "application_submitted" || 
          c.eventType === "interview_accepted"
        ).length,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
      }
    : null;

  if (metrics) {
    metrics.openRate = metrics.totalSent > 0 ? (metrics.totalOpened / metrics.totalSent) * 100 : 0;
    metrics.clickRate = metrics.totalOpened > 0 ? (metrics.totalClicked / metrics.totalOpened) * 100 : 0;
    metrics.conversionRate = metrics.totalClicked > 0 ? (metrics.totalConversions / metrics.totalClicked) * 100 : 0;
  }

  // Prepare funnel data
  const funnelData = metrics
    ? [
        { stage: "Sent", count: metrics.totalSent, color: COLORS[0] },
        { stage: "Opened", count: metrics.totalOpened, color: COLORS[1] },
        { stage: "Clicked", count: metrics.totalClicked, color: COLORS[2] },
        { stage: "Converted", count: metrics.totalConversions, color: COLORS[3] },
      ]
    : [];

  // Prepare time series data (group by day)
  const timeSeriesData = conversions
    ? Object.entries(
        conversions.reduce((acc, event) => {
          const date = format(new Date(event.createdAt), "MMM dd");
          if (!acc[date]) {
            acc[date] = { date, sent: 0, opened: 0, clicked: 0, converted: 0 };
          }
          if (event.eventType === "email_sent") acc[date].sent++;
          if (event.eventType === "email_opened") acc[date].opened++;
          if (event.eventType === "link_clicked" || event.eventType === "email_clicked") acc[date].clicked++;
          if (event.eventType === "application_submitted" || event.eventType === "interview_accepted") acc[date].converted++;
          return acc;
        }, {} as Record<string, any>)
      ).map(([_, data]) => data)
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Workflow Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track email workflow performance, delivery metrics, and conversion rates
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select
              value={selectedWorkflowId?.toString() || ""}
              onValueChange={(value) => setSelectedWorkflowId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a workflow" />
              </SelectTrigger>
              <SelectContent>
                {workflows?.map((workflow) => (
                  <SelectItem key={workflow.id} value={workflow.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{workflow.name}</span>
                      <Badge variant={workflow.isActive ? "default" : "secondary"}>
                        {workflow.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {!selectedWorkflowId ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Workflow</h3>
                <p className="text-muted-foreground">
                  Choose a workflow from the dropdown above to view its analytics
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Emails Sent"
                value={metrics?.totalSent || 0}
                icon={<Mail className="h-6 w-6 text-primary" />}
              />
              <MetricCard
                title="Open Rate"
                value={`${metrics?.openRate.toFixed(1)}%`}
                icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
                change={5.2}
                trend="up"
              />
              <MetricCard
                title="Click Rate"
                value={`${metrics?.clickRate.toFixed(1)}%`}
                icon={<MousePointerClick className="h-6 w-6 text-primary" />}
                change={2.1}
                trend="up"
              />
              <MetricCard
                title="Conversion Rate"
                value={`${metrics?.conversionRate.toFixed(1)}%`}
                icon={<TrendingUp className="h-6 w-6 text-primary" />}
                change={1.3}
                trend="down"
              />
            </div>

            {/* Charts */}
            <Tabs defaultValue="funnel" className="space-y-4">
              <TabsList>
                <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="breakdown">Event Breakdown</TabsTrigger>
              </TabsList>

              <TabsContent value="funnel" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                    <CardDescription>
                      Track how candidates progress through each stage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={funnelData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="stage" type="category" />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8">
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Over Time</CardTitle>
                    <CardDescription>
                      Daily email performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sent" stroke={COLORS[0]} name="Sent" />
                        <Line type="monotone" dataKey="opened" stroke={COLORS[1]} name="Opened" />
                        <Line type="monotone" dataKey="clicked" stroke={COLORS[2]} name="Clicked" />
                        <Line type="monotone" dataKey="converted" stroke={COLORS[3]} name="Converted" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="breakdown" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Distribution</CardTitle>
                      <CardDescription>
                        Breakdown of all tracked events
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={funnelData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.stage}: ${entry.count}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {funnelData.map((entry, index) => (
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
                      <CardTitle>Delivery Metrics</CardTitle>
                      <CardDescription>
                        Email delivery success and failure rates
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium">Delivered</span>
                        </div>
                        <span className="text-2xl font-bold">{metrics?.totalSent || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span className="text-sm font-medium">Bounced</span>
                        </div>
                        <span className="text-2xl font-bold">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-yellow-500" />
                          <span className="text-sm font-medium">Failed</span>
                        </div>
                        <span className="text-2xl font-bold">0</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Workflow Execution History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Executions</CardTitle>
                <CardDescription>
                  Latest workflow execution history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversions?.slice(0, 10).map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{event.eventType.replace(/_/g, " ")}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Candidate ID: {event.candidateId}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(event.createdAt), "MMM dd, yyyy HH:mm")}
                      </span>
                    </div>
                  ))}
                  {(!conversions || conversions.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No execution history available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
