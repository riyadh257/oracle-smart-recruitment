import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Eye, Save, Palette, Layout, Code } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'data_table' | 'chart' | 'merge_tag';
  config: Record<string, any>;
  position: number;
}

interface MergeTag {
  tag: string;
  description: string;
  sampleValue: string;
}

export default function EmailTemplateEditor() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("design");
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1e40af");
  const [secondaryColor, setSecondaryColor] = useState("#3b82f6");
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [headerHtml, setHeaderHtml] = useState("");
  const [footerHtml, setFooterHtml] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  // Default merge tags
  const [mergeTags] = useState<MergeTag[]>([
    { tag: "companyName", description: "Company name", sampleValue: "Oracle Recruitment" },
    { tag: "reportDate", description: "Report date", sampleValue: new Date().toLocaleDateString() },
    { tag: "reportTitle", description: "Report title", sampleValue: "Weekly Analytics Report" },
    { tag: "candidateCount", description: "Number of candidates", sampleValue: "150" },
    { tag: "interviewCount", description: "Number of interviews", sampleValue: "45" },
    { tag: "year", description: "Current year", sampleValue: new Date().getFullYear().toString() },
  ]);

  const createMutation = trpc.reportEmailTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully!");
      navigate("/email-templates");
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const generatePreviewMutation = trpc.reportEmailTemplates.generatePreview.useMutation({
    onSuccess: (data) => {
      setPreviewHtml(data.previewHtml);
      setActiveTab("preview");
    },
    onError: (error) => {
      toast.error(`Failed to generate preview: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!name || !subjectTemplate || !bodyHtml) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      name,
      description,
      logoUrl: logoUrl || undefined,
      primaryColor,
      secondaryColor,
      fontFamily,
      headerHtml: headerHtml || undefined,
      footerHtml: footerHtml || undefined,
      subjectTemplate,
      bodyHtml,
      bodyText: bodyText || undefined,
      availableMergeTags: mergeTags,
      isDefault,
    });
  };

  const handlePreview = () => {
    if (!bodyHtml) {
      toast.error("Please add body content first");
      return;
    }

    // Create sample data from merge tags
    const sampleData: Record<string, string> = {};
    mergeTags.forEach(tag => {
      sampleData[tag.tag] = tag.sampleValue;
    });

    // Generate preview locally (without saving to DB)
    let preview = bodyHtml;
    mergeTags.forEach(tag => {
      preview = preview.replace(new RegExp(`{{${tag.tag}}}`, 'g'), tag.sampleValue);
    });

    const fullPreview = `
      <div style="font-family: ${fontFamily}; max-width: 600px; margin: 0 auto;">
        ${headerHtml || ''}
        <div style="padding: 20px;">
          ${preview}
        </div>
        ${footerHtml || ''}
      </div>
    `;

    setPreviewHtml(fullPreview);
    setActiveTab("preview");
  };

  const loadTemplate = (templateId: string) => {
    const templates: Record<string, any> = {
      professional: {
        name: 'Professional Report',
        primaryColor: '#1e40af',
        secondaryColor: '#3b82f6',
        fontFamily: 'Arial, sans-serif',
        headerHtml: '<div style="background: #1e40af; color: white; padding: 20px; text-align: center;"><h1>{{companyName}}</h1></div>',
        footerHtml: '<div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">© {{year}} {{companyName}}. All rights reserved.</div>',
        subjectTemplate: 'Weekly Report - {{reportDate}}',
        bodyHtml: '<div style="padding: 30px;"><h2>Report Summary</h2><p>This week we processed {{candidateCount}} candidates and conducted {{interviewCount}} interviews.</p></div>',
      },
      minimal: {
        name: 'Minimal',
        primaryColor: '#000000',
        secondaryColor: '#6b7280',
        fontFamily: 'Georgia, serif',
        headerHtml: '<div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;"><h2>{{reportTitle}}</h2></div>',
        footerHtml: '<div style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 20px; font-size: 11px; color: #9ca3af;">Sent on {{reportDate}}</div>',
        subjectTemplate: '{{reportTitle}} - {{reportDate}}',
        bodyHtml: '<div style="font-family: Georgia, serif; line-height: 1.6;"><p>{{candidateCount}} candidates processed this week.</p></div>',
      },
      branded: {
        name: 'Branded',
        primaryColor: '#7c3aed',
        secondaryColor: '#a78bfa',
        fontFamily: 'Helvetica, Arial, sans-serif',
        headerHtml: '<div style="background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">{{companyName}}</h1></div>',
        footerHtml: '<div style="background: #f9fafb; padding: 20px; text-align: center;"><p style="margin: 0; font-size: 13px; color: #6b7280;">Oracle Recruitment System</p></div>',
        subjectTemplate: '{{companyName}} - {{reportTitle}}',
        bodyHtml: '<div style="padding: 40px; background: white;"><h2 style="color: #7c3aed;">{{reportTitle}}</h2><div style="margin-top: 20px;"><p>Total candidates: {{candidateCount}}</p><p>Interviews conducted: {{interviewCount}}</p></div></div>',
      },
    };

    const template = templates[templateId];
    if (template) {
      setName(template.name);
      setPrimaryColor(template.primaryColor);
      setSecondaryColor(template.secondaryColor);
      setFontFamily(template.fontFamily);
      setHeaderHtml(template.headerHtml);
      setFooterHtml(template.footerHtml);
      setSubjectTemplate(template.subjectTemplate);
      setBodyHtml(template.bodyHtml);
      toast.success(`Loaded ${template.name} template`);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/email-templates")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Email Template Editor</h1>
              <p className="text-muted-foreground">Create branded email templates for scheduled reports</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="design">
              <Palette className="w-4 h-4 mr-2" />
              Design
            </TabsTrigger>
            <TabsTrigger value="layout">
              <Layout className="w-4 h-4 mr-2" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="content">
              <Code className="w-4 h-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Template Library</CardTitle>
                <CardDescription>Start with a pre-designed template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Button variant="outline" onClick={() => loadTemplate('professional')}>
                    Professional
                  </Button>
                  <Button variant="outline" onClick={() => loadTemplate('minimal')}>
                    Minimal
                  </Button>
                  <Button variant="outline" onClick={() => loadTemplate('branded')}>
                    Branded
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Customize colors and fonts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Weekly Report Template"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#1e40af"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Input
                      id="fontFamily"
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      placeholder="Arial, sans-serif"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Header Section</CardTitle>
                <CardDescription>HTML content for email header</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={headerHtml}
                  onChange={(e) => setHeaderHtml(e.target.value)}
                  placeholder="<div>Header HTML...</div>"
                  rows={6}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Footer Section</CardTitle>
                <CardDescription>HTML content for email footer</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={footerHtml}
                  onChange={(e) => setFooterHtml(e.target.value)}
                  placeholder="<div>Footer HTML...</div>"
                  rows={6}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Subject</CardTitle>
                <CardDescription>Subject line template (use merge tags like reportDate)</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  placeholder="Weekly Report - {{reportDate}}"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Body (HTML)</CardTitle>
                <CardDescription>Main content area - use merge tags for dynamic content</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  placeholder="<div><h2>Report Content</h2><p>{{reportContent}}</p></div>"
                  rows={12}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Merge Tags</CardTitle>
                <CardDescription>Click to copy to clipboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {mergeTags.map((tag) => (
                    <Button
                      key={tag.tag}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`{{${tag.tag}}}`);
                        toast.success(`Copied {{${tag.tag}}}`);
                      }}
                    >
                      {`{{${tag.tag}}}`}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
                <CardDescription>Preview with sample data</CardDescription>
              </CardHeader>
              <CardContent>
                {previewHtml ? (
                  <div 
                    className="border rounded-lg p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Click "Preview" to see your template with sample data
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
