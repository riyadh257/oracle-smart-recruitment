import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Copy, Mail, Eye, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Email Template Gallery
 * 
 * Browse, create, and manage email templates for different notification types:
 * - Interview invitations
 * - Offer letters
 * - Rejection notices
 * - Status updates
 * - Feedback requests
 */
export default function TemplateGallery() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "general" as any,
    description: "",
    subject: "",
    htmlContent: "",
    textContent: "",
  });

  const { data: preDesignedTemplates, isLoading: preDesignedLoading } = trpc.templateGallery.list.useQuery(
    { isPreDesigned: true },
    { enabled: !!user }
  );

  const { data: myTemplates, isLoading: myTemplatesLoading } = trpc.templateGallery.list.useQuery(
    { isPreDesigned: false },
    { enabled: !!user }
  );

  const createTemplate = trpc.templateGallery.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      utils.templateGallery.list.invalidate();
      setShowCreateDialog(false);
      setNewTemplate({
        name: "",
        category: "general",
        description: "",
        subject: "",
        htmlContent: "",
        textContent: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const duplicateTemplate = trpc.templateGallery.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Template duplicated successfully");
      utils.templateGallery.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to duplicate template: ${error.message}`);
    },
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.htmlContent) {
      toast.error("Please fill in all required fields");
      return;
    }

    createTemplate.mutate(newTemplate);
  };

  const handleDuplicate = (templateId: number) => {
    duplicateTemplate.mutate({ id: templateId });
  };

  const filteredPreDesigned = preDesignedTemplates?.filter(
    (t) => selectedCategory === "all" || t.category === selectedCategory
  );

  const filteredMyTemplates = myTemplates?.filter(
    (t) => selectedCategory === "all" || t.category === selectedCategory
  );

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to access template gallery</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Email Template Gallery</h1>
            <p className="text-muted-foreground mt-2">
              Browse pre-designed templates or create your own
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription>
                  Design a custom email template for your notifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name *</Label>
                  <Input
                    id="template-name"
                    placeholder="e.g., Interview Invitation - Tech Role"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-category">Category *</Label>
                  <Select
                    value={newTemplate.category}
                    onValueChange={(value: any) => setNewTemplate({ ...newTemplate, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interview_invitation">Interview Invitation</SelectItem>
                      <SelectItem value="offer_letter">Offer Letter</SelectItem>
                      <SelectItem value="rejection">Rejection</SelectItem>
                      <SelectItem value="status_update">Status Update</SelectItem>
                      <SelectItem value="feedback_request">Feedback Request</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    placeholder="Brief description of when to use this template"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-subject">Email Subject *</Label>
                  <Input
                    id="template-subject"
                    placeholder="e.g., Interview Invitation for {{jobTitle}} at {{companyName}}"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use &#123;&#123;variableName&#125;&#125; for dynamic content
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-html">HTML Content *</Label>
                  <Textarea
                    id="template-html"
                    placeholder="<p>Dear {{candidateName}},</p><p>We are pleased to invite you...</p>"
                    value={newTemplate.htmlContent}
                    onChange={(e) => setNewTemplate({ ...newTemplate, htmlContent: e.target.value })}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-text">Plain Text Content</Label>
                  <Textarea
                    id="template-text"
                    placeholder="Plain text version for email clients that don't support HTML"
                    value={newTemplate.textContent}
                    onChange={(e) => setNewTemplate({ ...newTemplate, textContent: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleCreateTemplate}
                  disabled={createTemplate.isPending}
                  className="w-full"
                >
                  {createTemplate.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="interview_invitation">Interview Invitation</SelectItem>
              <SelectItem value="offer_letter">Offer Letter</SelectItem>
              <SelectItem value="rejection">Rejection</SelectItem>
              <SelectItem value="status_update">Status Update</SelectItem>
              <SelectItem value="feedback_request">Feedback Request</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="pre-designed" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pre-designed">
              <Sparkles className="w-4 h-4 mr-2" />
              Pre-Designed Templates
            </TabsTrigger>
            <TabsTrigger value="my-templates">
              <Mail className="w-4 h-4 mr-2" />
              My Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pre-designed" className="space-y-4">
            {preDesignedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPreDesigned && filteredPreDesigned.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPreDesigned.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>
                        {template.category.replace(/_/g, " ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {template.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(template.id)}
                          disabled={duplicateTemplate.isPending}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Duplicate
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          Used {template.usageCount} times
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No pre-designed templates found for this category</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-templates" className="space-y-4">
            {myTemplatesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMyTemplates && filteredMyTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMyTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>
                        {template.category.replace(/_/g, " ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {template.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(template.id)}
                          disabled={duplicateTemplate.isPending}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Duplicate
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          Used {template.usageCount} times
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">You haven't created any templates yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Template
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
