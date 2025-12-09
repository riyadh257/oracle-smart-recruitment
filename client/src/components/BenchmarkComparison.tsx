import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Lightbulb, Trophy } from "lucide-react";

interface BenchmarkComparisonProps {
  emailType: string;
  openRate: number;
  clickRate: number;
  sectorId?: string;
  companySizeId?: string;
}

export default function BenchmarkComparison({
  emailType,
  openRate,
  clickRate,
  sectorId = "general",
  companySizeId = "medium",
}: BenchmarkComparisonProps) {
  const { data: comparison, isLoading } = trpc.benchmarks.comparePerformance.useQuery({
    emailType,
    openRate,
    clickRate,
    sectorId,
    companySizeId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!comparison) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    if (status === "above") return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (status === "below") return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "above") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (status === "below") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const getMetricName = (metric: string) => {
    if (metric === "openRate") return "Open Rate";
    if (metric === "clickRate") return "Click Rate";
    if (metric === "responseRate") return "Response Rate";
    return metric;
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="rounded-lg border p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Overall Performance Score
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {comparison.sector} • {comparison.companySize}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-900 dark:text-blue-100">
              {comparison.overallScore}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">out of 100</div>
          </div>
        </div>
        <Progress value={comparison.overallScore} className="h-3" />
        <p className="mt-3 text-sm text-blue-800 dark:text-blue-200">
          {comparison.overallScore >= 70
            ? "Excellent performance! You're exceeding industry standards."
            : comparison.overallScore >= 50
            ? "Good performance with room for optimization."
            : "Consider implementing the recommendations below to improve performance."}
        </p>
      </div>

      {/* Metric Comparisons */}
      <div className="grid gap-4 md:grid-cols-2">
        {comparison.comparisons.map((comp: any) => (
          <Card key={comp.metric} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h5 className="font-semibold text-lg">{getMetricName(comp.metric)}</h5>
                  <p className="text-sm text-muted-foreground mt-1">{comp.insight}</p>
                </div>
                {getStatusIcon(comp.status)}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Performance</span>
                  <span className="text-2xl font-bold">{comp.yourValue.toFixed(1)}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Industry Average</span>
                  <span className="text-lg font-medium text-muted-foreground">
                    {comp.benchmarkValue.toFixed(1)}%
                  </span>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Difference</span>
                    <Badge className={getStatusColor(comp.status)}>
                      {comp.difference > 0 ? "+" : ""}
                      {comp.difference.toFixed(1)}% ({comp.percentageDifference > 0 ? "+" : ""}
                      {comp.percentageDifference.toFixed(0)}%)
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      {comparison.recommendations && comparison.recommendations.length > 0 && (
        <div className="rounded-lg border p-6 bg-amber-50 dark:bg-amber-950">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            <h4 className="font-semibold text-amber-900 dark:text-amber-100">
              Recommendations to Improve Performance
            </h4>
          </div>
          <ul className="space-y-3">
            {comparison.recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start gap-3 text-sm text-amber-900 dark:text-amber-100">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="pt-0.5">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Source */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Benchmark data sourced from recruitment industry studies (2023-2024)</p>
        <p className="mt-1">
          Comparisons are adjusted for {comparison.sector.toLowerCase()} sector and {comparison.companySize.toLowerCase()} companies
        </p>
      </div>
    </div>
  );
}
