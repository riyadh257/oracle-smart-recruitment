import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Smartphone, Monitor, Send, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EmailTemplatePreviewProps {
  subject: string;
  bodyHtml: string;
  onSendTest?: (email: string) => Promise<void>;
}

export default function EmailTemplatePreview({ subject, bodyHtml, onSendTest }: EmailTemplatePreviewProps) {
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      if (onSendTest) {
        await onSendTest(testEmail);
      }
      toast.success(`Test email sent to ${testEmail}`);
      setIsDialogOpen(false);
      setTestEmail("");
    } catch (error: unknown) {
      toast.error("Failed to send test email");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Email Template Preview</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Send className="mr-2 h-4 w-4" />
                Send Test Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Test Email</DialogTitle>
                <DialogDescription>
                  Enter an email address to receive a test version of this template
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendTest} disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Test
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="desktop" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop">
              <Monitor className="mr-2 h-4 w-4" />
              Desktop
            </TabsTrigger>
            <TabsTrigger value="mobile">
              <Smartphone className="mr-2 h-4 w-4" />
              Mobile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="desktop" className="mt-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mx-auto max-w-2xl rounded-lg border bg-background shadow-sm">
                <div className="border-b bg-muted/50 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="text-sm text-muted-foreground">Subject:</div>
                    <div className="font-semibold">{subject || "No subject"}</div>
                  </div>
                </div>
                <div className="p-6">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: bodyHtml || "<p>No content</p>" }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="mt-4">
            <div className="flex justify-center rounded-lg border bg-muted/30 p-8">
              <div className="w-[375px] rounded-[2.5rem] border-[14px] border-black bg-black shadow-2xl">
                <div className="rounded-[1.5rem] overflow-hidden bg-background">
                  {/* Mobile status bar */}
                  <div className="bg-background px-6 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>9:41</span>
                      <div className="flex gap-1">
                        <div className="h-3 w-3 rounded-full bg-muted" />
                        <div className="h-3 w-3 rounded-full bg-muted" />
                        <div className="h-3 w-3 rounded-full bg-muted" />
                      </div>
                    </div>
                  </div>

                  {/* Email header */}
                  <div className="border-b bg-muted/50 px-4 py-3">
                    <div className="text-xs text-muted-foreground">Subject:</div>
                    <div className="mt-1 text-sm font-semibold line-clamp-2">
                      {subject || "No subject"}
                    </div>
                  </div>

                  {/* Email content */}
                  <div className="h-[600px] overflow-y-auto p-4">
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert [&_*]:text-sm"
                      dangerouslySetInnerHTML={{ __html: bodyHtml || "<p>No content</p>" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Preview Tips:</strong> This preview shows how your email will appear in
            different email clients. Actual rendering may vary slightly depending on the
            recipient's email provider and device.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
