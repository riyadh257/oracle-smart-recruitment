import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type DateRange = "7d" | "30d" | "90d" | "all";

export default function ExportHistory() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const utils = trpc.useUtils();

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    if (dateRange !== "all") {
      switch (dateRange) {
        case "7d":
          start.setDate(start.getDate() - 7);
          break;
        case "30d":
          start.setDate(start.getDate() - 30);
          break;
        case "90d":
          start.setDate(start.getDate() - 90);
          break;
      }
    }
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [dateRange]);

  // Fetch export history
  const { data: exports, isLoading, error } = dateRange === "all"
    ? trpc.phase26.exportHistory.getHistory.useQuery({ limit: 100 })
    : trpc.phase26.exportHistory.getByDateRange.useQuery({ startDate, endDate });

  // Fetch export analytics
  const { data: analytics } = trpc.phase26.exportHistory.getAnalytics.useQuery({
    days: dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365,
  });

  // Download mutation
  const downloadMutation = trpc.phase26.exportHistory.download.useMutation({
    onSuccess: (data) => {
      // Open file in new tab
      window.open(data.fileUrl, "_blank");
      toast.success("Export file opened");
      utils.phase26.exportHistory.getHistory.invalidate();
      utils.phase26.exportHistory.getByDateRange.invalidate();
      utils.phase26.exportHistory.getAnalytics.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to download export");
    },
  });

  const getFileIcon = (exportType: string) => {
    switch (exportType) {
      case "csv":
        return FileText;
      case "excel":
        return FileSpreadsheet;
      case "pdf":
        return FileText;
      default:
        return File;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      completed: { variant: "default", icon: CheckCircle },
      processing: { variant: "secondary", icon: Clock },
      failed: { variant: "destructive", icon: XCircle },
      pending: { variant: "outline", icon: Clock },
      expired: { variant: "outline", icon: AlertCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString();
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const handleDownload = (exportId: number) => {
    downloadMutation.mutate({ id: exportId });
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load export history. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalExports = analytics?.summary?.totalExports ? Number(analytics.summary.totalExports) : 0;
  const totalDownloads = analytics?.summary?.totalDownloads ? Number(analytics.summary.totalDownloads) : 0;
  const csvCount = analytics?.summary?.csvCount ? Number(analytics.summary.csvCount) : 0;
  const pdfCount = analytics?.summary?.pdfCount ? Number(analytics.summary.pdfCount) : 0;
  const excelCount = analytics?.summary?.excelCount ? Number(analytics.summary.excelCount) : 0;
  const totalRecords = analytics?.summary?.totalRecords ? Number(analytics.summary.totalRecords) : 0;
  const avgProcessingTime = analytics?.summary?.avgProcessingTime ? Number(analytics.summary.avgProcessingTime) : 0;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Export History</h1>
          <p className="text-muted-foreground mt-1">
            Track data exports, downloads, and file expiration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Exports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExports.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalRecords.toLocaleString()} records exported
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDownloads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {totalExports > 0 ? (totalDownloads / totalExports).toFixed(1) : "0"} per export
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Format Breakdown</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CSV:</span>
                <span className="font-semibold">{csvCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">PDF:</span>
                <span className="font-semibold">{pdfCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Excel:</span>
                <span className="font-semibold">{excelCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgProcessingTime < 1000
                ? `${avgProcessingTime.toFixed(0)}ms`
                : `${(avgProcessingTime / 1000).toFixed(1)}s`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              per export file
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Table */}
      <Card>
        <CardHeader>
          <CardTitle>Export Files</CardTitle>
          <CardDescription>
            Files are automatically deleted 7 days after creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports && exports.length > 0 ? (
                  exports.map((exportRecord) => {
                    const FileIcon = getFileIcon(exportRecord.exportType);
                    const expired = isExpired(exportRecord.expiresAt);

                    return (
                      <TableRow key={exportRecord.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-xs">{exportRecord.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="uppercase">{exportRecord.exportType}</TableCell>
                        <TableCell className="capitalize">
                          {exportRecord.dataType.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>{getStatusBadge(exportRecord.status)}</TableCell>
                        <TableCell>{formatFileSize(exportRecord.fileSize)}</TableCell>
                        <TableCell>{exportRecord.recordCount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3 text-muted-foreground" />
                            <span>{exportRecord.downloadCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(exportRecord.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {expired ? (
                            <span className="text-red-600">Expired</span>
                          ) : (
                            <span className="text-muted-foreground">
                              {formatDate(exportRecord.expiresAt)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(exportRecord.id)}
                            disabled={
                              downloadMutation.isPending ||
                              exportRecord.status !== "completed" ||
                              expired
                            }
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No exports found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Data Type Analytics */}
      {analytics?.byDataType && analytics.byDataType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Export Analytics by Data Type</CardTitle>
            <CardDescription>Most frequently exported data categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.byDataType.map((item) => {
                const totalExportsForType = Number(item.totalExports);
                const percentage = totalExports > 0 ? (totalExportsForType / totalExports) * 100 : 0;

                return (
                  <div key={item.dataType} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">
                        {item.dataType.replace(/_/g, " ")}
                      </span>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>{totalExportsForType} exports</span>
                        <span>{Number(item.totalDownloads)} downloads</span>
                        <span>{Number(item.totalRecords).toLocaleString()} records</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
