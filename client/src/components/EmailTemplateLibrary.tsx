import { useState } from "react";
import { trpc } from "@/lib/trpc";
import TemplateVersionManager from "@/components/TemplateVersionManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import EmailTemplatePreview from "./EmailTemplatePreview";

interface EmailTemplateLibraryProps {
  onSelectTemplate?: (template: any) => void;
}

export default function EmailTemplateLibrary({ onSelectTemplate }: EmailTemplateLibraryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const { data: templates, isLoading } = trpc.emailTemplates.list.useQuery();

  const fillTemplate = trpc.emailTemplates.fillTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Template filled successfully");
      if (onSelectTemplate) {
        onSelectTemplate({
          ...selectedTemplate,
          ...data,
        });
      }
    },
  });

  const handlePreviewTemplate = (template: any) => {
    setSelectedTemplate(template);
    // Initialize variables with placeholders
    const initialVars: Record<string, string> = {};
    template.variables.forEach((v: string) => {
      initialVars[v] = `[${v}]`;
    });
    setVariables(initialVars);
    setIsPreviewOpen(true);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    
    fillTemplate.mutate({
      templateId: selectedTemplate.id,
      variables,
    });
    
    setIsPreviewOpen(false);
  };

  const handleCopyTemplate = () => {
    if (!selectedTemplate) return;
    
    navigator.clipboard.writeText(selectedTemplate.bodyHtml);
    toast.success("Template HTML copied to clipboard");
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      interview: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      application: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      offer: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      rejection: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      general: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[category] || colors.general;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Email Template Library</h2>
        <p className="text-muted-foreground">
          Professional, mobile-responsive email templates for your recruitment needs
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template: any) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Mail className="h-8 w-8 text-primary" />
                <Badge className={getCategoryColor(template.category)}>
                  {template.category}
                </Badge>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <strong>Subject:</strong> {template.subject}
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {template.preview}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreviewTemplate(template)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      handlePreviewTemplate(template);
                    }}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-6 py-4">
              {/* Variable Inputs */}
              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Template Variables</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedTemplate.variables.map((variable: string) => (
                      <div key={variable} className="space-y-2">
                        <Label htmlFor={variable}>
                          {variable.replace(/([A-Z])/g, " $1").replace(/^./, (str: string) => str.toUpperCase())}
                        </Label>
                        <Input
                          id={variable}
                          value={variables[variable] || ""}
                          onChange={(e) =>
                            setVariables({ ...variables, [variable]: e.target.value })
                          }
                          placeholder={`Enter ${variable}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Preview */}
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="html">HTML Code</TabsTrigger>
                  <TabsTrigger value="versions">Version History</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-4">
                  <EmailTemplatePreview
                    subject={selectedTemplate.subject}
                    bodyHtml={selectedTemplate.bodyHtml}
                  />
                </TabsContent>

                <TabsContent value="html" className="mt-4">
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-2 z-10"
                      onClick={handleCopyTemplate}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy HTML
                    </Button>
                    <pre className="rounded-lg border bg-muted p-4 text-xs overflow-x-auto">
                      <code>{selectedTemplate.bodyHtml}</code>
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="versions" className="mt-4">
                  <TemplateVersionManager templateId={selectedTemplate.id} />
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUseTemplate} disabled={fillTemplate.isPending}>
              {fillTemplate.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Use This Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
