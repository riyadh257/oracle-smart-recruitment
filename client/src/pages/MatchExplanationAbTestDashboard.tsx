import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TestTube,
  TrendingUp,
  Eye,
  MousePointer,
  FileCheck,
  Award,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function MatchExplanationAbTestDashboard() {
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [comparisonVariant1, setComparisonVariant1] = useState<string>("");
  const [comparisonVariant2, setComparisonVariant2] = useState<string>("");

  const { data: summaryStats, isLoading: summaryLoading } =
    trpc.matchExplanationAbTest.getSummaryStats.useQuery({
      startDate: dateRange.start,
      endDate: dateRange.end,
    });

  const { data: results, isLoading: resultsLoading } =
    trpc.matchExplanationAbTest.getResults.useQuery({
      startDate: dateRange.start,
      endDate: dateRange.end,
    });

  const { data: variants } = trpc.matchExplanationAbTest.getVariants.useQuery();

  const { data: significance, isLoading: sigLoading } =
    trpc.matchExplanationAbTest.getSignificanceAnalysis.useQuery(
      {
        variant1Id: comparisonVariant1,
        variant2Id: comparisonVariant2,
        startDate: dateRange.start,
        endDate: dateRange.end,
      },
      {
        enabled: !!comparisonVariant1 && !!comparisonVariant2,
      }
    );

  const isLoading = summaryLoading || resultsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading A/B test results...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Match Explanation A/B Test Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Measure which explanation format drives highest engagement and conversions
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.totalImpressions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {summaryStats?.variantCount || 0} variants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.totalClicks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats?.avgClickThroughRate.toFixed(2)}% avg CTR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats?.avgApplicationConversionRate.toFixed(2)}% avg conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{summaryStats?.bestVariantName || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Highest combined score</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.start || ""}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.end || ""}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Variant Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Variant Performance Comparison
          </CardTitle>
          <CardDescription>Click-through and conversion rates by variant</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={results}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="variantName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="clickThroughRate" fill="#667eea" name="Click-Through Rate (%)" />
              <Bar
                dataKey="applicationConversionRate"
                fill="#43e97b"
                name="Application Conversion Rate (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics by Variant</CardTitle>
          <CardDescription>Comprehensive performance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Variant</th>
                  <th className="text-right p-2">Impressions</th>
                  <th className="text-right p-2">Clicks</th>
                  <th className="text-right p-2">Applications</th>
                  <th className="text-right p-2">CTR (%)</th>
                  <th className="text-right p-2">Conversion (%)</th>
                </tr>
              </thead>
              <tbody>
                {results?.map((result) => (
                  <tr key={result.variantId} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{result.variantName}</td>
                    <td className="text-right p-2">{result.impressions}</td>
                    <td className="text-right p-2">{result.clicks}</td>
                    <td className="text-right p-2">{result.applications}</td>
                    <td className="text-right p-2 text-blue-600">
                      {result.clickThroughRate.toFixed(2)}%
                    </td>
                    <td className="text-right p-2 text-green-600">
                      {result.applicationConversionRate.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Statistical Significance Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Statistical Significance Test
          </CardTitle>
          <CardDescription>
            Compare two variants to determine if differences are statistically significant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="variant1">Variant 1</Label>
              <Select value={comparisonVariant1} onValueChange={setComparisonVariant1}>
                <SelectTrigger id="variant1">
                  <SelectValue placeholder="Select variant 1" />
                </SelectTrigger>
                <SelectContent>
                  {variants?.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="variant2">Variant 2</Label>
              <Select value={comparisonVariant2} onValueChange={setComparisonVariant2}>
                <SelectTrigger id="variant2">
                  <SelectValue placeholder="Select variant 2" />
                </SelectTrigger>
                <SelectContent>
                  {variants?.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {significance && !sigLoading && (
            <div className="mt-4 p-4 border rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">{significance.variant1?.variantName}</h4>
                  <p className="text-sm text-muted-foreground">
                    CTR: {significance.variant1?.clickThroughRate.toFixed(2)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Conversions: {significance.variant1?.applicationConversionRate.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">{significance.variant2?.variantName}</h4>
                  <p className="text-sm text-muted-foreground">
                    CTR: {significance.variant2?.clickThroughRate.toFixed(2)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Conversions: {significance.variant2?.applicationConversionRate.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Statistical Significance:</span>
                  <span
                    className={`font-bold ${
                      significance.isSignificant ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {significance.isSignificant ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Confidence Level:</span>
                  <span className="text-sm font-medium">
                    {significance.confidenceLevel.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">P-Value:</span>
                  <span className="text-sm font-medium">{significance.pValue.toFixed(4)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  {significance.isSignificant
                    ? "The difference between these variants is statistically significant (p < 0.05). You can confidently choose the better performing variant."
                    : "The difference is not statistically significant. More data may be needed to determine a clear winner."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
