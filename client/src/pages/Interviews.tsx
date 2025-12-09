import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, MapPin, Video, MessageSquare, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function Interviews() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: interviews, isLoading } = trpc.interviews.list.useQuery();

  if (loading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "default";
      case "completed":
        return "default";
      case "cancelled":
        return "outline";
      case "rescheduled":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "phone":
        return <Clock className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const upcomingInterviews = interviews?.filter(
    (i) => i.status === "scheduled" && new Date(i.scheduledAt) > new Date()
  ) || [];

  const pastInterviews = interviews?.filter(
    (i) => i.status === "completed" || new Date(i.scheduledAt) <= new Date()
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Interviews</h1>
            <p className="text-muted-foreground mt-2">
              Manage and provide feedback for interviews
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading interviews...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Interviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Interviews ({upcomingInterviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingInterviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No upcoming interviews scheduled
                  </p>
                ) : (
                  <div className="space-y-4">
                    {upcomingInterviews.map((interview) => (
                      <Card key={interview.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3">
                                {getTypeIcon(interview.type)}
                                <div>
                                  <p className="font-semibold">
                                    Interview #{interview.id}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Candidate ID: {interview.candidateId}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {new Date(interview.scheduledAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {new Date(interview.scheduledAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getStatusColor(interview.status)}>
                                    {interview.status}
                                  </Badge>
                                  <Badge variant="outline">{interview.type}</Badge>
                                </div>
                              </div>

                              {interview.interviewerName && (
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Interviewer:</span>{" "}
                                  {interview.interviewerName}
                                </p>
                              )}

                              {interview.meetingLink && (
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4 text-muted-foreground" />
                                  <a
                                    href={interview.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline"
                                  >
                                    Join Meeting
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Interviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Past Interviews ({pastInterviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pastInterviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No past interviews
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pastInterviews.map((interview: any) => {
                      const hasFeedback = interview.feedback && interview.feedback.length > 0;
                      const userFeedback = interview.feedback?.find(
                        (f: any) => f.submittedBy === user.name
                      );

                      return (
                        <Card key={interview.id} className="border-l-4 border-l-muted">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                  {getTypeIcon(interview.type)}
                                  <div>
                                    <p className="font-semibold">
                                      Interview #{interview.id}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Candidate ID: {interview.candidateId}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {new Date(interview.scheduledAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {new Date(interview.scheduledAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={getStatusColor(interview.status)}>
                                      {interview.status}
                                    </Badge>
                                    <Badge variant="outline">{interview.type}</Badge>
                                  </div>
                                </div>

                                {interview.interviewerName && (
                                  <p className="text-sm">
                                    <span className="text-muted-foreground">Interviewer:</span>{" "}
                                    {interview.interviewerName}
                                  </p>
                                )}

                                {hasFeedback && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <MessageSquare className="h-4 w-4 text-green-600" />
                                    <span className="text-green-600">
                                      {interview.feedback?.length || 0} feedback(s) submitted
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                {userFeedback ? (
                                  <Badge variant="default" className="whitespace-nowrap">
                                    Feedback Submitted
                                  </Badge>
                                ) : (
                                  <Button
                                    onClick={() =>
                                      setLocation(`/interviews/${interview.id}/feedback`)
                                    }
                                    size="sm"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Feedback
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
