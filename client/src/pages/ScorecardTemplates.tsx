import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

interface CriteriaItem {
  name: string;
  weight: number;
  description: string;
}

const JOB_ROLES = [
  "engineering",
  "sales",
  "marketing",
  "product",
  "design",
  "customer-support",
  "operations",
  "finance",
  "hr",
  "other",
];

const DEFAULT_TEMPLATES = {
  engineering: [
    { name: "Technical Skills", weight: 30, description: "Coding ability, system design, technical knowledge" },
    { name: "Problem Solving", weight: 25, description: "Analytical thinking, debugging, algorithm design" },
    { name: "Communication", weight: 20, description: "Explaining technical concepts, collaboration" },
    { name: "Culture Fit", weight: 15, description: "Team collaboration, company values alignment" },
    { name: "Learning Ability", weight: 10, description: "Adaptability, willingness to learn new technologies" },
  ],
  sales: [
    { name: "Sales Skills", weight: 35, description: "Closing ability, negotiation, persuasion" },
    { name: "Communication", weight: 25, description: "Presentation skills, active listening" },
    { name: "Product Knowledge", weight: 15, description: "Understanding of product/service offerings" },
    { name: "Customer Focus", weight: 15, description: "Customer relationship building, empathy" },
    { name: "Culture Fit", weight: 10, description: "Team collaboration, company values alignment" },
  ],
  marketing: [
    { name: "Strategic Thinking", weight: 30, description: "Campaign planning, market analysis" },
    { name: "Creativity", weight: 25, description: "Content creation, innovative ideas" },
    { name: "Communication", weight: 20, description: "Messaging, storytelling, presentation" },
    { name: "Data Analysis", weight: 15, description: "Metrics interpretation, ROI analysis" },
    { name: "Culture Fit", weight: 10, description: "Team collaboration, company values alignment" },
  ],
};

export default function ScorecardTemplates() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    jobRole: "",
    criteria: [] as CriteriaItem[],
  });

  const utils = trpc.useUtils();
  const { data: templates, isLoading } = trpc.scorecardTemplates.list.useQuery();
  
  const createMutation = trpc.scorecardTemplates.create.useMutation({
    onSuccess: () => {
      utils.scorecardTemplates.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Template created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateMutation = trpc.scorecardTemplates.update.useMutation({
    onSuccess: () => {
      utils.scorecardTemplates.list.invalidate();
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast.success("Template updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const deleteMutation = trpc.scorecardTemplates.delete.useMutation({
    onSuccess: () => {
      utils.scorecardTemplates.list.invalidate();
      toast.success("Template deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      jobRole: "",
      criteria: [],
    });
  };

  const handleJobRoleChange = (role: string) => {
    setFormData({
      ...formData,
      jobRole: role,
      criteria: DEFAULT_TEMPLATES[role as keyof typeof DEFAULT_TEMPLATES] || [],
    });
  };

  const handleCreateTemplate = () => {
    if (!formData.name || !formData.jobRole || formData.criteria.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      jobRole: formData.jobRole,
      criteria: JSON.stringify(formData.criteria),
    });
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !formData.name || !formData.jobRole || formData.criteria.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateMutation.mutate({
      id: editingTemplate.id,
      name: formData.name,
      description: formData.description,
      jobRole: formData.jobRole,
      criteria: JSON.stringify(formData.criteria),
    });
  };

  const handleEditClick = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      jobRole: template.jobRole,
      criteria: JSON.parse(template.criteria),
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate({ id });
    }
  };

  const addCriterion = () => {
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { name: "", weight: 10, description: "" }],
    });
  };

  const updateCriterion = (index: number, field: keyof CriteriaItem, value: string | number) => {
    const newCriteria = [...formData.criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setFormData({ ...formData, criteria: newCriteria });
  };

  const removeCriterion = (index: number) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.filter((_, i) => i !== index),
    });
  };

  const TemplateForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Senior Software Engineer Scorecard"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this template"
        />
      </div>

      <div>
        <Label htmlFor="jobRole">Job Role</Label>
        <Select value={formData.jobRole} onValueChange={handleJobRoleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a job role" />
          </SelectTrigger>
          <SelectContent>
            {JOB_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1).replace("-", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Evaluation Criteria</Label>
          <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
            <Plus className="h-4 w-4 mr-1" />
            Add Criterion
          </Button>
        </div>
        
        <div className="space-y-3">
          {formData.criteria.map((criterion, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Criterion name"
                        value={criterion.name}
                        onChange={(e) => updateCriterion(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Weight"
                        value={criterion.weight}
                        onChange={(e) => updateCriterion(index, "weight", parseInt(e.target.value) || 0)}
                        min={0}
                        max={100}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCriterion(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Description"
                    value={criterion.description}
                    onChange={(e) => updateCriterion(index, "description", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {formData.criteria.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            Total weight: {formData.criteria.reduce((sum: any, c: any) => sum + c.weight, 0)}%
          </p>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Interview Scorecard Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create customizable feedback templates for different job roles
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Scorecard Template</DialogTitle>
              <DialogDescription>
                Define evaluation criteria for a specific job role
              </DialogDescription>
            </DialogHeader>
            <TemplateForm />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates && templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No templates yet</p>
            <p className="text-muted-foreground mb-4">Create your first scorecard template to get started</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => {
            const criteria = JSON.parse(template.criteria) as CriteriaItem[];
            return (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>
                    {template.jobRole.charAt(0).toUpperCase() + template.jobRole.slice(1).replace("-", " ")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium">Criteria ({criteria.length}):</p>
                    <ul className="text-sm space-y-1">
                      {criteria.slice(0, 3).map((criterion, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span className="text-muted-foreground">{criterion.name}</span>
                          <span className="font-medium">{criterion.weight}%</span>
                        </li>
                      ))}
                      {criteria.length > 3 && (
                        <li className="text-muted-foreground text-xs">
                          +{criteria.length - 3} more criteria
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditClick(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(template.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scorecard Template</DialogTitle>
            <DialogDescription>
              Update evaluation criteria for this template
            </DialogDescription>
          </DialogHeader>
          <TemplateForm />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
