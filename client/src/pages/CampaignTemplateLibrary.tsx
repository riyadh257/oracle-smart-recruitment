import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Clock, 
  TrendingUp, 
  Calendar, 
  Zap, 
  Star, 
  Eye,
  Copy,
  BarChart3,
  Filter,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function CampaignTemplateLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<'performance' | 'usage' | 'recent'>('performance');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  // Get template library
  const { data: library, isLoading } = trpc.campaignTemplateLibrary.getTemplateLibrary.useQuery({
    category: selectedCategory,
    sortBy,
  });

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: "bg-green-500",
      medium: "bg-yellow-500",
      low: "bg-gray-400",
    };
    return (
      <Badge className={`${colors[confidence as keyof typeof colors]} text-white text-xs`}>
        {confidence.toUpperCase()}
      </Badge>
    );
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 0.1) return <Badge className="bg-green-500 text-white">Excellent</Badge>;
    if (rate >= 0.05) return <Badge className="bg-blue-500 text-white">Good</Badge>;
    if (rate >= 0.02) return <Badge className="bg-yellow-500 text-white">Average</Badge>;
    return <Badge variant="outline">New</Badge>;
  };

  const handleCopyTemplate = (templateId: number) => {
    toast.success("Template copied to your templates");
  };

  const handleUseTemplate = (template: any) => {
    // Navigate to campaign builder with this template
    toast.success(`Using template: ${template.name}`);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-purple-500" />
              Campaign Template Library
            </h1>
            <p className="text-gray-600 mt-1">
              Pre-optimized email templates with ML-predicted send times for maximum engagement
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="job_match">Job Match</SelectItem>
                    <SelectItem value="application">Application</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Best Performance</SelectItem>
                    <SelectItem value="usage">Most Used</SelectItem>
                    <SelectItem value="recent">Recently Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Library */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading template library...</p>
          </div>
        ) : library && library.templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {library.templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-500" />
                        {template.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {template.subject}
                      </CardDescription>
                    </div>
                    {getPerformanceBadge(template.avgConversionRate)}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                    {getConfidenceBadge(template.confidence)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Performance Metrics */}
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Open Rate:</span>
                      <span className="font-semibold">{(template.avgOpenRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Click Rate:</span>
                      <span className="font-semibold">{(template.avgClickRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Conversion:</span>
                      <span className="font-semibold text-green-600">
                        {(template.avgConversionRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Times Used:</span>
                      <span className="font-semibold">{template.usageCount}</span>
                    </div>
                  </div>

                  {/* ML-Optimized Send Time */}
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-900">
                        Optimal Send Time
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-gray-600">Day:</div>
                        <div className="font-semibold text-purple-700">
                          {dayNames[template.optimalDayOfWeek]}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Time:</div>
                        <div className="font-semibold text-purple-700">
                          {template.optimalHour}:00
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Expected conversion: {(template.expectedConversionRate * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Recommended Segment */}
                  {(template.recommendedFor.industry || 
                    template.recommendedFor.experienceLevel || 
                    template.recommendedFor.location) && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-semibold text-blue-900 mb-2">
                        Best For:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.recommendedFor.industry && (
                          <Badge variant="outline" className="text-xs">
                            {template.recommendedFor.industry}
                          </Badge>
                        )}
                        {template.recommendedFor.experienceLevel && (
                          <Badge variant="outline" className="text-xs">
                            {template.recommendedFor.experienceLevel}
                          </Badge>
                        )}
                        {template.recommendedFor.location && (
                          <Badge variant="outline" className="text-xs">
                            {template.recommendedFor.location}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No templates found</p>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your filters or create your first template
              </p>
            </CardContent>
          </Card>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewTemplate?.name}</DialogTitle>
              <DialogDescription>{previewTemplate?.subject}</DialogDescription>
            </DialogHeader>
            {previewTemplate && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div
                    dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }}
                    className="prose max-w-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleCopyTemplate(previewTemplate.id)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Template
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleUseTemplate(previewTemplate)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Use This Template
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
