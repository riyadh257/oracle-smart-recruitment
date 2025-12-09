import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Send, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

/**
 * Match Feedback Page
 * Post-hire feedback collection for continuous AI algorithm improvement
 */
export default function MatchFeedback() {
  const [candidateId, setCandidateId] = useState("");
  const [jobId, setJobId] = useState("");
  const [wasHired, setWasHired] = useState<boolean>(true);
  const [matchSuccessful, setMatchSuccessful] = useState<boolean | undefined>(undefined);
  const [skillMatchAccuracy, setSkillMatchAccuracy] = useState<number>(3);
  const [cultureFitAccuracy, setCultureFitAccuracy] = useState<number>(3);
  const [wellbeingMatchAccuracy, setWellbeingMatchAccuracy] = useState<number>(3);
  const [overallSatisfaction, setOverallSatisfaction] = useState<number>(3);
  const [whatWorkedWell, setWhatWorkedWell] = useState("");
  const [whatDidntWork, setWhatDidntWork] = useState("");
  const [improvementSuggestions, setImprovementSuggestions] = useState("");
  const [feedbackStage, setFeedbackStage] = useState<'30_days' | '90_days' | '6_months' | '1_year' | 'exit'>('30_days');

  // Fetch pending feedback requests
  const { data: pendingRequests, refetch: refetchPending } = trpc.matching.feedback.getPending.useQuery();

  // Fetch latest analytics
  const { data: analytics } = trpc.matching.feedback.getLatestAnalytics.useQuery();

  // Submit feedback mutation
  const submitFeedbackMutation = trpc.matching.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success("Feedback submitted successfully");
      // Reset form
      setCandidateId("");
      setJobId("");
      setWasHired(true);
      setMatchSuccessful(undefined);
      setSkillMatchAccuracy(3);
      setCultureFitAccuracy(3);
      setWellbeingMatchAccuracy(3);
      setOverallSatisfaction(3);
      setWhatWorkedWell("");
      setWhatDidntWork("");
      setImprovementSuggestions("");
      refetchPending();
    },
    onError: (error) => {
      toast.error(`Failed to submit feedback: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!candidateId || !jobId) {
      toast.error("Please enter candidate and job IDs");
      return;
    }

    submitFeedbackMutation.mutate({
      candidateId: parseInt(candidateId),
      jobId: parseInt(jobId),
      wasHired,
      matchSuccessful,
      skillMatchAccuracy,
      cultureFitAccuracy,
      wellbeingMatchAccuracy,
      overallSatisfaction,
      whatWorkedWell: whatWorkedWell || undefined,
      whatDidntWork: whatDidntWork || undefined,
      improvementSuggestions: improvementSuggestions || undefined,
      feedbackStage,
    });
  };

  const RatingInput = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <Button
            key={rating}
            type="button"
            variant={value === rating ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(rating)}
            className="w-12"
          >
            {rating}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">1 = Poor, 5 = Excellent</p>
    </div>
  );

  const getTrendIcon = (trend?: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Match Outcome Feedback</h1>
        <p className="text-muted-foreground mt-2">
          Help improve our AI matching algorithm by sharing your hiring outcomes
        </p>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              AI Matching Performance
              {getTrendIcon(analytics.improvementTrend)}
            </CardTitle>
            <CardDescription>
              Based on {analytics.totalFeedbackCount} feedback submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{(analytics.successRate / 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Retention Rate</p>
                <p className="text-2xl font-bold">{(analytics.retentionRate / 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Skill Accuracy</p>
                <p className="text-2xl font-bold">{(analytics.avgSkillMatchAccuracy / 100).toFixed(1)}/5</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Culture Accuracy</p>
                <p className="text-2xl font-bold">{(analytics.avgCultureFitAccuracy / 100).toFixed(1)}/5</p>
              </div>
            </div>
            {analytics.keyInsights && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Key Insights</p>
                <p className="text-sm text-muted-foreground">{analytics.keyInsights}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Match Feedback</CardTitle>
          <CardDescription>
            Provide feedback on a candidate match to help refine our AI algorithm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="candidateId">Candidate ID</Label>
              <Input
                id="candidateId"
                type="number"
                placeholder="e.g., 123"
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobId">Job ID</Label>
              <Input
                id="jobId"
                type="number"
                placeholder="e.g., 456"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedbackStage">Feedback Stage</Label>
              <Select value={feedbackStage} onValueChange={(value: any) => setFeedbackStage(value)}>
                <SelectTrigger id="feedbackStage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30_days">30 Days</SelectItem>
                  <SelectItem value="90_days">90 Days</SelectItem>
                  <SelectItem value="6_months">6 Months</SelectItem>
                  <SelectItem value="1_year">1 Year</SelectItem>
                  <SelectItem value="exit">Exit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hire Outcome */}
          <div className="space-y-3">
            <Label>Was the candidate hired?</Label>
            <RadioGroup value={wasHired ? "yes" : "no"} onValueChange={(value) => setWasHired(value === "yes")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="hired-yes" />
                <Label htmlFor="hired-yes" className="font-normal cursor-pointer">Yes, candidate was hired</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="hired-no" />
                <Label htmlFor="hired-no" className="font-normal cursor-pointer">No, candidate was not hired</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Match Success (if hired) */}
          {wasHired && (
            <div className="space-y-3">
              <Label>Was the match successful?</Label>
              <RadioGroup 
                value={matchSuccessful === undefined ? "unknown" : matchSuccessful ? "yes" : "no"} 
                onValueChange={(value) => setMatchSuccessful(value === "yes" ? true : value === "no" ? false : undefined)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="success-yes" />
                  <Label htmlFor="success-yes" className="font-normal cursor-pointer">Yes, successful hire</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="success-no" />
                  <Label htmlFor="success-no" className="font-normal cursor-pointer">No, not successful</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unknown" id="success-unknown" />
                  <Label htmlFor="success-unknown" className="font-normal cursor-pointer">Too early to tell</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Accuracy Ratings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">Match Accuracy Ratings</h3>
            
            <RatingInput
              label="Skill Match Accuracy"
              value={skillMatchAccuracy}
              onChange={setSkillMatchAccuracy}
            />
            
            <RatingInput
              label="Culture Fit Accuracy"
              value={cultureFitAccuracy}
              onChange={setCultureFitAccuracy}
            />
            
            <RatingInput
              label="Wellbeing Match Accuracy"
              value={wellbeingMatchAccuracy}
              onChange={setWellbeingMatchAccuracy}
            />
            
            <RatingInput
              label="Overall Satisfaction"
              value={overallSatisfaction}
              onChange={setOverallSatisfaction}
            />
          </div>

          {/* Qualitative Feedback */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">Additional Feedback (Optional)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="whatWorkedWell">What worked well?</Label>
              <Textarea
                id="whatWorkedWell"
                placeholder="Share what aspects of the match were successful..."
                value={whatWorkedWell}
                onChange={(e) => setWhatWorkedWell(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatDidntWork">What didn't work?</Label>
              <Textarea
                id="whatDidntWork"
                placeholder="Share what aspects of the match were unsuccessful..."
                value={whatDidntWork}
                onChange={(e) => setWhatDidntWork(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvementSuggestions">Suggestions for improvement</Label>
              <Textarea
                id="improvementSuggestions"
                placeholder="How can we improve our matching algorithm?..."
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitFeedbackMutation.isPending}
            className="w-full"
            size="lg"
          >
            {submitFeedbackMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting Feedback...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
