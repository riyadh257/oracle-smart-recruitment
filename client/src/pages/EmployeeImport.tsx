import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function EmployeeImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  const uploadCSVMutation = trpc.visaCompliance.import.uploadCSV.useMutation();
  const uploadExcelMutation = trpc.visaCompliance.import.uploadExcel.useMutation();
  const { data: template } = trpc.visaCompliance.import.getTemplate.useQuery();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportResult(null);
    }
  };
  
  const handleDownloadTemplate = () => {
    if (!template) return;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("Template downloaded successfully");
  };
  
  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }
    
    setImporting(true);
    setImportResult(null);
    
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        const text = await file.text();
        const result = await uploadCSVMutation.mutateAsync({
          fileContent: text,
          employerId: 1, // TODO: Get from context
        });
        setImportResult(result);
        
        if (result.success) {
          toast.success(`Successfully imported ${result.successCount} employees`);
        } else {
          toast.error(`Import completed with ${result.errorCount} errors`);
        }
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        const result = await uploadExcelMutation.mutateAsync({
          fileBuffer: base64,
          employerId: 1, // TODO: Get from context
        });
        setImportResult(result);
        
        if (result.success) {
          toast.success(`Successfully imported ${result.successCount} employees`);
        } else {
          toast.error(`Import completed with ${result.errorCount} errors`);
        }
      } else {
        toast.error("Unsupported file format. Please use CSV or Excel files.");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import employees");
    } finally {
      setImporting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Employee Bulk Import</h1>
        <p className="text-muted-foreground">
          Upload CSV or Excel files to import employee and visa compliance data in bulk
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload File
            </CardTitle>
            <CardDescription>
              Select a CSV or Excel file containing employee data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">Click to upload</p>
                  <p className="text-sm text-muted-foreground">CSV or Excel files</p>
                </div>
              </label>
              
              {file && (
                <div className="mt-4 p-3 bg-secondary rounded-md">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full"
            >
              {importing ? "Importing..." : "Import Employees"}
            </Button>
          </CardContent>
        </Card>
        
        {/* Template Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Template
            </CardTitle>
            <CardDescription>
              Get the CSV template with sample data and column headers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Required Columns:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• firstName, lastName (required)</li>
                <li>• email, phoneNumber</li>
                <li>• nationality, jobTitle, department</li>
                <li>• employmentStatus (active/on_leave/terminated/suspended)</li>
                <li>• hireDate (YYYY-MM-DD)</li>
                <li>• isSaudiNational (yes/no)</li>
                <li>• documentType, documentNumber</li>
                <li>• issueDate, expiryDate (YYYY-MM-DD)</li>
              </ul>
            </div>
            
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Import Results */}
      {importResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="text-2xl font-bold">{importResult.totalRows}</p>
                <p className="text-sm text-muted-foreground">Total Rows</p>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{importResult.successCount}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <div className="text-center p-4 bg-destructive/10 rounded-lg">
                <p className="text-2xl font-bold text-destructive">{importResult.errorCount}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
            
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Errors:</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {importResult.errors.map((error: any, index: number) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Row {error.row}, Field "{error.field}": {error.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
            
            {importResult.success && importResult.importedEmployeeIds.length > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Successfully imported {importResult.importedEmployeeIds.length} employees.
                  You can now view them in the Visa Compliance Dashboard.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
