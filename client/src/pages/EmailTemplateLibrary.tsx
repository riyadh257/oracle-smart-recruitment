import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Eye, Edit, Trash2, Copy, Mail, FileText, Sparkles } from "lucide-react";

// Pre-designed templates
const PRESET_TEMPLATES = [
  {
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
          <p><strong>Date & Time:</strong> {{interviewDate}}</p>
          <p><strong>Duration:</strong> {{interviewDuration}}</p>
          <p><strong>Location:</strong> {{interviewLocation}}</p>
        </div>
        <p>Please confirm your availability by clicking the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{confirmationLink}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Interview</a>
        </div>
        <p>Looking forward to meeting you!</p>
        <p>Best regards,<br/>{{companyName}} Recruitment Team</p>
      </div>
    `,
  },
  {
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
        <p>In the meantime, feel free to explore our company culture and values on our website.</p>
        <p>Best of luck!</p>
        <p>{{companyName}} Talent Team</p>
      </div>
    `,
  },
  {
    name: "Follow-Up Email",
    category: "follow_up",
    subject: "Following up on your application - {{jobTitle}}",
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f59e0b;">Following Up</h2>
        <p>Hi {{candidateName}},</p>
        <p>We wanted to follow up on your application for the {{jobTitle}} position.</p>
        <p>We're still reviewing applications and wanted to let you know that you're still in consideration.</p>
        <div style="margin: 30px 0; padding: 20px; background: #fffbeb; border-radius: 8px;">
          <p><strong>Current Status:</strong> Under Review</p>
          <p><strong>Expected Timeline:</strong> {{expectedTimeline}}</p>
        </div>
        <p>We appreciate your patience and continued interest in joining our team.</p>
        <p>We'll be in touch soon!</p>
        <p>Best regards,<br/>{{companyName}}</p>
      </div>
    `,
  },
  {
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
          <p><strong>Location:</strong> {{jobLocation}}</p>
          <p><strong>Match Score:</strong> <span style="color: #10b981; font-weight: bold;">{{matchScore}}%</span></p>
          <p style="margin-top: 15px;">{{jobDescription}}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{applyLink}}" style="background: #8b5cf6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Apply Now</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This opportunity won't last long. Apply today to secure your spot!</p>
      </div>
    `,
  },
];

export default function EmailTemplateLibrary() {
  const { user, isAuthenticated, loading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "custom",
    subject: "",
    bodyHtml: "",
    bodyText: "",
  });

  const handleUsePreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setFormData({
      name: preset.name,
      category: preset.category,
      subject: preset.subject,
      bodyHtml: preset.bodyHtml,
      bodyText: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handlePreview = (template: any) => {
    setPreviewTemplate(template);
  };

  const categories = [
    { value: "all", label: "All Templates" },
    { value: "onboarding", label: "Onboarding" },
    { value: "interview", label: "Interview" },
    { value: "application", label: "Application" },
    { value: "follow_up", label: "Follow Up" },
    { value: "job_match", label: "Job Match" },
    { value: "custom", label: "Custom" },
  ];

  const filteredTemplates = selectedCategory === "all" 
    ? PRESET_TEMPLATES 
    : PRESET_TEMPLATES.filter(t => t.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access email templates</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Template Library</h1>
          <p className="text-muted-foreground mt-2">
            Pre-designed templates for faster campaign creation
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
              <DialogDescription>
                Create a reusable email template with placeholders
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Monthly Newsletter"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="job_match">Job Match</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line *</Label>
                <Input
                  id="subject"
                  placeholder="Use {{placeholders}} like {{candidateName}}, {{jobTitle}}, {{companyName}}"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Available placeholders: {"{{candidateName}}"}, {"{{jobTitle}}"}, {"{{companyName}}"}
                </p>              </div>

              <Tabs defaultValue="html" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="html">HTML Content</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="html" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="body-html">Email Body (HTML) *</Label>
                    <Textarea
                      id="body-html"
                      placeholder="Enter HTML content with {{placeholders}}"
                      rows={15}
                      value={formData.bodyHtml}
                      onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body-text">Plain Text Version (Optional)</Label>
                    <Textarea
                      id="body-text"
                      placeholder="Plain text fallback"
                      rows={8}
                      value={formData.bodyText}
                      onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <div className="border rounded-lg p-6 bg-white min-h-[400px]">
                    <div className="mb-4 pb-4 border-b">
                      <p className="text-sm font-semibold text-muted-foreground">Subject:</p>
                      <p className="text-lg">{formData.subject || "No subject"}</p>
                    </div>
                    <div 
                      dangerouslySetInnerHTML={{ __html: formData.bodyHtml || "<p class='text-muted-foreground'>No content to preview</p>" }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success("Template saved successfully");
                setIsCreateDialogOpen(false);
              }}>
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            {categories.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Template Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {template.name}
                  </CardTitle>
                  <CardDescription className="mt-2 capitalize">
                    {template.category.replace(/_/g, " ")}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Preset
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Subject:</p>
                  <p className="text-sm line-clamp-2">{template.subject}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUsePreset(template)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>Template Preview</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Subject Line:</p>
              <p className="text-lg">{previewTemplate?.subject}</p>
            </div>
            <div className="border rounded-lg p-6 bg-white">
              <div dangerouslySetInnerHTML={{ __html: previewTemplate?.bodyHtml || "" }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            <Button onClick={() => {
              handleUsePreset(previewTemplate);
              setPreviewTemplate(null);
            }}>
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
              <p className="text-muted-foreground mb-6">
                No templates in this category. Try a different category or create a custom template.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
