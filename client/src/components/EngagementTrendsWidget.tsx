import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export function EngagementTrendsWidget() {
  const [, setLocation] = useLocation();
  
  const { data: trends, isLoading } = trpc.engagementTrends.getUserTrends.useQuery({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString()
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Engagement Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestTrend = trends;
  const previousTrend = null; // Would need historical data

  const accuracyChange = 0; // Would need historical comparison

  const isImproving = true;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Engagement Trends</CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setLocation("/engagement-trends")}
        >
          View All <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {latestTrend ? (
          <div className="space-y-4">
            <div>
              <div className="text-2xl font-bold">
                {latestTrend ? (latestTrend.overallAccuracy * 100).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">
                Prediction Accuracy (Last 7 Days)
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {isImproving ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${isImproving ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(accuracyChange * 100).toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                vs previous period
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <div className="text-lg font-semibold">
                  {latestTrend ? (latestTrend.averagePredictedOpenRate * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Predicted</p>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {latestTrend ? (latestTrend.averageActualOpenRate * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Actual</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No engagement data available</p>
        )}
      </CardContent>
    </Card>
  );
}
