import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Mail, Users, CheckCircle2, XCircle } from "lucide-react";

interface BulkSendCampaignDialogProps {
  campaignId: number;
  campaignName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BulkSendCampaignDialog({
  campaignId,
  campaignName,
  open,
  onOpenChange,
}: BulkSendCampaignDialogProps) {
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch candidates list
  const { data: candidates, isLoading } = trpc.candidates.list.useQuery(
    { limit: 100 },
    { enabled: open }
  );

  // Bulk execute mutation
  const bulkExecuteMutation = trpc.campaigns.bulkExecute.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Campaign sent successfully! ${result.successful} sent, ${result.failed} failed.`,
        {
          description:
            result.failed > 0
              ? `${result.errors.length} errors occurred. Check console for details.`
              : undefined,
        }
      );
      if (result.errors.length > 0) {
        console.error("Bulk send errors:", result.errors);
      }
      onOpenChange(false);
      setSelectedCandidates([]);
      setSelectAll(false);
    },
    onError: (error) => {
      toast.error(`Failed to send campaign: ${error.message}`);
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked && candidates) {
      setSelectedCandidates(candidates.map((c) => c.id));
    } else {
      setSelectedCandidates([]);
    }
  };

  const handleSelectCandidate = (candidateId: number, checked: boolean) => {
    if (checked) {
      setSelectedCandidates([...selectedCandidates, candidateId]);
    } else {
      setSelectedCandidates(selectedCandidates.filter((id) => id !== candidateId));
      setSelectAll(false);
    }
  };

  const handleSend = () => {
    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate");
      return;
    }

    bulkExecuteMutation.mutate({
      campaignId,
      candidateIds: selectedCandidates,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Campaign: {campaignName}
          </DialogTitle>
          <DialogDescription>
            Select candidates to send this email campaign to. The campaign will be executed for each selected candidate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              disabled={isLoading || !candidates || candidates.length === 0}
            />
            <Label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              Select All ({candidates?.length || 0} candidates)
            </Label>
          </div>

          {/* Candidates List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !candidates || candidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No candidates available</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      id={`candidate-${candidate.id}`}
                      checked={selectedCandidates.includes(candidate.id)}
                      onCheckedChange={(checked) =>
                        handleSelectCandidate(candidate.id, checked as boolean)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={`candidate-${candidate.id}`}
                        className="text-sm font-medium cursor-pointer block"
                      >
                        {candidate.fullName}
                      </Label>
                      <p className="text-xs text-muted-foreground truncate">
                        {candidate.email}
                      </p>
                      {candidate.headline && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {candidate.headline}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Summary */}
          {selectedCandidates.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedCandidates.length} candidate{selectedCandidates.length !== 1 ? "s" : ""} selected
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={bulkExecuteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              selectedCandidates.length === 0 || bulkExecuteMutation.isPending
            }
          >
            {bulkExecuteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send to {selectedCandidates.length} Candidate{selectedCandidates.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
