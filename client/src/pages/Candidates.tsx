import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Mail, Phone, Sparkles, BarChart3, Presentation, Download, FileText, ChevronDown, Send } from "lucide-react";
import { GeneratePresentationDialog } from "@/components/GeneratePresentationDialog";
import CultureFitRadar from "@/components/CultureFitRadar";
import WellbeingScore from "@/components/WellbeingScore";
import { CandidateMatchIndicators } from "@/components/CandidateMatchIndicators";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export default function Candidates() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [bulkScheduleOpen, setBulkScheduleOpen] = useState(false);
  const [bulkMessageOpen, setBulkMessageOpen] = useState(false);
  const [bulkScheduleData, setBulkScheduleData] = useState({
    scheduledAt: "",
    duration: 60,
    location: "",
    notes: "",
  });
  const [bulkMessageData, setBulkMessageData] = useState({
    templateId: 0,
    subject: "",
    message: "",
  });
  const { data: candidates, isLoading, refetch } = trpc.candidate.list.useQuery();
  const { data: jobs } = trpc.jobs.list.useQuery({ status: "open" });
  const createCandidate = trpc.candidate.create.useMutation({
    onSuccess: () => {
      toast.success("Candidate added successfully");
      refetch();
      setOpen(false);
    },
  });
  const screenCandidate = trpc.candidate.screenWithAI.useMutation({
    onSuccess: () => {
      toast.success("AI screening completed");
      refetch();
    },
  });

  const bulkApprove = trpc.candidate.bulkApprove.useMutation({
    onSuccess: () => {
      toast.success("Candidates approved");
      refetch();
      setSelectedCandidates([]);
    },
  });

  const bulkReject = trpc.candidate.bulkReject.useMutation({
    onSuccess: () => {
      toast.success("Candidates rejected");
      refetch();
      setSelectedCandidates([]);
    },
  });

  const bulkScheduleInterviews = trpc.candidate.bulkScheduleInterviews.useMutation({
    onSuccess: () => {
      toast.success("Interviews scheduled");
      refetch();
      setSelectedCandidates([]);
      setBulkScheduleOpen(false);
    },
  });

  const { data: emailTemplates } = trpc.emailTemplateSystem.getTemplates.useQuery({
    isActive: true,
  });

  const sendBulkMessage = trpc.candidate.bulkSendMessage.useMutation({
    onSuccess: () => {
      toast.success("Messages sent successfully");
      refetch();
      setSelectedCandidates([]);
      setBulkMessageOpen(false);
      setBulkMessageData({ templateId: 0, subject: "", message: "" });
    },
    onError: (error) => {
      toast.error(`Failed to send messages: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    linkedinUrl: "",
    jobId: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCandidate.mutate(formData);
  };

  const toggleSelectAll = () => {
    if (selectedCandidates.length === candidates?.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates?.map(c => c.id) || []);
    }
  };

  const toggleSelectCandidate = (id: number) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(selectedCandidates.filter(cid => cid !== id));
    } else {
      setSelectedCandidates([...selectedCandidates, id]);
    }
  };

  const handleBulkSchedule = () => {
    if (!bulkScheduleData.scheduledAt) {
      toast.error("Please select a date and time");
      return;
    }
    bulkScheduleInterviews.mutate({
      candidateIds: selectedCandidates,
      ...bulkScheduleData,
    });
  };

  const handleBulkMessage = () => {
    if (!bulkMessageData.subject || !bulkMessageData.message) {
      toast.error("Please fill in subject and message");
      return;
    }
    sendBulkMessage.mutate({
      candidateIds: selectedCandidates,
      templateId: bulkMessageData.templateId || undefined,
      subject: bulkMessageData.subject,
      message: bulkMessageData.message,
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates?.templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setBulkMessageData({
        templateId: template.id,
        subject: template.subject,
        message: template.bodyText || template.bodyHtml,
      });
    }
  };

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "secondary";
      case "screening":
        return "default";
      case "interview":
        return "default";
      case "offer":
        return "default";
      case "hired":
        return "default";
      case "rejected":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Candidates</h1>
            <p className="text-muted-foreground mt-2">
              Manage candidate applications
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const candidatesData = candidates?.map(c => ({
                    name: c.name,
                    email: c.email,
                    skills: c.skills ? JSON.parse(c.skills) : [],
                    experience: c.yearsOfExperience || 0,
                    location: c.location || "N/A",
                    status: c.status,
                  })) || [];
                  const result = await trpc.export.candidatesCSV.mutate({ candidates: candidatesData });
                  const blob = new Blob([result.csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = result.filename;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  toast.success("CSV exported successfully");
                } catch (error) {
                  toast.error("Failed to export CSV");
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const candidatesData = candidates?.map(c => ({
                    name: c.name,
                    email: c.email,
                    skills: c.skills ? JSON.parse(c.skills) : [],
                    experience: c.yearsOfExperience || 0,
                    location: c.location || "N/A",
                    status: c.status,
                  })) || [];
                  const result = await trpc.export.candidatesPDF.mutate({ 
                    title: "Candidates Report",
                    candidates: candidatesData 
                  });
                  const blob = new Blob([Uint8Array.from(atob(result.pdf), c => c.charCodeAt(0))], { type: 'application/pdf' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = result.filename;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  toast.success("PDF exported successfully");
                } catch (error) {
                  toast.error("Failed to export PDF");
                }
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/analytics'}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            {selectedCandidates.length > 0 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default">
                      Bulk Actions ({selectedCandidates.length})
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => bulkApprove.mutate({ candidateIds: selectedCandidates })}
                    >
                      Approve Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => bulkReject.mutate({ candidateIds: selectedCandidates })}
                    >
                      Reject Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBulkScheduleOpen(true)}>
                      Schedule Interviews
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBulkMessageOpen(true)}>
                      Send Message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCandidates([])}
                >
                  Clear Selection
                </Button>
              </>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Candidate</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, linkedinUrl: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="jobId">Job Position *</Label>
                  <Select
                    value={formData.jobId.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, jobId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs?.map((job) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCandidate.isPending}>
                    {createCandidate.isPending ? "Adding..." : "Add Candidate"}
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div>Loading candidates...</div>
        ) : candidates && candidates.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                checked={selectedCandidates.length === candidates.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select All ({selectedCandidates.length} of {candidates.length} selected)
              </span>
            </div>
            <div className="grid gap-4">
            {candidates.map((candidate) => (
              <Card key={candidate.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedCandidates.includes(candidate.id)}
                        onCheckedChange={() => toggleSelectCandidate(candidate.id)}
                        className="mt-1"
                      />
                    <div>
                      <CardTitle>{candidate.name}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {candidate.email}
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {candidate.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getStatusColor(candidate.status)}>
                        {candidate.status}
                      </Badge>
                    </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <CandidateMatchIndicators
                      cultureFitScore={candidate.cultureFitScore}
                      wellbeingMatchScore={candidate.wellbeingMatchScore}
                      overallMatchScore={candidate.overallMatchScore}
                      compact={true}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/candidates/${candidate.id}`}>View Details</a>
                    </Button>
                    {candidate.status === "new" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          screenCandidate.mutate({ candidateId: candidate.id })
                        }
                        disabled={screenCandidate.isPending}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Screen
                      </Button>
                    )}
                    <GeneratePresentationDialog
                      candidateId={candidate.id}
                      candidateName={candidate.name}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Dialog open={bulkScheduleOpen} onOpenChange={setBulkScheduleOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Interviews for {selectedCandidates.length} Candidates</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scheduledAt">Date & Time *</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={bulkScheduleData.scheduledAt}
                    onChange={(e) =>
                      setBulkScheduleData({ ...bulkScheduleData, scheduledAt: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={bulkScheduleData.duration}
                    onChange={(e) =>
                      setBulkScheduleData({ ...bulkScheduleData, duration: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={bulkScheduleData.location}
                    onChange={(e) =>
                      setBulkScheduleData({ ...bulkScheduleData, location: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={bulkScheduleData.notes}
                    onChange={(e) =>
                      setBulkScheduleData({ ...bulkScheduleData, notes: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setBulkScheduleOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkSchedule}
                    disabled={bulkScheduleInterviews.isPending}
                  >
                    {bulkScheduleInterviews.isPending ? "Scheduling..." : "Schedule Interviews"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Message Dialog */}
          <Dialog open={bulkMessageOpen} onOpenChange={setBulkMessageOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Message to {selectedCandidates.length} Candidates</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template">Email Template (Optional)</Label>
                  <Select
                    value={bulkMessageData.templateId.toString()}
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template or write custom message" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Custom Message</SelectItem>
                      {emailTemplates?.templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select a template to auto-fill subject and message
                  </p>
                </div>
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={bulkMessageData.subject}
                    onChange={(e) =>
                      setBulkMessageData({ ...bulkMessageData, subject: e.target.value })
                    }
                    placeholder="Enter email subject"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={bulkMessageData.message}
                    onChange={(e) =>
                      setBulkMessageData({ ...bulkMessageData, message: e.target.value })
                    }
                    placeholder="Enter your message here..."
                    rows={10}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Available variables: {"{{candidateName}}"}, {"{{jobTitle}}"}, {"{{companyName}}"}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setBulkMessageOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkMessage}
                    disabled={sendBulkMessage.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendBulkMessage.isPending ? "Sending..." : "Send Messages"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">No candidates yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add candidates to start screening
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
