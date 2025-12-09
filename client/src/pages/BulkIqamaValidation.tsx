import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BulkIqamaValidation() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processCsvMutation = trpc.ksaCompliance.workPermits.processBulkIqamaCsv.useMutation({
    onSuccess: (data) => {
      setValidationResults(data);
      setIsProcessing(false);
      toast.success(`Processed ${data.totalProcessed} Iqama numbers`);
    },
    onError: (error) => {
      setIsProcessing(false);
      toast.error(`Validation failed: ${error.message}`);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setCsvFile(file);
      setValidationResults(null);
    }
  };

  const handleUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file first');
      return;
    }

    setIsProcessing(true);
    
    try {
      const text = await csvFile.text();
      processCsvMutation.mutate({ csvContent: text });
    } catch (error) {
      setIsProcessing(false);
      toast.error('Failed to read CSV file');
    }
  };

  const downloadTemplate = () => {
    const template = 'iqamaNumber,employeeName,expiryDate\n2123456789,Ahmed Ali,2025-12-31\n1987654321,Mohammed Hassan,2024-06-15';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'iqama_validation_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Expiring Soon</Badge>;
      case 'expired':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Iqama Validation</h1>
        <p className="text-muted-foreground mt-2">
          Upload a CSV file to validate multiple employee Iqama numbers at once
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {validationResults?.totalProcessed || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Valid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {validationResults?.validCount || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Critical (≤30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {validationResults?.criticalCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Upload a CSV file with columns: iqamaNumber, employeeName, expiryDate (YYYY-MM-DD format)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Need a template? <button onClick={downloadTemplate} className="underline font-medium">Download CSV template</button>
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  {csvFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-6 h-6" />
                      <span className="font-medium">{csvFile.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to select CSV file or drag and drop
                      </p>
                    </div>
                  )}
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={!csvFile || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Validate Iqama Numbers'}
          </Button>
        </CardContent>
      </Card>

      {validationResults && validationResults.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>
              {validationResults.invalidCount > 0 && (
                <span className="text-red-600 font-medium">
                  {validationResults.invalidCount} invalid Iqama numbers found
                </span>
              )}
              {validationResults.expiringCount > 0 && (
                <span className="text-yellow-600 font-medium ml-4">
                  {validationResults.expiringCount} expiring within 90 days
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Iqama Number</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Until Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Warnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResults.results.map((result: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{result.iqamaNumber}</TableCell>
                      <TableCell>{result.employeeName}</TableCell>
                      <TableCell>{new Date(result.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {result.daysUntilExpiry >= 0 ? (
                          <span className={result.daysUntilExpiry <= 30 ? 'text-red-600 font-bold' : result.daysUntilExpiry <= 90 ? 'text-yellow-600 font-medium' : ''}>
                            {result.daysUntilExpiry} days
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold">Expired</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(result.status)}</TableCell>
                      <TableCell>
                        {result.warnings.length > 0 ? (
                          <div className="space-y-1">
                            {result.warnings.map((warning: string, i: number) => (
                              <div key={i} className="text-sm text-muted-foreground flex items-start gap-1">
                                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
