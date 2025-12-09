import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Mail, 
  TrendingUp, 
  Users, 
  MousePointerClick, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export default function TemplateAnalytics() {
  const { user, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30");

  const { data: analytics, isLoading } = trpc.emailTemplateSystem.getTemplateAnalytics.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory as any,
    days: parseInt(timeRange),
  });

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const stats = analytics?.summary || {
    totalTemplates: 0,
    totalSent: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    avgResponseRate: 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Template Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Track performance metrics for your email templates
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="interview_invitation">Interview Invitation</SelectItem>
                <SelectItem value="rejection">Rejection</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTemplates}</div>
              <p className="text-xs text-muted-foreground">
                Active email templates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Emails delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgOpenRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Across all templates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgClickRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Link engagement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Candidate responses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Template Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Template Performance</CardTitle>
            <CardDescription>
              Detailed metrics for each email template
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading analytics...</div>
            ) : !analytics?.templates || analytics.templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No template data available for the selected filters
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Open Rate</TableHead>
                    <TableHead className="text-right">Click Rate</TableHead>
                    <TableHead className="text-right">Response Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.templates.map((template) => {
                    const openRate = template.sentCount > 0 
                      ? (template.openedCount / template.sentCount) * 100 
                      : 0;
                    const clickRate = template.sentCount > 0 
                      ? (template.clickedCount / template.sentCount) * 100 
                      : 0;
                    const responseRate = template.sentCount > 0 
                      ? (template.respondedCount / template.sentCount) * 100 
                      : 0;

                    return (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{template.name}</div>
                            {template.isDefault && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {template.category.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{template.sentCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span>{template.deliveredCount}</span>
                            <Progress 
                              value={(template.deliveredCount / template.sentCount) * 100} 
                              className="w-16 h-1 mt-1"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium">{openRate.toFixed(1)}%</span>
                            <span className="text-xs text-muted-foreground">
                              {template.openedCount} opens
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium">{clickRate.toFixed(1)}%</span>
                            <span className="text-xs text-muted-foreground">
                              {template.clickedCount} clicks
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium">{responseRate.toFixed(1)}%</span>
                            <span className="text-xs text-muted-foreground">
                              {template.respondedCount} responses
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {template.isActive ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Templates */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Templates
              </CardTitle>
              <CardDescription>
                Highest engagement rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.topPerforming && analytics.topPerforming.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topPerforming.map((template, index) => (
                    <div key={template.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {template.sentCount} sent
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {template.engagementRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">engagement</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recently Used Templates
              </CardTitle>
              <CardDescription>
                Most recently sent templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentlyUsed && analytics.recentlyUsed.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentlyUsed.map((template) => (
                    <div key={template.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {template.category.replace(/_/g, " ")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(template.lastUsedAt || "").toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {template.usageCount} uses
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent usage data
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
