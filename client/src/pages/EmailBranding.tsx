import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Palette, Upload, Eye, History } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * Email Branding Customization Page
 * 
 * Allows admins to customize email template branding including:
 * - Company name and logo
 * - Primary and secondary colors
 * - Custom header and footer text
 * - Personalized greetings
 * - Custom sections for digest emails
 */
export default function EmailBranding() {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const { data: branding, isLoading } = trpc.emailBranding.get.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: history } = trpc.emailBranding.getHistory.useQuery(undefined, {
    enabled: !!user,
  });

  const createBranding = trpc.emailBranding.create.useMutation({
    onSuccess: () => {
      toast.success("Email branding created successfully");
      utils.emailBranding.get.invalidate();
      utils.emailBranding.getHistory.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create branding: ${error.message}`);
    },
  });

  const updateBranding = trpc.emailBranding.update.useMutation({
    onSuccess: () => {
      toast.success("Email branding updated successfully");
      utils.emailBranding.get.invalidate();
      utils.emailBranding.getHistory.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update branding: ${error.message}`);
    },
  });

  const uploadLogo = trpc.emailBranding.uploadLogo.useMutation({
    onSuccess: (data) => {
      setLogoUrl(data.url);
      setLogoKey(data.fileKey);
      toast.success("Logo uploaded successfully");
    },
    onError: (error) => {
      toast.error(`Failed to upload logo: ${error.message}`);
    },
  });

  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoKey, setLogoKey] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4F46E5");
  const [secondaryColor, setSecondaryColor] = useState("#1E40AF");
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [customGreeting, setCustomGreeting] = useState("");
  const [customSections, setCustomSections] = useState<Array<{ title: string; content: string }>>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (branding) {
      setCompanyName(branding.companyName || "");
      setLogoUrl(branding.logoUrl || "");
      setLogoKey(branding.logoKey || "");
      setPrimaryColor(branding.primaryColor || "#4F46E5");
      setSecondaryColor(branding.secondaryColor || "#1E40AF");
      setHeaderText(branding.headerText || "");
      setFooterText(branding.footerText || "");
      setCustomGreeting(branding.customGreeting || "");
      
      if (branding.customSections) {
        try {
          setCustomSections(JSON.parse(branding.customSections));
        } catch (e) {
          setCustomSections([]);
        }
      }
    }
  }, [branding]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file size must be less than 2MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event: any) => {
      const base64 = event.target?.result as string;
      const base64Data = base64.split(",")[1]; // Remove data:image/...;base64, prefix

      uploadLogo.mutate({
        fileName: file.name,
        fileData: base64Data,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const data = {
      companyName,
      logoUrl: logoUrl || undefined,
      logoKey: logoKey || undefined,
      primaryColor,
      secondaryColor,
      headerText: headerText || undefined,
      footerText: footerText || undefined,
      customGreeting: customGreeting || undefined,
      customSections: customSections.length > 0 ? JSON.stringify(customSections) : undefined,
    };

    if (branding) {
      updateBranding.mutate({ id: branding.id, ...data });
    } else {
      createBranding.mutate(data);
    }
  };

  const addCustomSection = () => {
    setCustomSections([...customSections, { title: "", content: "" }]);
  };

  const updateCustomSection = (index: number, field: "title" | "content", value: string) => {
    const updated = [...customSections];
    updated[index][field] = value;
    setCustomSections(updated);
  };

  const removeCustomSection = (index: number) => {
    setCustomSections(customSections.filter((_, i) => i !== index));
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Branding</h1>
            <p className="text-muted-foreground mt-2">
              Customize the appearance of your recruitment emails and digests
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Email Preview</DialogTitle>
                  <DialogDescription>
                    This is how your branded emails will appear
                  </DialogDescription>
                </DialogHeader>
                <div className="border rounded-lg p-4" style={{ backgroundColor: "#f9f9f9" }}>
                  <div
                    className="p-6 text-white text-center rounded-t-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt={companyName}
                        className="max-w-[150px] mx-auto mb-4"
                      />
                    )}
                    <h1 className="text-2xl font-bold">Daily Recruitment Digest</h1>
                    <p className="mt-2">{customGreeting || "Hello, here's your daily summary"}</p>
                    {headerText && <p className="mt-2 text-sm opacity-90">{headerText}</p>}
                  </div>
                  <div className="p-6 bg-white">
                    <div
                      className="p-4 border-l-4 mb-4"
                      style={{ borderLeftColor: primaryColor, backgroundColor: "#f9f9f9" }}
                    >
                      <h3 className="font-bold mb-2" style={{ color: secondaryColor }}>
                        Sample Notification
                      </h3>
                      <p className="text-sm">This is a sample notification in your digest</p>
                    </div>
                    {customSections.map((section, index) => (
                      <div key={index} className="p-4 border rounded mb-4">
                        <h3 className="font-bold mb-2" style={{ color: primaryColor }}>
                          {section.title || "Custom Section"}
                        </h3>
                        <p className="text-sm">{section.content || "Custom content here"}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-gray-100 text-center text-sm text-gray-600 rounded-b-lg">
                    <p>{footerText || "You're receiving this email because you've enabled daily digest notifications."}</p>
                    <p className="mt-2">&copy; {new Date().getFullYear()} {companyName || "Your Company"}. All rights reserved.</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Basic company details that appear in your emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo</Label>
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="h-16 w-auto border rounded" />
                  )}
                  <div>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadLogo.isPending}
                      className="max-w-xs"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      PNG or JPG, max 2MB
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Scheme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Scheme
              </CardTitle>
              <CardDescription>
                Choose colors that match your brand identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#4F46E5"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Used for headers and accents
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#1E40AF"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Used for titles and highlights
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Text */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Text</CardTitle>
              <CardDescription>
                Personalize the messaging in your emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customGreeting">Custom Greeting</Label>
                <Input
                  id="customGreeting"
                  value={customGreeting}
                  onChange={(e) => setCustomGreeting(e.target.value)}
                  placeholder="Hello {userName}, here's your daily summary"
                />
                <p className="text-sm text-muted-foreground">
                  Use {"{userName}"} as a placeholder for the recipient's name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headerText">Header Text</Label>
                <Textarea
                  id="headerText"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="Additional text to appear in the email header"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text</Label>
                <Textarea
                  id="footerText"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Custom footer message"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Sections</CardTitle>
              <CardDescription>
                Add custom sections to your digest emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {customSections.map((section, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Section {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomSection(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    value={section.title}
                    onChange={(e) => updateCustomSection(index, "title", e.target.value)}
                    placeholder="Section title"
                  />
                  <Textarea
                    value={section.content}
                    onChange={(e) => updateCustomSection(index, "content", e.target.value)}
                    placeholder="Section content"
                    rows={3}
                  />
                </div>
              ))}
              <Button variant="outline" onClick={addCustomSection}>
                Add Custom Section
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={createBranding.isPending || updateBranding.isPending}
            >
              {(createBranding.isPending || updateBranding.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Branding
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </div>

          {/* Version History */}
          {history && history.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Version History
                </CardTitle>
                <CardDescription>
                  Previous versions of your email branding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium">Version {item.version}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.updatedAt).toLocaleString()}
                          {item.isActive && " (Active)"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
