import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Briefcase, Users, Calendar, UserPlus, TrendingUp } from "lucide-react";
import { EngagementTrendsWidget } from "@/components/EngagementTrendsWidget";
import { ABTestsWidget } from "@/components/ABTestsWidget";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Mail, Activity } from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.analytics.getDashboardMetrics.useQuery();
  const { data: campaigns } = trpc.campaigns.getAll.useQuery(
    { employerId: user?.id || 0 },
    { enabled: !!user }
  );
  
  const activeCampaigns = campaigns?.filter(c => c.status === 'active') || [];

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const metrics = [
    {
      title: "Total Jobs",
      value: stats?.totalJobs || 0,
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Jobs",
      value: stats?.activeJobs || 0,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Candidates",
      value: stats?.totalCandidates || 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "New Candidates",
      value: stats?.newCandidates || 0,
      icon: UserPlus,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Upcoming Interviews",
      value: stats?.upcomingInterviews || 0,
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user.name || user.email}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : metric.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <EngagementTrendsWidget />
          <ABTestsWidget />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Active Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{activeCampaigns.length}</div>
              <p className="text-sm text-muted-foreground mb-4">
                {campaigns?.length || 0} total campaigns
              </p>
              <Link href="/campaigns">
                <Button variant="outline" size="sm" className="w-full">
                  View All Campaigns
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/jobs/new"
                className="block p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="font-medium">Post New Job</div>
                <div className="text-sm text-muted-foreground">
                  Create a new job posting
                </div>
              </a>
              <a
                href="/candidates"
                className="block p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="font-medium">View Candidates</div>
                <div className="text-sm text-muted-foreground">
                  Browse and manage candidates
                </div>
              </a>
              <a
                href="/interviews"
                className="block p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="font-medium">Schedule Interview</div>
                <div className="text-sm text-muted-foreground">
                  Set up new interview sessions
                </div>
              </a>
              <a
                href="/campaigns/new"
                className="block p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="font-medium">Create Email Campaign</div>
                <div className="text-sm text-muted-foreground">
                  Build and launch recruitment campaigns
                </div>
              </a>
              <a
                href="/calendar"
                className="block p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="font-medium">View Calendar</div>
                <div className="text-sm text-muted-foreground">
                  Manage interview schedules
                </div>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Screening</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Notifications</span>
                <span className="text-sm font-medium text-yellow-600">Configure</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Slack Integration</span>
                <span className="text-sm font-medium text-yellow-600">Configure</span>
              </div>
              <a
                href="/settings"
                className="block text-sm text-primary hover:underline"
              >
                Go to Settings →
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
