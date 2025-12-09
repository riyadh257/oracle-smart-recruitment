import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  Eye,
  Save,
  Plus,
  Loader2,
  Info,
  Code,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const TEMPLATE_TYPES = [
  { value: "interview_invite", label: "Interview Invitation" },
  { value: "application_received", label: "Application Received" },
  { value: "job_match", label: "Job Match Notification" },
  { value: "rejection", label: "Rejection Letter" },
  { value: "offer", label: "Job Offer" },
  { value: "custom", label: "Custom Template" },
];

export function EmailTemplateEditor() {
  const [selectedType, setSelectedType] = useState("interview_invite");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  // Fetch merge fields for selected template type
  const { data: mergeFields } = trpc.emailTemplate.getMergeFields.useQuery({
    templateType: selectedType,
  });

  // Fetch templates list
  const { data: templates, refetch: refetchTemplates } =
    trpc.emailTemplate.list.useQuery();

  // Preview mutation
  const previewMutation = trpc.emailTemplate.preview.useQuery(
    {
      templateType: selectedType,
      subject,
      bodyHtml,
    },
    {
      enabled: false,
    }
  );

  // Create version mutation
  const createVersionMutation = trpc.emailTemplate.createVersion.useMutation({
    onSuccess: () => {
      toast.success("Template saved successfully!");
      refetchTemplates();
    },
    onError: (error) => {
      toast.error("Failed to save template: " + error.message);
    },
  });

  // Load default template for type
  useEffect(() => {
    if (selectedType === "interview_invite") {
      setSubject("Interview Invitation - {{job_title}} at {{company_name}}");
      setBodyHtml(`<p>Dear {{candidate_name}},</p>

<p>We are pleased to invite you for an interview for the <strong>{{job_title}}</strong> position at {{company_name}}.</p>

<p><strong>Interview Details:</strong></p>
<ul>
  <li>Date: {{interview_date}}</li>
  <li>Time: {{interview_time}}</li>
  <li>Meeting Link: <a href="{{meeting_url}}">Join Interview</a></li>
</ul>

<p>Please confirm your availability at your earliest convenience.</p>

<p>Best regards,<br>{{company_name}} Hiring Team</p>`);
    } else if (selectedType === "application_received") {
      setSubject("Application Received - {{job_title}}");
      setBodyHtml(`<p>Dear {{candidate_name}},</p>

<p>Thank you for applying for the <strong>{{job_title}}</strong> position at {{company_name}}.</p>

<p>We have received your application on {{application_date}} and our team will review it carefully.</p>

<p>We will contact you if your qualifications match our requirements.</p>

<p>Best regards,<br>{{company_name}} Recruitment Team</p>`);
    }
  }, [selectedType]);

  const handleInsertMergeField = (field: string) => {
    setBodyHtml((prev) => prev + ` ${field}`);
  };

  const handlePreview = async () => {
    setShowPreview(true);
    try {
      const result = await previewMutation.refetch();
      if (result.data?.previewHtml) {
        setPreviewHtml(result.data.previewHtml);
      }
    } catch (error: unknown) {
      toast.error("Failed to generate preview");
    }
  };

  const handleSave = async () => {
    // For demo, we'll create a new template
    // In production, you'd select an existing template to update
    try {
      await createVersionMutation.mutateAsync({
        templateId: 1, // Would be selected from dropdown
        subject,
        bodyHtml,
        changeNotes: `Updated ${selectedType} template`,
      });
    } catch (error: unknown) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Template Editor
          </CardTitle>
          <CardDescription>
            Create and customize email templates with merge fields and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Type Selector */}
          <div className="space-y-2">
            <Label>Template Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Line */}
          <div className="space-y-2">
            <Label>Subject Line</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>

          {/* Merge Fields */}
          {mergeFields && mergeFields.length > 0 && (
            <div className="space-y-2">
              <Label>Available Merge Fields</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                {mergeFields.map((field: any) => (
                  <Button
                    key={field.key}
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertMergeField(field.key)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {field.label}
                  </Button>
                ))}
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Click a merge field to insert it into your template. These will be replaced with actual data when emails are sent.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Editor Tabs */}
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">
                <Code className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-2">
              <Label>Email Body (HTML)</Label>
              <Textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                placeholder="Enter email body HTML..."
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Use HTML tags for formatting. Merge fields will be automatically replaced.
              </p>
            </TabsContent>

            <TabsContent value="preview" className="space-y-2">
              {previewMutation.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : previewHtml ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-[500px]"
                    title="Email Preview"
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Click the Preview tab to see how your email will look</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={createVersionMutation.isPending}
              className="flex-1"
            >
              {createVersionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
            <Button
              onClick={handlePreview}
              variant="outline"
              disabled={previewMutation.isLoading}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template List */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Templates</CardTitle>
          <CardDescription>
            View and manage your email templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates && templates.length > 0 ? (
            <div className="space-y-2">
              {templates.map((template: any) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-gray-500">{template.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
                      Preview
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No templates created yet</p>
              <p className="text-sm mt-1">
                Create your first template using the editor above
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
