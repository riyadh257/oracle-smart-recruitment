import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { EmailTemplateEditor } from "@/components/EmailTemplateEditor";

export default function EmailTemplates() {
  const [showEditor, setShowEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "custom" as any,
    subject: "",
    body: "",
    jobCategory: "",
    interviewType: "" as any,
  });

  const { data: templates, isLoading, refetch } = trpc.emailTemplates.list.useQuery();

  // If editor is shown, render it instead
  if (showEditor) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              ← Back to Templates
            </Button>
          </div>
          <EmailTemplateEditor
            templateId={selectedTemplate?.id}
            onSave={() => {
              setShowEditor(false);
              refetch();
            }}
          />
        </div>
      </div>
    );
  }
  
  const createMutation = trpc.emailTemplates.create.useMutation();
  const updateMutation = trpc.emailTemplates.update.useMutation();
  const deleteMutation = trpc.emailTemplates.delete.useMutation();
  // TODO: Implement preview procedure
  // const { data: preview } = trpc.emailTemplates.preview.useQuery(
  //   {
  //     templateId: selectedTemplate?.id || 0,
  //     candidateName: "John Doe",
  //     jobTitle: "Software Engineer",
  //     interviewDate: new Date().toLocaleDateString(),
  //   },
  //   { enabled: isPreviewOpen && !!selectedTemplate }
  // );
  const preview: any = null;

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Email template created successfully");
      setIsCreateOpen(false);
      setFormData({
        name: "",
        type: "custom",
        subject: "",
        body: "",
        jobCategory: "",
        interviewType: "",
      });
      refetch();
    } catch (error) {
      toast.error("Failed to create email template");
    }
  };

  const handleUpdate = async () => {
    if (!selectedTemplate) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedTemplate.id,
        ...formData,
      });
      toast.success("Email template updated successfully");
      setIsEditOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to update email template");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Email template deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete email template");
    }
  };

  const openEdit = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject,
      body: template.body,
      jobCategory: template.category || "",
      interviewType: template.interviewType || "",
    });
    setIsEditOpen(true);
  };

  const openPreview = (template: any) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground mt-2">
            Customize email templates with company branding and dynamic content
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
              <DialogDescription>
                Create a new customizable email template for different scenarios
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Technical Interview Invitation"
                />
              </div>
              <div>
                <Label htmlFor="type">Template Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="interview_rescheduled">Interview Rescheduled</SelectItem>
                    <SelectItem value="application_received">Application Received</SelectItem>
                    <SelectItem value="application_rejected">Application Rejected</SelectItem>
                    <SelectItem value="offer_extended">Offer Extended</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="jobCategory">Job Category (Optional)</Label>
                <Input
                  id="jobCategory"
                  value={formData.jobCategory}
                  onChange={(e) => setFormData({ ...formData, jobCategory: e.target.value })}
                  placeholder="e.g., Engineering, Sales, Marketing"
                />
              </div>
              <div>
                <Label htmlFor="interviewType">Interview Type (Optional)</Label>
                <Select
                  value={formData.interviewType}
                  onValueChange={(value) => setFormData({ ...formData, interviewType: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interview type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Use {{candidateName}}, {{jobTitle}}, {{interviewDate}}"
                />
              </div>
              <div>
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Use merge fields: {{candidateName}}, {{jobTitle}}, {{interviewDate}}"
                  rows={10}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Available merge fields: {"{"}{"{"} candidateName {"}"}{"}"}, {"{"}{"{"} jobTitle {"}"}{"}"}, {"{"}{"{"} interviewDate {"}"}{"}"} 
                </p>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openPreview(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Type: {template.type.replace(/_/g, " ").toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Subject:</span>
                  <p className="text-muted-foreground truncate">{template.subject}</p>
                </div>
                {template.category && (
                  <div>
                    <span className="font-medium">Category:</span> {template.category}
                  </div>
                )}
                {template.interviewType && (
                  <div>
                    <span className="font-medium">Interview Type:</span> {template.interviewType}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates?.length === 0 && (
        <div className="text-center py-12">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No email templates yet</h3>
          <p className="text-muted-foreground mt-2">
            Create your first email template to get started
          </p>
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update your email template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit-name">Template Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-subject">Email Subject</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-body">Email Body</Label>
              <Textarea
                id="edit-body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={10}
              />
            </div>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} className="w-full">
              {updateMutation.isPending ? "Updating..." : "Update Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview with sample data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Subject</Label>
              <div className="p-3 bg-muted rounded-md mt-1">
                {preview?.subject || selectedTemplate?.subject}
              </div>
            </div>
            <div>
              <Label>Body</Label>
              <div className="p-3 bg-muted rounded-md mt-1 whitespace-pre-wrap">
                {preview?.body || selectedTemplate?.body}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
