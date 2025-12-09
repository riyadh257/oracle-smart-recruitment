import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Send, 
  Calendar, 
  Eye,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Briefcase,
  FileText,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Streamdown } from "streamdown";

/**
 * Email Digest Management Page
 * Configure and preview automated weekly summary emails
 */

export default function EmailDigest() {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState("");

  // Preview current week's digest
  const { data: digestPreview, isLoading: previewLoading, refetch: refetchPreview } = 
    trpc.emailDigest.previewWeeklyDigest.useQuery();

  // Get digest history
  const { data: digestHistory, isLoading: historyLoading, refetch: refetchHistory } = 
    trpc.emailDigest.getDigestHistory.useQuery({ limit: 10, offset: 0 });

  // Send digest mutation
  const sendDigestMutation = trpc.emailDigest.sendDigest.useMutation({
    onSuccess: () => {
      toast.success("Email digest sent successfully");
      refetchHistory();
      setRecipients([]);
    },
    onError: (error) => {
      toast.error(`Failed to send digest: ${error.message}`);
    },
  });

  const handleAddRecipient = () => {
    if (!newRecipient) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newRecipient)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (recipients.includes(newRecipient)) {
      toast.error("Email already added");
      return;
    }

    setRecipients([...recipients, newRecipient]);
    setNewRecipient("");
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSendDigest = () => {
    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    if (!digestPreview) {
      toast.error("No digest preview available");
      return;
    }

    sendDigestMutation.mutate({
      recipients,
      digestContent: digestPreview,
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Email Digest Reports</h1>
          <p className="text-muted-foreground mt-1">
            Automated weekly summaries for job health metrics, failed exports, and budget insights
          </p>
        </div>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Digest Preview</CardTitle>
                <CardDescription>
                  Preview of the current week's digest content
                </CardDescription>
              </div>
              <Button onClick={() => refetchPreview()} variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Refresh Preview
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {previewLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading preview...</p>
            ) : !digestPreview ? (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            ) : (
              <div className="space-y-6">
                {/* Period */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(digestPreview.period.startDate).toLocaleDateString()} - {new Date(digestPreview.period.endDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Job Health Metrics */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Job Health Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{digestPreview.jobHealthMetrics.activeJobs}</p>
                      <p className="text-sm text-muted-foreground">Active Jobs</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{digestPreview.jobHealthMetrics.filledPositions}</p>
                      <p className="text-sm text-muted-foreground">Filled Positions</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{digestPreview.jobHealthMetrics.newApplications}</p>
                      <p className="text-sm text-muted-foreground">New Applications</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{digestPreview.jobHealthMetrics.scheduledInterviews}</p>
                      <p className="text-sm text-muted-foreground">Scheduled Interviews</p>
                    </div>
                  </div>
                </div>

                {/* Failed Exports */}
                {digestPreview.failedExports.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Failed Export Attempts ({digestPreview.failedExports.length})
                    </h3>
                    <div className="space-y-2">
                      {digestPreview.failedExports.slice(0, 5).map((exp) => (
                        <div key={exp.id} className="p-3 border border-destructive rounded-lg bg-destructive/5">
                          <p className="font-medium">{exp.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {exp.exportType} • {exp.errorMessage || "Unknown error"}
                          </p>
                        </div>
                      ))}
                      {digestPreview.failedExports.length > 5 && (
                        <p className="text-sm text-muted-foreground">
                          ... and {digestPreview.failedExports.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Budget Insights */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Budget Insights
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold">{digestPreview.budgetInsights.totalScenarios}</p>
                      <p className="text-sm text-muted-foreground">Budget Scenarios</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold">
                        SAR {((digestPreview.budgetInsights.totalBudgetAllocated || 0) / 100).toFixed(0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{digestPreview.budgetInsights.averageROI}%</p>
                      <p className="text-sm text-muted-foreground">Average ROI</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{digestPreview.budgetInsights.activeAlerts}</p>
                      <p className="text-sm text-muted-foreground">Active Alerts</p>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    System Health
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-destructive">{digestPreview.systemHealth.jobFailures}</p>
                      <p className="text-sm text-muted-foreground">Job Failures</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{digestPreview.systemHealth.pendingExports}</p>
                      <p className="text-sm text-muted-foreground">Pending Exports</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{digestPreview.systemHealth.systemUptime}</p>
                      <p className="text-sm text-muted-foreground">System Uptime</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Send Digest Section */}
        <Card>
          <CardHeader>
            <CardTitle>Send Digest</CardTitle>
            <CardDescription>
              Configure recipients and send the weekly digest email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Add Recipient</Label>
              <div className="flex gap-2">
                <Input
                  id="recipient"
                  type="email"
                  placeholder="email@example.com"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddRecipient()}
                />
                <Button onClick={handleAddRecipient} variant="outline">
                  Add
                </Button>
              </div>
            </div>

            {recipients.length > 0 && (
              <div className="space-y-2">
                <Label>Recipients ({recipients.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {recipients.map((email) => (
                    <Badge key={email} variant="secondary">
                      {email}
                      <button
                        onClick={() => handleRemoveRecipient(email)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleSendDigest}
              disabled={recipients.length === 0 || sendDigestMutation.isPending || !digestPreview}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              {sendDigestMutation.isPending ? "Sending..." : "Send Digest Now"}
            </Button>
          </CardContent>
        </Card>

        {/* Digest History */}
        <Card>
          <CardHeader>
            <CardTitle>Digest History</CardTitle>
            <CardDescription>
              Previously sent email digests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading history...</p>
            ) : !digestHistory || digestHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No digest history</p>
            ) : (
              <div className="space-y-3">
                {digestHistory.map((digest) => (
                  <div key={digest.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{digest.emailSubject || "Weekly Digest"}</p>
                        <p className="text-sm text-muted-foreground">
                          Sent to: {digest.recipientEmail}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {digest.sentAt ? new Date(digest.sentAt).toLocaleString() : "Unknown"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={digest.deliveryStatus === "sent" ? "default" : "destructive"}>
                      {digest.deliveryStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
