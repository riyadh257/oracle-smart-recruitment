import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar as CalendarIcon, Clock, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";

interface InterviewSchedulerProps {
  applicationId: number;
  employerId: number;
  candidateId: number;
  jobId: number;
  onScheduled?: () => void;
}

export function InterviewScheduler({
  applicationId,
  employerId,
  candidateId,
  jobId,
  onScheduled,
}: InterviewSchedulerProps) {
  // Fetch available feedback templates
  const { data: templates, isLoading: templatesLoading } = trpc.feedback.getTemplates.useQuery({
    employerId,
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [duration, setDuration] = useState<number>(60);
  const [interviewType, setInterviewType] = useState<"phone" | "video" | "onsite" | "technical">("video");
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  const scheduleMutation = trpc.interviews.schedule.useMutation({
    onSuccess: () => {
      toast.success("Interview scheduled successfully!");
      onScheduled?.();
    },
    onError: (error) => {
      toast.error(`Failed to schedule interview: ${error.message}`);
    },
  });

  const checkConflictsMutation = trpc.interviews.checkConflicts.useMutation({
    onSuccess: (data) => {
      if (data.hasConflict) {
        setConflicts(data.conflicts || []);
        setShowConflictWarning(true);
        // Get suggestions
        getSuggestions();
      } else {
        setConflicts([]);
        setShowConflictWarning(false);
      }
      setCheckingConflicts(false);
    },
  });

  const suggestSlotsMutation = trpc.interviews.suggestSlots.useMutation({
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
    },
  });

  // Real-time conflict detection when date/time changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);

      setCheckingConflicts(true);
      checkConflictsMutation.mutate({
        employerId,
        scheduledAt: scheduledAt.toISOString(),
        duration,
      });
    }
  }, [selectedDate, selectedTime, duration]);

  const getSuggestions = () => {
    if (selectedDate) {
      suggestSlotsMutation.mutate({
        employerId,
        preferredDate: selectedDate.toISOString(),
        duration,
        numberOfSuggestions: 5,
      });
    }
  };

  const handleSchedule = (forceSchedule: boolean = false) => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    const scheduledAt = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    scheduleMutation.mutate({
      applicationId,
      employerId,
      candidateId,
      jobId,
      scheduledAt: scheduledAt.toISOString(),
      duration,
      interviewType,
      location: location || undefined,
      notes: notes || undefined,
      templateId: selectedTemplateId,
      forceSchedule,
    });
  };

  const handleSuggestionClick = (suggestionISO: string) => {
    const suggestionDate = new Date(suggestionISO);
    setSelectedDate(suggestionDate);
    setSelectedTime(
      `${suggestionDate.getHours().toString().padStart(2, "0")}:${suggestionDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}`
    );
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Schedule Interview
        </CardTitle>
        <CardDescription>
          Select a date and time for the interview. We'll check for conflicts in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Conflict Warning */}
        {showConflictWarning && conflicts.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Scheduling Conflict Detected</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                You have {conflicts.length} conflicting interview(s) at this time:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {conflicts.map((conflict: any) => (
                  <li key={conflict.id} className="text-sm">
                    {new Date(conflict.scheduledAt).toLocaleString()} - {conflict.duration} min
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Success indicator when no conflicts */}
        {!checkingConflicts && !showConflictWarning && selectedDate && selectedTime && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Time Slot Available</AlertTitle>
            <AlertDescription className="text-green-700">
              No conflicts detected for this time slot.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="space-y-4">
            <Label>Select Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          {/* Time and Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="time">Select Time</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeSlots().map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Interview Type</Label>
              <Select value={interviewType} onValueChange={(v: any) => setInterviewType(v)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video Call</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="technical">Technical Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(interviewType === "video" || interviewType === "onsite") && (
              <div>
                <Label htmlFor="location">
                  {interviewType === "video" ? "Meeting Link" : "Location"}
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={
                    interviewType === "video"
                      ? "https://meet.google.com/..."
                      : "Office address"
                  }
                />
              </div>
            )}

            <div>
              <Label htmlFor="template">Feedback Template (Optional)</Label>
              <Select 
                value={selectedTemplateId?.toString() || "none"} 
                onValueChange={(v) => setSelectedTemplateId(v === "none" ? undefined : Number(v))}
                disabled={templatesLoading}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder={templatesLoading ? "Loading templates..." : "Select a template"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Template</SelectItem>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{template.name}</span>
                        {template.isDefault && (
                          <Badge variant="secondary" className="ml-2">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateId && templates && (
                <p className="text-sm text-muted-foreground mt-1">
                  {templates.find(t => t.id === selectedTemplateId)?.description || ""}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Alternative Suggestions */}
        {showConflictWarning && suggestions.length > 0 && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Suggested Alternative Times</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {suggestions.map((suggestion, index) => {
                const suggestionDate = new Date(suggestion);
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start h-auto py-3"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">
                        {suggestionDate.toLocaleDateString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {suggestionDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          {showConflictWarning && (
            <Button
              variant="outline"
              onClick={() => handleSchedule(true)}
              disabled={scheduleMutation.isPending}
            >
              Schedule Anyway
            </Button>
          )}
          <Button
            onClick={() => handleSchedule(false)}
            disabled={scheduleMutation.isPending || showConflictWarning}
            className="min-w-[120px]"
          >
            {scheduleMutation.isPending ? "Scheduling..." : "Schedule Interview"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
