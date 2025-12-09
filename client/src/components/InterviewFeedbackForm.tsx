import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Star, Loader2, CheckCircle2 } from "lucide-react";

interface InterviewFeedbackFormProps {
  interviewId: number;
  candidateId: number;
  candidateName: string;
  interviewerId: number;
  templateId?: number;
  onSuccess?: () => void;
}

const RATING_LABELS = {
  1: "Poor",
  2: "Below Average",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

const RECOMMENDATION_OPTIONS = [
  { value: "strong_hire", label: "Strong Hire", color: "text-green-600" },
  { value: "hire", label: "Hire", color: "text-green-500" },
  { value: "maybe", label: "Maybe", color: "text-yellow-600" },
  { value: "no_hire", label: "No Hire", color: "text-red-500" },
  { value: "strong_no_hire", label: "Strong No Hire", color: "text-red-600" },
];

export default function InterviewFeedbackForm({
  interviewId,
  candidateId,
  candidateName,
  interviewerId,
  templateId,
  onSuccess,
}: InterviewFeedbackFormProps) {
  const [overallRating, setOverallRating] = useState<number>(3);
  const [technicalSkillsRating, setTechnicalSkillsRating] = useState<number>(3);
  const [communicationRating, setCommunicationRating] = useState<number>(3);
  const [problemSolvingRating, setProblemSolvingRating] = useState<number>(3);
  const [cultureFitRating, setCultureFitRating] = useState<number>(3);
  const [recommendation, setRecommendation] = useState<string>("maybe");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [detailedNotes, setDetailedNotes] = useState("");
  const [customQuestions, setCustomQuestions] = useState<Array<{
    id: string;
    question: string;
    type: "text" | "rating" | "multiple_choice";
    required: boolean;
    options?: string[];
    answer?: string | number;
  }>>([]);

  // Fetch template if templateId is provided
  const { data: template } = trpc.feedback.getTemplateById.useQuery(
    { templateId: templateId! },
    { enabled: !!templateId }
  );

  // Apply template questions when template is loaded
  useEffect(() => {
    if (template?.questions) {
      setCustomQuestions(template.questions.map(q => ({ ...q, answer: q.type === 'rating' ? 3 : '' })));
    }
  }, [template]);

  const createFeedbackMutation = trpc.feedback.create.useMutation({
    onSuccess: () => {
      toast.success("Feedback submitted successfully");
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to submit feedback: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createFeedbackMutation.mutate({
      interviewId,
      candidateId,
      interviewerId,
      overallRating,
      technicalSkillsRating,
      communicationRating,
      problemSolvingRating,
      cultureFitRating,
      recommendation: recommendation as any,
      strengths: strengths.trim() || undefined,
      weaknesses: weaknesses.trim() || undefined,
      detailedNotes: detailedNotes.trim() || undefined,
    });
  };

  const RatingInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  rating <= value
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground min-w-[100px]">
          {RATING_LABELS[value as keyof typeof RATING_LABELS]}
        </span>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Interview Feedback</CardTitle>
          <CardDescription>
            Provide detailed feedback for {candidateName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <RatingInput
            label="Overall Rating"
            value={overallRating}
            onChange={setOverallRating}
          />

          <Separator />

          {/* Specific Ratings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Detailed Ratings</h3>
            <RatingInput
              label="Technical Skills"
              value={technicalSkillsRating}
              onChange={setTechnicalSkillsRating}
            />
            <RatingInput
              label="Communication"
              value={communicationRating}
              onChange={setCommunicationRating}
            />
            <RatingInput
              label="Problem Solving"
              value={problemSolvingRating}
              onChange={setProblemSolvingRating}
            />
            <RatingInput
              label="Culture Fit"
              value={cultureFitRating}
              onChange={setCultureFitRating}
            />
          </div>

          <Separator />

          {/* Recommendation */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Hiring Recommendation</Label>
            <RadioGroup value={recommendation} onValueChange={setRecommendation}>
              <div className="space-y-2">
                {RECOMMENDATION_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className={`cursor-pointer ${option.color}`}
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Text Feedback */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strengths">Strengths</Label>
              <Textarea
                id="strengths"
                placeholder="What did the candidate do well?"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weaknesses">Areas for Improvement</Label>
              <Textarea
                id="weaknesses"
                placeholder="What could the candidate improve on?"
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detailedNotes">Detailed Notes</Label>
              <Textarea
                id="detailedNotes"
                placeholder="Any additional observations or comments..."
                value={detailedNotes}
                onChange={(e) => setDetailedNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Custom Template Questions */}
          {customQuestions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Template Questions</h3>
                {customQuestions.map((question, index) => (
                  <div key={question.id} className="space-y-2">
                    <Label htmlFor={`custom-${question.id}`}>
                      {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {question.type === "text" && (
                      <Textarea
                        id={`custom-${question.id}`}
                        value={question.answer as string || ""}
                        onChange={(e) => {
                          const updated = [...customQuestions];
                          updated[index].answer = e.target.value;
                          setCustomQuestions(updated);
                        }}
                        required={question.required}
                        rows={3}
                      />
                    )}
                    {question.type === "rating" && (
                      <RatingInput
                        label=""
                        value={question.answer as number || 3}
                        onChange={(value) => {
                          const updated = [...customQuestions];
                          updated[index].answer = value;
                          setCustomQuestions(updated);
                        }}
                      />
                    )}
                    {question.type === "multiple_choice" && question.options && (
                      <RadioGroup
                        value={question.answer as string || ""}
                        onValueChange={(value) => {
                          const updated = [...customQuestions];
                          updated[index].answer = value;
                          setCustomQuestions(updated);
                        }}
                      >
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                              <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={createFeedbackMutation.isPending}
          size="lg"
        >
          {createFeedbackMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Submit Feedback
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
