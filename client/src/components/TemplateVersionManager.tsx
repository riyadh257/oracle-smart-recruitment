import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { History, RotateCcw, Check, X, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface TemplateVersionManagerProps {
  templateId: string;
}

export default function TemplateVersionManager({ templateId }: TemplateVersionManagerProps) {
  const [selectedVersions, setSelectedVersions] = useState<[number, number] | null>(null);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [versionToRollback, setVersionToRollback] = useState<number | null>(null);

  const { data: versions, isLoading, refetch } = trpc.emailTemplates.getVersions.useQuery({ templateId });
  const { data: comparison } = trpc.emailTemplates.compareVersions.useQuery(
    {
      templateId,
      currentVersion: selectedVersions?.[0] || 0,
      previousVersion: selectedVersions?.[1] || 0,
    },
    { enabled: !!selectedVersions }
  );

  const rollbackMutation = trpc.emailTemplates.rollbackVersion.useMutation({
    onSuccess: () => {
      toast.success("Successfully rolled back to previous version");
      setRollbackDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Rollback failed: ${error.message}`);
    },
  });

  const autoCheckMutation = trpc.emailTemplates.autoCheckRollback.useMutation({
    onSuccess: (result) => {
      if (result.rolledBack) {
        toast.warning(`Auto-rollback triggered: ${result.reason}`);
        refetch();
      } else {
        toast.success("Performance check passed - no rollback needed");
      }
    },
  });

  const handleRollback = () => {
    if (versionToRollback === null) return;
    rollbackMutation.mutate({
      templateId,
      targetVersion: versionToRollback,
      reason: "Manual rollback from version manager",
    });
  };

  const handleCompare = (v1: number, v2: number) => {
    setSelectedVersions([v1, v2]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No version history available for this template.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </h3>
          <p className="text-sm text-muted-foreground">
            Track template changes and rollback when needed
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => autoCheckMutation.mutate({ templateId })}
          disabled={autoCheckMutation.isPending}
        >
          {autoCheckMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Check Performance
            </>
          )}
        </Button>
      </div>

      {/* Version Timeline */}
      <div className="space-y-4">
        {versions.map((version: any, index: number) => (
          <Card key={version.id} className={version.isActive ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base">
                      Version {version.version}
                    </CardTitle>
                    {version.isActive && (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {format(new Date(version.createdAt), "PPpp")}
                    {version.notes && ` • ${version.notes}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {index < versions.length - 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompare(version.version, versions[index + 1].version)}
                    >
                      Compare
                    </Button>
                  )}
                  {!version.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setVersionToRollback(version.version);
                        setRollbackDialogOpen(true);
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Rollback
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h5 className="text-sm font-medium mb-2">Subject Line</h5>
                  <p className="text-sm text-muted-foreground">{version.subject}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Sent</p>
                    <p className="text-lg font-semibold">{version.totalSent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Open Rate</p>
                    <p className="text-lg font-semibold">{version.openRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Click Rate</p>
                    <p className="text-lg font-semibold">{version.clickRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              {version.totalSent > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Performance Score:</span>
                    <Badge variant={version.performanceScore >= 60 ? "default" : "secondary"}>
                      {version.performanceScore.toFixed(1)} / 100
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Version Comparison */}
      {comparison && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle>Version Comparison</CardTitle>
            <CardDescription>
              Comparing v{comparison.currentVersion.version} vs v{comparison.previousVersion.version}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Open Rate</span>
                    {comparison.performanceDelta.openRateDelta > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : comparison.performanceDelta.openRateDelta < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : null}
                  </div>
                  <p className="text-2xl font-bold">
                    {comparison.performanceDelta.openRateDelta > 0 ? "+" : ""}
                    {comparison.performanceDelta.openRateDelta.toFixed(1)}%
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Click Rate</span>
                    {comparison.performanceDelta.clickRateDelta > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : comparison.performanceDelta.clickRateDelta < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : null}
                  </div>
                  <p className="text-2xl font-bold">
                    {comparison.performanceDelta.clickRateDelta > 0 ? "+" : ""}
                    {comparison.performanceDelta.clickRateDelta.toFixed(1)}%
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Score</span>
                    {comparison.performanceDelta.scoreDelta > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : comparison.performanceDelta.scoreDelta < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : null}
                  </div>
                  <p className="text-2xl font-bold">
                    {comparison.performanceDelta.scoreDelta > 0 ? "+" : ""}
                    {comparison.performanceDelta.scoreDelta.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className={`rounded-lg p-4 ${
                comparison.recommendation === "rollback" 
                  ? "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                  : comparison.recommendation === "keep"
                  ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                  : "bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800"
              }`}>
                <div className="flex items-start gap-3">
                  {comparison.recommendation === "rollback" ? (
                    <X className="h-5 w-5 text-red-600 mt-0.5" />
                  ) : comparison.recommendation === "keep" ? (
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-semibold mb-1">
                      Recommendation: {comparison.recommendation === "rollback" ? "Rollback" : comparison.recommendation === "keep" ? "Keep Current Version" : "Collect More Data"}
                    </h4>
                    <p className="text-sm">{comparison.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rollback Confirmation Dialog */}
      <Dialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Rollback</DialogTitle>
            <DialogDescription>
              Are you sure you want to rollback to version {versionToRollback}? This will create a new version based on the selected version's content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRollback} disabled={rollbackMutation.isPending}>
              {rollbackMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rolling back...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Confirm Rollback
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
