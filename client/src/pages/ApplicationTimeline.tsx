import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  Calendar, 
  MessageSquare, 
  XCircle,
  ArrowLeft,
  MapPin,
  Briefcase
} from "lucide-react";
import { Link } from "wouter";

/**
 * Application Timeline Page
 * Visual timeline showing candidate application progress with status updates,
 * interview schedules, and feedback collection
 */

export default function ApplicationTimeline() {
  const params = useParams<{ id: string }>();
  const applicationId = parseInt(params.id || "0");

  const { data: timeline, isLoading, error } = trpc.applicationTimeline.getTimeline.useQuery({
    applicationId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto mb-4" />
              <p>Application not found or you don't have permission to view it.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { application, events, interviews, feedback } = timeline;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: "bg-blue-500",
      screening: "bg-yellow-500",
      interviewing: "bg-purple-500",
      offered: "bg-green-500",
      rejected: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: "Submitted",
      screening: "Under Screening",
      interviewing: "Interview Stage",
      offered: "Offer Extended",
      rejected: "Rejected",
    };
    return labels[status] || status;
  };

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, any> = {
      submitted: FileText,
      viewed: Clock,
      screening: FileText,
      interview_scheduled: Calendar,
      interview_completed: CheckCircle2,
      feedback_received: MessageSquare,
      offer_extended: CheckCircle2,
      offer_accepted: CheckCircle2,
      offer_declined: XCircle,
      rejected: XCircle,
      withdrawn: XCircle,
    };
    const Icon = icons[eventType] || Clock;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/applications">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Application Timeline</h1>
            <p className="text-muted-foreground">
              Track your application progress for {application.job.title}
            </p>
          </div>
          <Badge className={getStatusColor(application.status)}>
            {getStatusLabel(application.status)}
          </Badge>
        </div>
      </div>

      {/* Application Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{application.job.title}</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-4 mt-2">
              {application.job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {application.job.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {application.candidate.fullName}
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Applied on:</span>
              <p className="font-medium">
                {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium">{getStatusLabel(application.status)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Application Progress</CardTitle>
          <CardDescription>
            Detailed timeline of your application journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            
            {/* Timeline events */}
            <div className="space-y-6">
              {events.map((event, index) => (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-card">
                    {getEventIcon(event.eventType)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interviews */}
      {interviews.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Interview Schedule</CardTitle>
            <CardDescription>
              Your scheduled interviews for this position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div key={interview.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {new Date(interview.scheduledAt).toLocaleString()}
                        </p>
                        {interview.interviewerName && (
                          <p className="text-sm text-muted-foreground">
                            with {interview.interviewerName}
                          </p>
                        )}
                        {interview.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {interview.location}
                          </p>
                        )}
                      </div>
                      <Badge variant={interview.status === "completed" ? "default" : "secondary"}>
                        {interview.status}
                      </Badge>
                    </div>
                    {interview.notes && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        {interview.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Feedback</CardTitle>
            <CardDescription>
              Feedback received from interviewers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedback.map((fb) => (
                <div key={fb.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">
                        Overall Rating: {fb.overallRating}/5
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {fb.recommendation && (
                      <Badge>
                        {fb.recommendation}
                      </Badge>
                    )}
                  </div>
                  {fb.strengths && (
                    <div className="mt-3">
                      <p className="text-sm font-medium">Strengths:</p>
                      <p className="text-sm text-muted-foreground">{fb.strengths}</p>
                    </div>
                  )}
                  {fb.weaknesses && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Areas for Improvement:</p>
                      <p className="text-sm text-muted-foreground">{fb.weaknesses}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
