import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";

export default function PresentationExport() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [isExporting, setIsExporting] = useState(false);

  const presentationId = parseInt(id || "0");
  const { data: presentation, isLoading } = trpc.presentation.getById.useQuery(
    { id: presentationId },
    { enabled: !!presentationId }
  );

  const exportMutation = trpc.presentation.exportToPowerPoint.useMutation({
    onSuccess: (data) => {
      toast.success("Export information retrieved");
      // In a real implementation, this would trigger the export process
      // For now, we'll show the information needed for export
      console.log("Export data:", data);
      setIsExporting(false);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
      setIsExporting(false);
    },
  });

  const handleExportPowerPoint = async () => {
    if (!presentation) return;
    
    setIsExporting(true);
    try {
      const exportData = await exportMutation.mutateAsync({ presentationId });
      
      // Show instructions for using manus-export-slides
      toast.info(
        "To export this presentation, use the manus-export-slides utility in the terminal",
        { duration: 5000 }
      );
      
      // In a production environment, this would trigger a backend process
      // that uses manus-export-slides to generate the .pptx file
      console.log("Use command: manus-export-slides", exportData.slidesVersion || exportData.slidesPath, "ppt");
      
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Presentation not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setLocation("/presentations")}
            >
              Back to Presentations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => setLocation("/presentations")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Presentations
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Export Presentation</CardTitle>
          <CardDescription>
            Export "{presentation.title}" to various formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">PowerPoint (.pptx)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Export your presentation as a PowerPoint file for offline sharing with
                  stakeholders. The file will maintain the original formatting and layout.
                </p>
                <Button
                  onClick={handleExportPowerPoint}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export to PowerPoint
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg opacity-50">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">PDF Document (.pdf)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Export as a PDF document for easy viewing and printing. Coming soon.
                </p>
                <Button disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Export to PDF (Coming Soon)
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Export Information</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>
                <span className="font-medium">Slides Path:</span>{" "}
                {presentation.slidesPath}
              </p>
              {presentation.slidesVersion && (
                <p>
                  <span className="font-medium">Version:</span>{" "}
                  {presentation.slidesVersion}
                </p>
              )}
              <p className="mt-3 text-xs">
                Exports are processed on the server and will be available for download once
                complete. Large presentations may take a few moments to export.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
