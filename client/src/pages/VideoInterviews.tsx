import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Video, Calendar, Clock, ExternalLink, Play, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function VideoInterviews() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedInterviewId, setSelectedInterviewId] = useState<number | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: jobs } = trpc.jobs.list.useQuery();
  const { data: interviews } = trpc.interviews.list.useQuery(
    { jobId: selectedJobId! },
    { enabled: !!selectedJobId }
  );
  const { data: videoInterviews, refetch } = trpc.videoInterviews.list.useQuery();
  
  const createMutation = trpc.videoInterviews.create.useMutation();
  const updateStatusMutation = trpc.videoInterviews.updateStatus.useMutation();

  const handleCreateVideoInterview = async () => {
    if (!selectedInterviewId || !selectedCandidateId || !selectedJobId || !scheduledAt) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createMutation.mutateAsync({
        interviewId: selectedInterviewId,
        candidateId: selectedCandidateId,
        jobId: selectedJobId,
        scheduledAt,
      });
      toast.success("Video interview scheduled successfully");
      setIsDialogOpen(false);
      refetch();
      setSelectedJobId(null);
      setSelectedInterviewId(null);
      setSelectedCandidateId(null);
      setScheduledAt("");
    } catch (error) {
      toast.error("Failed to schedule video interview");
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: status as any,
        startedAt: status === "in_progress" ? new Date().toISOString() : undefined,
        endedAt: status === "completed" ? new Date().toISOString() : undefined,
      });
      toast.success(`Video interview ${status}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update video interview status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case "in_progress":
        return <Play className="h-4 w-4 text-green-600" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "text-blue-600 bg-blue-50";
      case "in_progress":
        return "text-green-600 bg-green-50";
      case "completed":
        return "text-green-600 bg-green-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Video Interviews</h1>
            <p className="text-muted-foreground mt-2">
              Manage video interview scheduling and recordings
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Video className="mr-2 h-4 w-4" />
                Schedule Video Interview
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Video Interview</DialogTitle>
                <DialogDescription>
                  Create a new video interview session for a candidate
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="job">Job Position *</Label>
                  <Select
                    value={selectedJobId?.toString() || ""}
                    onValueChange={(value) => {
                      setSelectedJobId(parseInt(value));
                      setSelectedInterviewId(null);
                      setSelectedCandidateId(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job position" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs?.map((job) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title} - {job.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedJobId && (
                  <div>
                    <Label htmlFor="interview">Interview *</Label>
                    <Select
                      value={selectedInterviewId?.toString() || ""}
                      onValueChange={(value) => {
                        const interviewId = parseInt(value);
                        setSelectedInterviewId(interviewId);
                        const interview = interviews?.find((i) => i.id === interviewId);
                        if (interview) {
                          setSelectedCandidateId(interview.candidateId);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an interview" />
                      </SelectTrigger>
                      <SelectContent>
                        {interviews?.map((interview) => (
                          <SelectItem key={interview.id} value={interview.id.toString()}>
                            Interview #{interview.id} - {interview.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="scheduledAt">Scheduled Date & Time *</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleCreateVideoInterview}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Scheduling..." : "Schedule Video Interview"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {videoInterviews && videoInterviews.length > 0 ? (
            videoInterviews.map((videoInterview: any) => (
              <Card key={videoInterview.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Video Interview #{videoInterview.id}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Interview ID: {videoInterview.interviewId} • Candidate ID: {videoInterview.candidateId} • Job ID: {videoInterview.jobId}
                      </CardDescription>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(videoInterview.status)}`}>
                      {getStatusIcon(videoInterview.status)}
                      <span className="text-sm font-medium capitalize">
                        {videoInterview.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Scheduled:</span>
                      <span className="font-medium">
                        {new Date(videoInterview.scheduledAt).toLocaleString()}
                      </span>
                    </div>

                    {videoInterview.duration && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{videoInterview.duration} minutes</span>
                      </div>
                    )}
                  </div>

                  {videoInterview.roomUrl && (
                    <div className="mb-4">
                      <Label className="text-sm text-muted-foreground">Meeting Room</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input value={videoInterview.roomUrl} readOnly className="flex-1" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(videoInterview.roomUrl, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {videoInterview.recordingUrl && (
                    <div className="mb-4">
                      <Label className="text-sm text-muted-foreground">Recording</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input value={videoInterview.recordingUrl} readOnly className="flex-1" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(videoInterview.recordingUrl, "_blank")}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {videoInterview.status === "scheduled" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(videoInterview.id, "in_progress")}
                        >
                          Start Interview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(videoInterview.id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {videoInterview.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(videoInterview.id, "completed")}
                      >
                        End Interview
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No video interviews scheduled</h3>
                <p className="text-muted-foreground mt-2">
                  Schedule your first video interview to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
