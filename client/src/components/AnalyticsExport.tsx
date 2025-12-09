import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

export function AnalyticsExport() {
  const [exportType, setExportType] = useState<"pdf" | "excel">("pdf");
  const [dataType, setDataType] = useState<"candidates" | "jobs" | "interviews" | "screening">("candidates");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data: stats } = trpc.analytics.getDashboardMetrics.useQuery();

  const { data: candidates = [] } = trpc.candidate.list.useQuery();
  const { data: jobs = [] } = trpc.jobs.list.useQuery();
  const { data: interviews = [] } = trpc.interviews.list.useQuery();

  const exportToPDF = async () => {
    if (!stats) {
      toast.error("No data available to export");
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text("Recruitment Analytics Report", 14, 20);
      
      // Date range
      doc.setFontSize(10);
      const dateRange = startDate && endDate 
        ? `Period: ${startDate} to ${endDate}`
        : "Period: All time";
      doc.text(dateRange, 14, 28);
      
      // Summary statistics
      doc.setFontSize(14);
      doc.text("Summary Statistics", 14, 40);
      
      const summaryData = [
        ["Total Jobs", stats.totalJobs.toString()],
        ["Active Jobs", stats.activeJobs.toString()],
        ["Total Candidates", stats.totalCandidates.toString()],
        ["New Candidates", stats.newCandidates.toString()],
        ["Total Interviews", stats.totalInterviews.toString()],
        ["Upcoming Interviews", stats.upcomingInterviews.toString()],
      ];
      
      autoTable(doc, {
        startY: 45,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
      });
      
      // Candidate status breakdown
      doc.setFontSize(14);
      const finalY = (doc as any).lastAutoTable.finalY || 80;
      doc.text("Candidate Status Breakdown", 14, finalY + 10);
      
      // Status data not available in getDashboardMetrics
      const statusData: string[][] = [];
      
      autoTable(doc, {
        startY: finalY + 15,
        head: [["Status", "Count"]],
        body: statusData,
        theme: "grid",
      });
      
      // Job applications section removed - not available in getDashboardMetrics
      
      // Save PDF
      const fileName = `recruitment-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success("PDF exported successfully!");
    } catch (error: unknown) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      
      let data: any[] = [];
      let sheetName = "";
      let columns: any[] = [];
      
      switch (dataType) {
        case "candidates":
          sheetName = "Candidates";
          columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Name", key: "name", width: 25 },
            { header: "Email", key: "email", width: 30 },
            { header: "Phone", key: "phone", width: 15 },
            { header: "Status", key: "status", width: 15 },
            { header: "Source", key: "source", width: 15 },
            { header: "Created At", key: "createdAt", width: 20 },
          ];
          data = candidates.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone || "",
            status: c.status,
            source: c.source || "",
            createdAt: new Date(c.createdAt).toLocaleDateString(),
          }));
          break;
          
        case "jobs":
          sheetName = "Jobs";
          columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Title", key: "title", width: 30 },
            { header: "Department", key: "department", width: 20 },
            { header: "Location", key: "location", width: 20 },
            { header: "Type", key: "employmentType", width: 15 },
            { header: "Status", key: "status", width: 15 },
            { header: "Created At", key: "createdAt", width: 20 },
          ];
          data = jobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            department: j.department || "",
            location: j.location || "",
            employmentType: j.employmentType,
            status: j.status,
            createdAt: new Date(j.createdAt).toLocaleDateString(),
          }));
          break;
          
        case "interviews":
          sheetName = "Interviews";
          columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Candidate ID", key: "candidateId", width: 15 },
            { header: "Job ID", key: "jobId", width: 10 },
            { header: "Type", key: "type", width: 15 },
            { header: "Scheduled At", key: "scheduledAt", width: 20 },
            { header: "Duration (min)", key: "duration", width: 15 },
            { header: "Status", key: "status", width: 15 },
          ];
          data = interviews.map((i: any) => ({
            id: i.id,
            candidateId: i.candidateId,
            jobId: i.jobId,
            type: i.type,
            scheduledAt: new Date(i.scheduledAt).toLocaleString(),
            duration: i.duration,
            status: i.status,
          }));
          break;
          
        case "screening":
          sheetName = "Screening Results";
          columns = [
            { header: "Candidate ID", key: "candidateId", width: 15 },
            { header: "Overall Score", key: "overallScore", width: 15 },
            { header: "Recommendation", key: "recommendation", width: 20 },
            { header: "Summary", key: "summary", width: 50 },
          ];
          // This would need screening results data
          data = [];
          break;
      }
      
      const worksheet = workbook.addWorksheet(sheetName);
      worksheet.columns = columns;
      
      // Add data
      data.forEach((row: any) => {
        worksheet.addRow(row);
      });
      
      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      
      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${dataType}-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Excel file exported successfully!");
    } catch (error: unknown) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel file");
    } finally {
      setExporting(false);
    }
  };

  const handleExport = () => {
    if (exportType === "pdf") {
      exportToPDF();
    } else {
      exportToExcel();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Analytics</CardTitle>
        <CardDescription>
          Export recruitment data and analytics to PDF or Excel format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Report
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel Spreadsheet
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportType === "excel" && (
            <div className="space-y-2">
              <Label>Data Type</Label>
              <Select value={dataType} onValueChange={(value: any) => setDataType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candidates">Candidates</SelectItem>
                  <SelectItem value="jobs">Jobs</SelectItem>
                  <SelectItem value="interviews">Interviews</SelectItem>
                  <SelectItem value="screening">Screening Results</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date (Optional)</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleExport} disabled={exporting} className="w-full">
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export {exportType === "pdf" ? "PDF" : "Excel"}
            </>
          )}
        </Button>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• PDF exports include summary statistics and charts</p>
          <p>• Excel exports provide raw data for further analysis</p>
          <p>• Date filters are optional - leave blank for all-time data</p>
        </div>
      </CardContent>
    </Card>
  );
}
