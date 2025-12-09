import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  PlayCircle,
  XCircle,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type OperationType = "bulk_email" | "bulk_status_update" | "bulk_interview_schedule" | "bulk_enrichment" | "bulk_export";
type OperationStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export default function BulkOperations() {
  const { user, loading: authLoading } = useAuth();
  const [operationType, setOperationType] = useState<OperationType>("bulk_email");
  const [itemIds, setItemIds] = useState("");
  const [parameters, setParameters] = useState("");
  const [statusFilter, setStatusFilter] = useState<OperationStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedOperationId, setSelectedOperationId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Fetch operations list
  const { data: operations, isLoading: operationsLoading } = trpc.bulkOperations.getBulkOperations.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    limit: 10,
  });

  // Fetch operation details
  const { data: details, isLoading: detailsLoading } = trpc.bulkOperations.getBulkOperationDetails.useQuery(
    { operationId: selectedOperationId || 0 },
    { enabled: !!selectedOperationId }
  );

  // Fetch operation stats
  const { data: stats, isLoading: statsLoading } = trpc.bulkOperations.getBulkOperationStats.useQuery();

  // Create operation mutation
  const createMutation = trpc.bulkOperations.createBulkOperation.useMutation({
    onSuccess: () => {
      toast.success("Bulk operation created successfully");
      utils.bulkOperations.getBulkOperations.invalidate();
      utils.bulkOperations.getBulkOperationStats.invalidate();
      setItemIds("");
      setParameters("");
    },
    onError: (error) => {
      toast.error(`Failed to create operation: ${error.message}`);
    },
  });

  // Cancel operation mutation
  const cancelMutation = trpc.bulkOperations.cancelBulkOperation.useMutation({
    onSuccess: () => {
      toast.success("Operation cancelled successfully");
      utils.bulkOperations.getBulkOperations.invalidate();
      utils.bulkOperations.getBulkOperationDetails.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to cancel operation: ${error.message}`);
    },
  });

  // Auto-refresh for active operations
  useEffect(() => {
    const interval = setInterval(() => {
      if (operations?.operations.some(op => op.status === "processing" || op.status === "pending")) {
        utils.bulkOperations.getBulkOperations.invalidate();
        utils.bulkOperations.getBulkOperationStats.invalidate();
        if (selectedOperationId) {
          utils.bulkOperations.getBulkOperationDetails.invalidate();
        }
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [operations, selectedOperationId, utils]);

  const handleCreate = () => {
    if (!itemIds.trim()) {
      toast.error("Please enter item IDs");
      return;
    }

    const ids = itemIds.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (ids.length === 0) {
      toast.error("Please enter valid item IDs");
      return;
    }

    let parsedParams = {};
    if (parameters.trim()) {
      try {
        parsedParams = JSON.parse(parameters);
      } catch (e) {
        toast.error("Invalid JSON in parameters field");
        return;
      }
    }

    createMutation.mutate({
      type: operationType,
      itemIds: ids,
      parameters: parsedParams,
    });
  };

  const handleCancel = (operationId: number) => {
    cancelMutation.mutate({ operationId });
  };

  const getStatusBadge = (status: OperationStatus) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-500"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getProgressPercentage = (operation: { totalItems: number; processedItems: number }) => {
    if (operation.totalItems === 0) return 0;
    return Math.round((operation.processedItems / operation.totalItems) * 100);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access bulk operations</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Bulk Operations Manager
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and monitor bulk operations with real-time progress tracking
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            utils.bulkOperations.getBulkOperations.invalidate();
            utils.bulkOperations.getBulkOperationStats.invalidate();
            toast.success("Refreshed");
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOperations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedOperations || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.failedOperations || 0} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Operations</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.processingOperations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground">
              Processed across all operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Operation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Bulk Operation</CardTitle>
          <CardDescription>
            Start a new bulk operation to process multiple items at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="operationType">Operation Type</Label>
              <Select value={operationType} onValueChange={(v) => setOperationType(v as OperationType)}>
                <SelectTrigger id="operationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulk_email">Bulk Email</SelectItem>
                  <SelectItem value="bulk_status_update">Bulk Status Update</SelectItem>
                  <SelectItem value="bulk_interview_schedule">Bulk Interview Schedule</SelectItem>
                  <SelectItem value="bulk_enrichment">Bulk Profile Enrichment</SelectItem>
                  <SelectItem value="bulk_export">Bulk Data Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemIds">Item IDs (comma-separated)</Label>
              <Input
                id="itemIds"
                placeholder="1, 2, 3, 4, 5"
                value={itemIds}
                onChange={(e) => setItemIds(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parameters">Parameters (JSON)</Label>
            <Textarea
              id="parameters"
              placeholder='{"subject": "Welcome", "template": "welcome_email"}'
              value={parameters}
              onChange={(e) => setParameters(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Create Operation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Operations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Operations Queue</CardTitle>
              <CardDescription>Monitor and manage bulk operations</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OperationStatus | "all")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {operationsLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : operations && operations.operations.length > 0 ? (
            <div className="space-y-4">
              {operations.operations.map((operation) => (
                <div
                  key={operation.id}
                  className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium capitalize">
                        {operation.type.replace(/_/g, " ")}
                      </span>
                      {getStatusBadge(operation.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOperationId(operation.id)}
                      >
                        View Details
                      </Button>
                      {(operation.status === "pending" || operation.status === "processing") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancel(operation.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Progress: {operation.processedItems} / {operation.totalItems} items
                      </span>
                      <span className="font-semibold">{getProgressPercentage(operation)}%</span>
                    </div>
                    <Progress value={getProgressPercentage(operation)} />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Success: </span>
                      <span className="text-green-600">{operation.successCount}</span>
                    </div>
                    <div>
                      <span className="font-medium">Failed: </span>
                      <span className="text-red-600">{operation.failureCount}</span>
                    </div>
                    <div>
                      <span className="font-medium">Created: </span>
                      <span>{new Date(operation.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {operation.completedAt && (
                    <div className="text-xs text-muted-foreground">
                      Completed: {new Date(operation.completedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {operations.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(operations.totalPages, p + 1))}
                  disabled={page === operations.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No operations found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operation Details Modal */}
      {selectedOperationId && details && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Operation Details</CardTitle>
                <CardDescription>
                  Operation #{details.operation.id} • {details.operation.type.replace(/_/g, " ")}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedOperationId(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(details.operation.status)}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Total Items</Label>
                <p className="text-lg font-semibold mt-1">{details.operation.totalItems}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Processed</Label>
                <p className="text-lg font-semibold mt-1">{details.operation.processedItems}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Success Rate</Label>
                <p className="text-lg font-semibold mt-1">
                  {details.operation.totalItems > 0
                    ? ((details.operation.successCount / details.operation.totalItems) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-semibold">{getProgressPercentage(details.operation)}%</span>
              </div>
              <Progress value={getProgressPercentage(details.operation)} />
            </div>

            {/* Items */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Operation Items</Label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {details.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-sm">Item #{item.itemId}</span>
                      {item.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {item.status === "failed" && <XCircle className="h-4 w-4 text-red-500" />}
                      {item.status === "pending" && <Clock className="h-4 w-4 text-yellow-500" />}
                    </div>
                    {item.errorMessage && (
                      <span className="text-xs text-red-500">{item.errorMessage}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Parameters */}
            {details.operation.parameters && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Parameters</Label>
                <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                  {JSON.stringify(details.operation.parameters, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
