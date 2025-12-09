import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Users, Mail, Eye, Sparkles, FileText } from "lucide-react";

// Pre-designed templates matching EmailTemplateLibrary
const PRESET_TEMPLATES = [
  {
    id: "welcome",
    name: "Welcome Email",
    category: "onboarding",
    subject: "Welcome to {{companyName}}!",
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Welcome, {{candidateName}}!</h1>
        <p>We're thrilled to have you join us at {{companyName}}.</p>
        <p>Your journey with us starts here. We're excited to see what you'll accomplish!</p>
        <div style="margin: 30px 0; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <h3>Next Steps:</h3>
          <ul>
            <li>Complete your profile</li>
            <li>Review our company handbook</li>
            <li>Schedule your onboarding session</li>
          </ul>
        </div>
        <p>Best regards,<br/>The {{companyName}} Team</p>
      </div>
    `,
  },
  {
    id: "interview",
    name: "Interview Invitation",
    category: "interview",
    subject: "Interview Invitation for {{jobTitle}} at {{companyName}}",
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Interview Invitation</h2>
        <p>Dear {{candidateName}},</p>
        <p>We're impressed with your application for the <strong>{{jobTitle}}</strong> position and would like to invite you for an interview.</p>
        <div style="margin: 30px 0; padding: 20px; background: #dbeafe; border-left: 4px solid #2563eb; border-radius: 4px;">
          <p><strong>Position:</strong> {{jobTitle}}</p>
        </div>
        <p>Please confirm your availability.</p>
        <p>Looking forward to meeting you!</p>
        <p>Best regards,<br/>{{companyName}} Recruitment Team</p>
      </div>
    `,
  },
  {
    id: "application",
    name: "Application Received",
    category: "application",
    subject: "We've received your application for {{jobTitle}}",
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Application Received</h2>
        <p>Hi {{candidateName}},</p>
        <p>Thank you for applying for the <strong>{{jobTitle}}</strong> position at {{companyName}}.</p>
        <p>We've received your application and our team is currently reviewing it. We'll get back to you within the next few days.</p>
        <div style="margin: 30px 0; padding: 20px; background: #f0fdf4; border-radius: 8px;">
          <h3 style="color: #10b981;">What happens next?</h3>
          <ol>
            <li>Our recruitment team reviews your application</li>
            <li>Shortlisted candidates will be contacted for interviews</li>
            <li>Final selection and offer</li>
          </ol>
        </div>
        <p>Best of luck!</p>
        <p>{{companyName}} Talent Team</p>
      </div>
    `,
  },
  {
    id: "followup",
    name: "Follow-Up Email",
    category: "follow_up",
    subject: "Following up on your application - {{jobTitle}}",
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">Following Up</h2>
        <p>Hi {{candidateName}},</p>
        <p>We wanted to follow up on your application for the {{jobTitle}} position.</p>
        <p>We're still reviewing applications and wanted to let you know that you're still in consideration.</p>
        <p>We appreciate your patience and continued interest in joining our team.</p>
        <p>We'll be in touch soon!</p>
        <p>Best regards,<br/>{{companyName}}</p>
      </div>
    `,
  },
  {
    id: "jobmatch",
    name: "Job Match Notification",
    category: "job_match",
    subject: "New job opportunity matching your profile",
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="background: #8b5cf6; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px;">✨ Perfect Match</span>
        </div>
        <h2 style="color: #8b5cf6;">We Found a Great Match for You!</h2>
        <p>Hi {{candidateName}},</p>
        <p>Based on your skills and experience, we think you'd be perfect for this role:</p>
        <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 12px;">
          <h3 style="color: #8b5cf6; margin-top: 0;">{{jobTitle}}</h3>
          <p><strong>Company:</strong> {{companyName}}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This opportunity won't last long. Apply today to secure your spot!</p>
      </div>
    `,
  },
];

function personalizeMessage(
  message: string,
  data: { candidateName?: string; jobTitle?: string; companyName?: string }
): string {
  let personalized = message;
  personalized = personalized.replace(/\{\{candidateName\}\}/g, data.candidateName || "Candidate");
  personalized = personalized.replace(/\{\{jobTitle\}\}/g, data.jobTitle || "the position");
  personalized = personalized.replace(/\{\{companyName\}\}/g, data.companyName || "our company");
  return personalized;
}

export default function BulkBroadcastEnhanced() {
  const [activeTab, setActiveTab] = useState("create");
  const [title, setTitle] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [targetAudience, setTargetAudience] = useState<"all_candidates" | "filtered">("filtered");
  
  const [filterCriteria, setFilterCriteria] = useState({
    location: [] as string[],
    experienceMin: undefined as number | undefined,
    experienceMax: undefined as number | undefined,
    availability: true,
    skills: [] as string[],
  });

  const { data: broadcasts, refetch: refetchBroadcasts } = trpc.communication.broadcast.list.useQuery({
    limit: 50,
    offset: 0,
  });

  const { data: filteredCandidates } = trpc.communication.broadcast.getFilteredCandidates.useQuery(
    { filterCriteria },
    { enabled: targetAudience === "filtered" }
  );

  const createBroadcast = trpc.communication.broadcast.create.useMutation({
    onSuccess: () => {
      toast.success("Broadcast created and sent successfully!");
      refetchBroadcasts();
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create broadcast: " + error.message);
    },
  });

  const sendBroadcast = trpc.communication.broadcast.send.useMutation({
    onSuccess: () => {
      toast.success("Broadcast sent successfully!");
      refetchBroadcasts();
    },
    onError: (error) => {
      toast.error("Failed to send broadcast: " + error.message);
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = PRESET_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setEmailSubject(template.subject);
      setMessageContent(template.bodyHtml);
      toast.success("Template loaded: " + template.name);
    }
  };

  const resetForm = () => {
    setTitle("");
    setEmailSubject("");
    setMessageContent("");
    setSelectedTemplateId("");
  };

  const handleSendBroadcast = async () => {
    if (!title || !emailSubject || !messageContent) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createBroadcast.mutateAsync({
      title,
      messageType: "email",
      messageContent,
      emailSubject,
      emailHtml: messageContent,
      targetAudience,
      filterCriteria: targetAudience === "filtered" ? filterCriteria : undefined,
      scheduledAt: undefined,
    });
  };

  const candidateCount = filteredCandidates?.length || 0;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Bulk Broadcast</h1>
        <p className="text-muted-foreground mt-2">Send personalized emails to multiple candidates</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">Create Broadcast</TabsTrigger>
          <TabsTrigger value="history">Broadcast History</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>New Email Broadcast</CardTitle>
              <CardDescription>Send personalized emails using templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campaign Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Monthly Newsletter - January 2024"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Email Template</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Choose a template or write custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Custom (No Template)</SelectItem>
                    {PRESET_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Templates include personalization placeholders
                </p>
              </div>

              {/* Email Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Use placeholders: {{candidateName}}, {{jobTitle}}, {{companyName}}"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              {/* Email Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Email Content (HTML) *</Label>
                <Textarea
                  id="content"
                  placeholder="Enter HTML content with {{placeholders}}"
                  rows={12}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Available placeholders: {"{{candidateName}}"}, {"{{jobTitle}}"}, {"{{companyName}}"}
                </p>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_candidates">All Candidates</SelectItem>
                    <SelectItem value="filtered">Filtered Candidates</SelectItem>
                  </SelectContent>
                </Select>
                {targetAudience === "filtered" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Users className="h-4 w-4" />
                    <span>{candidateCount} candidates match your filters</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setShowPreview(true)} variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  onClick={handleSendBroadcast} 
                  disabled={createBroadcast.isPending}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createBroadcast.isPending ? "Sending..." : "Send Broadcast"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          {broadcasts && broadcasts.length > 0 ? (
            <div className="grid gap-4">
              {broadcasts.map((broadcast) => (
                <Card key={broadcast.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{broadcast.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(broadcast.createdAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={broadcast.status === "sent" ? "default" : "secondary"}>
                          {broadcast.status}
                        </Badge>
                        <Badge variant="outline">
                          <Mail className="h-3 w-3 mr-1" />
                          {broadcast.messageType}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Recipients</p>
                        <p className="text-lg font-bold">{broadcast.totalRecipients}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success</p>
                        <p className="text-lg font-bold text-green-600">{broadcast.successCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="text-lg font-bold text-red-600">{broadcast.failureCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Broadcasts Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first broadcast to start sending emails
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <Send className="h-4 w-4 mr-2" />
                    Create Broadcast
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>Preview with sample data</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Subject:</p>
              <p className="text-lg">
                {personalizeMessage(emailSubject, {
                  candidateName: "John Smith",
                  jobTitle: "Senior Software Engineer",
                  companyName: "Oracle Corporation"
                })}
              </p>
            </div>
            <div className="border rounded-lg p-6 bg-white">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: personalizeMessage(messageContent, {
                    candidateName: "John Smith",
                    jobTitle: "Senior Software Engineer",
                    companyName: "Oracle Corporation"
                  })
                }} 
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
