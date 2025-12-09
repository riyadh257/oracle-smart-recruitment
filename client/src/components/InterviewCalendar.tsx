import { useState, useMemo } from "react";
import { Calendar, momentLocalizer, View, Event as CalendarEvent } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertCircle, Calendar as CalendarIcon, Loader2 } from "lucide-react";

const localizer = momentLocalizer(moment);

interface Interview {
  id: number;
  candidateId: number;
  jobId: number;
  interviewerName?: string | null;
  interviewerEmail?: string | null;
  scheduledAt: Date;
  duration: number;
  type: "phone" | "video" | "onsite" | "technical";
  location?: string | null;
  meetingLink?: string | null;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  notes?: string | null;
}

interface CalendarEventData extends CalendarEvent {
  resource: Interview;
}

interface InterviewCalendarProps {
  candidateId?: number;
  onInterviewClick?: (interview: Interview) => void;
}

export function InterviewCalendar({ candidateId, onInterviewClick }: InterviewCalendarProps) {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [conflicts, setConflicts] = useState<Interview[]>([]);

  const { data: interviews = [], isLoading } = trpc.interviews.list.useQuery(
    candidateId ? { candidateId } : {}
  );

  const { data: candidates = [] } = trpc.candidate.list.useQuery();
  const { data: jobs = [] } = trpc.jobs.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.interviews.create.useMutation({
    onSuccess: () => {
      toast.success("Interview scheduled successfully!");
      setShowNewDialog(false);
      setSelectedSlot(null);
      setConflicts([]);
      utils.interviews.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to schedule interview: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    candidateId: candidateId || 0,
    jobId: 0,
    interviewerName: "",
    interviewerEmail: "",
    duration: 60,
    type: "video" as const,
    location: "",
    meetingLink: "",
    notes: "",
  });

  const events: CalendarEventData[] = useMemo(() => {
    return interviews.map((interview) => {
      const start = new Date(interview.scheduledAt);
      const end = new Date(start.getTime() + interview.duration * 60000);
      const candidate = candidates.find((c) => c.id === interview.candidateId);
      
      return {
        title: `${candidate?.name || "Unknown"} - ${interview.type}`,
        start,
        end,
        resource: interview,
      };
    });
  }, [interviews, candidates]);

  const checkConflicts = (start: Date, end: Date) => {
    const conflicting = interviews.filter((interview) => {
      if (interview.status === "cancelled") return false;
      
      const interviewStart = new Date(interview.scheduledAt);
      const interviewEnd = new Date(interviewStart.getTime() + interview.duration * 60000);
      
      return (
        (start >= interviewStart && start < interviewEnd) ||
        (end > interviewStart && end <= interviewEnd) ||
        (start <= interviewStart && end >= interviewEnd)
      );
    });
    
    setConflicts(conflicting);
    return conflicting;
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    checkConflicts(slotInfo.start, slotInfo.end);
    setShowNewDialog(true);
  };

  const handleSelectEvent = (event: CalendarEventData) => {
    onInterviewClick?.(event.resource);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot) return;
    
    if (!formData.candidateId || !formData.jobId) {
      toast.error("Please select a candidate and job");
      return;
    }

    createMutation.mutate({
      ...formData,
      scheduledAt: selectedSlot.start.toISOString(),
    });
  };

  const eventStyleGetter = (event: CalendarEventData) => {
    const interview = event.resource;
    let backgroundColor = "#3b82f6";
    
    switch (interview.status) {
      case "completed":
        backgroundColor = "#10b981";
        break;
      case "cancelled":
        backgroundColor = "#ef4444";
        break;
      case "rescheduled":
        backgroundColor = "#f59e0b";
        break;
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Interview Calendar
        </h2>
        <Button onClick={() => {
          setSelectedSlot({ start: new Date(), end: new Date(Date.now() + 3600000) });
          setShowNewDialog(true);
        }}>
          Schedule Interview
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg border" style={{ height: "600px" }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            eventPropGetter={eventStyleGetter}
            popup
          />
        </div>
      )}

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Interview</DialogTitle>
            <DialogDescription>
              {selectedSlot && `${moment(selectedSlot.start).format("MMMM D, YYYY [at] h:mm A")}`}
            </DialogDescription>
          </DialogHeader>

          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Conflict detected!</strong> {conflicts.length} interview(s) already scheduled at this time.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidate">Candidate *</Label>
                <Select
                  value={formData.candidateId.toString()}
                  onValueChange={(value) => {
                    const candidate = candidates.find((c) => c.id === parseInt(value));
                    setFormData({
                      ...formData,
                      candidateId: parseInt(value),
                      jobId: candidate?.jobId || 0,
                    });
                  }}
                  disabled={!!candidateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id.toString()}>
                        {candidate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job">Job Position *</Label>
                <Select
                  value={formData.jobId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, jobId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Interview Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  min={15}
                  step={15}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interviewerName">Interviewer Name</Label>
                <Input
                  id="interviewerName"
                  value={formData.interviewerName}
                  onChange={(e) => setFormData({ ...formData, interviewerName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interviewerEmail">Interviewer Email</Label>
                <Input
                  id="interviewerEmail"
                  type="email"
                  value={formData.interviewerEmail}
                  onChange={(e) => setFormData({ ...formData, interviewerEmail: e.target.value })}
                />
              </div>
            </div>

            {["onsite", "video"].includes(formData.type) && (
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Office address or room number"
                />
              </div>
            )}

            {formData.type === "video" && (
              <div className="space-y-2">
                <Label htmlFor="meetingLink">Meeting Link</Label>
                <Input
                  id="meetingLink"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="Zoom, Google Meet, or Teams link"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Schedule Interview"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
