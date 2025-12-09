import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ComplianceReports() {
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  
  const generatePDFMutation = trpc.visaCompliance.export.generatePDF.useMutation();
  const generateExcelMutation = trpc.visaCompliance.export.generateExcel.useMutation();
  
  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    
    try {
      const result = await generatePDFMutation.mutateAsync({
        employerId: 1, // TODO: Get from context
      });
      
      // Convert base64 to blob and download
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setGeneratingPDF(false);
    }
  };
  
  const handleGenerateExcel = async () => {
    setGeneratingExcel(true);
    
    try {
      const result = await generateExcelMutation.mutateAsync({
        employerId: 1, // TODO: Get from context
      });
      
      // Convert base64 to blob and download
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Excel report generated successfully");
    } catch (error) {
      console.error("Excel generation error:", error);
      toast.error("Failed to generate Excel report");
    } finally {
      setGeneratingExcel(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Compliance Reports</h1>
        <p className="text-muted-foreground">
          Export comprehensive compliance audit reports with charts and alert history
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* PDF Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              PDF Report
            </CardTitle>
            <CardDescription>
              Generate a formatted PDF report with charts and visualizations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Report Includes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Compliance overview metrics</li>
                <li>• Active alerts by severity</li>
                <li>• Expiring documents (next 30 days)</li>
                <li>• Formatted tables and charts</li>
                <li>• Company branding and timestamp</li>
              </ul>
            </div>
            
            <Button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="w-full"
            >
              {generatingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate PDF Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* Excel Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Excel Report
            </CardTitle>
            <CardDescription>
              Generate an Excel workbook with multiple sheets of detailed data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Report Includes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Overview sheet with key metrics</li>
                <li>• Active alerts with full details</li>
                <li>• Expiring documents list</li>
                <li>• 90-day compliance trends</li>
                <li>• Filterable and sortable data</li>
              </ul>
            </div>
            
            <Button
              onClick={handleGenerateExcel}
              disabled={generatingExcel}
              className="w-full"
              variant="outline"
            >
              {generatingExcel ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Excel...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Excel Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Generate reports monthly for audit compliance</li>
                <li>• Share PDF reports with management</li>
                <li>• Use Excel for detailed data analysis</li>
                <li>• Archive reports for historical tracking</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Report Contents</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real-time data from compliance database</li>
                <li>• Automatically calculated metrics</li>
                <li>• Alert history and severity levels</li>
                <li>• Document expiration forecasts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
