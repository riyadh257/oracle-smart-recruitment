import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Download, Share2, X, TrendingUp, TrendingDown, Minus, Calendar, Mail, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function MatchComparison() {
  const [, setLocation] = useLocation();
  const [selectedMatches, setSelectedMatches] = useState<number[]>([]);
  const [bulkActionDialog, setBulkActionDialog] = useState<'schedule' | 'message' | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Get selected match IDs from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchIds = params.get("matches");
    if (matchIds) {
      setSelectedMatches(matchIds.split(",").map(Number));
    }
  }, []);

  // Fetch saved matches for comparison
  const { data: savedMatches, isLoading } = trpc.savedMatches.getSavedMatches.useQuery({
    status: "all",
    limit: 100,
  });

  // Fetch feedback templates for interview scheduling
  const { data: templates } = trpc.feedbackTemplates.getAll.useQuery();

  // Bulk actions mutations
  const scheduleInterviewsMutation = trpc.phase27.bulkActions.scheduleInterviews.useMutation({
    onSuccess: (result) => {
      toast.success(`Scheduled ${result.results.successful} interviews successfully`);
      if (result.results.failed > 0) {
        toast.error(`Failed to schedule ${result.results.failed} interviews`);
      }
      setBulkActionDialog(null);
      setScheduleDateTime('');
      setSelectedTemplateId('');
    },
    onError: (error) => {
      toast.error(`Failed to schedule interviews: ${error.message}`);
    },
  });

  const sendMessagesMutation = trpc.phase27.bulkActions.sendMessages.useMutation({
    onSuccess: (result) => {
      toast.success(`Sent messages to ${result.results.successful} candidates successfully`);
      if (result.results.failed > 0) {
        toast.error(`Failed to send ${result.results.failed} messages`);
      }
      setBulkActionDialog(null);
      setMessageContent('');
    },
    onError: (error) => {
      toast.error(`Failed to send messages: ${error.message}`);
    },
  });

  // Filter to only selected matches
  const matchesToCompare = savedMatches?.matches.filter(m => 
    selectedMatches.includes(m.savedMatch.id)
  ) || [];

  const removeMatch = (matchId: number) => {
    setSelectedMatches(prev => prev.filter(id => id !== matchId));
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  const getTrendIcon = (trend: string | null) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const exportComparison = () => {
    // Create CSV content
    const headers = ["Candidate", "Job", "Overall Score", "Skill Score", "Culture Score", "Wellbeing Score", "Status", "Priority"];
    const rows = matchesToCompare.map(m => [
      m.candidate.fullName,
      m.job.title,
      m.application.overallMatchScore || "N/A",
      m.application.skillMatchScore || "N/A",
      m.application.cultureFitScore || "N/A",
      m.application.wellbeingMatchScore || "N/A",
      m.savedMatch.status,
      m.savedMatch.priority,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `match-comparison-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Comparison exported successfully");
  };

  const shareComparison = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Comparison link copied to clipboard");
  };

  const handleBulkScheduleInterviews = () => {
    if (!scheduleDateTime) {
      toast.error("Please select a date and time");
      return;
    }

    const candidateIds = matchesToCompare.map(m => m.candidate.id);
    const jobId = matchesToCompare[0]?.job.id;

    if (!jobId) {
      toast.error("No job selected");
      return;
    }

    scheduleInterviewsMutation.mutate({
      candidateIds,
      jobId,
      scheduledDateTime: new Date(scheduleDateTime).toISOString(),
      templateId: selectedTemplateId ? parseInt(selectedTemplateId) : undefined,
    });
  };

  const handleBulkSendMessages = () => {
    if (!messageContent.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const candidateIds = matchesToCompare.map(m => m.candidate.id);
    const jobId = matchesToCompare[0]?.job.id;

    if (!jobId) {
      toast.error("No job selected");
      return;
    }

    sendMessagesMutation.mutate({
      candidateIds,
      jobId,
      messageContent,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (matchesToCompare.length === 0) {
    return (
      <DashboardLayout>
        <div className="container max-w-7xl py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No Matches Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Please select matches from the Saved Matches page to compare them.
                </p>
                <Button onClick={() => setLocation("/saved-matches")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go to Saved Matches
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-7xl py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Match Comparison</h1>
            <p className="text-muted-foreground mt-2">
              Compare {matchesToCompare.length} selected matches side-by-side
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={shareComparison}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={exportComparison}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => setLocation("/saved-matches")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Side-by-Side Comparison</CardTitle>
            <CardDescription>
              Compare match scores, candidate profiles, and job requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Attribute</TableHead>
                    {matchesToCompare.map((match) => (
                      <TableHead key={match.savedMatch.id} className="text-center">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold truncate">
                            {match.candidate.fullName}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMatch(match.savedMatch.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground font-normal mt-1">
                          {match.job.title}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Overall Match Score */}
                  <TableRow>
                    <TableCell className="font-semibold">Overall Match</TableCell>
                    {matchesToCompare.map((match) => (
                      <TableCell key={match.savedMatch.id} className="text-center">
                        <Badge variant={getScoreBadgeVariant(match.application.overallMatchScore || 0)}>
                          {match.application.overallMatchScore}%
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Skill Match Score */}
                  <TableRow>
                    <TableCell className="font-semibold">Technical Skills</TableCell>
                    {matchesToCompare.map((match) => (
                      <TableCell key={match.savedMatch.id}>
                        <div className="space-y-2">
                          <Progress value={match.application.skillMatchScore || 0} />
                          <p className={`text-sm font-semibold text-center ${getScoreColor(match.application.skillMatchScore)}`}>
                            {match.application.skillMatchScore}%
                          </p>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Culture Fit Score */}
                  <TableRow>
                    <TableCell className="font-semibold">Culture Fit</TableCell>
                    {matchesToCompare.map((match) => (
                      <TableCell key={match.savedMatch.id}>
                        <div className="space-y-2">
                          <Progress value={match.application.cultureFitScore || 0} />
                          <p className={`text-sm font-semibold text-center ${getScoreColor(match.application.cultureFitScore)}`}>
                            {match.application.cultureFitScore}%
                          </p>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Wellbeing Score */}
                  <TableRow>
                    <TableCell className="font-semibold">Wellbeing Match</TableCell>
                    {matchesToCompare.map((match) => (
                      <TableCell key={match.savedMatch.id}>
                        <div className="space-y-2">
                          <Progress value={match.application.wellbeingMatchScore || 0} />
                          <p className={`text-sm font-semibold text-center ${getScoreColor(match.application.wellbeingMatchScore)}`}>
                            {match.application.wellbeingMatchScore}%
                          </p>
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Status */}
                  <TableRow>
                    <TableCell className="font-semibold">Status</TableCell>
                    {matchesToCompare.map((match) => (
                      <TableCell key={match.savedMatch.id} className="text-center">
                        <Badge variant="outline">{match.savedMatch.status}</Badge>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Priority */}
                  <TableRow>
                    <TableCell className="font-semibold">Priority</TableCell>
                    {matchesToCompare.map((match) => (
                      <TableCell key={match.savedMatch.id} className="text-center">
                        <Badge
                          variant={
                            match.savedMatch.priority === "high"
                              ? "destructive"
                              : match.savedMatch.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {match.savedMatch.priority}
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Experience */}
                  <TableRow>
                    <TableCell className="font-semibold">Experience</TableCell>
                    {matchesToCompare.map((match) => (
                      <TableCell key={match.savedMatch.id} className="text-center">
                        {match.candidate.yearsOfExperience || "N/A"} years
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Location */}
                  <TableRow>
                    <TableCell className="font-semibold">Location</TableCell>
                    {matchesToCompare.map((match) => (
                      <TableCell key={match.savedMatch.id} className="text-center text-sm">
                        {match.candidate.location || "Not specified"}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Salary Expectation */}
                  <TableRow>
                    <TableCell className="font-semibold">Salary Expectation</TableCell>
                    {matchesToCompare.map((match) => (
                      <TableCell key={match.savedMatch.id} className="text-center text-sm">
                        {match.candidate.expectedSalary 
                          ? `$${match.candidate.expectedSalary.toLocaleString()}`
                          : "Not specified"}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Notes */}
                  <TableRow>
                    <TableCell className="font-semibold">Notes</TableCell>
                    {matchesToCompare.map((match) => (
                      <TableCell key={match.savedMatch.id} className="text-sm">
                        {match.savedMatch.notes || <span className="text-muted-foreground">No notes</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
            <CardDescription>
              Perform actions on all {matchesToCompare.length} compared candidates at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setBulkActionDialog('schedule')}
                disabled={matchesToCompare.length === 0}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule All Interviews
              </Button>
              <Button 
                variant="outline"
                onClick={() => setBulkActionDialog('message')}
                disabled={matchesToCompare.length === 0}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Message to All
              </Button>
              <Button 
                variant="outline"
                disabled={matchesToCompare.length === 0}
                onClick={() => {
                  toast.info("Status change feature coming soon");
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Change Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Actions</CardTitle>
            <CardDescription>Take action on specific candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {matchesToCompare.map((match) => (
                <Card key={match.savedMatch.id} className="border-2">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">{match.candidate.fullName}</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {match.job.title}
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" className="w-full">
                        Schedule Interview
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        Send Message
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setLocation(`/candidates/${match.candidate.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Schedule Interviews Dialog */}
      <Dialog open={bulkActionDialog === 'schedule'} onOpenChange={(open) => !open && setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interviews for All Candidates</DialogTitle>
            <DialogDescription>
              Schedule interviews for {matchesToCompare.length} candidates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="datetime">Interview Date & Time</Label>
              <Input
                id="datetime"
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template">Feedback Template (Optional)</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkScheduleInterviews}
              disabled={scheduleInterviewsMutation.isPending}
            >
              {scheduleInterviewsMutation.isPending ? "Scheduling..." : "Schedule All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Send Messages Dialog */}
      <Dialog open={bulkActionDialog === 'message'} onOpenChange={(open) => !open && setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to All Candidates</DialogTitle>
            <DialogDescription>
              Send a message to {matchesToCompare.length} candidates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                placeholder="Enter your message here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkSendMessages}
              disabled={sendMessagesMutation.isPending}
            >
              {sendMessagesMutation.isPending ? "Sending..." : "Send to All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
