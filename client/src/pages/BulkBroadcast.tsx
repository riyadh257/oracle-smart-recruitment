import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, Send, Users, Filter, MessageSquare, Mail, Smartphone } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { VariablePicker } from "@/components/VariablePicker";

const MESSAGE_TYPES = [
  { value: "email", label: "Email", icon: Mail },
  { value: "sms", label: "SMS", icon: Smartphone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
];

// Helper function to personalize message with placeholder data
function personalizeMessage(
  message: string,
  data: { candidateName?: string; jobTitle?: string; companyName?: string }
): string {
  let personalized = message;
  personalized = personalized.replace(/{{candidateName}}/g, data.candidateName || "Candidate");
  personalized = personalized.replace(/{{jobTitle}}/g, data.jobTitle || "the position");
  personalized = personalized.replace(/{{companyName}}/g, data.companyName || "our company");
  return personalized;
}

export default function BulkBroadcast() {
  const [activeTab, setActiveTab] = useState("create");
  
  // Create broadcast state
  const [title, setTitle] = useState("");
  const [messageType, setMessageType] = useState<"email" | "sms" | "whatsapp">("email");
  const [messageContent, setMessageContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [targetAudience, setTargetAudience] = useState<"all_candidates" | "filtered" | "manual_selection">("filtered");
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined);
  
  // Filter criteria state
  const [filterCriteria, setFilterCriteria] = useState({
    location: [] as string[],
    experienceMin: undefined as number | undefined,
    experienceMax: undefined as number | undefined,
    availability: true,
    skills: [] as string[],
  });

  const [showPreview, setShowPreview] = useState(false);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<number | null>(null);

  // Queries
  const { data: broadcasts, refetch: refetchBroadcasts } = trpc.communication.broadcast.list.useQuery({
    limit: 50,
    offset: 0,
  });

  const { data: filteredCandidates, isLoading: candidatesLoading } = trpc.communication.broadcast.getFilteredCandidates.useQuery(
    { filterCriteria },
    { enabled: targetAudience === "filtered" }
  );

  const { data: broadcastDetails } = trpc.communication.broadcast.getDetails.useQuery(
    { broadcastId: selectedBroadcastId! },
    { enabled: selectedBroadcastId !== null }
  );

  // Mutations
  const createBroadcast = trpc.communication.broadcast.create.useMutation({
    onSuccess: () => {
      toast.success("Broadcast created successfully");
      refetchBroadcasts();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create broadcast: ${error.message}`);
    },
  });

  const sendBroadcast = trpc.communication.broadcast.send.useMutation({
    onSuccess: () => {
      toast.success("Broadcast sent successfully");
      refetchBroadcasts();
    },
    onError: (error) => {
      toast.error(`Failed to send broadcast: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTitle("");
    setMessageContent("");
    setEmailSubject("");
    setSelectedTemplateId(undefined);
    setScheduledAt(undefined);
    setFilterCriteria({
      location: [],
      experienceMin: undefined,
      experienceMax: undefined,
      availability: true,
      skills: [],
    });
  };

  const handleCreateBroadcast = async () => {
    if (!title || !messageContent) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (messageType === "email" && !emailSubject) {
      toast.error("Email subject is required");
      return;
    }

    await createBroadcast.mutateAsync({
      title,
      messageType,
      messageContent,
      emailSubject: messageType === "email" ? emailSubject : undefined,
      emailHtml: messageType === "email" ? `<p>${messageContent}</p>` : undefined,
      targetAudience,
      filterCriteria: targetAudience === "filtered" ? filterCriteria : undefined,
      scheduledAt,
    });
  };

  const handleSendBroadcast = async (broadcastId: number) => {
    if (!filteredCandidates || filteredCandidates.candidates.length === 0) {
      toast.error("No candidates match the filter criteria");
      return;
    }

    const candidateIds = filteredCandidates.candidates.map((c) => c.id);
    await sendBroadcast.mutateAsync({ broadcastId, candidateIds });
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bulk Broadcast</h1>
        <p className="text-muted-foreground mt-1">
          Send SMS, WhatsApp, or email messages to multiple candidates at once
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">Create Broadcast</TabsTrigger>
          <TabsTrigger value="history">Broadcast History</TabsTrigger>
        </TabsList>

        {/* Create Broadcast Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Broadcast Message</CardTitle>
              <CardDescription>
                Create and send messages to candidates via email, SMS, or WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Broadcast Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., New Job Opportunities"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="messageType">Message Type</Label>
                  <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MESSAGE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {messageType === "email" && (
                  <div>
                    <Label htmlFor="emailSubject">Email Subject</Label>
                    <Input
                      id="emailSubject"
                      placeholder="Enter email subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="messageContent">Message Content</Label>
                    <VariablePicker onInsert={(variable) => {
                      const textarea = document.getElementById("messageContent") as HTMLTextAreaElement;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newContent = messageContent.substring(0, start) + variable + messageContent.substring(end);
                        setMessageContent(newContent);
                        // Set cursor position after inserted variable
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + variable.length, start + variable.length);
                        }, 0);
                      }
                    }} />
                  </div>
                  <Textarea
                    id="messageContent"
                    placeholder="Enter your message..."
                    rows={6}
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {messageType === "sms" && "SMS messages are limited to 160 characters"}
                    {messageType === "whatsapp" && "WhatsApp messages support up to 4096 characters"}
                    {messageType === "email" && "Email messages can include HTML formatting. Use Insert Variable button to add personalization."}
                  </p>
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-4">
                <Label>Target Audience</Label>
                <Select value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_candidates">All Candidates</SelectItem>
                    <SelectItem value="filtered">Filtered Candidates</SelectItem>
                    <SelectItem value="manual_selection">Manual Selection</SelectItem>
                  </SelectContent>
                </Select>

                {targetAudience === "filtered" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Filter Criteria</CardTitle>
                      <CardDescription>
                        Select criteria to filter candidates
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="experienceMin">Min Experience (years)</Label>
                          <Input
                            id="experienceMin"
                            type="number"
                            min="0"
                            value={filterCriteria.experienceMin || ""}
                            onChange={(e) =>
                              setFilterCriteria({
                                ...filterCriteria,
                                experienceMin: e.target.value ? parseInt(e.target.value) : undefined,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="experienceMax">Max Experience (years)</Label>
                          <Input
                            id="experienceMax"
                            type="number"
                            min="0"
                            value={filterCriteria.experienceMax || ""}
                            onChange={(e) =>
                              setFilterCriteria({
                                ...filterCriteria,
                                experienceMax: e.target.value ? parseInt(e.target.value) : undefined,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="availability"
                          checked={filterCriteria.availability}
                          onCheckedChange={(checked) =>
                            setFilterCriteria({ ...filterCriteria, availability: checked as boolean })
                          }
                        />
                        <Label htmlFor="availability" className="font-normal">
                          Only available candidates
                        </Label>
                      </div>

                      {candidatesLoading ? (
                        <div className="text-sm text-muted-foreground">Loading candidates...</div>
                      ) : filteredCandidates ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{filteredCandidates.totalCount}</span>
                          <span className="text-muted-foreground">candidates match this criteria</span>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Scheduling */}
              <div className="space-y-4">
                <Label>Schedule</Label>
                <div className="flex items-center gap-4">
                  <Button
                    variant={scheduledAt ? "outline" : "default"}
                    onClick={() => setScheduledAt(undefined)}
                  >
                    Send Immediately
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={scheduledAt ? "default" : "outline"}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledAt ? format(scheduledAt, "PPP p") : "Schedule for later"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduledAt}
                        onSelect={setScheduledAt}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateBroadcast} disabled={createBroadcast.isPending}>
                  {createBroadcast.isPending ? "Creating..." : "Create Broadcast"}
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  Preview
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Broadcast History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast History</CardTitle>
              <CardDescription>
                View past and scheduled broadcast messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {broadcasts && broadcasts.length > 0 ? (
                <div className="space-y-4">
                  {broadcasts.map((broadcast) => (
                    <div
                      key={broadcast.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedBroadcastId(broadcast.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{broadcast.title}</h3>
                            <Badge variant={
                              broadcast.status === "sent" ? "default" :
                              broadcast.status === "failed" ? "destructive" :
                              "secondary"
                            }>
                              {broadcast.status}
                            </Badge>
                            <Badge variant="outline">{broadcast.messageType}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {broadcast.messageContent}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span>Recipients: {broadcast.totalRecipients}</span>
                            <span>Success: {broadcast.successCount}</span>
                            <span>Failed: {broadcast.failureCount}</span>
                            {broadcast.sentAt && (
                              <span>Sent: {format(new Date(broadcast.sentAt), "MMM dd, yyyy")}</span>
                            )}
                          </div>
                        </div>
                        {broadcast.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendBroadcast(broadcast.id);
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Now
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No broadcast messages yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Preview</DialogTitle>
            <DialogDescription>
              Preview how your message will appear to recipients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {messageType === "email" && (
              <div>
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <p className="font-medium">{emailSubject || "(No subject)"}</p>
              </div>
            )}
            
            {/* Original Template */}
            <div>
              <Label className="text-xs text-muted-foreground">Original Template</Label>
              <div className="border rounded-lg p-4 bg-muted/50 whitespace-pre-wrap text-sm">
                {messageContent || "(No content)"}
              </div>
            </div>
            
            {/* Personalized Preview */}
            <div>
              <Label className="text-xs text-muted-foreground">Personalized Preview Example</Label>
              <p className="text-xs text-muted-foreground mb-2">
                This shows how the message will look with candidate data:
              </p>
              <div className="border rounded-lg p-4 bg-background whitespace-pre-wrap">
                {personalizeMessage(messageContent, {
                  candidateName: "John Smith",
                  jobTitle: "Senior Software Engineer",
                  companyName: "Oracle Corporation"
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Available placeholders: {"{{candidateName}}, {{jobTitle}}, {{companyName}}"}
              </p>
            </div>
            
            {targetAudience === "filtered" && filteredCandidates && (
              <div>
                <Label className="text-xs text-muted-foreground">Recipients</Label>
                <p className="text-sm">
                  This message will be sent to <strong>{filteredCandidates.totalCount}</strong> candidates
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
