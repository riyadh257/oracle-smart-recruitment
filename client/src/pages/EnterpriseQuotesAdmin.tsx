import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Download, Eye, Loader2, Search, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

type QuoteStatus = "pending" | "contacted" | "quoted" | "closed" | "rejected";

const statusColors: Record<QuoteStatus, string> = {
  pending: "bg-yellow-500",
  contacted: "bg-blue-500",
  quoted: "bg-purple-500",
  closed: "bg-green-500",
  rejected: "bg-red-500",
};

const statusLabels: Record<QuoteStatus, string> = {
  pending: "Pending",
  contacted: "Contacted",
  quoted: "Quoted",
  closed: "Closed",
  rejected: "Rejected",
};

export default function EnterpriseQuotesAdmin() {
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [companyNameFilter, setCompanyNameFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "companyName" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<QuoteStatus>("pending");
  const [updateNotes, setUpdateNotes] = useState("");

  const utils = trpc.useUtils();

  // Build filter object
  const filters = {
    status: statusFilter === "all" ? undefined : statusFilter,
    startDate: startDate ? new Date(startDate).getTime() : undefined,
    endDate: endDate ? new Date(endDate).getTime() : undefined,
    companyName: companyNameFilter || undefined,
    sortBy,
    sortOrder,
  };

  const { data: quotes = [], isLoading } = trpc.enterpriseQuotes.listWithFilters.useQuery(filters);
  const { data: statistics } = trpc.enterpriseQuotes.getStatistics.useQuery();

  const updateMutation = trpc.enterpriseQuotes.update.useMutation({
    onSuccess: () => {
      toast.success("Quote updated successfully");
      utils.enterpriseQuotes.listWithFilters.invalidate();
      utils.enterpriseQuotes.getStatistics.invalidate();
      setDetailDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update quote: ${error.message}`);
    },
  });

  const handleViewDetails = (quote: any) => {
    setSelectedQuote(quote);
    setUpdateStatus(quote.status);
    setUpdateNotes(quote.notes || "");
    setDetailDialogOpen(true);
  };

  const handleUpdateQuote = () => {
    if (!selectedQuote) return;
    
    updateMutation.mutate({
      id: selectedQuote.id,
      status: updateStatus,
      notes: updateNotes,
    });
  };

  const handleExportCSV = () => {
    if (quotes.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "ID",
      "Company Name",
      "Contact Name",
      "Email",
      "Phone",
      "Company Size",
      "Industry",
      "Expected Hires",
      "Status",
      "Created At",
    ];

    const rows = quotes.map((q) => [
      q.id,
      q.companyName,
      q.contactName,
      q.email,
      q.phone || "N/A",
      q.companySize,
      q.industry || "N/A",
      q.expectedHires || "N/A",
      q.status,
      new Date(q.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `enterprise-quotes-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setCompanyNameFilter("");
    setStartDate("");
    setEndDate("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Quote Requests</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track enterprise quote requests from potential clients
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{statistics.contacted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Quoted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{statistics.quoted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{statistics.closed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{statistics.rejected}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter and sort enterprise quote requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-filter">Company Name</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company-filter"
                    placeholder="Search company..."
                    value={companyNameFilter}
                    onChange={(e) => setCompanyNameFilter(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort-by">Sort By</Label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger id="sort-by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="companyName">Company Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort-order">Sort Order</Label>
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                  <SelectTrigger id="sort-order">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quotes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Quote Requests</CardTitle>
            <CardDescription>
              {quotes.length} {quotes.length === 1 ? "request" : "requests"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No quote requests found matching your filters
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell className="font-mono">{quote.id}</TableCell>
                        <TableCell className="font-medium">{quote.companyName}</TableCell>
                        <TableCell>{quote.contactName}</TableCell>
                        <TableCell>{quote.email}</TableCell>
                        <TableCell>{quote.companySize}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[quote.status as QuoteStatus]}>
                            {statusLabels[quote.status as QuoteStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(quote)}
                          >
                            <Eye className="h-4 w-4" />
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Quote Request Details</DialogTitle>
              <DialogDescription>
                View and update enterprise quote request information
              </DialogDescription>
            </DialogHeader>

            {selectedQuote && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Company Name</Label>
                    <p className="font-medium mt-1">{selectedQuote.companyName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Contact Name</Label>
                    <p className="font-medium mt-1">{selectedQuote.contactName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium mt-1">{selectedQuote.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium mt-1">{selectedQuote.phone || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Company Size</Label>
                    <p className="font-medium mt-1">{selectedQuote.companySize}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Industry</Label>
                    <p className="font-medium mt-1">{selectedQuote.industry || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Expected Hires/Year</Label>
                    <p className="font-medium mt-1">{selectedQuote.expectedHires || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created At</Label>
                    <p className="font-medium mt-1">
                      {new Date(selectedQuote.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedQuote.specialRequirements && (
                  <div>
                    <Label className="text-muted-foreground">Special Requirements</Label>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-md">
                      {selectedQuote.specialRequirements}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="update-status">Update Status</Label>
                  <Select value={updateStatus} onValueChange={(value) => setUpdateStatus(value as QuoteStatus)}>
                    <SelectTrigger id="update-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="update-notes">Internal Notes</Label>
                  <Textarea
                    id="update-notes"
                    placeholder="Add notes about this quote request..."
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateQuote} disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Update Quote
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
