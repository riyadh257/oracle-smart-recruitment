import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Mail,
  MousePointerClick,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import BulkSendCampaignDialog from "@/components/BulkSendCampaignDialog";

export default function CampaignAnalytics() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const campaignId = parseInt(id || "0");
  const [bulkSendOpen, setBulkSendOpen] = useState(false);

  const { data: campaign, isLoading: campaignLoading } = trpc.campaigns.getById.useQuery(
    { campaignId },
    { enabled: !!campaignId }
  );

  const { data: analytics, isLoading: analyticsLoading } = trpc.campaigns.getAnalytics.useQuery(
    { campaignId },
    { enabled: !!campaignId }
  );

  const { data: executions = [], isLoading: executionsLoading } = trpc.campaigns.getExecutions.useQuery(
    { campaignId },
    { enabled: !!campaignId }
  );

  const openRateChartRef = useRef<HTMLCanvasElement>(null);
  const clickRateChartRef = useRef<HTMLCanvasElement>(null);
  const conversionFunnelRef = useRef<HTMLCanvasElement>(null);
  const timelineChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analytics || !openRateChartRef.current) return;

    const ctx = openRateChartRef.current.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Opened", "Not Opened"],
        datasets: [
          {
            data: [analytics.openRate || 0, 100 - (analytics.openRate || 0)],
            backgroundColor: ["#10b981", "#e5e7eb"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.label}: ${context.parsed}%`;
              },
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [analytics]);

  useEffect(() => {
    if (!analytics || !clickRateChartRef.current) return;

    const ctx = clickRateChartRef.current.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Clicked", "Not Clicked"],
        datasets: [
          {
            data: [analytics.clickRate || 0, 100 - (analytics.clickRate || 0)],
            backgroundColor: ["#3b82f6", "#e5e7eb"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.label}: ${context.parsed}%`;
              },
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [analytics]);

  useEffect(() => {
    if (!analytics || !conversionFunnelRef.current) return;

    const ctx = conversionFunnelRef.current.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Sent", "Delivered", "Opened", "Clicked", "Converted"],
        datasets: [
          {
            label: "Recipients",
            data: [
              analytics.totalSent || 0,
              analytics.totalDelivered || 0,
              analytics.totalOpened || 0,
              analytics.totalClicked || 0,
              analytics.totalConverted || 0,
            ],
            backgroundColor: [
              "#6366f1",
              "#8b5cf6",
              "#10b981",
              "#3b82f6",
              "#f59e0b",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    return () => chart.destroy();
  }, [analytics]);

  useEffect(() => {
    if (!executions.length || !timelineChartRef.current) return;

    const ctx = timelineChartRef.current.getContext("2d");
    if (!ctx) return;

    // Group executions by date
    const executionsByDate = executions.reduce((acc: Record<string, number>, execution: any) => {
      const date = new Date(execution.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const dates = Object.keys(executionsByDate).sort();
    const counts = dates.map((date) => executionsByDate[date]);

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "Executions",
            data: counts,
            borderColor: "#6366f1",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [executions]);

  if (campaignLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Campaign not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 border-green-300";
      case "paused":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-300";
      case "draft":
        return "bg-gray-500/10 text-gray-700 border-gray-300";
      case "completed":
        return "bg-blue-500/10 text-blue-700 border-blue-300";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/campaigns")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-muted-foreground mt-1">{campaign.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setBulkSendOpen(true)}
            disabled={campaign.status !== "active"}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send to Candidates
          </Button>
          <Badge variant="outline" className={getStatusColor(campaign.status)}>
            {campaign.status}
          </Badge>
        </div>
      </div>

      {/* Bulk Send Dialog */}
      <BulkSendCampaignDialog
        campaignId={campaignId}
        campaignName={campaign.name}
        open={bulkSendOpen}
        onOpenChange={setBulkSendOpen}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{analytics?.totalSent || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{analytics?.openRate?.toFixed(1) || 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Click Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{analytics?.clickRate?.toFixed(1) || 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold">{analytics?.conversionRate?.toFixed(1) || 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="executions">Executions ({executions.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Open Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Open Rate</CardTitle>
                <CardDescription>Percentage of recipients who opened the email</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: "250px" }}>
                  <canvas ref={openRateChartRef}></canvas>
                </div>
              </CardContent>
            </Card>

            {/* Click Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Click Rate</CardTitle>
                <CardDescription>Percentage of recipients who clicked links</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: "250px" }}>
                  <canvas ref={clickRateChartRef}></canvas>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Delivered</p>
                  <p className="text-2xl font-bold">{analytics?.totalDelivered || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Opened</p>
                  <p className="text-2xl font-bold">{analytics?.totalOpened || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Clicked</p>
                  <p className="text-2xl font-bold">{analytics?.totalClicked || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Converted</p>
                  <p className="text-2xl font-bold">{analytics?.totalConverted || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Track how recipients progress through the campaign stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: "400px" }}>
                <canvas ref={conversionFunnelRef}></canvas>
              </div>
            </CardContent>
          </Card>

          {/* Funnel Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Delivery Rate</p>
                  <Progress 
                    value={analytics?.totalSent ? (analytics.totalDelivered / analytics.totalSent) * 100 : 0} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground">
                    {analytics?.totalSent ? ((analytics.totalDelivered / analytics.totalSent) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Open Rate</p>
                  <Progress value={analytics?.openRate || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">{analytics?.openRate?.toFixed(1) || 0}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Click Rate</p>
                  <Progress value={analytics?.clickRate || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">{analytics?.clickRate?.toFixed(1) || 0}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <Progress value={analytics?.conversionRate || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">{analytics?.conversionRate?.toFixed(1) || 0}%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Activity Timeline</CardTitle>
              <CardDescription>Daily execution count over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: "400px" }}>
                <canvas ref={timelineChartRef}></canvas>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-4">
          {executionsLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Loading executions...</p>
              </CardContent>
            </Card>
          ) : executions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No executions found</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Campaign Executions</CardTitle>
                <CardDescription>Individual campaign execution records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {executions.map((execution: any) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {execution.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : execution.status === "failed" ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium">Execution #{execution.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(execution.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{execution.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
