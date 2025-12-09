import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Bell, AlertTriangle, Activity, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });

  // Fetch data
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = 
    trpc.admin.getSystemHealth.useQuery();
  
  const { data: notificationPrefs, isLoading: prefsLoading, refetch: refetchPrefs } = 
    trpc.admin.getAllNotificationPreferences.useQuery();
  
  const { data: feedbackStats, isLoading: statsLoading, refetch: refetchStats } = 
    trpc.admin.getFeedbackReminderStats.useQuery(dateRange);
  
  const { data: notificationStats, isLoading: notifStatsLoading, refetch: refetchNotifStats} = 
    trpc.admin.getNotificationStats.useQuery(dateRange);
  
  const { data: jobStatus, isLoading: jobStatusLoading, refetch: refetchJobStatus } = 
    trpc.admin.getScheduledJobStatus.useQuery();
  
  const runJobsMutation = trpc.admin.runScheduledJobs.useMutation({
    onSuccess: () => {
      toast.success("Scheduled jobs executed successfully");
      refetchStats();
      refetchJobStatus();
    },
    onError: (error) => {
      toast.error(`Failed to run jobs: ${error.message}`);
    },
  });

  const handleRefreshAll = () => {
    Promise.all([
      refetchHealth(),
      refetchPrefs(),
      refetchStats(),
      refetchNotifStats(),
    ]).then(() => {
      toast.success("Dashboard data refreshed");
    });
  };

  if (healthLoading || prefsLoading || statsLoading || notifStatsLoading || jobStatusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            System management and monitoring center
          </p>
        </div>
        <Button onClick={handleRefreshAll} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reminders</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth?.pendingReminders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Reminders</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {systemHealth?.failedReminders || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Notifications</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth?.recentNotifications || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemHealth?.pendingFeedback || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Phase 26: Quick Access Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Monitoring & Operational Integrity</CardTitle>
          <CardDescription>
            Monitor SMS costs, job executions, and export history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => window.location.href = "/admin/sms-costs"}
            >
              <Activity className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">SMS Cost Dashboard</div>
                <div className="text-xs text-muted-foreground">Track Twilio costs & usage</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => window.location.href = "/admin/job-executions"}
            >
              <RefreshCw className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Job Execution History</div>
                <div className="text-xs text-muted-foreground">Monitor automation jobs</div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => window.location.href = "/admin/export-history"}
            >
              <Bell className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Export History</div>
                <div className="text-xs text-muted-foreground">Audit data exports</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notification Preferences</TabsTrigger>
          <TabsTrigger value="reminders">Feedback Reminders</TabsTrigger>
          <TabsTrigger value="stats">Notification Stats</TabsTrigger>
          <TabsTrigger value="jobs">Scheduled Jobs</TabsTrigger>
        </TabsList>

        {/* Notification Preferences Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Notification Preferences</CardTitle>
              <CardDescription>
                Manage notification settings for all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Email Notifications</TableHead>
                    <TableHead>Push Notifications</TableHead>
                    <TableHead>SMS Notifications</TableHead>
                    <TableHead>Quiet Hours</TableHead>
                    <TableHead>Timezone</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notificationPrefs && notificationPrefs.length > 0 ? (
                    notificationPrefs.map((pref) => (
                      <TableRow key={pref.id}>
                        <TableCell className="font-medium">{pref.userName || "N/A"}</TableCell>
                        <TableCell>{pref.userEmail || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={pref.enableEmailNotifications ? "default" : "secondary"}>
                            {pref.enableEmailNotifications ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pref.enablePushNotifications ? "default" : "secondary"}>
                            {pref.enablePushNotifications ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pref.enableSmsNotifications ? "default" : "secondary"}>
                            {pref.enableSmsNotifications ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {pref.quietHoursStart && pref.quietHoursEnd
                            ? `${pref.quietHoursStart} - ${pref.quietHoursEnd}`
                            : "Not set"}
                        </TableCell>
                        <TableCell>{pref.timezone || "UTC"}</TableCell>
                        <TableCell>
                          {pref.updatedAt
                            ? format(new Date(pref.updatedAt), "MMM dd, yyyy HH:mm")
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No notification preferences found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Reminders Tab */}
        <TabsContent value="reminders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{feedbackStats?.totalReminders || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sent Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {feedbackStats?.sentReminders || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {feedbackStats?.successRate.toFixed(1) || 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reminder Statistics by Type and Status</CardTitle>
              <CardDescription>
                Breakdown of feedback reminders over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reminder Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackStats?.stats && feedbackStats.stats.length > 0 ? (
                    feedbackStats.stats.map((stat, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{stat.reminderType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              stat.status === "sent"
                                ? "default"
                                : stat.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {stat.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-lg font-semibold">{stat.count}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No reminder statistics available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reminders</CardTitle>
              <CardDescription>Latest 50 feedback reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Attempts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackStats?.recentReminders && feedbackStats.recentReminders.length > 0 ? (
                    feedbackStats.recentReminders.map((reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell className="font-mono text-sm">{reminder.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{reminder.reminderType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              reminder.status === "sent"
                                ? "default"
                                : reminder.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {reminder.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {reminder.scheduledFor
                            ? format(new Date(reminder.scheduledFor), "MMM dd, yyyy HH:mm")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {reminder.sentAt
                            ? format(new Date(reminder.sentAt), "MMM dd, yyyy HH:mm")
                            : "Not sent"}
                        </TableCell>
                        <TableCell>{reminder.attempts || 0}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No recent reminders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Delivery Statistics</CardTitle>
              <CardDescription>
                Breakdown of notifications by type and delivery method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Delivery Method</TableHead>
                    <TableHead>Total Count</TableHead>
                    <TableHead>Push Sent</TableHead>
                    <TableHead>Email Sent</TableHead>
                    <TableHead>SMS Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notificationStats && notificationStats.length > 0 ? (
                    notificationStats.map((stat, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{stat.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{stat.deliveryMethod}</Badge>
                        </TableCell>
                        <TableCell className="text-lg font-semibold">{stat.count}</TableCell>
                        <TableCell>{stat.pushSent || 0}</TableCell>
                        <TableCell>{stat.emailSent || 0}</TableCell>
                        <TableCell>{stat.smsSent || 0}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No notification statistics available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Job Runner</CardTitle>
              <CardDescription>
                Automated background tasks that run on a schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={jobStatus?.enabled ? "default" : "secondary"}>
                    {jobStatus?.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Schedule</p>
                  <p className="text-sm text-muted-foreground">{jobStatus?.schedule}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Next Run</p>
                  <p className="text-sm text-muted-foreground">
                    {jobStatus?.nextRun
                      ? format(new Date(jobStatus.nextRun), "MMM dd, yyyy HH:mm")
                      : "Not scheduled"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Time Until Next Run</p>
                  <p className="text-sm text-muted-foreground">
                    {jobStatus?.timeUntilNextRun
                      ? `${Math.round(jobStatus.timeUntilNextRun / 1000 / 60)} minutes`
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => runJobsMutation.mutate()}
                  disabled={runJobsMutation.isPending}
                >
                  {runJobsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running Jobs...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Run Jobs Manually
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configured Jobs</CardTitle>
              <CardDescription>
                List of automated tasks managed by the job runner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobStatus?.jobs && jobStatus.jobs.length > 0 ? (
                    jobStatus.jobs.map((job, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{job.name}</TableCell>
                        <TableCell>{job.description}</TableCell>
                        <TableCell>
                          <Badge variant={job.enabled ? "default" : "secondary"}>
                            {job.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No scheduled jobs configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
