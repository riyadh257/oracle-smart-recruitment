import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BarChart3,
  Download,
  Calendar,
  Loader2,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const REPORT_TYPES = [
  {
    value: "hiring_funnel",
    label: "Hiring Funnel Analysis",
    description: "Track application stages and conversion rates",
    metrics: ["Applications", "Screening", "Interviews", "Offers", "Conversion Rates"],
  },
  {
    value: "time_to_hire",
    label: "Time to Hire Report",
    description: "Analyze hiring speed and efficiency",
    metrics: ["Average Days", "Fastest Hire", "Slowest Hire", "Distribution"],
  },
  {
    value: "billing",
    label: "Billing Summary",
    description: "Financial overview of recruitment costs",
    metrics: ["Total Billed", "Total Paid", "Pending", "Billing Records"],
  },
];

export function ReportBuilder() {
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("hiring_funnel");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv">("pdf");
  const [generatingReport, setGeneratingReport] = useState(false);

  // Fetch archived reports
  const { data: archivedReports, isLoading: loadingReports, refetch: refetchReports } =
    trpc.reports.listArchived.useQuery();

  // Generate report mutation
  const generateMutation = trpc.reports.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Report generated successfully!");
      setGeneratingReport(false);
    },
    onError: (error) => {
      toast.error("Failed to generate report: " + error.message);
      setGeneratingReport(false);
    },
  });

  // Export report mutation
  const exportMutation = trpc.reports.export.useMutation({
    onSuccess: (data) => {
      toast.success("Report exported and saved!");
      refetchReports();
      
      // Open report in new tab
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error) => {
      toast.error("Failed to export report: " + error.message);
    },
  });

  const selectedReportType = REPORT_TYPES.find((rt) => rt.value === reportType);

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  const handleGenerateReport = async () => {
    if (!reportName.trim()) {
      toast.error("Please enter a report name");
      return;
    }

    setGeneratingReport(true);

    try {
      const reportConfig = {
        name: reportName,
        description: selectedReportType?.description || "",
        reportType: reportType as any,
        dateRange: {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end),
        },
        metrics: selectedMetrics.length > 0 ? selectedMetrics : selectedReportType?.metrics || [],
      };

      // Generate the report
      await generateMutation.mutateAsync(reportConfig);

      // Export it
      await exportMutation.mutateAsync({
        reportConfig,
        format: exportFormat,
      });

      setGeneratingReport(false);
    } catch (error: unknown) {
      setGeneratingReport(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Custom Report Builder
          </CardTitle>
          <CardDescription>
            Configure and generate custom recruitment analytics reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Name */}
          <div className="space-y-2">
            <Label>Report Name</Label>
            <Input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="e.g., Q1 2024 Hiring Performance"
            />
          </div>

          {/* Report Type */}
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedReportType && (
              <p className="text-sm text-gray-500">{selectedReportType.description}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Metrics Selection */}
          {selectedReportType && (
            <div className="space-y-2">
              <Label>Metrics to Include</Label>
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                {selectedReportType.metrics.map((metric) => (
                  <div key={metric} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric}
                      checked={selectedMetrics.includes(metric)}
                      onCheckedChange={() => handleMetricToggle(metric)}
                    />
                    <label
                      htmlFor={metric}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {metric}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Leave all unchecked to include all metrics
              </p>
            </div>
          )}

          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="flex gap-2">
              <Button
                variant={exportFormat === "pdf" ? "default" : "outline"}
                onClick={() => setExportFormat("pdf")}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant={exportFormat === "csv" ? "default" : "outline"}
                onClick={() => setExportFormat("csv")}
                className="flex-1"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={generatingReport || !reportName.trim()}
            className="w-full"
            size="lg"
          >
            {generatingReport ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate & Export Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report History */}
      <Card>
        <CardHeader>
          <CardTitle>Report Archive</CardTitle>
          <CardDescription>
            Access previously generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingReports ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : archivedReports && archivedReports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedReports.map((report: any) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>
                      {REPORT_TYPES.find((rt) => rt.value === report.reportType)?.label ||
                        report.reportType}
                    </TableCell>
                    <TableCell>{formatDate(report.generatedAt)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase">
                        {report.format}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (report.url) {
                            window.open(report.url, "_blank");
                          } else {
                            toast.info("Report URL not available");
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No reports generated yet</p>
              <p className="text-sm mt-1">
                Create your first report using the builder above
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
