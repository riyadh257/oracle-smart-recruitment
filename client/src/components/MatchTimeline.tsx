import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  GitCompare, 
  Star, 
  Calendar, 
  Mail, 
  FileText, 
  XCircle, 
  Archive,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";

interface MatchTimelineProps {
  candidateId: number;
  jobId: number;
}

export default function MatchTimeline({ candidateId, jobId }: MatchTimelineProps) {
  const { data: timeline, isLoading } = trpc.phase27.timeline.getMatch.useQuery({
    candidateId,
    jobId,
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'match_created':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'match_viewed':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'match_compared':
        return <GitCompare className="h-4 w-4 text-purple-600" />;
      case 'match_favorited':
        return <Star className="h-4 w-4 text-yellow-600" />;
      case 'match_unfavorited':
        return <Star className="h-4 w-4 text-gray-400" />;
      case 'interview_scheduled':
        return <Calendar className="h-4 w-4 text-indigo-600" />;
      case 'message_sent':
        return <Mail className="h-4 w-4 text-cyan-600" />;
      case 'status_changed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'feedback_submitted':
        return <FileText className="h-4 w-4 text-orange-600" />;
      case 'match_dismissed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'match_archived':
        return <Archive className="h-4 w-4 text-gray-600" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'match_created':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'match_viewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'match_compared':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'match_favorited':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'interview_scheduled':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'message_sent':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'status_changed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'feedback_submitted':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'match_dismissed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'match_archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match Timeline</CardTitle>
          <CardDescription>Track the history of this match</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No timeline events yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Timeline</CardTitle>
        <CardDescription>
          {timeline.length} event{timeline.length !== 1 ? 's' : ''} in match history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline events */}
          <div className="space-y-6">
            {timeline.map((event, index) => (
              <div key={event.id} className="relative flex gap-4">
                {/* Icon */}
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-background">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getEventColor(event.eventType)}`}>
                    {getEventIcon(event.eventType)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={getEventColor(event.eventType)}>
                          {formatEventType(event.eventType)}
                        </Badge>
                        {event.matchScore && (
                          <Badge variant="secondary">
                            Score: {event.matchScore}%
                          </Badge>
                        )}
                      </div>
                      
                      {event.eventDescription && (
                        <p className="text-sm text-foreground mb-2">
                          {event.eventDescription}
                        </p>
                      )}

                      {event.metadata && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md mt-2">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(event.createdAt), 'MMM d, yyyy')}
                      <br />
                      {format(new Date(event.createdAt), 'h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
