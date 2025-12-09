import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Users, UserCheck, Briefcase, Target, BarChart3 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

export default function TalentPoolAnalytics() {
  const { user } = useAuth();
  const [employerId, setEmployerId] = useState<number | null>(null);

  // Get employer ID
  const employerQuery = trpc.employer.getProfile.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (employerQuery.data?.id) {
      setEmployerId(employerQuery.data.id);
    }
  }, [employerQuery.data]);

  // Fetch analytics data
  const analyticsQuery = trpc.talentPoolAnalytics.getDashboard.useQuery(
    { employerId: employerId! },
    { enabled: !!employerId }
  );

  if (employerQuery.isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employerId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Employer Profile Required</CardTitle>
            <CardDescription>Please create an employer profile to access analytics.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const analytics = analyticsQuery.data;
  const metrics = analytics?.metrics;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Talent Pool Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track growth, engagement, and conversion metrics for your talent pool
          </p>
        </div>
        <Link href="/employer/talent-pool">
          <Button variant="outline">
            <Users className="w-4 h-4 mr-2" />
            View Talent Pool
          </Button>
        </Link>
      </div>

      {analyticsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !metrics ? (
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>Start building your talent pool to see analytics.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalCandidates}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.activeCandidates} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.growthRate > 0 ? "+" : ""}
                  {metrics.growthRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <UserCheck className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.engagementRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.contactedCandidates + metrics.hiredCandidates} contacted/hired
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Briefcase className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.hiredCandidates} hired
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Talent Pool Growth</CardTitle>
              <CardDescription>Cumulative candidate additions over the last 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-1">
                {analytics.growth.slice(-30).map((day, index) => {
                  const maxCumulative = Math.max(...analytics.growth.map((d: any) => d.cumulative));
                  const height = maxCumulative > 0 ? (day.cumulative / maxCumulative) * 100 : 0;
                  
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-primary rounded-t transition-all hover:opacity-80"
                      style={{ height: `${height}%`, minHeight: day.cumulative > 0 ? "4px" : "0" }}
                      title={`${day.date}: ${day.cumulative} total`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Track candidates through your hiring pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.funnel.map((stage, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-muted-foreground">
                        {stage.count} ({stage.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Skills</CardTitle>
                <CardDescription>Most common skills in your talent pool</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.skills.slice(0, 10).map((skill, index) => {
                    const maxCount = analytics.skills[0]?.count || 1;
                    const percentage = (skill.count / maxCount) * 100;
                    
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{skill.skill}</span>
                          <span className="text-muted-foreground">{skill.count}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Match Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Match Score Distribution</CardTitle>
                <CardDescription>Quality of candidates in your talent pool</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.matchScores.map((range, index) => {
                    const total = analytics.matchScores.reduce((sum: any, r: any) => sum + r.count, 0);
                    const percentage = total > 0 ? (range.count / total) * 100 : 0;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{range.range}</span>
                          <span className="text-muted-foreground">
                            {range.count} ({Math.round(percentage)}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3">
                          <div
                            className="bg-primary h-3 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Average Match Score */}
          <Card>
            <CardHeader>
              <CardTitle>Average Match Score</CardTitle>
              <CardDescription>Overall quality indicator for your talent pool</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-4xl font-bold">{metrics.averageMatchScore}%</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {metrics.averageMatchScore >= 80
                      ? "Excellent - High quality talent pool"
                      : metrics.averageMatchScore >= 60
                      ? "Good - Quality candidates available"
                      : "Fair - Consider refining search criteria"}
                  </p>
                </div>
                <Target className="w-16 h-16 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
