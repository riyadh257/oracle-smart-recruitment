import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Presentation as PresentationIcon } from "lucide-react";

/**
 * Presentation Slides Viewer
 * Displays the Oracle Smart Recruitment presentation slides
 */
export default function Presentation() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const presentationPath = "/home/ubuntu/oracle-smart-recruitment/presentation/slides";

  useEffect(() => {
    // Simulate loading check
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenPresentation = () => {
    // Open presentation in new window
    window.open(`/presentation-viewer?path=${encodeURIComponent(presentationPath)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Presentation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Presentation Slides</h1>
        <p className="text-muted-foreground">
          View the Oracle Smart Recruitment System presentation
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <PresentationIcon className="w-5 h-5" />
                Oracle Smart Recruitment System
              </CardTitle>
              <CardDescription>
                Comprehensive presentation covering system architecture, AI capabilities, and implementation roadmap
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Presentation Topics</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Executive Summary & Vision</li>
                <li>• System Architecture Overview</li>
                <li>• AI-Powered Features</li>
                <li>• Implementation Roadmap</li>
                <li>• Technical Infrastructure</li>
                <li>• Security & Compliance</li>
                <li>• ROI & Success Metrics</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Presentation Details</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Format: Interactive HTML Slides</li>
                <li>• Total Slides: 12</li>
                <li>• Duration: ~20-30 minutes</li>
                <li>• Includes: Diagrams, charts, and visuals</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleOpenPresentation} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Open Presentation
            </Button>
            <Button variant="outline" onClick={() => {
              const link = document.createElement('a');
              link.href = `/api/presentation/export?format=pdf&path=${encodeURIComponent(presentationPath)}`;
              link.download = 'oracle-smart-recruitment-presentation.pdf';
              link.click();
            }}>
              Download PDF
            </Button>
          </div>

          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p>
              <strong>Note:</strong> This presentation is designed for stakeholders, technical teams, and decision-makers. 
              It provides a comprehensive overview of the Oracle Smart Recruitment System's capabilities and implementation strategy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
