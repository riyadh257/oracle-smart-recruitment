import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, Clock, Send, Loader2, Sparkles, X, Eye } from "lucide-react";
import { format } from "date-fns";

export default function EmailScheduler() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [emailType, setEmailType] = useState("custom");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [recipientType, setRecipientType] = useState<"all_candidates" | "matched_candidates" | "specific_job" | "custom_list">("all_candidates");
  const [scheduledFor, setScheduledFor] = useState("");
  const [useSmartTiming, setUseSmartTiming] = useState(false);

  const { data: schedules, isLoading, refetch } = trpc.emailScheduling.list.useQuery();
  const { data: smartTiming } = trpc.emailScheduling.getSmartTiming.useQuery(
    { emailType, preferredDate: scheduledFor || undefined },
    { enabled: useSmartTiming && !!emailType }
  );

  const createSchedule = trpc.emailScheduling.create.useMutation({
    onSuccess: () => {
      toast.success("Email campaign scheduled successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to schedule: ${error.message}`);
    },
  });

  const cancelSchedule = trpc.emailScheduling.cancel.useMutation({
    onSuccess: () => {
      toast.success("Schedule cancelled");
      refetch();
    },
  });

  const resetForm = () => {
    setName("");
    setEmailType("custom");
    setSubject("");
    setBodyHtml("");
    setRecipientType("all_candidates");
    setScheduledFor("");
    setUseSmartTiming(false);
  };

  const handleCreate = () => {
    if (!name.trim() || !subject.trim() || !bodyHtml.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    createSchedule.mutate({
      name,
      emailType,
      subject,
      bodyHtml,
      recipientType,
      scheduledFor: scheduledFor || undefined,
      useSmartTiming,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      scheduled: { variant: "default", label: "Scheduled" },
      sending: { variant: "default", label: "Sending" },
      sent: { variant: "outline", label: "Sent" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Campaign Scheduler</h2>
          <p className="text-muted-foreground">
            Schedule email campaigns with smart send-time optimization
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule Email Campaign</DialogTitle>
              <DialogDescription>
                Create and schedule an email campaign with optional smart timing
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Weekly Job Matches"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailType">Email Type</Label>
                  <Select value={emailType} onValueChange={setEmailType}>
                    <SelectTrigger id="emailType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interview_invite">Interview Invite</SelectItem>
                      <SelectItem value="job_match">Job Match</SelectItem>
                      <SelectItem value="application_update">Application Update</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyHtml">Email Content (HTML)</Label>
                <Textarea
                  id="bodyHtml"
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  placeholder="Enter email HTML content"
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientType">Recipients</Label>
                <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
                  <SelectTrigger id="recipientType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_candidates">All Candidates</SelectItem>
                    <SelectItem value="matched_candidates">Matched Candidates</SelectItem>
                    <SelectItem value="specific_job">Specific Job</SelectItem>
                    <SelectItem value="custom_list">Custom List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="smartTiming" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Smart Send-Time Optimization
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically choose the best time based on historical performance
                    </p>
                  </div>
                  <Switch
                    id="smartTiming"
                    checked={useSmartTiming}
                    onCheckedChange={setUseSmartTiming}
                  />
                </div>

                {!useSmartTiming && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduledFor">Schedule For</Label>
                    <Input
                      id="scheduledFor"
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                    />
                  </div>
                )}

                {useSmartTiming && smartTiming && (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Recommended Send Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-lg font-semibold">
                            {format(new Date(smartTiming.recommendedTime), "EEEE, MMMM d 'at' h:mm a")}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Expected open rate: {smartTiming.expectedOpenRate.toFixed(1)}%
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            {smartTiming.confidence} confidence
                          </Badge>
                        </div>
                        <p className="text-sm">{smartTiming.reasoning}</p>
                        
                        {smartTiming.alternativeTimes && smartTiming.alternativeTimes.length > 0 && (
                          <div className="pt-3 border-t">
                            <p className="text-sm font-medium mb-2">Alternative Times:</p>
                            <div className="space-y-1">
                              {smartTiming.alternativeTimes.map((alt: any, i: number) => (
                                <p key={i} className="text-sm text-muted-foreground">
                                  • {format(new Date(alt.time), "EEE, MMM d 'at' h:mm a")} ({alt.expectedOpenRate.toFixed(1)}%)
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createSchedule.isPending}>
                {createSchedule.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Schedule Campaign
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scheduled Campaigns List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : schedules && schedules.length > 0 ? (
        <div className="grid gap-4">
          {schedules.map((schedule: any) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{schedule.name}</CardTitle>
                    <CardDescription>
                      {schedule.emailType} • {schedule.recipientType.replace(/_/g, " ")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(schedule.status)}
                    {schedule.useSmartTiming && (
                      <Badge variant="outline" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        Smart Timing
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <strong>Subject:</strong> {schedule.subject}
                  </div>
                  
                  {schedule.scheduledFor && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Scheduled for {format(new Date(schedule.scheduledFor), "PPpp")}
                    </div>
                  )}

                  {schedule.sentAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Send className="h-4 w-4" />
                      Sent on {format(new Date(schedule.sentAt), "PPpp")}
                    </div>
                  )}

                  {schedule.totalRecipients > 0 && (
                    <div className="text-sm">
                      <strong>Recipients:</strong> {schedule.sentCount} / {schedule.totalRecipients}
                    </div>
                  )}

                  {schedule.status === "scheduled" && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelSchedule.mutate({ id: schedule.id })}
                        disabled={cancelSchedule.isPending}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel Schedule
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No scheduled campaigns yet. Create your first campaign to get started.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Your First Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
