import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Eye, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const FONT_OPTIONS = [
  "Inter, sans-serif",
  "Roboto, sans-serif",
  "Open Sans, sans-serif",
  "Montserrat, sans-serif",
  "Lato, sans-serif",
  "Poppins, sans-serif",
  "Playfair Display, serif",
  "Merriweather, serif",
  "Arial, sans-serif",
  "Georgia, serif",
];

const LAYOUT_OPTIONS = [
  { value: "standard", label: "Standard", description: "Classic slide layout with title and content" },
  { value: "split", label: "Split", description: "Two-column layout for comparisons" },
  { value: "full-image", label: "Full Image", description: "Image-focused with minimal text overlay" },
  { value: "minimal", label: "Minimal", description: "Clean layout with lots of whitespace" },
];

export default function TemplateCustomizer() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const templateId = parseInt(id || "0");

  const { data: template, isLoading } = trpc.presentation.getTemplateById.useQuery(
    { id: templateId },
    { enabled: templateId > 0 }
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colors, setColors] = useState({
    primary: "#1e40af",
    secondary: "#3b82f6",
    accent: "#60a5fa",
    background: "#ffffff",
    text: "#1f2937",
  });
  const [fonts, setFonts] = useState({
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  });
  const [layout, setLayout] = useState("standard");

  const updateMutation = trpc.presentation.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const generateThumbnailMutation = trpc.presentation.generateTemplateThumbnail.useMutation({
    onSuccess: () => {
      toast.success("Thumbnail generated successfully");
    },
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      
      try {
        const styleConfig = JSON.parse(template.styleConfig);
        if (styleConfig.colors) {
          setColors(styleConfig.colors);
        }
        if (styleConfig.fonts) {
          setFonts(styleConfig.fonts);
        }
        if (styleConfig.layout) {
          setLayout(styleConfig.layout);
        }
      } catch (error) {
        console.error("Failed to parse style config:", error);
      }
    }
  }, [template]);

  const handleSave = async () => {
    const styleConfig = JSON.stringify({
      colors,
      fonts,
      layout,
    });

    await updateMutation.mutateAsync({
      id: templateId,
      name,
      description,
      styleConfig,
    });

    // Regenerate thumbnail with new styles
    await generateThumbnailMutation.mutateAsync({ id: templateId });
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

  if (!template) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Template Not Found</CardTitle>
              <CardDescription>
                The template you're looking for could not be found.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/presentation")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Customize Template</h1>
              <p className="text-muted-foreground">
                Modify colors, fonts, and layout to match your brand
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {}}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || generateThumbnailMutation.isPending}
            >
              {(updateMutation.isPending || generateThumbnailMutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter template name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter template description"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customization</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="colors">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="colors">Colors</TabsTrigger>
                    <TabsTrigger value="fonts">Fonts</TabsTrigger>
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                  </TabsList>

                  <TabsContent value="colors" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary"
                            type="color"
                            value={colors.primary}
                            onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={colors.primary}
                            onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                            placeholder="#1e40af"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondary">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondary"
                            type="color"
                            value={colors.secondary}
                            onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={colors.secondary}
                            onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accent">Accent Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="accent"
                            type="color"
                            value={colors.accent}
                            onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={colors.accent}
                            onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                            placeholder="#60a5fa"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="background">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="background"
                            type="color"
                            value={colors.background}
                            onChange={(e) => setColors({ ...colors, background: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={colors.background}
                            onChange={(e) => setColors({ ...colors, background: e.target.value })}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="text">Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="text"
                            type="color"
                            value={colors.text}
                            onChange={(e) => setColors({ ...colors, text: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={colors.text}
                            onChange={(e) => setColors({ ...colors, text: e.target.value })}
                            placeholder="#1f2937"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="fonts" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="heading-font">Heading Font</Label>
                        <Select
                          value={fonts.heading}
                          onValueChange={(value) => setFonts({ ...fonts, heading: value })}
                        >
                          <SelectTrigger id="heading-font">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: font }}>{font.split(",")[0]}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="body-font">Body Font</Label>
                        <Select
                          value={fonts.body}
                          onValueChange={(value) => setFonts({ ...fonts, body: value })}
                        >
                          <SelectTrigger id="body-font">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map((font) => (
                              <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: font }}>{font.split(",")[0]}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="layout" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {LAYOUT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setLayout(option.value)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            layout === option.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  See how your template will look with the current settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="aspect-[4/3] rounded-lg overflow-hidden border-2"
                  style={{ backgroundColor: colors.background }}
                >
                  {/* Header */}
                  <div
                    className="h-16 flex items-center px-6"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <h2
                      className="text-2xl font-bold"
                      style={{
                        fontFamily: fonts.heading,
                        color: colors.background,
                      }}
                    >
                      {name || "Template Preview"}
                    </h2>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div
                      className="p-4 rounded"
                      style={{ backgroundColor: colors.secondary }}
                    >
                      <p style={{ fontFamily: fonts.body, color: colors.background }}>
                        Content Block 1
                      </p>
                    </div>
                    <div
                      className="p-4 rounded"
                      style={{ backgroundColor: colors.secondary }}
                    >
                      <p style={{ fontFamily: fonts.body, color: colors.background }}>
                        Content Block 2
                      </p>
                    </div>
                    <div
                      className="p-4 rounded"
                      style={{ backgroundColor: colors.secondary }}
                    >
                      <p style={{ fontFamily: fonts.body, color: colors.background }}>
                        Content Block 3
                      </p>
                    </div>
                  </div>

                  {/* Accent Element */}
                  <div className="absolute bottom-6 right-6">
                    <div
                      className="w-12 h-12 rounded-full opacity-80"
                      style={{ backgroundColor: colors.accent }}
                    />
                  </div>
                </div>

                {/* Color Swatches */}
                <div className="mt-4 flex gap-2">
                  <div className="flex-1 space-y-1">
                    <div
                      className="h-8 rounded"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <p className="text-xs text-center text-muted-foreground">Primary</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div
                      className="h-8 rounded"
                      style={{ backgroundColor: colors.secondary }}
                    />
                    <p className="text-xs text-center text-muted-foreground">Secondary</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div
                      className="h-8 rounded"
                      style={{ backgroundColor: colors.accent }}
                    />
                    <p className="text-xs text-center text-muted-foreground">Accent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
