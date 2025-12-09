import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Trophy, 
  Activity, 
  BarChart3, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ABTestDashboard() {
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get all A/B tests
  const { data: tests = [], refetch: refetchTests } = trpc.abTestConversion.getTestResults.useQuery(
    { testId: selectedTestId || 1 },
    { 
      enabled: !!selectedTestId,
      refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
    }
  );

  // Get conversion funnel
  const { data: funnelData = [] } = trpc.abTestConversion.getConversionFunnel.useQuery(
    { testId: selectedTestId || 1 },
    { enabled: !!selectedTestId }
  );

  // Analyze test mutation
  const analyzeMutation = trpc.abTestConversion.analyzeTest.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.isSignificant
          ? `Winner found: ${data.winner} with ${data.relativeImprovement.toFixed(1)}% improvement!`
          : "No significant difference found yet"
      );
      refetchTests();
    },
  });

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-500", icon: Clock },
      running: { color: "bg-blue-500", icon: Activity },
      completed: { color: "bg-green-500", icon: CheckCircle },
      cancelled: { color: "bg-red-500", icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (!tests.test) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No A/B Tests Found</h3>
            <p className="text-gray-600">Create your first A/B test to start tracking conversions</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { test, variants, result } = tests;

  // Prepare data for charts
  const variantComparisonData = variants.map((v) => ({
    name: v.variantName,
    "Open Rate": (v.openRate * 100).toFixed(1),
    "Click Rate": (v.clickRate * 100).toFixed(1),
    "Conversion Rate": (v.conversionRate * 100).toFixed(1),
  }));

  const pieData = variants.map((v) => ({
    name: v.variantName,
    value: v.conversionCount || 0,
  }));

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">A/B Test Dashboard</h1>
          <p className="text-gray-600">Real-time conversion tracking and automatic winner determination</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`} />
            {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
          </Button>
        </div>
      </div>

      {/* Test Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{test.name}</CardTitle>
              <CardDescription>{test.description || "No description"}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(test.status)}
              {test.status === "running" && (
                <Button
                  size="sm"
                  onClick={() => analyzeMutation.mutate({ testId: test.id })}
                  disabled={analyzeMutation.isPending}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {analyzeMutation.isPending ? "Analyzing..." : "Analyze Now"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">Test Type</div>
              <div className="text-xl font-bold text-blue-900">{test.testType}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">Sample Size</div>
              <div className="text-xl font-bold text-purple-900">{test.sampleSize}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 mb-1">Confidence Level</div>
              <div className="text-xl font-bold text-green-900">{test.confidenceLevel}%</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 mb-1">Duration</div>
              <div className="text-xl font-bold text-yellow-900">
                {test.startedAt
                  ? Math.floor(
                      (new Date(test.completedAt || Date.now()).getTime() -
                        new Date(test.startedAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0}{" "}
                days
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winner Announcement */}
      {result && result.statisticalSignificance === 1 && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Winner Determined!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-lg">
                <strong>Winning Variant:</strong>{" "}
                {variants.find((v) => v.id === result.winnerVariantId)?.variantName || "Unknown"}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Relative Improvement</div>
                  <div className="text-2xl font-bold text-green-600">
                    +{result.relativeImprovement.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">P-Value</div>
                  <div className="text-2xl font-bold text-green-600">
                    {result.pValue.toFixed(4)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Confidence</div>
                  <div className="text-2xl font-bold text-green-600">{test.confidenceLevel}%</div>
                </div>
              </div>
              <div className="bg-white p-3 rounded border border-green-200">
                <strong>Recommendation:</strong> {result.recommendation}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="details">Variant Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>Open rate, click rate, and conversion rate by variant</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={variantComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Open Rate" fill="#3b82f6" />
                  <Bar dataKey="Click Rate" fill="#10b981" />
                  <Bar dataKey="Conversion Rate" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Distribution</CardTitle>
                <CardDescription>Total conversions by variant</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Variant Metrics</CardTitle>
                <CardDescription>Detailed performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {variants.map((variant, idx) => (
                    <div
                      key={variant.id}
                      className="p-4 rounded-lg border"
                      style={{ borderColor: COLORS[idx % COLORS.length] }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{variant.variantName}</h4>
                        {result?.winnerVariantId === variant.id && (
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Sent:</span>{" "}
                          <span className="font-semibold">{variant.sentCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Opened:</span>{" "}
                          <span className="font-semibold">{variant.openedCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Clicked:</span>{" "}
                          <span className="font-semibold">{variant.clickedCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Converted:</span>{" "}
                          <span className="font-semibold">{variant.conversionCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel Analysis</CardTitle>
              <CardDescription>Track user journey from send to conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {funnelData.map((variant, idx) => (
                  <div key={idx}>
                    <h4 className="font-semibold mb-3">{variant.variantName}</h4>
                    <div className="space-y-2">
                      {variant.funnel.map((stage: any, stageIdx: number) => {
                        const percentage =
                          variant.funnel[0].count > 0
                            ? ((stage.count / variant.funnel[0].count) * 100).toFixed(1)
                            : 0;
                        return (
                          <div key={stageIdx} className="flex items-center gap-3">
                            <div className="w-24 text-sm font-medium">{stage.stage}</div>
                            <div className="flex-1">
                              <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                                <div
                                  className="h-full flex items-center justify-end px-3 text-white text-sm font-semibold transition-all"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: COLORS[idx % COLORS.length],
                                  }}
                                >
                                  {stage.count > 0 && `${stage.count} (${percentage}%)`}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {variants.map((variant, idx) => (
            <Card key={variant.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Variant {variant.variantName}
                    {result?.winnerVariantId === variant.id && (
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    )}
                  </CardTitle>
                  <Badge style={{ backgroundColor: COLORS[idx % COLORS.length] }} className="text-white">
                    {((variant.conversionRate || 0) * 100).toFixed(2)}% Conversion
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600 mb-1">Recipients</div>
                    <div className="text-2xl font-bold">{variant.recipientCount || 0}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-xs text-blue-600 mb-1">Sent</div>
                    <div className="text-2xl font-bold text-blue-900">{variant.sentCount || 0}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-xs text-green-600 mb-1">Delivered</div>
                    <div className="text-2xl font-bold text-green-900">
                      {variant.deliveredCount || 0}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="text-xs text-purple-600 mb-1">Opened</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {variant.openedCount || 0}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <div className="text-xs text-yellow-600 mb-1">Clicked</div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {variant.clickedCount || 0}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <div className="text-xs text-orange-600 mb-1">Converted</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {variant.conversionCount || 0}
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded">
                    <div className="text-xs text-indigo-600 mb-1">Open Rate</div>
                    <div className="text-2xl font-bold text-indigo-900">
                      {((variant.openRate || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-pink-50 p-3 rounded">
                    <div className="text-xs text-pink-600 mb-1">Click Rate</div>
                    <div className="text-2xl font-bold text-pink-900">
                      {((variant.clickRate || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {variant.emailSubject && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <div className="text-sm font-semibold mb-1">Email Subject:</div>
                    <div className="text-sm">{variant.emailSubject}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
