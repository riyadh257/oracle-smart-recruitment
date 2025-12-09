import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Mail, Clock, Eye } from "lucide-react";
import { toast } from "sonner";

export default function NotificationAnalytics() {
  const [timeRange, setTimeRange] = useState("30");
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedChannel, setSelectedChannel] = useState<string | undefined>(undefined);
  const [selectedSegment, setSelectedSegment] = useState<string | undefined>(undefined);
  const [selectedCampaign, setSelectedCampaign] = useState<string | undefined>(undefined);

  const { data: summary, isLoading: summaryLoading } = trpc.notificationAnalytics.getSummary.useQuery({
    days: parseInt(timeRange),
  });

  const { data: detailed, isLoading: detailedLoading } = trpc.notificationAnalytics.getDetailed.useQuery({
    notificationType: selectedType as any,
  });

  // Get unique segments and campaigns for filters
  const { data: campaigns } = trpc.emailCampaigns.list.useQuery();
  const uniqueSegments = ['all_users', 'active_candidates', 'interviewers', 'hiring_managers'];

  const formatNotificationType = (type: string) => {
    return type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      feedback_submitted: "bg-blue-500",
      interview_scheduled: "bg-green-500",
      candidate_status_change: "bg-yellow-500",
      digest: "bg-purple-500",
    };
    return colors[type] || "bg-gray-500";
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Notification Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track notification volume, engagement, and response times
            </p>
          </div>

          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Refine analytics by notification type, channel, user segment, or campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notification Type</label>
                <Select value={selectedType || "all"} onValueChange={(v) => setSelectedType(v === "all" ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="interview_reminder">Interview Reminder</SelectItem>
                    <SelectItem value="feedback_request">Feedback Request</SelectItem>
                    <SelectItem value="candidate_response">Candidate Response</SelectItem>
                    <SelectItem value="engagement_alert">Engagement Alert</SelectItem>
                    <SelectItem value="ab_test_result">A/B Test Result</SelectItem>
                    <SelectItem value="system_update">System Update</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Channel</label>
                <Select value={selectedChannel || "all"} onValueChange={(v) => setSelectedChannel(v === "all" ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="push">Push Notification</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">User Segment</label>
                <Select value={selectedSegment || "all"} onValueChange={(v) => setSelectedSegment(v === "all" ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All segments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    {uniqueSegments.map((segment) => (
                      <SelectItem key={segment} value={segment}>
                        {segment.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign</label>
                <Select value={selectedCampaign || "all"} onValueChange={(v) => setSelectedCampaign(v === "all" ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaigns?.map((campaign: any) => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedType || selectedChannel || selectedSegment || selectedCampaign) && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {[selectedType, selectedChannel, selectedSegment, selectedCampaign].filter(Boolean).length} filter(s) applied
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedType(undefined);
                    setSelectedChannel(undefined);
                    setSelectedSegment(undefined);
                    setSelectedCampaign(undefined);
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {summaryLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : summary ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalNotifications}</div>
                  <p className="text-xs text-muted-foreground">
                    Last {summary.periodDays} days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Digest Open Rate</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.digestOpenRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Email engagement
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary.averageResponseTimeMinutes !== null
                      ? `${summary.averageResponseTimeMinutes}m`
                      : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    To feedback requests
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Notification Types</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.keys(summary.byType).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active categories
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Notifications by Type</CardTitle>
                <CardDescription>
                  Breakdown of notification volume by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(summary.byType).map(([type, data]) => {
                    const total = summary.totalNotifications;
                    const percentage = total > 0 ? Math.round((data.count / total) * 100) : 0;
                    
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {formatNotificationType(type)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {data.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getTypeColor(type)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Detailed Analytics</CardTitle>
                    <CardDescription>
                      Daily breakdown of notification activity
                    </CardDescription>
                  </div>
                  <Select
                    value={selectedType || "all"}
                    onValueChange={(value) => setSelectedType(value === "all" ? undefined : value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="feedback_submitted">Feedback Submitted</SelectItem>
                      <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                      <SelectItem value="candidate_status_change">Status Change</SelectItem>
                      <SelectItem value="digest">Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {detailedLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : detailed && detailed.length > 0 ? (
                  <div className="space-y-2">
                    {detailed.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getTypeColor(item.notificationType)}`} />
                          <div>
                            <p className="font-medium">
                              {formatNotificationType(item.notificationType)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.count} notifications</p>
                          {item.averageResponseTimeMinutes && (
                            <p className="text-sm text-muted-foreground">
                              Avg: {item.averageResponseTimeMinutes}m response
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No detailed analytics available for the selected period
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.digestOpenRate < 50 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="font-medium text-yellow-900">Low Digest Open Rate</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your digest open rate is below 50%. Consider adjusting email timing or content to improve engagement.
                      </p>
                    </div>
                  )}
                  
                  {summary.averageResponseTimeMinutes && summary.averageResponseTimeMinutes > 120 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-900">Slow Response Time</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Average response time is over 2 hours. Consider enabling immediate notifications for urgent items.
                      </p>
                    </div>
                  )}
                  
                  {summary.totalNotifications > 50 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-900">High Activity</p>
                      <p className="text-sm text-green-700 mt-1">
                        You're actively managing {summary.totalNotifications} notifications. Great job staying engaged!
                      </p>
                    </div>
                  )}
                  
                  {Object.keys(summary.byType).length === 0 && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900">No Activity</p>
                      <p className="text-sm text-gray-700 mt-1">
                        No notifications in the selected period. Check your notification preferences to ensure you're receiving updates.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No analytics data available
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
