import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Download,
  DollarSign,
  TrendingUp,
  Calendar,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function InvoiceDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<{
    start: Date;
    end: Date;
  }>(() => {
    // Default to current month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  });

  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Fetch billing summary
  const { data: billingSummary, isLoading: loadingSummary } =
    trpc.billing.getBillingSummary.useQuery();

  // Fetch billing records
  const { data: billingRecords, isLoading: loadingRecords, refetch: refetchRecords } =
    trpc.billing.getBillingRecords.useQuery();

  // Calculate billing for selected period
  const { data: periodBilling, isLoading: loadingPeriodBilling } =
    trpc.billing.calculateBilling.useQuery({
      periodStart: selectedPeriod.start,
      periodEnd: selectedPeriod.end,
    });

  // Generate invoice mutation
  const generateInvoiceMutation = trpc.billing.generateInvoice.useMutation({
    onSuccess: (data) => {
      toast.success("Invoice generated successfully!");
      setGeneratingInvoice(false);
      refetchRecords();
      
      // Open invoice in new tab
      if (data.invoiceUrl) {
        window.open(data.invoiceUrl, "_blank");
      }
    },
    onError: (error) => {
      toast.error("Failed to generate invoice: " + error.message);
      setGeneratingInvoice(false);
    },
  });

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true);
    await generateInvoiceMutation.mutateAsync({
      periodStart: selectedPeriod.start,
      periodEnd: selectedPeriod.end,
    });
  };

  const handlePeriodChange = (months: number) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - months, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - months + 1, 0);
    setSelectedPeriod({ start, end });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loadingSummary || loadingRecords) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Billed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(billingSummary?.totalBilled || 0)}
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(billingSummary?.totalPaid || 0)}
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(billingSummary?.totalPending || 0)}
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Generation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate New Invoice
          </CardTitle>
          <CardDescription>
            Select a billing period and generate an invoice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Period Selector */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePeriodChange(0)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Current Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePeriodChange(1)}
            >
              Last Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePeriodChange(2)}
            >
              2 Months Ago
            </Button>
          </div>

          {/* Selected Period Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Selected Period
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(selectedPeriod.start)} - {formatDate(selectedPeriod.end)}
                </p>
              </div>
              {periodBilling && !loadingPeriodBilling && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    Estimated Amount
                  </p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(periodBilling.totalAmount)}
                  </p>
                </div>
              )}
            </div>

            {periodBilling && !loadingPeriodBilling && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Qualified Applications</p>
                  <p className="text-sm font-medium">
                    {periodBilling.qualifiedApplications} × $50
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Scheduled Interviews</p>
                  <p className="text-sm font-medium">
                    {periodBilling.scheduledInterviews} × $25
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleGenerateInvoice}
            disabled={generatingInvoice || loadingPeriodBilling}
            className="w-full"
            size="lg"
          >
            {generatingInvoice ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Invoice...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Invoice
              </>
            )}
          </Button>

          {periodBilling && periodBilling.totalAmount === 0 && (
            <Alert>
              <AlertDescription>
                No billable activity found for this period. The invoice will show $0.00.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            View and download previously generated invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billingRecords && billingRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Interviews</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingRecords.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {formatDate(record.periodStart)} - {formatDate(record.periodEnd)}
                    </TableCell>
                    <TableCell>{record.qualifiedApplications || 0}</TableCell>
                    <TableCell>{record.scheduledInterviews || 0}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(record.totalAmount || 0)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {record.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // In production, this would download the actual invoice
                          toast.info("Invoice download feature coming soon");
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
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No invoices generated yet</p>
              <p className="text-sm mt-1">
                Generate your first invoice using the form above
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
