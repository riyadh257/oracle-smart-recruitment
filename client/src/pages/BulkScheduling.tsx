import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, AlertTriangle, CheckCircle2, Users, FileText } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function BulkScheduling() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    scheduledAt: "",
    duration: 60,
    location: "",
    notes: "",
    templateId: undefined as number | undefined,
  });

  const { data: candidates, isLoading } = trpc.interviews.listPendingScheduling.useQuery(undefined, {
    enabled: !!user,
  });

  const employerId = user?.id || 1;
  const { data: templates } = trpc.feedback.getTemplates.useQuery(
    { employerId },
    { enabled: !!user }
  );

  const scheduleMutation = trpc.interviews.bulkScheduleInterviews.useMutation({
    onSuccess: () => {
      toast.success("Interviews scheduled successfully");
      setSelectedCandidates([]);
      setShowScheduleForm(false);
      setScheduleData({
        scheduledAt: "",
        duration: 60,
        location: "",
        notes: "",
        templateId: undefined,
      });
    },
    onError: (error) => {
      toast.error(`Failed to schedule: ${error.message}`);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const toggleCandidate = (id: number) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (!candidates) return;
    if (selectedCandidates.length === candidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates.map((c) => c.id));
    }
  };

  const handleOpenScheduleForm = () => {
    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate");
      return;
    }
    setShowScheduleForm(true);
  };

  const handleBulkSchedule = () => {
    if (!scheduleData.scheduledAt) {
      toast.error("Please select a date and time");
      return;
    }
    scheduleMutation.mutate({
      candidateIds: selectedCandidates,
      ...scheduleData,
    });
  };

  const hasConflicts = candidates?.some((c) => c.hasConflict) || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Bulk Interview Scheduling</h1>
          <p className="text-slate-600">Select multiple candidates and schedule interviews efficiently</p>
        </div>

        <div className="grid gap-6 mb-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{candidates?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Candidates awaiting scheduling</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedCandidates.length}</div>
              <p className="text-xs text-muted-foreground">Ready to schedule</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {candidates?.filter((c) => c.hasConflict).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Availability issues detected</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Candidate Selection</CardTitle>
                <CardDescription>Review availability and select candidates to schedule</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={toggleAll} disabled={!candidates || candidates.length === 0}>
                  {selectedCandidates.length === candidates?.length ? "Deselect All" : "Select All"}
                </Button>
                <Button
                  onClick={handleOpenScheduleForm}
                  disabled={selectedCandidates.length === 0}
                >
                  Schedule {selectedCandidates.length} Interview{selectedCandidates.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !candidates || candidates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending interviews to schedule</p>
              </div>
            ) : (
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                      selectedCandidates.includes(candidate.id)
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Checkbox
                      checked={selectedCandidates.includes(candidate.id)}
                      onCheckedChange={() => toggleCandidate(candidate.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{candidate.name}</h3>
                        <Badge variant={candidate.hasConflict ? "destructive" : "secondary"}>
                          {candidate.position}
                        </Badge>
                        {candidate.hasConflict && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Conflict
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Suggested: {candidate.suggestedDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{candidate.suggestedTime}</span>
                        </div>
                      </div>
                      {candidate.hasConflict && (
                        <p className="mt-2 text-sm text-orange-600">
                          ⚠️ {candidate.conflictReason}
                        </p>
                      )}
                      <div className="mt-2 text-xs text-slate-500">
                        Available slots: {candidate.availableSlots.join(", ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {hasConflicts && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Scheduling Conflicts Detected
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-orange-800">
              <p>
                Some candidates have scheduling conflicts. Review the alternative time slots or contact
                candidates directly to resolve availability issues before scheduling.
              </p>
            </CardContent>
          </Card>
        )}

        {showScheduleForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Schedule Interview Details</CardTitle>
              <CardDescription>
                Configure interview details for {selectedCandidates.length} selected candidate{selectedCandidates.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={scheduleData.scheduledAt}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={scheduleData.duration}
                    onChange={(e) => setScheduleData({ ...scheduleData, duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., Conference Room A or Zoom link"
                  value={scheduleData.location}
                  onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Feedback Template (optional)</Label>
                <Select
                  value={scheduleData.templateId?.toString() || "none"}
                  onValueChange={(value) =>
                    setScheduleData({
                      ...scheduleData,
                      templateId: value === "none" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a feedback template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {template.name}
                          {template.isDefault && (
                            <Badge variant="secondary" className="ml-2">Default</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose a template to standardize feedback collection for these interviews
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes for the interviewer..."
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowScheduleForm(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkSchedule}
                  disabled={!scheduleData.scheduledAt || scheduleMutation.isPending}
                >
                  {scheduleMutation.isPending ? "Scheduling..." : "Confirm Schedule"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
