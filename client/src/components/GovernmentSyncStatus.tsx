import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

export function GovernmentSyncStatus() {
  const { data: latestSync, refetch, isLoading } = trpc.compliance.getLatestSync.useQuery();
  const { data: syncHistory } = trpc.compliance.getSyncHistory.useQuery();

  const triggerSyncMutation = trpc.compliance.triggerSync.useMutation({
    onSuccess: () => {
      toast.success("Sync initiated successfully");
      setTimeout(() => refetch(), 2000); // Refetch after 2 seconds
    },
    onError: (error) => {
      toast.error(error.message || "Failed to trigger sync");
    },
  });

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>MHRSD/Qiwa Sync Status</CardTitle>
            <CardDescription>Real-time government data synchronization</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => triggerSyncMutation.mutate()}
            disabled={triggerSyncMutation.isPending || latestSync?.syncStatus === "in_progress"}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${triggerSyncMutation.isPending ? "animate-spin" : ""}`} />
            Sync Now
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {latestSync ? (
          <>
            {/* Latest Sync Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getSyncStatusIcon(latestSync.syncStatus)}
                <div>
                  <p className="font-medium">
                    {latestSync.syncStatus === "success"
                      ? "Synced Successfully"
                      : latestSync.syncStatus === "in_progress"
                      ? "Sync in Progress..."
                      : latestSync.syncStatus === "failed"
                      ? "Sync Failed"
                      : "Pending Sync"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last sync: {new Date(latestSync.lastSyncAt!).toLocaleString()}
                  </p>
                </div>
              </div>
              <Badge className={getSyncStatusColor(latestSync.syncStatus)}>
                {latestSync.syncStatus.replace("_", " ")}
              </Badge>
            </div>

            {/* Sync Details */}
            {latestSync.syncStatus === "success" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Records Synced</p>
                  <p className="text-2xl font-bold">{latestSync.recordsSynced || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold">{latestSync.syncDuration || 0}s</p>
                </div>
              </div>
            )}

            {latestSync.errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{latestSync.errorMessage}</p>
              </div>
            )}

            {/* Next Scheduled Sync */}
            {latestSync.nextScheduledSync && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  Next scheduled sync: {new Date(latestSync.nextScheduledSync).toLocaleString()}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No sync history available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Sync Now" to initiate your first sync
            </p>
          </div>
        )}

        {/* Recent Sync History */}
        {syncHistory && syncHistory.length > 1 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recent Sync History</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {syncHistory.slice(0, 5).map((sync: any) => (
                <div
                  key={sync.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    {getSyncStatusIcon(sync.syncStatus)}
                    <span className="text-muted-foreground">
                      {new Date(sync.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {sync.syncType}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
