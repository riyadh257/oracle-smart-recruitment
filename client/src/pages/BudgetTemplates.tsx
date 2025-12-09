import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp,
  Zap,
  Package,
  Sparkles,
  Check,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";

/**
 * Budget Scenario Templates Page
 * Pre-configured templates for common hiring scenarios
 */

export default function BudgetTemplates() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "seasonal" | "urgent" | "bulk">("all");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [recipientMultiplier, setRecipientMultiplier] = useState(1);
  const [budgetMultiplier, setBudgetMultiplier] = useState(1);

  // Get all templates
  const { data: allTemplates, isLoading: templatesLoading } = 
    trpc.budgetTemplates.getAllTemplates.useQuery({
      category: selectedCategory === "all" ? undefined : selectedCategory,
    });

  // Apply template mutation
  const applyTemplateMutation = trpc.budgetTemplates.applyTemplate.useMutation({
    onSuccess: (data) => {
      toast.success(`Template "${data.templateName}" applied successfully`);
      setShowApplyDialog(false);
      setSelectedTemplate(null);
      setScenarioName("");
      setRecipientMultiplier(1);
      setBudgetMultiplier(1);
      // Navigate to command center to see the created scenario
      navigate("/command-center");
    },
    onError: (error) => {
      toast.error(`Failed to apply template: ${error.message}`);
    },
  });

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;
    
    if (!scenarioName.trim()) {
      toast.error("Please enter a scenario name");
      return;
    }

    applyTemplateMutation.mutate({
      templateId: selectedTemplate.id,
      scenarioName: scenarioName.trim(),
      customizations: {
        adjustRecipients: recipientMultiplier,
        adjustBudget: budgetMultiplier,
      },
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "seasonal":
        return <Calendar className="h-5 w-5" />;
      case "urgent":
        return <Zap className="h-5 w-5" />;
      case "bulk":
        return <Package className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "seasonal":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "urgent":
        return "bg-red-100 text-red-700 border-red-300";
      case "bulk":
        return "bg-purple-100 text-purple-700 border-purple-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Budget Scenario Templates</h1>
          <p className="text-muted-foreground mt-1">
            Pre-configured templates for common hiring campaigns - seasonal, urgent, and bulk recruitment
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
            <TabsTrigger value="urgent">Urgent</TabsTrigger>
            <TabsTrigger value="bulk">Bulk</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {templatesLoading ? (
              <p className="text-center text-muted-foreground py-12">Loading templates...</p>
            ) : !allTemplates || allTemplates.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No templates found</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2 rounded-lg border ${getCategoryColor(template.category)}`}>
                          {getCategoryIcon(template.category)}
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {template.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                          <p className="font-semibold">SAR {(template.totalEstimatedCost / 100).toFixed(0)}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Est. ROI</p>
                          <p className="font-semibold text-green-600">{template.estimatedROI}%</p>
                        </div>
                      </div>

                      {/* Campaigns */}
                      <div>
                        <p className="text-sm font-medium mb-2">Includes {template.defaultCampaigns.length} Campaigns:</p>
                        <ul className="space-y-1">
                          {template.defaultCampaigns.slice(0, 3).map((campaign, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                              <Check className="h-3 w-3 text-green-600" />
                              {campaign.name}
                            </li>
                          ))}
                          {template.defaultCampaigns.length > 3 && (
                            <li className="text-sm text-muted-foreground">
                              ... and {template.defaultCampaigns.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Recommended For */}
                      <div>
                        <p className="text-sm font-medium mb-2">Recommended For:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.recommendedFor.slice(0, 3).map((rec, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {rec}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Apply Button */}
                      <Button 
                        className="w-full"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setScenarioName(template.name);
                          setShowApplyDialog(true);
                        }}
                      >
                        Apply Template
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Apply Template Dialog */}
        <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Apply Budget Template</DialogTitle>
              <DialogDescription>
                Customize the template settings before creating your budget scenario
              </DialogDescription>
            </DialogHeader>

            {selectedTemplate && (
              <div className="space-y-6 py-4">
                {/* Template Info */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">{selectedTemplate.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{selectedTemplate.description}</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Base Cost:</span>
                      <p className="font-medium">SAR {(selectedTemplate.totalEstimatedCost / 100).toFixed(0)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Campaigns:</span>
                      <p className="font-medium">{selectedTemplate.defaultCampaigns.length}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Est. ROI:</span>
                      <p className="font-medium text-green-600">{selectedTemplate.estimatedROI}%</p>
                    </div>
                  </div>
                </div>

                {/* Scenario Name */}
                <div className="space-y-2">
                  <Label htmlFor="scenario-name">Scenario Name *</Label>
                  <Input
                    id="scenario-name"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="e.g., Q1 2024 Tech Hiring"
                  />
                </div>

                {/* Customizations */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Customizations (Optional)</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipient-multiplier">
                      Recipient Multiplier: {recipientMultiplier}x
                    </Label>
                    <Input
                      id="recipient-multiplier"
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={recipientMultiplier}
                      onChange={(e) => setRecipientMultiplier(parseFloat(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Adjust the number of recipients ({recipientMultiplier < 1 ? "decrease" : recipientMultiplier > 1 ? "increase" : "no change"})
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget-multiplier">
                      Budget Multiplier: {budgetMultiplier}x
                    </Label>
                    <Input
                      id="budget-multiplier"
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={budgetMultiplier}
                      onChange={(e) => setBudgetMultiplier(parseFloat(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Adjust the budget per recipient ({budgetMultiplier < 1 ? "decrease" : budgetMultiplier > 1 ? "increase" : "no change"})
                    </p>
                  </div>
                </div>

                {/* Estimated Results */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Estimated Results
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Cost:</span>
                      <p className="font-medium text-lg">
                        SAR {((selectedTemplate.totalEstimatedCost * recipientMultiplier * budgetMultiplier) / 100).toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Recipients:</span>
                      <p className="font-medium text-lg">
                        {Math.round(
                          selectedTemplate.defaultCampaigns.reduce((sum: number, c: any) => sum + c.estimatedRecipients, 0) * 
                          recipientMultiplier
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleApplyTemplate}
                disabled={!scenarioName.trim() || applyTemplateMutation.isPending}
              >
                {applyTemplateMutation.isPending ? "Creating..." : "Create Scenario"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
