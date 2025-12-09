import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, User, ArrowLeft, MessageSquare, QrCode, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import InterviewFeedbackForm from "@/components/InterviewFeedbackForm";
import { toast } from "sonner";

export default function InterviewDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  
  const interviewId = parseInt(id || "0");
  
  // Fetch interview details
  const { data: interviews, isLoading } = trpc.interviews.list.useQuery({});
  const interview = interviews?.find(i => i.id === interviewId);
  
  // Fetch feedback for this interview
  const { data: feedbackList, refetch: refetchFeedback } = trpc.feedback.getByInterview.useQuery(
    { interviewId },
    { enabled: !!interviewId }
  );

  // Fetch QR code for mobile feedback
  const { data: qrData } = trpc.interviews.generateFeedbackQRCode.useQuery(
    { interviewId },
    { enabled: !!interviewId }
  );

  const handleFeedbackSubmit = () => {
    setFeedbackDialogOpen(false);
    refetchFeedback();
    toast.success("Feedback submitted successfully");
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Interview not found</p>
            <Button onClick={() => navigate("/interviews")} className="mt-4">
              Back to Interviews
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/interviews")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Interview Details</h1>
            <p className="text-muted-foreground">
              Interview #{interview.id}
            </p>
          </div>
        </div>
        
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <MessageSquare className="mr-2 h-4 w-4" />
              Submit Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Interview Feedback</DialogTitle>
              <DialogDescription>
                Provide detailed feedback for this interview
              </DialogDescription>
            </DialogHeader>
            <InterviewFeedbackForm
              interviewId={interviewId}
              candidateId={interview.candidateId}
              candidateName={`Candidate #${interview.candidateId}`}
              interviewerId={1}
              templateId={interview.templateId || undefined}
              onSuccess={handleFeedbackSubmit}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Interview Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Interview Information</CardTitle>
            <Badge className={statusColors[interview.status as keyof typeof statusColors]}>
              {interview.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {new Date(interview.scheduledAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">
                  {new Date(interview.scheduledAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{interview.duration} minutes</p>
              </div>
            </div>
            
            {interview.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{interview.location}</p>
                </div>
              </div>
            )}
          </div>
          
          {interview.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p className="text-sm">{interview.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Mobile Feedback QR Code */}
      {qrData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Feedback Access
            </CardTitle>
            <CardDescription>
              Scan this QR code to submit feedback from your mobile device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-white p-4 rounded-lg border">
                <img 
                  src={qrData.qrCode} 
                  alt="QR Code for mobile feedback" 
                  className="w-48 h-48"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-2">
                  <QrCode className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Quick Access</p>
                    <p className="text-sm text-muted-foreground">
                      Scan the QR code with your phone camera to open the mobile-optimized feedback form
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Direct Link:</p>
                  <a 
                    href={qrData.feedbackUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {qrData.feedbackUrl}
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback History */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback History</CardTitle>
          <CardDescription>
            {feedbackList?.length || 0} feedback submission(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!feedbackList || feedbackList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No feedback submitted yet</p>
              <p className="text-sm mt-1">Be the first to provide feedback for this interview</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackList.map((feedback) => (
                <Card key={feedback.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Interviewer #{feedback.interviewerId}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(feedback.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {feedback.recommendation.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Overall</p>
                        <p className="text-lg font-semibold">{feedback.overallRating}/5</p>
                      </div>
                      {feedback.technicalSkillsRating && (
                        <div>
                          <p className="text-sm text-muted-foreground">Technical</p>
                          <p className="text-lg font-semibold">{feedback.technicalSkillsRating}/5</p>
                        </div>
                      )}
                      {feedback.communicationRating && (
                        <div>
                          <p className="text-sm text-muted-foreground">Communication</p>
                          <p className="text-lg font-semibold">{feedback.communicationRating}/5</p>
                        </div>
                      )}
                      {feedback.problemSolvingRating && (
                        <div>
                          <p className="text-sm text-muted-foreground">Problem Solving</p>
                          <p className="text-lg font-semibold">{feedback.problemSolvingRating}/5</p>
                        </div>
                      )}
                      {feedback.cultureFitRating && (
                        <div>
                          <p className="text-sm text-muted-foreground">Culture Fit</p>
                          <p className="text-lg font-semibold">{feedback.cultureFitRating}/5</p>
                        </div>
                      )}
                    </div>
                    
                    {feedback.strengths && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Strengths</p>
                        <p className="text-sm text-muted-foreground">{feedback.strengths}</p>
                      </div>
                    )}
                    
                    {feedback.weaknesses && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Areas for Improvement</p>
                        <p className="text-sm text-muted-foreground">{feedback.weaknesses}</p>
                      </div>
                    )}
                    
                    {feedback.detailedNotes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Additional Notes</p>
                        <p className="text-sm text-muted-foreground">{feedback.detailedNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
