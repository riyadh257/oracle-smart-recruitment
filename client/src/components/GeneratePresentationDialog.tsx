import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Presentation, Check } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface GeneratePresentationDialogProps {
  candidateId: number;
  candidateName: string;
}

export function GeneratePresentationDialog({
  candidateId,
  candidateName,
}: GeneratePresentationDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [includeInterviews, setIncludeInterviews] = useState(true);
  const [includeScreening, setIncludeScreening] = useState(true);
  const [, setLocation] = useLocation();

  const { data: templates, isLoading: templatesLoading } = trpc.presentation.listTemplates.useQuery(
    { category: "candidate-profile" },
    { enabled: open }
  );

  const generateMutation = trpc.presentation.generateFromCandidate.useMutation({
    onSuccess: (data) => {
      toast.success("Presentation generated successfully!");
      setOpen(false);
      // Navigate to presentations page
      setLocation("/presentations");
    },
    onError: (error) => {
      toast.error(`Failed to generate presentation: ${error.message}`);
    },
  });

  const incrementUsageMutation = trpc.presentation.incrementTemplateUsage.useMutation();

  // Set default template when templates load
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = templates.find((t: any) => t.isDefault) || templates[0];
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [templates, selectedTemplateId]);

  const handleGenerate = () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template");
      return;
    }

    const selectedTemplate = templates?.find((t: any) => t.id === selectedTemplateId);
    const templateStyle = selectedTemplate?.name.toLowerCase().replace(/\s+/g, '-') || 'professional';

    generateMutation.mutate({
      candidateId,
      templateStyle,
      includeInterviews,
      includeScreening,
    });

    // Track template usage
    incrementUsageMutation.mutate({ id: selectedTemplateId });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Presentation className="w-4 h-4 mr-2" />
          Generate Presentation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Candidate Presentation</DialogTitle>
          <DialogDescription>
            Auto-generate a professional presentation for {candidateName} using AI.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-3">
            <Label>Choose Presentation Template</Label>
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                {templates?.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`relative group rounded-lg border-2 transition-all overflow-hidden ${
                      selectedTemplateId === template.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[4/3] bg-muted relative">
                      {template.thumbnailUrl ? (
                        <img
                          src={template.thumbnailUrl}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Presentation className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
                      
                      {/* Selected indicator */}
                      {selectedTemplateId === template.id && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    
                    {/* Template info */}
                    <div className="p-2 text-left">
                      <p className="font-medium text-sm truncate">{template.name}</p>
                      {template.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-interviews"
              checked={includeInterviews}
              onCheckedChange={(checked) => setIncludeInterviews(checked as boolean)}
            />
            <Label
              htmlFor="include-interviews"
              className="text-sm font-normal cursor-pointer"
            >
              Include interview feedback and performance
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-screening"
              checked={includeScreening}
              onCheckedChange={(checked) => setIncludeScreening(checked as boolean)}
            />
            <Label
              htmlFor="include-screening"
              className="text-sm font-normal cursor-pointer"
            >
              Include AI screening results
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
