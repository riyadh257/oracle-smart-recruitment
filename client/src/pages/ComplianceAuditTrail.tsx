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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Search,
  Clock,
  User,
  FileEdit,
  Trash2,
  Plus,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Shield,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

export default function ComplianceAuditTrail() {
  const [entityType, setEntityType] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: logs, isLoading, refetch } = trpc.auditLog.list.useQuery({
    entityType: entityType || undefined,
    action: action || undefined,
    searchTerm: searchTerm || undefined,
    limit: 100,
  });

  const { data: statistics } = trpc.auditLog.statistics.useQuery({});

  const exportMutation = trpc.auditLog.exportCSV.useQuery(
    {
      entityType: entityType || undefined,
      action: action || undefined,
    },
    { enabled: false }
  );

  const handleExport = async () => {
    try {
      const result = await exportMutation.refetch();
      if (result.data) {
        const blob = new Blob([result.data.csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(`Exported ${result.data.recordCount} audit log entries`);
      }
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      create: { variant: "default", icon: Plus },
      update: { variant: "secondary", icon: FileEdit },
      delete: { variant: "destructive", icon: Trash2 },
      rollback: { variant: "outline", icon: RotateCcw },
      approve: { variant: "default", icon: CheckCircle2 },
      reject: { variant: "destructive", icon: XCircle },
    };

    const config = variants[action] || { variant: "outline", icon: FileEdit };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {action}
      </Badge>
    );
  };

  const viewDetails = (log: any) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const parseJSON = (jsonString: string | null) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Compliance Audit Trail
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete audit log of all compliance data changes for regulatory requirements
          </p>
        </div>
        <Button onClick={handleExport} disabled={exportMutation.isFetching}>
          <Download className="h-4 w-4 mr-2" />
          {exportMutation.isFetching ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalEntries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entity Types</CardTitle>
              <FileEdit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(statistics.byEntityType).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions Logged</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(statistics.byAction).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(statistics.byUser).length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="visa_compliance">Visa Compliance</SelectItem>
                  <SelectItem value="nitaqat_status">Nitaqat Status</SelectItem>
                  <SelectItem value="work_permit">Work Permit</SelectItem>
                  <SelectItem value="labor_law_config">Labor Law Config</SelectItem>
                  <SelectItem value="compliance_alert">Compliance Alert</SelectItem>
                  <SelectItem value="scheduled_report">Scheduled Report</SelectItem>
                  <SelectItem value="import_history">Import History</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="rollback">Rollback</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search audit logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>
            Complete history of all compliance-related data changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No audit logs found</p>
              <p className="text-sm text-muted-foreground">
                Audit entries will appear here when compliance data is modified
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Field Changed</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>{log.userId}</TableCell>
                      <TableCell className="capitalize">
                        {log.entityType.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>{log.entityId || "N/A"}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{log.fieldChanged || "N/A"}</TableCell>
                      <TableCell className="font-mono text-xs">{log.ipAddress || "N/A"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => viewDetails(log)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Complete information about this audit entry</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm">
                    {format(new Date(selectedLog.createdAt), "PPpp")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">User ID</Label>
                  <p className="text-sm">{selectedLog.userId}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Entity Type</Label>
                  <p className="text-sm capitalize">
                    {selectedLog.entityType.replace(/_/g, " ")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Entity ID</Label>
                  <p className="text-sm">{selectedLog.entityId || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Action</Label>
                  <div>{getActionBadge(selectedLog.action)}</div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Field Changed</Label>
                  <p className="text-sm">{selectedLog.fieldChanged || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="text-sm font-mono">{selectedLog.ipAddress || "N/A"}</p>
                </div>
              </div>

              {selectedLog.changeReason && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Change Reason</Label>
                  <p className="text-sm">{selectedLog.changeReason}</p>
                </div>
              )}

              {selectedLog.valueBefore && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Value Before</Label>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(parseJSON(selectedLog.valueBefore), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.valueAfter && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Value After</Label>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(parseJSON(selectedLog.valueAfter), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">User Agent</Label>
                  <p className="text-xs font-mono break-all">{selectedLog.userAgent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
