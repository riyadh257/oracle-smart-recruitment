import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Trophy } from "lucide-react";
import { useState } from "react";

interface StatisticalSignificanceProps {
  testId: number;
}

export default function StatisticalSignificance({ testId }: StatisticalSignificanceProps) {
  const [metric, setMetric] = useState<"open" | "click">("open");
  const [confidenceLevel, setConfidenceLevel] = useState<"90" | "95" | "99">("95");

  const { data: analysis, isLoading } = trpc.abTesting.analyzeSignificance.useQuery({
    testId,
    metric,
    confidenceLevel,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing statistical significance...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const { isSignificant, winner, pValue, confidenceInterval, summary, sampleSizeReached, minimumSampleSize, currentSampleSize, effectSize } = analysis;

  const sampleProgress = (currentSampleSize / minimumSampleSize) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Statistical Analysis
              {isSignificant && winner && winner !== "tie" && (
                <Badge variant="default" className="bg-green-600">
                  <Trophy className="mr-1 h-3 w-3" />
                  Significant Result
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Confidence intervals and p-value calculations for your A/B test
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Metric</label>
            <Select value={metric} onValueChange={(value: "open" | "click") => setMetric(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open Rate</SelectItem>
                <SelectItem value="click">Click Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confidence Level</label>
            <Select value={confidenceLevel} onValueChange={(value: "90" | "95" | "99") => setConfidenceLevel(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">90%</SelectItem>
                <SelectItem value="95">95%</SelectItem>
                <SelectItem value="99">99%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sample Size Progress */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sample Size Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentSampleSize} / {minimumSampleSize} per variant
            </span>
          </div>
          <Progress value={Math.min(sampleProgress, 100)} className="h-2" />
          {!sampleSizeReached && (
            <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-500">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Need {minimumSampleSize - currentSampleSize} more samples per variant to reach
                statistical power for reliable results
              </p>
            </div>
          )}
          {sampleSizeReached && (
            <div className="flex items-start gap-2 text-sm text-green-600 dark:text-green-500">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>Minimum sample size reached - results are statistically reliable</p>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="rounded-lg border p-4 bg-muted/50">
          <h4 className="font-semibold mb-2">Analysis Summary</h4>
          <p className="text-sm">{summary}</p>
        </div>

        {/* Statistical Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1 rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">P-Value</div>
            <div className="text-2xl font-bold">{pValue.toFixed(4)}</div>
            <div className="text-xs text-muted-foreground">
              {pValue < 0.05 ? "Statistically significant" : "Not significant"}
            </div>
          </div>

          <div className="space-y-1 rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Effect Size</div>
            <div className="text-2xl font-bold">{(effectSize * 100).toFixed(2)}%</div>
            <div className="text-xs text-muted-foreground">Absolute difference</div>
          </div>

          <div className="space-y-1 rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Confidence Interval</div>
            <div className="text-lg font-bold">
              [{(confidenceInterval.lower * 100).toFixed(2)}%, {(confidenceInterval.upper * 100).toFixed(2)}%]
            </div>
            <div className="text-xs text-muted-foreground">At {confidenceLevel}% confidence</div>
          </div>
        </div>

        {/* Variant Comparison */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                Variant A
                {winner === "A" && <Trophy className="h-4 w-4 text-green-600" />}
              </h4>
              {winner === "A" && (
                <Badge variant="default" className="bg-green-600">Winner</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-medium">{analysis.variantA.rate.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Count:</span>
                <span className="font-medium">
                  {analysis.variantA.count} / {analysis.variantA.total}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                Variant B
                {winner === "B" && <Trophy className="h-4 w-4 text-green-600" />}
              </h4>
              {winner === "B" && (
                <Badge variant="default" className="bg-green-600">Winner</Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-medium">{analysis.variantB.rate.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Count:</span>
                <span className="font-medium">
                  {analysis.variantB.count} / {analysis.variantB.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interpretation Guide */}
        <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950">
          <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
            How to Interpret These Results
          </h4>
          <ul className="space-y-1 text-sm text-blue-900 dark:text-blue-100">
            <li>
              <strong>P-Value:</strong> Probability that the observed difference is due to chance.
              Lower is better (typically &lt; 0.05).
            </li>
            <li>
              <strong>Effect Size:</strong> The actual difference in performance between variants.
              Larger means more practical impact.
            </li>
            <li>
              <strong>Confidence Interval:</strong> Range where the true difference likely falls.
              Narrower intervals indicate more precise estimates.
            </li>
            <li>
              <strong>Statistical Significance:</strong> Achieved when p-value is below the threshold
              for your chosen confidence level.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
