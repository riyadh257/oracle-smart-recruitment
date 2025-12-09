import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Video, MapPin, Plus, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

export default function CalendarPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const utils = trpc.useUtils();
  
  const { data: interviews, isLoading } = trpc.interviews.getUpcoming.useQuery(
    { employerId: user?.id || 0 },
    { enabled: !!user }
  );

  const { data: candidates } = trpc.candidates.list.useQuery({});

  const scheduleInterviewMutation = trpc.interviews.schedule.useMutation({
    onSuccess: () => {
      utils.interviews.getUpcoming.invalidate();
      setIsScheduleDialogOpen(false);
      toast.success("Interview scheduled successfully");
    },
    onError: (error) => {
      toast.error(`Failed to schedule interview: ${error.message}`);
    }
  });

  const handleScheduleInterview = (data: any) => {
    scheduleInterviewMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      scheduled: "default",
      completed: "secondary",
      cancelled: "destructive",
      pending: "outline"
    };
    
    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };

  const groupInterviewsByDate = (interviews: any[]) => {
    const grouped: Record<string, any[]> = {};
    
    interviews?.forEach((interview) => {
      const date = new Date(interview.scheduledTime).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(interview);
    });
    
    return grouped;
  };

  const groupedInterviews = groupInterviewsByDate(interviews || []);
  const sortedDates = Object.keys(groupedInterviews).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Interview Calendar</h1>
            <p className="text-muted-foreground mt-2">
              Manage and schedule candidate interviews
            </p>
          </div>
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Interview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule New Interview</DialogTitle>
                <DialogDescription>
                  Set up an interview with a candidate
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleScheduleInterview({
                  employerId: user?.id || 0,
                  candidateId: parseInt(formData.get('candidateId') as string),
                  scheduledTime: new Date(formData.get('scheduledTime') as string),
                  duration: parseInt(formData.get('duration') as string),
                  meetingUrl: formData.get('meetingUrl') as string || undefined
                });
              }} className="space-y-4">
                <div>
                  <Label htmlFor="candidateId">Candidate</Label>
                  <Select name="candidateId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select candidate" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates?.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id.toString()}>
                          {candidate.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduledTime">Date & Time</Label>
                  <Input
                    id="scheduledTime"
                    name="scheduledTime"
                    type="datetime-local"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select name="duration" defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="meetingUrl">Meeting URL (optional)</Label>
                  <Input
                    id="meetingUrl"
                    name="meetingUrl"
                    type="url"
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsScheduleDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={scheduleInterviewMutation.isLoading}>
                    {scheduleInterviewMutation.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      "Schedule Interview"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interviews?.filter(i => i.status === 'scheduled').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Next 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interviews?.filter(i => 
                  new Date(i.scheduledTime).toDateString() === new Date().toDateString()
                ).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Scheduled interviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interviews?.filter(i => i.status === 'completed').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interviews?.filter(i => i.status === 'pending').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interviews Timeline */}
        {sortedDates.length > 0 ? (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
                <div className="space-y-3">
                  {groupedInterviews[date].map((interview) => (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {new Date(interview.scheduledTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {interview.duration} minutes
                              </span>
                              {getStatusBadge(interview.status)}
                            </div>
                            
                            <h3 className="text-lg font-medium mb-1">
                              Interview with {interview.candidateId}
                            </h3>
                            
                            {interview.meetingUrl && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Video className="h-3 w-3" />
                                <a 
                                  href={interview.meetingUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Join Video Call
                                </a>
                              </div>
                            )}

                            {interview.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {interview.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Reschedule
                            </Button>
                            <Button variant="outline" size="sm">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No interviews scheduled</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Start scheduling interviews with your candidates to fill your calendar
              </p>
              <Button size="lg" onClick={() => setIsScheduleDialogOpen(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Schedule First Interview
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
