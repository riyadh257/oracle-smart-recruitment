import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye, Copy, Mail, Bell, MessageSquare } from "lucide-react";
import { Streamdown } from "streamdown";

export default function NotificationTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const { data: templates, isLoading, refetch } = trpc.notificationTemplates.list.useQuery();
  const { data: variables } = trpc.notificationTemplates.getVariables.useQuery();
  
  const createMutation = trpc.notificationTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateMutation = trpc.notificationTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      setSelectedTemplate(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const deleteMutation = trpc.notificationTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const previewMutation = trpc.notificationTemplates.preview.useMutation({
    onSuccess: (data) => {
      setPreviewData(data.rendered);
      setIsPreviewDialogOpen(true);
    },
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      interview_reminder: "bg-blue-100 text-blue-800",
      feedback_request: "bg-purple-100 text-purple-800",
      candidate_response: "bg-green-100 text-green-800",
      engagement_alert: "bg-yellow-100 text-yellow-800",
      ab_test_result: "bg-pink-100 text-pink-800",
      system_update: "bg-gray-100 text-gray-800",
      general: "bg-indigo-100 text-indigo-800",
      custom: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const handlePreview = (template: any) => {
    const sampleVariables: Record<string, any> = {};
    variables?.forEach((v: any) => {
      sampleVariables[v.name] = v.exampleValue || v.defaultValue || `[${v.name}]`;
    });

    previewMutation.mutate({
      template: template.bodyTemplate,
      variables: sampleVariables,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Templates</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage customizable notification templates with variable placeholders
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Notification Template</DialogTitle>
              <DialogDescription>
                Design a new template with customizable variables for personalized notifications
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              onSubmit={(data) => createMutation.mutate(data)}
              variables={variables || []}
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="push">Push</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <TemplateGrid
            templates={templates || []}
            onEdit={setSelectedTemplate}
            onDelete={handleDelete}
            onPreview={handlePreview}
            getChannelIcon={getChannelIcon}
            getTypeColor={getTypeColor}
          />
        </TabsContent>

        {['email', 'push', 'sms'].map((channel) => (
          <TabsContent key={channel} value={channel} className="space-y-4">
            <TemplateGrid
              templates={(templates || []).filter((t: any) => t.channel === channel)}
              onEdit={setSelectedTemplate}
              onDelete={handleDelete}
              onPreview={handlePreview}
              getChannelIcon={getChannelIcon}
              getTypeColor={getTypeColor}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template content and configuration
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <TemplateForm
              initialData={selectedTemplate}
              onSubmit={(data) => {
                updateMutation.mutate({ id: selectedTemplate.id, ...data });
              }}
              variables={variables || []}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview with sample data
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-muted/50">
            <Streamdown>{previewData || ""}</Streamdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateGrid({
  templates,
  onEdit,
  onDelete,
  onPreview,
  getChannelIcon,
  getTypeColor,
}: any) {
  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No templates found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template: any) => (
        <Card key={template.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getChannelIcon(template.channel)}
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </div>
              <Badge className={getTypeColor(template.type)}>
                {template.type.replace(/_/g, ' ')}
              </Badge>
            </div>
            {template.description && (
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {template.subject && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subject:</p>
                <p className="text-sm line-clamp-1">{template.subject}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Body:</p>
              <p className="text-sm line-clamp-3">{template.bodyTemplate}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Used {template.usageCount} times</span>
              {template.isDefault === 1 && <Badge variant="outline">Default</Badge>}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onPreview(template)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(template)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(template.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TemplateForm({ initialData, onSubmit, variables, isSubmitting }: any) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    type: initialData?.type || "general",
    channel: initialData?.channel || "push",
    subject: initialData?.subject || "",
    bodyTemplate: initialData?.bodyTemplate || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const insertVariable = (varName: string) => {
    const placeholder = `{{${varName}}}`;
    setFormData((prev) => ({
      ...prev,
      bodyTemplate: prev.bodyTemplate + placeholder,
    }));
  };

  const variablesByCategory = variables.reduce((acc: any, v: any) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interview_reminder">Interview Reminder</SelectItem>
              <SelectItem value="feedback_request">Feedback Request</SelectItem>
              <SelectItem value="candidate_response">Candidate Response</SelectItem>
              <SelectItem value="engagement_alert">Engagement Alert</SelectItem>
              <SelectItem value="ab_test_result">A/B Test Result</SelectItem>
              <SelectItem value="system_update">System Update</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="channel">Channel *</Label>
        <Select
          value={formData.channel}
          onValueChange={(value) => setFormData({ ...formData, channel: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="push">Push Notification</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="push_email">Push + Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {(formData.channel === 'email' || formData.channel === 'push_email') && (
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required={formData.channel === 'email' || formData.channel === 'push_email'}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="bodyTemplate">Message Template *</Label>
        <Textarea
          id="bodyTemplate"
          value={formData.bodyTemplate}
          onChange={(e) => setFormData({ ...formData, bodyTemplate: e.target.value })}
          rows={8}
          required
          placeholder="Enter your message template here. Use {{variable_name}} for placeholders."
        />
      </div>

      <div className="space-y-2">
        <Label>Available Variables</Label>
        <div className="border rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto">
          {Object.entries(variablesByCategory).map(([category, vars]: [string, any]) => (
            <div key={category}>
              <p className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {vars.map((v: any) => (
                  <Button
                    key={v.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(v.name)}
                    title={v.description || v.name}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {v.placeholder}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Update Template" : "Create Template"}
        </Button>
      </div>
    </form>
  );
}
