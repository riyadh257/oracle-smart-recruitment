import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown, Users, Target, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
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
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ABTestingDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const testId = parseInt(params.id || "0");

  const { data: testDetails, isLoading } = trpc.communication.abTesting.getDetails.useQuery(
    { testId },
    { enabled: testId > 0 }
  );

  const calculateResults = trpc.communication.abTesting.calculateResults.useMutation({
    onSuccess: () => {
      toast.success("Test results calculated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to calculate results: ${error.message}`);
    },
  });

  const declareWinner = trpc.enhancedAbTesting.declareWinner.useMutation({
    onSuccess: () => {
      toast.success("Winner declared successfully");
    },
    onError: (error) => {
      toast.error(`Failed to declare winner: ${error.message}`);
    },
  });

  const stopTest = trpc.enhancedAbTesting.stopTest.useMutation({
    onSuccess: () => {
      toast.success("Test stopped successfully");
    },
    onError: (error) => {
      toast.error(`Failed to stop test: ${error.message}`);
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

  const handleDeclareWinner = async (variantId: number) => {
    await declareWinner.mutateAsync({ testId, winningVariantId: variantId });
  };

  const handleStopTest = async () => {
    await stopTest.mutateAsync({ testId });
  };

  // Calculate winner based on conversion rate
  const variants = testDetails.variants || [];
  const bestVariant = variants.reduce((best, current) => {
    const bestRate = best.conversions / Math.max(best.impressions, 1);
    const currentRate = current.conversions / Math.max(current.impressions, 1);
    return currentRate > bestRate ? current : best;
  }, variants[0]);

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ab-testing")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{testDetails.name}</h1>
            <p className="text-muted-foreground mt-1">{testDetails.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={testDetails.status === "active" ? "default" : "secondary"}>
            {testDetails.status}
          </Badge>
          {testDetails.status === "active" && (
            <Button variant="destructive" onClick={handleStopTest}>
              Stop Test
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {variants.reduce((sum, v) => sum + v.impressions, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {variants.reduce((sum, v) => sum + v.conversions, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                (variants.reduce((sum, v) => sum + v.conversions, 0) /
                  Math.max(variants.reduce((sum, v) => sum + v.impressions, 0), 1)) *
                100
              ).toFixed(2)}
              %
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Statistical Significance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {testDetails.statisticalSignificance ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-bold">Significant</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-bold text-muted-foreground">Not Yet</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="variants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="variants">Variant Performance</TabsTrigger>
          <TabsTrigger value="timeline">Performance Over Time</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
        </TabsList>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variants.map((variant, index) => {
              const conversionRate = (variant.conversions / Math.max(variant.impressions, 1)) * 100;
              const isWinner = variant.id === bestVariant?.id;

              return (
                <Card key={variant.id} className={isWinner ? "border-green-500 border-2" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        Variant {String.fromCharCode(65 + index)}
                        {isWinner && <Badge variant="default">Best Performer</Badge>}
                      </CardTitle>
                      {testDetails.status === "active" && testDetails.statisticalSignificance && (
                        <Button
                          size="sm"
                          onClick={() => handleDeclareWinner(variant.id)}
                          disabled={declareWinner.isPending}
                        >
                          Declare Winner
                        </Button>
                      )}
                    </div>
                    <CardDescription>{variant.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Impressions</p>
                        <p className="text-2xl font-bold">{variant.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Conversions</p>
                        <p className="text-2xl font-bold">{variant.conversions.toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Conversion Rate</p>
                        <p className="text-lg font-bold">{conversionRate.toFixed(2)}%</p>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(conversionRate * 2, 100)}%` }}
                        />
                      </div>
                    </div>

                    {variant.config && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Configuration</p>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(variant.config, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Variant Comparison</CardTitle>
              <CardDescription>Side-by-side comparison of all variants</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={variants.map((v, i) => ({
                  name: `Variant ${String.fromCharCode(65 + i)}`,
                  impressions: v.impressions,
                  conversions: v.conversions,
                  rate: (v.conversions / Math.max(v.impressions, 1)) * 100,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="impressions" fill="#3b82f6" name="Impressions" />
                  <Bar yAxisId="left" dataKey="conversions" fill="#10b981" name="Conversions" />
                  <Bar yAxisId="right" dataKey="rate" fill="#f59e0b" name="Conversion Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>Track how each variant performs over time</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData && performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {variants.map((variant, index) => (
                      <Line
                        key={variant.id}
                        type="monotone"
                        dataKey={`variant${variant.id}`}
                        stroke={COLORS[index % COLORS.length]}
                        name={`Variant ${String.fromCharCode(65 + index)}`}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No performance data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Visualize the conversion journey for each variant</CardDescription>
            </CardHeader>
            <CardContent>
              {conversionFunnel && conversionFunnel.length > 0 ? (
                <div className="space-y-6">
                  {variants.map((variant, index) => {
                    const variantFunnel = conversionFunnel.filter(
                      (f) => f.variantId === variant.id
                    );

                    return (
                      <div key={variant.id}>
                        <h3 className="text-lg font-semibold mb-4">
                          Variant {String.fromCharCode(65 + index)} - {variant.name}
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            layout="vertical"
                            data={variantFunnel}
                            margin={{ left: 100 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="stage" type="category" />
                            <Tooltip />
                            <Bar dataKey="count" fill={COLORS[index % COLORS.length]}>
                              <LabelList dataKey="count" position="right" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No funnel data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
