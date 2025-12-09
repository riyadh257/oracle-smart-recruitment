import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Undo2,
  AlertCircle,
  Download,
  Upload,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

export default function ImportHistory() {
  const [importType, setImportType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [selectedImport, setSelectedImport] = useState<any>(null);
  const [rollbackReason, setRollbackReason] = useState("");

  const { data: imports, isLoading, refetch } = trpc.importHistory.list.useQuery({
    importType: importType || undefined,
    status: status || undefined,
    limit: 50,
  });

  const { data: statistics } = trpc.importHistory.statistics.useQuery();

  const rollbackMutation = trpc.importHistory.rollback.useMutation({
    onSuccess: () => {
      toast.success("Import rolled back successfully");
      setRollbackDialogOpen(false);
      setRollbackReason("");
      setSelectedImport(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Rollback failed: ${error.message}`);
    },
  });

  const handleRollback = () => {
    if (!selectedImport) return;

    rollbackMutation.mutate({
      id: selectedImport.id,
      reason: rollbackReason || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      completed: { variant: "default", icon: CheckCircle2 },
      failed: { variant: "destructive", icon: XCircle },
      processing: { variant: "secondary", icon: Clock },
      pending: { variant: "outline", icon: Clock },
      rolled_back: { variant: "secondary", icon: Undo2 },
    };

    const config = variants[status] || { variant: "outline", icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getSuccessRate = (recordsTotal: number, recordsSuccess: number) => {
    if (recordsTotal === 0) return 0;
    return Math.round((recordsSuccess / recordsTotal) * 100);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import History</h1>
        <p className="text-muted-foreground mt-2">
          Track all import operations with detailed statistics and rollback capability
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalImports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.totalImports > 0
                  ? Math.round((statistics.completedImports / statistics.totalImports) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.completedImports} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Imports</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.failedImports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Records Processed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalRecordsProcessed}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.totalRecordsSuccess} successful
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Import Type</Label>
              <Select value={importType} onValueChange={setImportType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="candidates">Candidates</SelectItem>
                  <SelectItem value="jobs">Jobs</SelectItem>
                  <SelectItem value="employees">Employees</SelectItem>
                  <SelectItem value="compliance_data">Compliance Data</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="rolled_back">Rolled Back</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Import Operations</CardTitle>
          <CardDescription>
            View detailed information about all import operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !imports || imports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No imports found</p>
              <p className="text-sm text-muted-foreground">
                Import operations will appear here once created
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Records</TableHead>
                    <TableHead className="text-right">Success</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead className="text-right">Success Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((importRecord) => (
                    <TableRow key={importRecord.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(importRecord.createdAt), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="capitalize">
                        {importRecord.importType.replace("_", " ")}
                      </TableCell>
                      <TableCell>{importRecord.fileName || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(importRecord.status)}</TableCell>
                      <TableCell className="text-right">{importRecord.recordsTotal}</TableCell>
                      <TableCell className="text-right">{importRecord.recordsSuccess}</TableCell>
                      <TableCell className="text-right">{importRecord.recordsError}</TableCell>
                      <TableCell className="text-right">
                        {getSuccessRate(importRecord.recordsTotal, importRecord.recordsSuccess)}%
                      </TableCell>
                      <TableCell>
                        {(importRecord.status === "completed" ||
                          importRecord.status === "failed") &&
                          importRecord.status !== "rolled_back" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedImport(importRecord);
                                setRollbackDialogOpen(true);
                              }}
                            >
                              <Undo2 className="h-4 w-4 mr-1" />
                              Rollback
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rollback Confirmation Dialog */}
      <Dialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback Import</DialogTitle>
            <DialogDescription>
              Are you sure you want to rollback this import? This action will mark the import as
              rolled back.
            </DialogDescription>
          </DialogHeader>

          {selectedImport && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Import Type:</span>
                  <span className="text-sm capitalize">
                    {selectedImport.importType.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">File Name:</span>
                  <span className="text-sm">{selectedImport.fileName || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Records:</span>
                  <span className="text-sm">
                    {selectedImport.recordsSuccess} / {selectedImport.recordsTotal}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rollback-reason">Reason for Rollback (Optional)</Label>
                <Textarea
                  id="rollback-reason"
                  placeholder="Enter reason for rollback..."
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRollbackDialogOpen(false);
                setRollbackReason("");
                setSelectedImport(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRollback}
              disabled={rollbackMutation.isPending}
            >
              {rollbackMutation.isPending ? "Rolling back..." : "Confirm Rollback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
