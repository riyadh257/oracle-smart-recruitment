import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Trophy, BarChart3, Play, Pause, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function ABTestingDashboard() {
  const { user, loading: authLoading } = useAuth();

  const { data: experiments, isLoading } = trpc.abTesting.listExperiments.useQuery(undefined, {
    enabled: !!user,
  });

  const promoteWinnerMutation = trpc.abTesting.promoteWinner.useMutation({
    onSuccess: () => {
      toast.success("Winner promoted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to promote: ${error.message}`);
    },
  });

  const pauseExperimentMutation = trpc.abTesting.pauseExperiment.useMutation({
    onSuccess: () => {
      toast.success("Experiment paused");
    },
    onError: (error) => {
      toast.error(`Failed to pause: ${error.message}`);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 95) return <Badge className="bg-green-600">High Confidence</Badge>;
    if (confidence >= 80) return <Badge className="bg-yellow-600">Medium Confidence</Badge>;
    return <Badge variant="secondary">Low Confidence</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-blue-600"><Play className="h-3 w-3 mr-1" />Running</Badge>;
      case "paused":
        return <Badge variant="outline"><Pause className="h-3 w-3 mr-1" />Paused</Badge>;
      case "completed":
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="container py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">A/B Testing Dashboard</h1>
          <p className="text-slate-600">Compare variants and optimize your recruitment process</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !experiments || experiments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No active experiments</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {experiments.map((experiment) => (
              <Card key={experiment.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{experiment.name}</CardTitle>
                      <CardDescription>{experiment.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(experiment.status)}
                      {getConfidenceBadge(experiment.confidence)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Variant A */}
                    <div className={`p-6 rounded-lg border-2 ${experiment.winner === 'A' ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Variant A (Control)</h3>
                        {experiment.winner === 'A' && (
                          <Trophy className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Response Rate</span>
                            <span className="font-semibold">{experiment.variantA.responseRate}%</span>
                          </div>
                          <Progress value={experiment.variantA.responseRate} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Conversion Rate</span>
                            <span className="font-semibold">{experiment.variantA.conversionRate}%</span>
                          </div>
                          <Progress value={experiment.variantA.conversionRate} className="h-2" />
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Sample Size</span>
                            <span className="font-semibold">{experiment.variantA.sampleSize}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className={`p-6 rounded-lg border-2 ${experiment.winner === 'B' ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Variant B (Test)</h3>
                        {experiment.winner === 'B' && (
                          <Trophy className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Response Rate</span>
                            <span className="font-semibold">{experiment.variantB.responseRate}%</span>
                          </div>
                          <Progress value={experiment.variantB.responseRate} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Conversion Rate</span>
                            <span className="font-semibold">{experiment.variantB.conversionRate}%</span>
                          </div>
                          <Progress value={experiment.variantB.conversionRate} className="h-2" />
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Sample Size</span>
                            <span className="font-semibold">{experiment.variantB.sampleSize}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Comparison */}
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-900 mb-3">Performance Comparison</h4>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="flex items-center gap-2">
                        {experiment.variantB.responseRate > experiment.variantA.responseRate ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="text-xs text-slate-600">Response Lift</p>
                          <p className="font-semibold">
                            {((experiment.variantB.responseRate - experiment.variantA.responseRate) / experiment.variantA.responseRate * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {experiment.variantB.conversionRate > experiment.variantA.conversionRate ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="text-xs text-slate-600">Conversion Lift</p>
                          <p className="font-semibold">
                            {((experiment.variantB.conversionRate - experiment.variantA.conversionRate) / experiment.variantA.conversionRate * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-slate-600">Statistical Confidence</p>
                          <p className="font-semibold">{experiment.confidence}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    {experiment.status === 'running' && experiment.winner && experiment.confidence >= 95 && (
                      <Button
                        onClick={() => promoteWinnerMutation.mutate({ experimentId: experiment.id })}
                        disabled={promoteWinnerMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Promote Winner (Variant {experiment.winner})
                      </Button>
                    )}
                    {experiment.status === 'running' && (
                      <Button
                        variant="outline"
                        onClick={() => pauseExperimentMutation.mutate({ experimentId: experiment.id })}
                        disabled={pauseExperimentMutation.isPending}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Experiment
                      </Button>
                    )}
                    {experiment.status === 'running' && experiment.confidence < 95 && (
                      <p className="text-sm text-slate-600 flex items-center">
                        ⏳ Collecting more data to reach statistical significance...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
