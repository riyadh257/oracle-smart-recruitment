import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Mail, Eye, Code, Send, Save } from "lucide-react";

export default function CampaignBuilder() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: (data) => {
      toast.success("Campaign created successfully");
      setLocation(`/campaigns/${data.id}/edit`);
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    }
  });

  const handleSaveDraft = () => {
    if (!campaignName.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }

    createMutation.mutate({
      employerId: user?.id || 0,
      name: campaignName,
      description: description,
      workflowDefinition: {
        emailSubject,
        emailBody,
        template: selectedTemplate
      }
    });
  };

  const handlePreview = () => {
    setPreviewMode(previewMode === "desktop" ? "mobile" : "desktop");
  };

  const emailTemplates = {
    blank: {
      name: "Blank Template",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Your content here...</p>
      </div>`
    },
    welcome: {
      name: "Welcome Email",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Welcome to Our Recruitment Platform!</h1>
        <p>Thank you for your interest in joining our team. We're excited to review your application.</p>
        <div style="margin: 30px 0; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <h2 style="color: #374151; font-size: 18px;">What's Next?</h2>
          <ul style="color: #6b7280;">
            <li>Our team will review your application</li>
            <li>You'll hear from us within 3-5 business days</li>
            <li>Keep an eye on your email for updates</li>
          </ul>
        </div>
        <p style="color: #6b7280;">Best regards,<br>The Recruitment Team</p>
      </div>`
    },
    interview: {
      name: "Interview Invitation",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">You're Invited to Interview!</h1>
        <p>Congratulations! We'd like to invite you for an interview.</p>
        <div style="margin: 30px 0; padding: 20px; background: #dbeafe; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h2 style="color: #1e40af; font-size: 18px;">Interview Details</h2>
          <p style="margin: 10px 0;"><strong>Date:</strong> [Interview Date]</p>
          <p style="margin: 10px 0;"><strong>Time:</strong> [Interview Time]</p>
          <p style="margin: 10px 0;"><strong>Duration:</strong> 45 minutes</p>
        </div>
        <a href="[Calendar Link]" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Add to Calendar
        </a>
        <p style="color: #6b7280; margin-top: 30px;">We look forward to speaking with you!</p>
      </div>`
    },
    followup: {
      name: "Follow-up Email",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Application Status Update</h1>
        <p>We wanted to provide you with an update on your application status.</p>
        <div style="margin: 30px 0; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <p style="color: #374151;">Your application is currently under review by our hiring team. We appreciate your patience during this process.</p>
        </div>
        <p style="color: #6b7280;">If you have any questions, please don't hesitate to reach out.</p>
        <p style="color: #6b7280; margin-top: 30px;">Best regards,<br>The Recruitment Team</p>
      </div>`
    }
  };

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = emailTemplates[templateKey as keyof typeof emailTemplates];
    if (template) {
      setEmailBody(template.html);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Email Campaign</h1>
            <p className="text-muted-foreground mt-2">
              Build and customize your recruitment email campaign
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={createMutation.isLoading}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button disabled={createMutation.isLoading}>
              <Send className="mr-2 h-4 w-4" />
              Launch Campaign
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Editor Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Basic information about your campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    placeholder="e.g., Welcome Series - Software Engineers"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose of this campaign..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Template</CardTitle>
                <CardDescription>Choose a template or start from scratch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger id="template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(emailTemplates).map(([key, template]) => (
                        <SelectItem key={key} value={key}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject line..."
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <Tabs defaultValue="visual" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="visual">
                      <Eye className="mr-2 h-4 w-4" />
                      Visual
                    </TabsTrigger>
                    <TabsTrigger value="html">
                      <Code className="mr-2 h-4 w-4" />
                      HTML
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="visual" className="space-y-4">
                    <div>
                      <Label>Email Content</Label>
                      <Textarea
                        placeholder="Write your email content here..."
                        value={emailBody.replace(/<[^>]*>/g, '')}
                        onChange={(e) => setEmailBody(`<p>${e.target.value}</p>`)}
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="html" className="space-y-4">
                    <div>
                      <Label>HTML Code</Label>
                      <Textarea
                        placeholder="<div>Your HTML here...</div>"
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>A/B Testing</CardTitle>
                <CardDescription>Test different versions of your email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Enable A/B Testing</p>
                    <p className="text-sm text-muted-foreground">
                      Test subject lines and content variations
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Email Preview</CardTitle>
                    <CardDescription>See how your email will look</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handlePreview}>
                    {previewMode === "desktop" ? "📱 Mobile" : "💻 Desktop"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`border rounded-lg overflow-hidden ${previewMode === "mobile" ? "max-w-[375px] mx-auto" : ""}`}>
                  {/* Email Header */}
                  <div className="bg-gray-100 p-4 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">recruitment@company.com</span>
                    </div>
                    <div className="text-sm font-semibold">
                      {emailSubject || "Your email subject will appear here"}
                    </div>
                  </div>
                  
                  {/* Email Body */}
                  <div className="bg-white p-6">
                    {emailBody ? (
                      <div dangerouslySetInnerHTML={{ __html: emailBody }} />
                    ) : (
                      <div className="text-center text-muted-foreground py-12">
                        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Your email content will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sendTime">Send Time</Label>
                  <Select defaultValue="immediate">
                    <SelectTrigger id="sendTime">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Send Immediately</SelectItem>
                      <SelectItem value="scheduled">Schedule for Later</SelectItem>
                      <SelectItem value="trigger">Trigger-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select defaultValue="all">
                    <SelectTrigger id="audience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Candidates</SelectItem>
                      <SelectItem value="new">New Applicants</SelectItem>
                      <SelectItem value="interviewed">Interviewed Candidates</SelectItem>
                      <SelectItem value="custom">Custom Segment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
