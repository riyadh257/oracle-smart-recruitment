import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  MailOpen,
  MousePointerClick,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Upload,
  Eye,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

interface CommunicationTimelineProps {
  candidateId: number;
  employerId?: number;
  applicationId?: number;
}

const eventTypeIcons: Record<string, any> = {
  email_sent: Mail,
  email_opened: MailOpen,
  email_clicked: MousePointerClick,
  application_submitted: FileText,
  application_viewed: Eye,
  interview_scheduled: Calendar,
  interview_completed: CheckCircle2,
  interview_cancelled: XCircle,
  status_changed: Clock,
  note_added: MessageSquare,
  document_uploaded: Upload,
  message_sent: MessageSquare,
  message_received: MessageSquare,
};

const eventTypeColors: Record<string, string> = {
  email_sent: "bg-blue-500",
  email_opened: "bg-green-500",
  email_clicked: "bg-purple-500",
  application_submitted: "bg-indigo-500",
  application_viewed: "bg-cyan-500",
  interview_scheduled: "bg-yellow-500",
  interview_completed: "bg-emerald-500",
  interview_cancelled: "bg-red-500",
  status_changed: "bg-orange-500",
  note_added: "bg-gray-500",
  document_uploaded: "bg-pink-500",
  message_sent: "bg-teal-500",
  message_received: "bg-violet-500",
};

const eventTypeLabels: Record<string, string> = {
  email_sent: "Email Sent",
  email_opened: "Email Opened",
  email_clicked: "Email Clicked",
  application_submitted: "Application Submitted",
  application_viewed: "Application Viewed",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed",
  interview_cancelled: "Interview Cancelled",
  status_changed: "Status Changed",
  note_added: "Note Added",
  document_uploaded: "Document Uploaded",
  message_sent: "Message Sent",
  message_received: "Message Received",
};

export function CommunicationTimeline({
  candidateId,
  employerId,
  applicationId,
}: CommunicationTimelineProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  // Fetch communication timeline
  const { data: events = [], isLoading } = trpc.communications.getCandidateTimeline.useQuery({
    candidateId,
    employerId,
    applicationId,
    eventTypes: selectedEventTypes.length > 0 ? (selectedEventTypes as any) : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    searchQuery: searchQuery || undefined,
  });

  // Fetch communication summary
  const { data: summary } = trpc.communications.getSummary.useQuery({ candidateId });

  // Fetch timeline statistics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: statistics } = trpc.communications.getStatistics.useQuery({
    candidateId,
    startDate: thirtyDaysAgo.toISOString(),
    endDate: new Date().toISOString(),
  });

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleEventTypeToggle = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType)
        ? prev.filter((t) => t !== eventType)
        : [...prev, eventType]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedEventTypes([]);
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalEmails || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.emailsOpened || 0} opened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.engagementScore || 0}</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalInterviews || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.completedInterviews || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.responseRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Email open rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search communications..."
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Event Types</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(eventTypeLabels).map(([type, label]) => (
                <Badge
                  key={type}
                  variant={selectedEventTypes.includes(type) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleEventTypeToggle(type)}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Timeline</CardTitle>
          <CardDescription>
            Complete history of all interactions with this candidate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading timeline...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No communication events found
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Timeline Events */}
              <div className="space-y-6">
                {events.map((event: any) => {
                  const Icon = eventTypeIcons[event.eventType] || MessageSquare;
                  const color = eventTypeColors[event.eventType] || "bg-gray-500";

                  return (
                    <div
                      key={event.id}
                      className="relative pl-16 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                      onClick={() => handleEventClick(event)}
                    >
                      {/* Icon */}
                      <div
                        className={`absolute left-5 ${color} text-white rounded-full p-2 shadow-lg`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">{event.eventTitle}</h4>
                            {event.eventDescription && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.eventDescription}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {eventTypeLabels[event.eventType]}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.eventTimestamp), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          <span className="capitalize">{event.initiatedBy}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              {selectedEvent && format(new Date(selectedEvent.eventTimestamp), "MMMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Label>Event Type</Label>
                <div className="mt-1">
                  <Badge>{eventTypeLabels[selectedEvent.eventType]}</Badge>
                </div>
              </div>

              <div>
                <Label>Title</Label>
                <p className="mt-1 text-sm">{selectedEvent.eventTitle}</p>
              </div>

              {selectedEvent.eventDescription && (
                <div>
                  <Label>Description</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedEvent.eventDescription}
                  </p>
                </div>
              )}

              <div>
                <Label>Initiated By</Label>
                <p className="mt-1 text-sm capitalize">{selectedEvent.initiatedBy}</p>
              </div>

              {selectedEvent.eventMetadata && Object.keys(selectedEvent.eventMetadata).length > 0 && (
                <div>
                  <Label>Additional Information</Label>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedEvent.eventMetadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
