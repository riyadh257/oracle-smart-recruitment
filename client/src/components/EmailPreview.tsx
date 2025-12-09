import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Eye, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EmailPreview() {
  const [activeTab, setActiveTab] = useState("preview");
  
  const { data: previewData, isLoading } = trpc.emailPreview.generatePreview.useQuery();
  const sendTestEmail = trpc.emailPreview.sendTestEmail.useMutation({
    onSuccess: () => {
      toast.success("Test email sent successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to send test email: ${error.message}`);
    },
  });

  const handleSendTest = () => {
    sendTestEmail.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Digest Preview
            </CardTitle>
            <CardDescription>
              Preview what your daily digest email will look like
            </CardDescription>
          </div>
          <Button
            onClick={handleSendTest}
            disabled={sendTestEmail.isPending || isLoading}
            size="sm"
          >
            {sendTestEmail.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-40 bg-muted animate-pulse rounded" />
            <div className="h-40 bg-muted animate-pulse rounded" />
          </div>
        ) : previewData ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">
                <Eye className="mr-2 h-4 w-4" />
                Visual Preview
              </TabsTrigger>
              <TabsTrigger value="content">
                <Mail className="mr-2 h-4 w-4" />
                Sample Content
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={previewData.previewHtml}
                  className="w-full h-[600px]"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This is how your daily digest email will appear in your inbox
              </p>
            </TabsContent>

            <TabsContent value="content" className="mt-4">
              <div className="space-y-4">
                {Object.keys(previewData.sampleNotifications).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No recent notifications to preview.</p>
                    <p className="text-sm mt-2">
                      Your digest will show notifications from the past 24 hours.
                    </p>
                  </div>
                ) : (
                  <>
                    {Object.entries(previewData.sampleNotifications).map(([type, notifications]) => {
                      const typeTitle = type
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ");
                      
                      return (
                        <div key={type} className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">
                            {typeTitle} ({(notifications as any[]).length})
                          </h3>
                          <div className="space-y-2">
                            {(notifications as any[]).map((notif) => (
                              <div
                                key={notif.id}
                                className="p-3 bg-muted rounded-lg"
                              >
                                <p className="font-medium text-sm">{notif.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notif.body}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(notif.sentAt).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load preview
          </div>
        )}

        {previewData?.preferences && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-medium text-blue-900 mb-2">Current Settings</p>
            <div className="text-sm text-blue-700 space-y-1">
              <p>
                • Frequency: <strong>{previewData.preferences.frequency === "immediate" ? "Immediate" : "Daily Digest"}</strong>
              </p>
              <p>
                • Feedback Notifications: <strong>{previewData.preferences.feedbackSubmitted ? "Enabled" : "Disabled"}</strong>
              </p>
              <p>
                • Interview Notifications: <strong>{previewData.preferences.interviewScheduled ? "Enabled" : "Disabled"}</strong>
              </p>
              <p>
                • Status Change Notifications: <strong>{previewData.preferences.candidateStatusChange ? "Enabled" : "Disabled"}</strong>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
