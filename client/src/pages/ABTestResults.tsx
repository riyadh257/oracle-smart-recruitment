import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, MousePointerClick, Eye, Trophy, AlertCircle } from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function ABTestResults() {
  const params = useParams();
  const [, navigate] = useLocation();
  const testId = parseInt(params.id || "0");

  const { data: testDetails, isLoading, refetch } = trpc.communication.abTesting.getDetails.useQuery(
    { testId },
    { enabled: testId > 0 }
  );

  const calculateResults = trpc.communication.abTesting.calculateResults.useMutation({
    onSuccess: () => {
      toast.success("Test results calculated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to calculate results: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!testDetails) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Test not found</p>
            <Button className="mt-4" onClick={() => navigate("/ab-testing")}>
              Back to A/B Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { test, variants, result } = testDetails;
  const variantA = variants.find(v => v.variant === 'A');
  const variantB = variants.find(v => v.variant === 'B');

  const variantAOpenRate = variantA && variantA.sentCount > 0 ? (variantA.openCount / variantA.sentCount) * 100 : 0;
  const variantBOpenRate = variantB && variantB.sentCount > 0 ? (variantB.openCount / variantB.sentCount) * 100 : 0;
  const variantAClickRate = variantA && variantA.sentCount > 0 ? (variantA.clickCount / variantA.sentCount) * 100 : 0;
  const variantBClickRate = variantB && variantB.sentCount > 0 ? (variantB.clickCount / variantB.sentCount) * 100 : 0;

  const comparisonData = [
    { metric: 'Sent', 'Variant A': variantA?.sentCount || 0, 'Variant B': variantB?.sentCount || 0 },
    { metric: 'Opened', 'Variant A': variantA?.openCount || 0, 'Variant B': variantB?.openCount || 0 },
    { metric: 'Clicked', 'Variant A': variantA?.clickCount || 0, 'Variant B': variantB?.clickCount || 0 },
  ];

  const rateComparisonData = [
    { metric: 'Open Rate', 'Variant A': variantAOpenRate, 'Variant B': variantBOpenRate },
    { metric: 'Click Rate', 'Variant A': variantAClickRate, 'Variant B': variantBClickRate },
  ];

  const pieData = [
    { name: 'Variant A Sent', value: variantA?.sentCount || 0 },
    { name: 'Variant B Sent', value: variantB?.sentCount || 0 },
  ];

  const winner = result ? (result.winnerVariantId === variantA?.id ? 'A' : 'B') : null;

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ab-testing")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{test.name}</h1>
            <p className="text-muted-foreground mt-1 capitalize">{test.emailType.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={test.status === "active" ? "default" : "secondary"}>{test.status}</Badge>
          {test.status === "active" && (
            <Button onClick={() => calculateResults.mutate({ testId })} disabled={calculateResults.isPending}>
              {calculateResults.isPending ? "Calculating..." : "Calculate Results"}
            </Button>
          )}
        </div>
      </div>

      {result && winner && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900 dark:text-green-100">Winner: Variant {winner}</CardTitle>
            </div>
            <CardDescription className="text-green-700 dark:text-green-300">{result.recommendation}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Statistical Significance</p>
                <p className="text-lg font-bold">{result.statisticalSignificance}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Confidence Level</p>
                <p className="text-lg font-bold">{result.confidenceLevel}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Relative Improvement</p>
                <p className="text-lg font-bold">{(result.relativeImprovement / 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Test Duration</p>
                <p className="text-lg font-bold">{result.testDuration}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((variantA?.sentCount || 0) + (variantB?.sentCount || 0)).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />Total Opens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((variantA?.openCount || 0) + (variantB?.openCount || 0)).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((variantA?.clickCount || 0) + (variantB?.clickCount || 0)).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sample Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{test.sampleSize}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comparison">Performance Comparison</TabsTrigger>
          <TabsTrigger value="rates">Conversion Rates</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="variants">Variant Details</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Absolute Performance Metrics</CardTitle>
              <CardDescription>Compare raw numbers between variants</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Variant A" fill="#3b82f6" />
                  <Bar dataKey="Variant B" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate Comparison</CardTitle>
              <CardDescription>Percentage-based performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={rateComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => value.toFixed(2) + '%'} />
                  <Legend />
                  <Bar dataKey="Variant A" fill="#3b82f6" />
                  <Bar dataKey="Variant B" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Distribution</CardTitle>
              <CardDescription>How emails were distributed between variants</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name + ': ' + entry.value} outerRadius={120} fill="#8884d8" dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={"cell-" + index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Variant A</CardTitle>
                  {winner === 'A' && <Trophy className="h-5 w-5 text-yellow-500" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Subject Line</h4>
                  <p className="text-sm text-muted-foreground">{variantA?.subject}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sent</p>
                    <p className="text-lg font-bold">{variantA?.sentCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Opened</p>
                    <p className="text-lg font-bold">{variantA?.openCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Clicked</p>
                    <p className="text-lg font-bold">{variantA?.clickCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Open Rate</p>
                    <p className="text-lg font-bold">{variantAOpenRate.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Variant B</CardTitle>
                  {winner === 'B' && <Trophy className="h-5 w-5 text-yellow-500" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Subject Line</h4>
                  <p className="text-sm text-muted-foreground">{variantB?.subject}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sent</p>
                    <p className="text-lg font-bold">{variantB?.sentCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Opened</p>
                    <p className="text-lg font-bold">{variantB?.openCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Clicked</p>
                    <p className="text-lg font-bold">{variantB?.clickCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Open Rate</p>
                    <p className="text-lg font-bold">{variantBOpenRate.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {(!variantA?.sentCount && !variantB?.sentCount) && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">No test data available yet</p>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
              This test hasn't sent any emails yet. Start sending emails to see performance data and analytics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
