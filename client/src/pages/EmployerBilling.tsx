import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { InvoiceDashboard } from "@/components/InvoiceDashboard";

export default function EmployerBilling() {
  const [, setLocation] = useLocation();

  const { data: billingRecords, isLoading } = trpc.billing.getBillingRecords.useQuery();
  const { data: summary } = trpc.billing.getBillingSummary.useQuery();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "overdue": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "overdue": return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/employer/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              Pay-for-Performance Billing
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Invoice Dashboard */}
        <div className="mb-8">
          <InvoiceDashboard />
        </div>

        {/* Value Proposition Banner */}
        <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">Only Pay for Quality Results</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Unlike traditional platforms that charge upfront regardless of outcomes, Oracle Smart Recruitment uses
                  <strong className="text-green-700"> pay-for-performance pricing</strong>. You only pay when we deliver qualified candidates
                  who meet your standards—measured by interview completion, offer acceptance, or successful hires.
                </p>
                <div className="grid md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-green-600 rounded-full"></div>
                    <span className="text-slate-700">Pay per qualified application</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                    <span className="text-slate-700">Bonus for successful hires</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                    <span className="text-slate-700">No upfront subscription fees</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Summary */}
        {summary && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Billed</p>
                    <p className="text-2xl font-bold text-slate-900">${summary.totalBilled.toFixed(2)}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Paid</p>
                    <p className="text-2xl font-bold text-green-900">${summary.totalPaid.toFixed(2)}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">${summary.totalPending.toFixed(2)}</p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Quality Hires</p>
                    <p className="text-2xl font-bold text-purple-900">{summary.qualityHires}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Model Explanation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How Pay-for-Performance Works</CardTitle>
            <CardDescription>
              Our transparent pricing model aligns our success with yours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-slate-900 mb-2">Qualified Application</h4>
                <p className="text-2xl font-bold text-blue-600 mb-2">$50</p>
                <p className="text-sm text-slate-600">
                  Charged when a candidate with 80%+ match score applies and completes the application
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-slate-900 mb-2">Interview Scheduled</h4>
                <p className="text-2xl font-bold text-green-600 mb-2">$100</p>
                <p className="text-sm text-slate-600">
                  Additional fee when you schedule an interview with our matched candidate
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-slate-900 mb-2">Successful Hire</h4>
                <p className="text-2xl font-bold text-purple-600 mb-2">$500</p>
                <p className="text-sm text-slate-600">
                  Bonus fee when you successfully hire a candidate we matched (30-day retention required)
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700">
                <strong>Example:</strong> If you hire a candidate through our platform, your total cost would be $650
                ($50 + $100 + $500). Compare this to traditional recruiters charging 15-25% of annual salary
                (typically $15,000-$25,000 for a $100k position).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Billing Records */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              View all your pay-for-performance transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-slate-600">Loading billing records...</p>
              </div>
            ) : billingRecords && billingRecords.length > 0 ? (
              <div className="space-y-3">
                {billingRecords.map((record: any) => (
                  <Card key={record.id} className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 capitalize">
                                {record.eventType.replace('_', ' ')}
                              </p>
                              <p className="text-sm text-slate-600">
                                {new Date(record.createdAt).toLocaleDateString()} at{' '}
                                {new Date(record.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          {record.description && (
                            <p className="text-sm text-slate-600 ml-13">{record.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-slate-900">${record.amount.toFixed(2)}</p>
                            {record.qualityScore && (
                              <p className="text-xs text-slate-600">Quality: {record.qualityScore}%</p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize flex items-center gap-1 ${getStatusColor(record.status)}`}>
                            {getStatusIcon(record.status)}
                            {record.status}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No billing records yet</h3>
                <p className="text-slate-600 mb-4">
                  Start receiving qualified applications to see your pay-for-performance charges
                </p>
                <Button onClick={() => setLocation("/employer/jobs/create")}>
                  Post Your First Job
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
