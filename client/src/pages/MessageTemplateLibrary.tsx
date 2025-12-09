import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Mail, MessageSquare, Eye, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function MessageTemplateLibrary() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");

  const { data: templates = [], refetch } = trpc.messageTemplates.list.useQuery({
    category: filterCategory !== "all" ? filterCategory : undefined,
    channelType: filterChannel !== "all" ? (filterChannel as any) : undefined,
    isActive: true,
  });

  const createMutation = trpc.messageTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateMutation = trpc.messageTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      setEditingTemplate(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const deleteMutation = trpc.messageTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const handleCreateTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const channelType = formData.get("channelType") as string;

    createMutation.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as any,
      channelType: channelType as any,
      emailSubject: channelType !== "sms" ? (formData.get("emailSubject") as string) : undefined,
      emailBody: channelType !== "sms" ? (formData.get("emailBody") as string) : undefined,
      smsBody: channelType !== "email" ? (formData.get("smsBody") as string) : undefined,
      variables: [],
    });
  };

  const handleUpdateTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const channelType = formData.get("channelType") as string;

    updateMutation.mutate({
      id: editingTemplate.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as any,
      channelType: channelType as any,
      emailSubject: channelType !== "sms" ? (formData.get("emailSubject") as string) : undefined,
      emailBody: channelType !== "sms" ? (formData.get("emailBody") as string) : undefined,
      smsBody: channelType !== "email" ? (formData.get("smsBody") as string) : undefined,
    });
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      interview_invitation: "bg-blue-100 text-blue-800 border-blue-300",
      status_update: "bg-purple-100 text-purple-800 border-purple-300",
      follow_up: "bg-green-100 text-green-800 border-green-300",
      rejection: "bg-red-100 text-red-800 border-red-300",
      offer: "bg-yellow-100 text-yellow-800 border-yellow-300",
      reminder: "bg-orange-100 text-orange-800 border-orange-300",
      general: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colors[category] || colors.general;
  };

  const formatCategory = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Message Template Library</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage reusable templates for bulk email and SMS messaging
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a reusable message template for bulk communications
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input id="name" name="name" required placeholder="e.g., Interview Invitation" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Brief description of this template"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interview_invitation">Interview Invitation</SelectItem>
                      <SelectItem value="status_update">Status Update</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="rejection">Rejection</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channelType">Channel Type</Label>
                  <Select name="channelType" required defaultValue="email">
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="sms">SMS Only</SelectItem>
                      <SelectItem value="both">Both Email & SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">Email Content</TabsTrigger>
                  <TabsTrigger value="sms">SMS Content</TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailSubject">Email Subject</Label>
                    <Input
                      id="emailSubject"
                      name="emailSubject"
                      placeholder="Use {{variableName}} for dynamic content"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailBody">Email Body</Label>
                    <Textarea
                      id="emailBody"
                      name="emailBody"
                      rows={8}
                      placeholder="Use {{candidateName}}, {{jobTitle}}, etc. for dynamic content"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="sms" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="smsBody">SMS Message</Label>
                    <Textarea
                      id="smsBody"
                      name="smsBody"
                      rows={6}
                      placeholder="Keep it concise (160 characters recommended). Use {{variableName}} for dynamic content"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      SMS messages are limited to 500 characters
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="filterCategory">Filter by Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="filterCategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="interview_invitation">Interview Invitation</SelectItem>
                  <SelectItem value="status_update">Status Update</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="rejection">Rejection</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label htmlFor="filterChannel">Filter by Channel</Label>
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger id="filterChannel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template: any) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.description && (
                    <CardDescription className="mt-1">{template.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={getCategoryColor(template.category)}>
                  {formatCategory(template.category)}
                </Badge>
                {template.channelType === "email" && (
                  <Badge variant="secondary">
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Badge>
                )}
                {template.channelType === "sms" && (
                  <Badge variant="secondary">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    SMS
                  </Badge>
                )}
                {template.channelType === "both" && (
                  <>
                    <Badge variant="secondary">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Badge>
                    <Badge variant="secondary">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      SMS
                    </Badge>
                  </>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Used {template.usageCount || 0} times</p>
                {template.lastUsedAt && (
                  <p className="text-xs">
                    Last used: {new Date(template.lastUsedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>No templates found. Create your first template to get started.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>Update your message template</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateTemplate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  required
                  defaultValue={editingTemplate.name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={editingTemplate.description || ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select name="category" required defaultValue={editingTemplate.category}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interview_invitation">Interview Invitation</SelectItem>
                      <SelectItem value="status_update">Status Update</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="rejection">Rejection</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-channelType">Channel Type</Label>
                  <Select name="channelType" required defaultValue={editingTemplate.channelType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="sms">SMS Only</SelectItem>
                      <SelectItem value="both">Both Email & SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">Email Content</TabsTrigger>
                  <TabsTrigger value="sms">SMS Content</TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-emailSubject">Email Subject</Label>
                    <Input
                      id="edit-emailSubject"
                      name="emailSubject"
                      defaultValue={editingTemplate.emailSubject || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-emailBody">Email Body</Label>
                    <Textarea
                      id="edit-emailBody"
                      name="emailBody"
                      rows={8}
                      defaultValue={editingTemplate.emailBody || ""}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="sms" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-smsBody">SMS Message</Label>
                    <Textarea
                      id="edit-smsBody"
                      name="smsBody"
                      rows={6}
                      defaultValue={editingTemplate.smsBody || ""}
                      maxLength={500}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Template"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
