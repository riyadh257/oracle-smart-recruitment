import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, Star, Send } from "lucide-react";
import { toast } from "sonner";
import { APP_LOGO, APP_TITLE } from "@/const";

/**
 * Mobile-optimized interviewer feedback interface
 * Designed for quick feedback submission immediately after interviews
 */
export default function MobileInterviewFeedback() {
  const [, params] = useRoute("/mobile/feedback/:interviewId");
  const interviewId = params?.interviewId ? parseInt(params.interviewId) : null;

  const [ratings, setRatings] = useState({
    overall: 0,
    technical: 0,
    communication: 0,
    problemSolving: 0,
    cultureFit: 0,
  });

  const [recommendation, setRecommendation] = useState<string>("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: interview, isLoading } = trpc.interviews.getById.useQuery(
    { interviewId: interviewId! },
    { enabled: !!interviewId }
  );

  const submitFeedback = trpc.feedback.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Feedback submitted successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to submit feedback: ${error.message}`);
    },
  });

  const handleRatingClick = (category: keyof typeof ratings, value: number) => {
    setRatings({ ...ratings, [category]: value });
  };

  const handleSubmit = () => {
    if (!interviewId || !interview) {
      toast.error("Interview not found");
      return;
    }

    if (ratings.overall === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    if (!recommendation) {
      toast.error("Please provide a recommendation");
      return;
    }

    submitFeedback.mutate({
      interviewId,
      candidateId: interview.candidateId,
      interviewerId: interview.interviewerId,
      overallRating: ratings.overall,
      technicalSkillsRating: ratings.technical || undefined,
      communicationRating: ratings.communication || undefined,
      problemSolvingRating: ratings.problemSolving || undefined,
      cultureFitRating: ratings.cultureFit || undefined,
      recommendation: recommendation as any,
      strengths: strengths || undefined,
      weaknesses: weaknesses || undefined,
      detailedNotes: notes || undefined,
    });
  };

  const RatingStars = ({
    category,
    label,
  }: {
    category: keyof typeof ratings;
    label: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-base">{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleRatingClick(category, value)}
            className="p-2 rounded-full hover:bg-accent transition-colors"
          >
            <Star
              className={`h-8 w-8 ${
                ratings[category] >= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {ratings[category] > 0 ? `${ratings[category]} / 5` : "Not rated"}
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg">Interview not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground">
              Your feedback has been submitted successfully.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setRatings({
                  overall: 0,
                  technical: 0,
                  communication: 0,
                  problemSolving: 0,
                  cultureFit: 0,
                });
                setRecommendation("");
                setStrengths("");
                setWeaknesses("");
                setNotes("");
              }}
              variant="outline"
              className="mt-4"
            >
              Submit Another Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {APP_LOGO && (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            )}
            <div>
              <h1 className="text-lg font-bold">Interview Feedback</h1>
              <p className="text-sm text-muted-foreground">
                {interview.candidateName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
        <div className="space-y-6">
          {/* Interview Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interview Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Candidate:</span>{" "}
                {interview.candidateName}
              </div>
              <div>
                <span className="font-medium">Position:</span>{" "}
                {interview.jobTitle || "Not specified"}
              </div>
              <div>
                <span className="font-medium">Date:</span>{" "}
                {new Date(interview.scheduledAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          {/* Overall Rating - Most Important */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Rating *</CardTitle>
              <CardDescription>
                Your overall impression of the candidate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RatingStars category="overall" label="" />
            </CardContent>
          </Card>

          {/* Detailed Ratings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Ratings</CardTitle>
              <CardDescription>Optional but recommended</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RatingStars category="technical" label="Technical Skills" />
              <RatingStars category="communication" label="Communication" />
              <RatingStars category="problemSolving" label="Problem Solving" />
              <RatingStars category="cultureFit" label="Culture Fit" />
            </CardContent>
          </Card>

          {/* Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommendation *</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={recommendation} onValueChange={setRecommendation}>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Select recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strong_hire">Strong Hire</SelectItem>
                  <SelectItem value="hire">Hire</SelectItem>
                  <SelectItem value="maybe">Maybe</SelectItem>
                  <SelectItem value="no_hire">No Hire</SelectItem>
                  <SelectItem value="strong_no_hire">Strong No Hire</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Quick Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Notes</CardTitle>
              <CardDescription>Optional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="strengths">Key Strengths</Label>
                <Textarea
                  id="strengths"
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="What impressed you most?"
                  rows={3}
                  className="text-base"
                />
              </div>

              <div>
                <Label htmlFor="weaknesses">Areas for Improvement</Label>
                <Textarea
                  id="weaknesses"
                  value={weaknesses}
                  onChange={(e) => setWeaknesses(e.target.value)}
                  placeholder="What concerns do you have?"
                  rows={3}
                  className="text-base"
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any other observations?"
                  rows={4}
                  className="text-base"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="container mx-auto max-w-2xl">
          <Button
            onClick={handleSubmit}
            disabled={submitFeedback.isPending || ratings.overall === 0 || !recommendation}
            className="w-full text-base py-6"
            size="lg"
          >
            {submitFeedback.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
