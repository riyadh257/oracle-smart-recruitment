import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Mail, XCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { subDays, format } from "date-fns";

export default function DeliverabilityMonitor() {
  const [dateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const { data: metrics, isLoading: metricsLoading } = trpc.deliverability.getMetrics.useQuery(dateRange);
  const { data: reputation, isLoading: reputationLoading } = trpc.deliverability.getCurrentReputation.useQuery();
  const { data: alerts, isLoading: alertsLoading } = trpc.deliverability.getAlerts.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.deliverability.getStats.useQuery({ days: 30 });

  const getReputationBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string; color: string }> = {
      excellent: { variant: "default", label: "Excellent", color: "text-green-600" },
      good: { variant: "default", label: "Good", color: "text-blue-600" },
      fair: { variant: "secondary", label: "Fair", color: "text-yellow-600" },
      poor: { variant: "outline", label: "Poor", color: "text-orange-600" },
      critical: { variant: "destructive", label: "Critical", color: "text-red-600" },
    };
    return config[status] || config.good;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Email Deliverability Monitor</h2>
        <p className="text-sm text-muted-foreground">
          Track bounce rates, spam complaints, and sender reputation
        </p>
      </div>

      {/* Alerts */}
      {!alertsLoading && alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert: any, index: number) => (
            <Alert key={index} variant={alert.severity === "critical" ? "destructive" : "default"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.message}</AlertTitle>
              <AlertDescription>
                {alert.metric}: {alert.value.toFixed(2)}% (threshold: {alert.threshold}%)
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Reputation Card */}
      {reputationLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reputation ? (
        <Card>
          <CardHeader>
            <CardTitle>Sender Reputation</CardTitle>
            <CardDescription>Current email sender reputation score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <span className={`text-5xl font-bold ${getReputationBadge(reputation.status).color}`}>
                    {reputation.score}
                  </span>
                  <Badge variant={getReputationBadge(reputation.status).variant}>
                    {getReputationBadge(reputation.status).label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getTrendIcon(reputation.trend)}
                  <span className="capitalize">{reputation.trend}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-2">Score Range</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    <span>90-100: Excellent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span>75-89: Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                    <span>60-74: Fair</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                    <span>40-59: Poor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    <span>0-39: Critical</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Statistics Cards */}
      {statsLoading ? null : stats ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgDeliveryRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalDelivered.toLocaleString()} of {stats.totalSent.toLocaleString()} delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgBounceRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.avgBounceRate < 5 ? "Within healthy range" : "Above recommended"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spam Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgSpamRate.toFixed(3)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.avgSpamRate < 0.1 ? "Excellent" : "Needs attention"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Change</CardTitle>
              {stats.scoreChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.scoreChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.scoreChange >= 0 ? "+" : ""}
                {stats.scoreChange.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground">Last 7 days vs previous</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Metrics Chart */}
      {metricsLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : metrics && metrics.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Deliverability Trends</CardTitle>
            <CardDescription>30-day delivery, bounce, and spam rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={[...metrics].reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), "MMM d")}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => format(new Date(value), "MMM d, yyyy")}
                  formatter={(value: any) => `${value.toFixed(2)}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="deliveryRate"
                  stroke="#10b981"
                  name="Delivery Rate"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="bounceRate"
                  stroke="#f59e0b"
                  name="Bounce Rate"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="spamRate"
                  stroke="#ef4444"
                  name="Spam Rate"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-12">
              <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No deliverability data available yet</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
