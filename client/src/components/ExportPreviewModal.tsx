import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, FileText, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

interface ExportFilter {
  field: string;
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "between" | "in";
  value: any;
}

interface ExportColumn {
  field: string;
  label: string;
  format?: string;
}

interface ExportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: "candidates" | "interviews" | "feedback" | "analytics" | "campaigns" | "jobs" | "applications";
  filters: ExportFilter[];
  columns: ExportColumn[];
  format: "csv" | "pdf" | "excel";
  onConfirm: () => void;
}

export function ExportPreviewModal({
  open,
  onOpenChange,
  template,
  filters,
  columns,
  format,
  onConfirm,
}: ExportPreviewModalProps) {
  const { data: preview, isLoading, refetch } = trpc.exportPreview.previewExport.useQuery(
    {
      template,
      filters,
      columns,
      format,
    },
    {
      enabled: open,
    }
  );

  // Refetch when modal opens or inputs change
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, template, filters, columns, format, refetch]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Preview
          </DialogTitle>
          <DialogDescription>
            Review your export data before scheduling. This preview shows the first 5 rows that match your filters.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading preview...</span>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground">Total Rows</div>
                <div className="mt-1 text-2xl font-bold">{preview.totalCount.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground">Estimated Size</div>
                <div className="mt-1 text-2xl font-bold">{formatFileSize(preview.estimatedSize)}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium text-muted-foreground">Format</div>
                <div className="mt-1 text-2xl font-bold uppercase">{format}</div>
              </div>
            </div>

            {/* Warnings */}
            {preview.warnings && preview.warnings.length > 0 && (
              <div className="space-y-2">
                {preview.warnings.map((warning, index) => (
                  <Alert key={index} variant={preview.totalCount === 0 ? "destructive" : "default"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Success indicator */}
            {preview.success && preview.totalCount > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Export configuration is valid and ready to schedule.
                </AlertDescription>
              </Alert>
            )}

            {/* Sample Data Table */}
            {preview.sampleRows && preview.sampleRows.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Sample Data (First 5 Rows)</h3>
                  <Badge variant="outline">{preview.sampleRows.length} rows shown</Badge>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(preview.sampleRows[0] || {}).map((key) => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.sampleRows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {Object.values(row).map((value, cellIndex) => (
                            <TableCell key={cellIndex} className="max-w-xs truncate">
                              {value !== null && value !== undefined
                                ? typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)
                                : "-"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* No data message */}
            {preview.totalCount === 0 && (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Data Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  No records match your current filter criteria. Please adjust your filters and try again.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!preview.success || preview.totalCount === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Confirm & Schedule Export
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Preview Unavailable</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Unable to generate export preview. Please check your configuration and try again.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
