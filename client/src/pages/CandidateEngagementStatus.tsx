import { useState } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  MousePointer, 
  Eye, 
  Calendar,
  Briefcase,
  Award,
  Activity
} from 'lucide-react';

export default function CandidateEngagementStatus() {
  const [, params] = useRoute('/candidate/engagement/:token');
  const token = params?.token || '';

  // Mock engagement data - in production, fetch from backend using token
  const engagement = {
    candidateName: 'John Doe',
    overallScore: 78,
    scoreTrend: 5, // +5 points from last week
    lastUpdated: new Date(),
    metrics: {
      emailOpenRate: 85,
      emailClickRate: 42,
      responseRate: 67,
      profileViews: 23,
    },
    recentActivity: [
      { type: 'email_open', description: 'Opened "Senior Developer Position"', timestamp: new Date(Date.now() - 3600000) },
      { type: 'profile_view', description: 'Profile viewed by Tech Corp', timestamp: new Date(Date.now() - 7200000) },
      { type: 'email_click', description: 'Clicked job details link', timestamp: new Date(Date.now() - 86400000) },
      { type: 'response', description: 'Responded to interview invitation', timestamp: new Date(Date.now() - 172800000) },
    ],
    activeApplications: 3,
    upcomingInterviews: 1,
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-500">High</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge className="bg-red-500">Low</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Your Engagement Status</h1>
          <p className="text-muted-foreground">
            Track your activity and engagement with potential employers
          </p>
        </div>

        {/* Overall Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Overall Engagement Score</span>
              {getScoreBadge(engagement.overallScore)}
            </CardTitle>
            <CardDescription>
              Last updated: {engagement.lastUpdated.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-5xl font-bold ${getScoreColor(engagement.overallScore)}`}>
                  {engagement.overallScore}
                </span>
                <div className="flex items-center gap-2">
                  {engagement.scoreTrend >= 0 ? (
                    <>
                      <TrendingUp className="w-6 h-6 text-green-600" />
                      <span className="text-green-600 font-semibold">+{engagement.scoreTrend}</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-6 h-6 text-red-600" />
                      <span className="text-red-600 font-semibold">{engagement.scoreTrend}</span>
                    </>
                  )}
                  <span className="text-sm text-muted-foreground">vs last week</span>
                </div>
              </div>
              <Progress value={engagement.overallScore} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Email Open Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold">{engagement.metrics.emailOpenRate}%</div>
                <Progress value={engagement.metrics.emailOpenRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MousePointer className="w-5 h-5 text-purple-600" />
                Click-Through Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold">{engagement.metrics.emailClickRate}%</div>
                <Progress value={engagement.metrics.emailClickRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Response Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold">{engagement.metrics.responseRate}%</div>
                <Progress value={engagement.metrics.responseRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-orange-600" />
                Profile Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{engagement.metrics.profileViews}</div>
              <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Briefcase className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{engagement.activeApplications}</div>
                  <p className="text-sm text-muted-foreground">Active Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{engagement.upcomingInterviews}</div>
                  <p className="text-sm text-muted-foreground">Upcoming Interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions with employers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagement.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Tips to Improve Your Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Open and read emails from employers promptly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Click through to job details to show interest</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Respond to interview invitations within 24 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Keep your profile updated and complete</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
