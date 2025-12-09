import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Copy, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface TemplateQuestion {
  id: string;
  question: string;
  type: "text" | "rating" | "multiple_choice";
  required: boolean;
  options?: string[];
}

export default function FeedbackTemplates() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    interviewType: "",
    questions: [] as TemplateQuestion[],
    isDefault: false,
  });

  const [newQuestion, setNewQuestion] = useState({
    question: "",
    type: "text" as "text" | "rating" | "multiple_choice",
    required: true,
    options: "",
  });

  // Assume user is employer for now
  const employerId = user?.id || 1;

  const { data: templates, isLoading, refetch } = trpc.feedback.getTemplates.useQuery({
    employerId,
  });

  const createTemplate = trpc.feedback.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      refetch();
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateTemplate = trpc.feedback.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      refetch();
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const deleteTemplate = trpc.feedback.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      interviewType: "",
      questions: [],
      isDefault: false,
    });
    setEditingTemplate(null);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim()) {
      toast.error("Question text is required");
      return;
    }

    const question: TemplateQuestion = {
      id: `q_${Date.now()}`,
      question: newQuestion.question,
      type: newQuestion.type,
      required: newQuestion.required,
      options:
        newQuestion.type === "multiple_choice"
          ? newQuestion.options.split(",").map((o) => o.trim()).filter(Boolean)
          : undefined,
    };

    setFormData({
      ...formData,
      questions: [...formData.questions, question],
    });

    setNewQuestion({
      question: "",
      type: "text",
      required: true,
      options: "",
    });
  };

  const handleRemoveQuestion = (questionId: string) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((q) => q.id !== questionId),
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (editingTemplate) {
      updateTemplate.mutate({
        templateId: editingTemplate.id,
        ...formData,
      });
    } else {
      createTemplate.mutate({
        employerId,
        ...formData,
      });
    }
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      interviewType: template.interviewType || "",
      questions: template.questions || [],
      isDefault: template.isDefault || false,
    });
    setOpen(true);
  };

  const handleDuplicate = (template: any) => {
    createTemplate.mutate({
      employerId,
      name: `${template.name} (Copy)`,
      description: template.description,
      interviewType: template.interviewType,
      questions: template.questions,
      isDefault: false,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Feedback Templates</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage role-specific interview feedback templates
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Edit Template" : "Create New Template"}
                </DialogTitle>
                <DialogDescription>
                  Define evaluation criteria and questions for interviews
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Senior Software Engineer Technical Interview"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Brief description of this template"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="interviewType">Interview Type</Label>
                    <Select
                      value={formData.interviewType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, interviewType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select interview type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="behavioral">Behavioral</SelectItem>
                        <SelectItem value="culture_fit">Culture Fit</SelectItem>
                        <SelectItem value="system_design">System Design</SelectItem>
                        <SelectItem value="coding">Coding</SelectItem>
                        <SelectItem value="final_round">Final Round</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Evaluation Questions</h3>

                  {/* Existing Questions */}
                  {formData.questions.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {formData.questions.map((q, index) => (
                        <Card key={q.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">Q{index + 1}:</span>
                                  <Badge variant="secondary">{q.type}</Badge>
                                  {q.required && <Badge variant="outline">Required</Badge>}
                                </div>
                                <p className="text-sm">{q.question}</p>
                                {q.options && q.options.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Options: {q.options.join(", ")}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveQuestion(q.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Add New Question */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Add Question</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Question Text</Label>
                        <Input
                          value={newQuestion.question}
                          onChange={(e) =>
                            setNewQuestion({ ...newQuestion, question: e.target.value })
                          }
                          placeholder="Enter your question"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Question Type</Label>
                          <Select
                            value={newQuestion.type}
                            onValueChange={(value: any) =>
                              setNewQuestion({ ...newQuestion, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="rating">Rating (1-5)</SelectItem>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Required</Label>
                          <Select
                            value={newQuestion.required ? "yes" : "no"}
                            onValueChange={(value) =>
                              setNewQuestion({ ...newQuestion, required: value === "yes" })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {newQuestion.type === "multiple_choice" && (
                        <div>
                          <Label>Options (comma-separated)</Label>
                          <Input
                            value={newQuestion.options}
                            onChange={(e) =>
                              setNewQuestion({ ...newQuestion, options: e.target.value })
                            }
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}

                      <Button onClick={handleAddQuestion} variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createTemplate.isPending || updateTemplate.isPending}
                  >
                    {(createTemplate.isPending || updateTemplate.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingTemplate ? "Update Template" : "Create Template"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid */}
        {templates && templates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template: any) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description || "No description"}
                      </CardDescription>
                    </div>
                    {template.isDefault && (
                      <Badge variant="default">Default</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {template.interviewType && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">
                          {template.interviewType.replace("_", " ")}
                        </span>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      {template.questions?.length || 0} questions
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(template)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this template?")) {
                            deleteTemplate.mutate({ templateId: template.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No templates yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first feedback template to standardize interviews
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
