import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Calendar, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SmartSendTimeOptimizerProps {
  candidateIds?: number[];
  segment?: {
    industry?: string;
    experienceLevel?: string;
    location?: string;
  };
}

export function SmartSendTimeOptimizer({ candidateIds, segment }: SmartSendTimeOptimizerProps) {
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Get optimal send time for segment
  const { data: optimalTime, isLoading: loadingOptimal } = trpc.smartSendTime.getOptimalSendTime.useQuery(
    { segment },
    { enabled: !candidateIds || candidateIds.length === 0 }
  );

  // Get batch predictions for multiple candidates
  const { data: batchPredictions, isLoading: loadingBatch } = trpc.smartSendTime.batchPredictSendTimes.useQuery(
    { candidateIds: candidateIds || [] },
    { enabled: !!candidateIds && candidateIds.length > 0 }
  );

  // Get heatmap data
  const { data: heatmapData, isLoading: loadingHeatmap } = trpc.smartSendTime.getSendTimeHeatmap.useQuery(
    { segment },
    { enabled: showHeatmap }
  );

  const updateModelMutation = trpc.smartSendTime.updateModel.useMutation({
    onSuccess: () => {
      toast.success("ML model updated successfully");
    },
  });

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: "bg-green-500",
      medium: "bg-yellow-500",
      low: "bg-gray-500",
    };
    return (
      <Badge className={`${colors[confidence as keyof typeof colors]} text-white`}>
        {confidence.toUpperCase()} CONFIDENCE
      </Badge>
    );
  };

  if (loadingOptimal || loadingBatch) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2">Analyzing send time patterns...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Single Segment Recommendation */}
      {optimalTime && !candidateIds && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Optimal Send Time Recommendation
                </CardTitle>
                <CardDescription>
                  AI-powered prediction based on historical engagement data
                </CardDescription>
              </div>
              {getConfidenceBadge(optimalTime.confidence)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">Best Day</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {dayNames[optimalTime.recommendedDayOfWeek]}
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900">Best Time</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {optimalTime.recommendedHour}:00
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-900">Expected Conversion</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {(optimalTime.expectedConversionRate * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Performance Metrics</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Open Rate:</span>
                  <span className="ml-2 font-semibold">
                    {(optimalTime.expectedOpenRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Click Rate:</span>
                  <span className="ml-2 font-semibold">
                    {(optimalTime.expectedClickRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Conversion Rate:</span>
                  <span className="ml-2 font-semibold">
                    {(optimalTime.expectedConversionRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
              <strong>Analysis:</strong> {optimalTime.reasoning}
            </div>

            {optimalTime.alternativeTimes && optimalTime.alternativeTimes.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Alternative Send Times</h4>
                <div className="space-y-2">
                  {optimalTime.alternativeTimes.map((alt, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                      <span>
                        {dayNames[alt.dayOfWeek]} at {alt.hour}:00
                      </span>
                      <Badge variant="outline">Score: {alt.score.toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Batch Predictions */}
      {batchPredictions && batchPredictions.predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personalized Send Time Predictions</CardTitle>
            <CardDescription>
              Optimal send times for {batchPredictions.predictions.length} candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {batchPredictions.predictions.map((pred) => (
                <div
                  key={pred.candidateId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{pred.candidateName}</div>
                    <div className="text-sm text-gray-600">
                      {dayNames[pred.recommendedDayOfWeek]} at {pred.recommendedHour}:00
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Expected Conversion</div>
                      <div className="font-semibold text-green-600">
                        {(pred.expectedConversionRate * 100).toFixed(1)}%
                      </div>
                    </div>
                    {getConfidenceBadge(pred.confidence)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Heatmap Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Send Time Performance Heatmap</CardTitle>
              <CardDescription>
                Visual representation of engagement patterns by day and hour
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHeatmap(!showHeatmap)}
            >
              {showHeatmap ? "Hide" : "Show"} Heatmap
            </Button>
          </div>
        </CardHeader>
        {showHeatmap && (
          <CardContent>
            {loadingHeatmap ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : heatmapData ? (
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div className="grid grid-cols-25 gap-1">
                    {/* Header row with hours */}
                    <div className="col-span-1"></div>
                    {Array.from({ length: 24 }, (_, i) => (
                      <div key={i} className="text-xs text-center font-semibold">
                        {i}
                      </div>
                    ))}

                    {/* Data rows */}
                    {dayNames.map((day, dayIdx) => (
                      <>
                        <div key={`day-${dayIdx}`} className="text-xs font-semibold pr-2">
                          {day.slice(0, 3)}
                        </div>
                        {Array.from({ length: 24 }, (_, hourIdx) => {
                          const cell = heatmapData.heatmap.find(
                            (h) => h.day === dayIdx && h.hour === hourIdx
                          );
                          const intensity = cell ? cell.conversionRate * 100 : 0;
                          const bgColor =
                            intensity > 5
                              ? "bg-green-500"
                              : intensity > 3
                              ? "bg-green-400"
                              : intensity > 1
                              ? "bg-green-300"
                              : intensity > 0
                              ? "bg-green-200"
                              : "bg-gray-100";

                          return (
                            <div
                              key={`${dayIdx}-${hourIdx}`}
                              className={`${bgColor} h-8 rounded cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all`}
                              title={`${day} ${hourIdx}:00 - ${intensity.toFixed(1)}% conversion (${cell?.sampleSize || 0} samples)`}
                            />
                          );
                        })}
                      </>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <span>Low</span>
                    <div className="flex gap-1">
                      <div className="w-6 h-4 bg-gray-100 rounded"></div>
                      <div className="w-6 h-4 bg-green-200 rounded"></div>
                      <div className="w-6 h-4 bg-green-300 rounded"></div>
                      <div className="w-6 h-4 bg-green-400 rounded"></div>
                      <div className="w-6 h-4 bg-green-500 rounded"></div>
                    </div>
                    <span>High Conversion</span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        )}
      </Card>

      {/* Model Training */}
      <Card>
        <CardHeader>
          <CardTitle>ML Model Management</CardTitle>
          <CardDescription>
            Update the prediction model with latest engagement data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => updateModelMutation.mutate()}
            disabled={updateModelMutation.isPending}
          >
            {updateModelMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating Model...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Update ML Model
              </>
            )}
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            Retrains the model using the latest workflow analytics and conversion data
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
