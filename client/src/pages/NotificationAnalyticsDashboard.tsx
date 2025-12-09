import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
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
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, TrendingDown, Mail, Bell, MessageSquare, Eye, MousePointer, CheckCircle2 } from "lucide-react";

export default function NotificationAnalyticsDashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30");

  const { data: typePerformance = [], isLoading: typeLoading } =
    trpc.notificationAnalyticsDashboard.getTypePerformance.useQuery({
      days: parseInt(timeRange),
    });

  const { data: channelComparison = [], isLoading: channelLoading } =
    trpc.notificationAnalyticsDashboard.getChannelComparison.useQuery({
      days: parseInt(timeRange),
    });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "push":
        return <Bell className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "push":
        return "#8b5cf6"; // purple
      case "email":
        return "#3b82f6"; // blue
      case "sms":
        return "#10b981"; // green
      default:
        return "#6b7280"; // gray
    }
  };

  const formatNotificationType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Calculate overall metrics
  const overallMetrics = channelComparison.reduce(
    (acc, channel) => ({
      totalSent: acc.totalSent + Number(channel.totalSent),
      totalViewed: acc.totalViewed + Number(channel.totalViewed),
      totalClicked: acc.totalClicked + Number(channel.totalClicked),
      totalActioned: acc.totalActioned + Number(channel.totalActioned),
    }),
    { totalSent: 0, totalViewed: 0, totalClicked: 0, totalActioned: 0 }
  );

  const overallViewRate =
    overallMetrics.totalSent > 0
      ? Math.round((overallMetrics.totalViewed / overallMetrics.totalSent) * 100)
      : 0;
  const overallClickRate =
    overallMetrics.totalSent > 0
      ? Math.round((overallMetrics.totalClicked / overallMetrics.totalSent) * 100)
      : 0;
  const overallActionRate =
    overallMetrics.totalSent > 0
      ? Math.round((overallMetrics.totalActioned / overallMetrics.totalSent) * 100)
      : 0;

  // Prepare chart data
  const channelChartData = channelComparison.map((channel) => ({
    channel: channel.channel,
    viewRate: channel.viewRate,
    clickRate: channel.clickRate,
    actionRate: channel.actionRate,
  }));

  const typeChartData = typePerformance
    .slice(0, 10)
    .map((type) => ({
      type: formatNotificationType(type.notificationType),
      viewRate: type.viewRate,
      clickRate: type.clickRate,
      actionRate: type.actionRate,
      totalSent: Number(type.totalSent),
    }));

  const pieData = channelComparison.map((channel) => ({
    name: channel.channel,
    value: Number(channel.totalSent),
  }));

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track notification performance and optimize engagement
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{overallMetrics.totalSent.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>View Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{overallViewRate}%</span>
              {overallViewRate >= 50 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Click Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{overallClickRate}%</span>
              {overallClickRate >= 30 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Action Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{overallActionRate}%</span>
              {overallActionRate >= 20 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Channel Performance</CardTitle>
            <CardDescription>Compare engagement rates across channels</CardDescription>
          </CardHeader>
          <CardContent>
            {channelLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : channelChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={channelChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="viewRate" fill="#3b82f6" name="View Rate %" />
                  <Bar dataKey="clickRate" fill="#8b5cf6" name="Click Rate %" />
                  <Bar dataKey="actionRate" fill="#10b981" name="Action Rate %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel Distribution</CardTitle>
            <CardDescription>Notifications sent by channel</CardDescription>
          </CardHeader>
          <CardContent>
            {channelLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getChannelColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notification Type Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Notification Type</CardTitle>
          <CardDescription>Top performing notification types</CardDescription>
        </CardHeader>
        <CardContent>
          {typeLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : typeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={typeChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="viewRate" fill="#3b82f6" name="View Rate %" />
                <Bar dataKey="clickRate" fill="#8b5cf6" name="Click Rate %" />
                <Bar dataKey="actionRate" fill="#10b981" name="Action Rate %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Channel Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Details</CardTitle>
          <CardDescription>Detailed metrics for each notification channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channelComparison.map((channel) => (
              <div key={channel.channel} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getChannelIcon(channel.channel)}
                  <div>
                    <p className="font-medium capitalize">{channel.channel}</p>
                    <p className="text-sm text-muted-foreground">
                      {Number(channel.totalSent).toLocaleString()} notifications sent
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{channel.viewRate}%</p>
                    <p className="text-xs text-muted-foreground">View Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{channel.clickRate}%</p>
                    <p className="text-xs text-muted-foreground">Click Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{channel.actionRate}%</p>
                    <p className="text-xs text-muted-foreground">Action Rate</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>Insights to improve notification engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overallViewRate < 50 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <TrendingDown className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Low View Rate</p>
                  <p className="text-sm text-yellow-700">
                    Your overall view rate is below 50%. Consider adjusting notification timing or
                    improving notification titles to increase visibility.
                  </p>
                </div>
              </div>
            )}
            {overallClickRate < 30 && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <MousePointer className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Low Click Rate</p>
                  <p className="text-sm text-blue-700">
                    Your click rate is below 30%. Try making notification content more actionable
                    and include clear calls-to-action.
                  </p>
                </div>
              </div>
            )}
            {channelComparison.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Channel Optimization</p>
                  <p className="text-sm text-green-700">
                    {channelComparison.sort((a, b) => b.actionRate - a.actionRate)[0]?.channel}{" "}
                    notifications have the highest action rate. Consider prioritizing this channel
                    for important updates.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
